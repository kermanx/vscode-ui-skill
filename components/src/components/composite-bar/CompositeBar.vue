<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
} from "vue";
import ContextMenu from "../context-menu/ContextMenu.vue";
import Hover from "../hover/Hover.vue";
import { instantHoverKey } from "../tooltip/delegate";
import type { MenuEntry } from "../menu/types";
import type { ContextMenuAnchor } from "../context-menu/types";
import type { CompositeItem } from "./types";
import { badgeText, fitItems, title, visibleBadges } from "./model";
import "../action-bar/actionbar.css";
import "./panecomposite.css";
import "./progressbadge.css";
const props = withDefaults(
  defineProps<{
    items: readonly CompositeItem[];
    activeId?: string;
    orientation?: "horizontal" | "vertical";
    icons?: boolean;
    availableSize?: number;
    side?: "left" | "right";
  }>(),
  { orientation: "vertical", icons: true, side: "left" },
);
const emit = defineEmits<{
  open: [id: string, focus: boolean];
  pin: [id: string, pinned: boolean];
  badge: [id: string, enabled: boolean];
  command: [id: string, ...args: unknown[]];
}>();
const root = ref<HTMLElement>(),
  list = ref<HTMLElement>(),
  contextMenu = ref<InstanceType<typeof ContextMenu>>();
const elements = new Map<string, HTMLElement>(),
  refs = new Map<string, (element: unknown) => void>();
const pinned = ref(new Map<string, boolean>()),
  badgeEnabled = ref(new Map<string, boolean>());
const items = computed(() =>
  props.items.map((item) => ({
    ...item,
    pinned: pinned.value.get(item.id) ?? item.pinned,
    badgesEnabled: badgeEnabled.value.get(item.id) ?? item.badgesEnabled,
  })),
);
const vertical = computed(() => props.orientation === "vertical");
const dimension = ref(Infinity),
  sizes = ref(new Map<string, number>());
const fitted = computed(() =>
  fitItems(
    items.value,
    props.activeId,
    vertical.value
      ? new Map(items.value.map((item) => [item.id, 48]))
      : sizes.value,
    props.availableSize ?? dimension.value,
    vertical.value ? 48 : 44,
  ),
);
const overflowItem: CompositeItem = {
  id: "additionalComposites.action",
  label: "Additional Views",
  icon: "more",
};
const measuring = ref(!vertical.value);
const shown = computed(() => measuring.value ? items.value.filter(item => item.visible !== false) : [
  ...fitted.value.shown,
  ...(fitted.value.overflow.length ? [overflowItem] : []),
]);
const tabStops = ref(new Set<string>()),
  focusClass = ref(new Set<string>());
let focused: string | undefined, previous: string | undefined;
function itemRef(id: string) {
  let callback = refs.get(id);
  if (!callback) {
    callback = (value) => {
      if (value instanceof HTMLElement) elements.set(id, value);
      else elements.delete(id);
    };
    refs.set(id, callback);
  }
  return callback;
}
watch(
  shown,
  (value, old = []) => {
    const current = old
      .filter((item) => value.some((next) => next.id === item.id))
      .map((item) => item.id);
    let pushed = false;
    value.forEach((item, index) => {
      const at = current.indexOf(item.id);
      if (at !== index) {
        if (at >= 0) current.splice(at, 1);
        current.splice(index, 0, item.id);
        pushed = true;
      }
    });
    for (const id of tabStops.value)
      if (!value.some((item) => item.id === id)) tabStops.value.delete(id);
    for (const id of focusClass.value)
      if (!value.some((item) => item.id === id)) focusClass.value.delete(id);
    if (pushed) tabStops.value = new Set(value.length ? [value[0]!.id] : []);
  },
  { immediate: true },
);

function focus(index?: number) {
  focused =
    index === undefined
      ? (focused ?? shown.value[0]?.id)
      : shown.value[index]?.id;
  if (previous && previous !== focused) {
    tabStops.value.delete(previous);
    focusClass.value.delete(previous);
    elements.get(previous)?.blur();
  }
  if (focused) {
    tabStops.value.add(focused);
    focusClass.value.add(focused);
    elements.get(focused)?.focus();
    previous = focused;
  }
}
function move(delta: number, wrap = !vertical.value) {
  if (!shown.value.length) return false;
  const index = focused
    ? shown.value.findIndex((item) => item.id === focused)
    : delta > 0
      ? shown.value.length - 1
      : 0;
  const next = index + delta;
  if (!wrap && (next < 0 || next >= shown.value.length)) return false;
  focus((next + shown.value.length) % shown.value.length);
  return true;
}
function keyboard(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  let handled = true;
  if (event.key === (vertical.value ? "ArrowDown" : "ArrowRight"))
    handled = move(1);
  else if (event.key === (vertical.value ? "ArrowUp" : "ArrowLeft"))
    handled = move(-1);
  else if (event.key === "Home") focus(0);
  else if (event.key === "End") focus(shown.value.length - 1);
  else if (event.key === "Enter" || event.key === " ") {
    if (focused) run(focused);
  } else handled = false;
  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
}
const lastRuns = new Map<string, number>();
function run(id: string) {
  if (id === overflowItem.id) {
    void overflowMenu();
    return;
  }
  const now = Date.now(),
    last = lastRuns.get(id) || 0;
  if (now > last && now - last < 300) return;
  lastRuns.set(id, now);
  emit("open", id, true);
}
function pin(id: string, value = true, open = false) {
  if ((items.value.find((item) => item.id === id)?.pinned !== false) === value)
    return;
  pinned.value.set(id, value);
  emit("pin", id, value);
  if (value && open) emit("open", id, true);
  else if (!value && props.activeId === id) {
    const fallback = items.value.find(
      (item) =>
        item.id !== id && item.visible !== false && item.pinned !== false,
    );
    if (fallback) emit("open", fallback.id, fallback.id !== items.value[0]?.id);
  }
}
function toggleBadge(id: string) {
  const enabled =
    items.value.find((item) => item.id === id)?.badgesEnabled === false;
  badgeEnabled.value.set(id, enabled);
  emit("badge", id, enabled);
}
const menuActions = ref<MenuEntry[]>([]),
  handlers = new Map<string, () => void>();
function action(
  label: string,
  handler: () => void,
  checked?: boolean,
  disabled?: boolean,
): MenuEntry {
  const id = String(handlers.size);
  handlers.set(id, handler);
  return { id, label, checked, disabled };
}
function pinActions() {
  const count = items.value.filter(item => item.visible !== false && item.pinned !== false).length;
  return items.value.filter(item => item.visible !== false).map(item => {
    const entry = action(item.label, () => pin(item.id, item.pinned === false, true), item.pinned !== false, item.pinned !== false && count <= 1);
    if (!('separator' in entry)) entry.keybinding = item.keybinding;
    return entry;
  });
}
async function menu(at: ContextMenuAnchor, entries: MenuEntry[]) {
  menuActions.value = entries;
  await nextTick();
  await contextMenu.value?.show(at);
}
async function overflowMenu() {
  handlers.clear();
  const entries = fitted.value.overflow.map(item => {
    const entry = action(item.label, () => run(item.id), item.id === props.activeId);
    if (!('separator' in entry)) entry.keybinding = item.keybinding;
    return entry;
  });
  const target = elements.get(overflowItem.id);
  if (target) await menu(target, entries);
}
async function showContext(event: MouseEvent, selected?: CompositeItem) {
  event.preventDefault();
  event.stopPropagation();
  handlers.clear();
  const actions: MenuEntry[] = [];
  let anchor: ContextMenuAnchor = event;
  if (selected && selected !== overflowItem) {
    if (selected.keybinding)
      actions.push(
        action("Configure Keybinding", () =>
          emit(
            "command",
            "workbench.action.openGlobalKeybindings",
            `@command:${selected.id}`,
          ),
        ),
      );
    const isPinned = selected.pinned !== false;
    actions.push(
      action(
        `${isPinned ? "Hide" : "Keep"} '${selected.label}'`,
        () => pin(selected.id, !isPinned),
        false,
        isPinned &&
          items.value.filter((item) => item.pinned !== false).length <= 1,
      ),
    );
    actions.push(
      action(
        `${selected.badgesEnabled !== false ? "Hide" : "Show"} Badge`,
        () => toggleBadge(selected.id),
        false,
      ),
    );
    actions.push({ separator: true });
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    anchor = {
      x: Math.floor(bounds.left + bounds.width / 2),
      y: bounds.bottom,
    };
  }
  actions.push(...pinActions());
  await menu(anchor, actions);
}
const active = ref<string>(),
  clicked = ref(new Set<string>()),
  clickTimers = new Map<string, ReturnType<typeof setTimeout>>();
function down(id: string, event: MouseEvent) {
  if (id === overflowItem.id) { event.preventDefault(); event.stopPropagation(); }
  clearTimeout(hoverTimer);
  hoverTimer = undefined;
  hover.value?.hide();
  clicked.value.add(id);
  if (event.button === 0) active.value = id;
}
function up(id: string) {
  active.value = undefined;
  clearTimeout(clickTimers.get(id));
  clickTimers.set(
    id,
    setTimeout(() => clicked.value.delete(id), 800),
  );
}
let blurTimer: ReturnType<typeof setTimeout> | undefined;
function focusIn() {
  clearTimeout(blurTimer);
}
function focusOut() {
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    if (!root.value?.contains(document.activeElement)) {
      previous = focused;
      focused = undefined;
    }
  }, 0);
}
const hover = ref<InstanceType<typeof Hover>>(),
  hoverOpen = ref(false),
  hoverTarget = ref<HTMLElement>(),
  hoverText = ref(""),
  instant = ref(false);
provide(instantHoverKey, instant);
let hoverTimer: ReturnType<typeof setTimeout> | undefined;
function prepareHover(item: CompositeItem) {
  const target = elements.get(item.id);
  if (
    !target ||
    (target === hoverTarget.value && (hoverOpen.value || hoverTimer))
  )
    return;
  clearTimeout(hoverTimer);
  instant.value = hoverOpen.value;
  hover.value?.hide();
  hoverTarget.value = target;
  hoverText.value = title(item);
  hoverTimer = setTimeout(
    async () => {
      hoverTimer = undefined;
      await nextTick();
      hoverOpen.value = true;
    },
    instant.value ? 0 : navigator.platform.includes("Mac") ? 1500 : 500,
  );
}
function leaveHover() {
  clearTimeout(hoverTimer);
  hoverTimer = undefined;
}
const colors = ref<Record<string, string>>({});
function readColors() {
  if (!root.value) return;
  const style = getComputedStyle(root.value);
  colors.value = Object.fromEntries(
    [
      "activityBar.foreground",
      "activityBar.inactiveForeground",
      "activityBarBadge.background",
      "activityBarBadge.foreground",
      "activityBar.dropBorder",
      "panelTitle.activeForeground",
      "panelTitle.inactiveForeground",
      "panelTitleBadge.background",
      "panelTitleBadge.foreground",
      "panel.dropBorder",
      "badge.background",
      "badge.foreground",
      "contrastBorder",
    ].map((id) => [
      id,
      style.getPropertyValue(`--vscode-${id.replaceAll(".", "-")}`).trim(),
    ]),
  );
}
function labelStyle(item: CompositeItem) {
  return {
    color:
      colors.value[
        `${vertical.value ? "activityBar" : "panelTitle"}.${item.id === props.activeId ? (vertical.value ? "foreground" : "activeForeground") : "inactiveForeground"}`
      ],
    borderBottomColor:
      !vertical.value && item.id === props.activeId
        ? "var(--vscode-panelTitle-activeBorder)"
        : undefined,
  };
}
const badgeStyle = computed(() => ({
  color:
    colors.value[
      `${vertical.value ? "activityBarBadge" : "panelTitleBadge"}.foreground`
    ] || colors.value["badge.foreground"],
  backgroundColor:
    colors.value[
      `${vertical.value ? "activityBarBadge" : "panelTitleBadge"}.background`
    ] || colors.value["badge.background"],
  borderColor: colors.value.contrastBorder,
  borderWidth: colors.value.contrastBorder ? "1px" : undefined,
  borderStyle:
    colors.value.contrastBorder && vertical.value ? "solid" : undefined,
}));
function badgeVisible(item: CompositeItem) {
  const badges = visibleBadges(item);
  return (
    item.badgesEnabled !== false &&
    !!badges.type &&
    (badges.type !== "number" || !!badgeText(item))
  );
}
function badgeIcon(item: CompositeItem) {
  if (item.badgesEnabled === false) return undefined;
  const badge = visibleBadges(item).badges[0];
  return badge?.type === "icon"
    ? `icon-overlay codicon codicon-${badge.icon}`
    : undefined;
}
let observer: ResizeObserver | undefined,
  themeObserver: MutationObserver | undefined;
async function measure() {
  if (vertical.value) return;
  measuring.value = true;
  await nextTick();
  sizes.value = new Map(items.value.map(item => [item.id, elements.get(item.id)?.clientWidth || 0]));
  measuring.value = false;
}
watch(() => props.items.map(item => `${item.id}:${item.label}:${item.icon}`).join("|"), measure);
watch(() => props.icons, measure);
function layout() {
  if (!root.value) return;
  dimension.value = vertical.value
    ? root.value.parentElement!.clientHeight
    : root.value.parentElement!.clientWidth;
}
function backgroundContext(event: MouseEvent) { void showContext(event); }
onMounted(() => {
  root.value?.parentElement?.addEventListener("contextmenu", backgroundContext);
  readColors();
  layout();
  void document.fonts.ready.then(measure);
  observer = new ResizeObserver(layout);
  observer.observe(root.value!.parentElement!);
  const theme = root.value!.closest(".vc-theme");
  if (theme) {
    themeObserver = new MutationObserver(readColors);
    themeObserver.observe(theme, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });
  }
});
onBeforeUnmount(() => {
  root.value?.parentElement?.removeEventListener("contextmenu", backgroundContext);
  observer?.disconnect();
  themeObserver?.disconnect();
  clearTimeout(blurTimer);
  clearTimeout(hoverTimer);
  for (const timer of clickTimers.values()) clearTimeout(timer);
});
defineExpose({
  contextMenu: backgroundContext,
  focus,
  pin: (id: string) => pin(id),
  unpin: (id: string) => pin(id, false),
  layout,
});
</script>
<template>
  <div ref="root" class="composite-bar" @contextmenu="showContext($event)">
    <div
      class="monaco-action-bar"
      :class="{ vertical }"
      @keydown="keyboard"
      @keyup="
        ($event.key === 'Enter' || $event.key === ' ') &&
        ($event.preventDefault(), $event.stopPropagation())
      "
      @focusout="focusOut"
      @focusin="focusIn"
    >
      <ul
        ref="list"
        class="actions-container"
        :role="shown.length ? 'tablist' : 'presentation'"
        aria-label="Active View Switcher"
      >
        <li
          v-for="item in shown"
          :key="item.id"
          :ref="itemRef(item.id)"
          class="action-item"
          :class="{
            icon: icons || item === overflowItem,
            checked: item.id === activeId,
            active: active === item.id,
            clicked: clicked.has(item.id),
            focused: focusClass.has(item.id),
          }"
          role="tab"
          :draggable="item === overflowItem ? undefined : true"
          :aria-label="item === overflowItem ? item.label : ''"
          :aria-expanded="
            item === overflowItem ? undefined : item.id === activeId
          "
          :aria-selected="
            item === overflowItem ? undefined : item.id === activeId
          "
          :aria-haspopup="item === overflowItem ? true : undefined"
          :tabindex="tabStops.has(item.id) ? 0 : -1"
          :style="{
            '--insert-border-color':
              colors[vertical ? 'activityBar.dropBorder' : 'panel.dropBorder'],
          }"
          @focus="focused = item.id"
          @mousedown="down(item.id, $event)"
          @mouseup.stop="up(item.id)"
          @mouseout.stop="active = undefined"
          @click.prevent.stop="run(item.id)"
          @dblclick.stop.prevent
          @contextmenu="showContext($event, item)"
          @mouseover="prepareHover(item)"
          @mouseleave="leaveHover"
        >
          <a
            class="action-label"
            :class="
              (icons || item === overflowItem) && item.icon
                ? `codicon codicon-${item.icon}`
                : undefined
            "
            :aria-label="title(item)"
            :style="labelStyle(item)"
            >{{ !icons && item !== overflowItem ? item.label : "" }}</a
          >
          <div
            class="badge"
            :class="{
              'progress-badge': item.badgesEnabled !== false && visibleBadges(item).type === 'progress',
              'icon-badge': item.badgesEnabled !== false && visibleBadges(item).type === 'icon',
              compact: item.badgesEnabled !== false && !vertical && !!visibleBadges(item).type,
              'compact-content': item.badgesEnabled !== false && !vertical && badgeText(item).length >= 3,
            }"
            :style="{ display: badgeVisible(item) ? undefined : 'none' }"
            :aria-hidden="badgeVisible(item) ? undefined : true"
            :aria-label="title(item)"
          >
            <div
              class="badge-content"
              :class="badgeIcon(item)"
              :style="badgeStyle"
            >
              {{ item.badgesEnabled !== false ? badgeText(item) : '' }}
            </div>
          </div>
          <div class="active-item-indicator" />
        </li>
      </ul>
    </div>
    <ContextMenu
      ref="contextMenu"
      :actions="menuActions"
      @action="handlers.get($event)?.()"
    />
    <Hover
      ref="hover"
      v-model:open="hoverOpen"
      :target="hoverTarget || null"
      :content="hoverText"
      compact
      show-pointer
      hide-on-key-down
      :position="vertical ? (side === 'left' ? 'right' : 'left') : 'above'"
    />
  </div>
</template>
