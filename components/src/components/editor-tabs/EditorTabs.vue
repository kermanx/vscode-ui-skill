<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import ActionBar from "../action-bar/ActionBar.vue";
import IconLabel from "../icon-label/IconLabel.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import TabsScrollArea from "./TabsScrollArea.vue";
import type { EditorTab, EditorTabsProps } from "./types";
import { editorTabsTheme } from "./theme";
import { shorten } from "./shorten";
import "./editorgroupview.css";
import "./editor-tabs.css";
import "./editortabscontrol.css";
import "./multieditortabscontrol.css";
const props = withDefaults(defineProps<EditorTabsProps>(), {
  active: true,
  compact: false,
  showIcons: true,
  showIndex: false,
  highlightModifiedTabs: false,
  sizing: "fit",
  fixedMinWidth: 50,
  fixedMaxWidth: 160,
  stickySizing: "normal",
  actionLocation: "right",
  reserveActionSpace: true,
  showClose: true,
  showUnpin: true,
  scrollbar: "auto",
  scrollbarSize: "default",
  preventStickyClose: "keyboardAndMouse",
  doubleClickAction: "expand",
});
const activeId = defineModel<string>("activeId");
const selectedIds = defineModel<readonly string[]>("selectedIds", {
  default: () => [],
});
const emit = defineEmits<{
  activate: [id: string, preserveFocus: boolean];
  close: [ids: string[]];
  pin: [id: string];
  unpin: [id: string];
  toggleGroupSize: [action: "expand" | "maximize"];
  contextmenu: [event: MouseEvent | KeyboardEvent, item: EditorTab];
  configurePreview: [];
}>();
const root = ref<HTMLElement>(),
  scrollArea = ref<InstanceType<typeof TabsScrollArea>>();
const nodes = reactive(new Map<string, HTMLElement>()),
  actionBars = new Map<string, InstanceType<typeof ActionBar>>();
const items = computed(() =>
  [...props.items].sort((a, b) => Number(!!b.sticky) - Number(!!a.sticky)),
);
const selected = computed(
  () => new Set([activeId.value, ...selectedIds.value].filter(Boolean)),
);
const height = computed(() => (props.compact ? 22 : 35));
const scrollLeft = ref(0),
  stickyWidth = ref(0),
  disableSticky = ref(false),
  alt = ref(false),
  hovered = ref<string>();
const colors = ref<Record<string, string>>({});
const uid = getCurrentInstance()!.uid,
  highContrast = ref(false),
  light = ref(false);
const themeRules = computed(() =>
  editorTabsTheme(
    colors.value,
    highContrast.value,
    light.value,
    `.vc-editor-tabs[data-editor-tabs="${uid}"]`,
  ),
);
let themeObserver: MutationObserver, resizeObserver: ResizeObserver;
const isMac =
  typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
function refreshTheme() {
  if (!root.value) return;
  const style = getComputedStyle(root.value);
  const ids = [
    "contrastBorder",
    "contrastActiveBorder",
    "editorGroupHeader.tabsBorder",
    "tab.border",
    "tab.lastPinnedBorder",
    "tab.activeBorder",
    "tab.unfocusedActiveBorder",
    "tab.activeBorderTop",
    "tab.unfocusedActiveBorderTop",
    "tab.selectedBorderTop",
    "tab.activeModifiedBorder",
    "tab.inactiveModifiedBorder",
    "tab.unfocusedActiveModifiedBorder",
    "tab.unfocusedInactiveModifiedBorder",
    "editor.background",
    "editorGroup.dropBackground",
    "editorGroupHeader.tabsBackground",
    "tab.activeBackground",
    "tab.inactiveBackground",
    "tab.unfocusedActiveBackground",
    "tab.unfocusedInactiveBackground",
    "tab.hoverBackground",
    "tab.unfocusedHoverBackground",
    "tab.hoverForeground",
    "tab.unfocusedHoverForeground",
    "tab.hoverBorder",
    "tab.unfocusedHoverBorder",
  ];
  const theme = root.value.closest(".vc-theme");
  highContrast.value = !!theme?.matches(".hc-black,.hc-light");
  light.value = !!theme?.matches(".vs,.hc-light");
  colors.value = Object.fromEntries(
    ids.map((id) => [
      id,
      style.getPropertyValue(`--vscode-${id.replaceAll(".", "-")}`).trim(),
    ]),
  );
}
const bottomBorder = computed(
  () =>
    colors.value["editorGroupHeader.tabsBorder"] ||
    (root.value?.closest(".hc-black,.hc-light")
      ? colors.value["tab.border"] || colors.value.contrastBorder
      : ""),
);
function topBorder(item: EditorTab) {
  if (props.highlightModifiedTabs && item.dirty) return "";
  return (
    (item.id === activeId.value
      ? colors.value[
          props.active ? "tab.activeBorderTop" : "tab.unfocusedActiveBorderTop"
        ]
      : "") ||
    (selected.value.has(item.id) ? colors.value["tab.selectedBorderTop"] : "")
  );
}
function modifiedBorder(item: EditorTab) {
  if (!props.highlightModifiedTabs || !item.dirty) return "";
  return colors.value[
    `tab.${props.active ? "" : "unfocused"}${props.active ? (item.id === activeId.value ? "active" : "inactive") : item.id === activeId.value ? "Active" : "Inactive"}ModifiedBorder`
  ];
}
function activeBorder(item: EditorTab) {
  return item.id === activeId.value
    ? colors.value[
        props.active ? "tab.activeBorder" : "tab.unfocusedActiveBorder"
      ]
    : "";
}
function tabStyle(item: EditorTab, index: number) {
  const stickyCount = items.value.filter((item) => item.sticky).length;
  const border =
    (item.sticky &&
    index === stickyCount - 1 &&
    stickyCount !== items.value.length
      ? colors.value["tab.lastPinnedBorder"]
      : "") ||
    colors.value["tab.border"] ||
    colors.value.contrastBorder;
  return {
    left: item.sticky
      ? `${index * (props.stickySizing === "compact" ? 38 : props.stickySizing === "shrink" ? 80 : 0)}px`
      : "auto",
    borderRight: border ? `1px solid ${border}` : undefined,
    outlineColor: colors.value.contrastActiveBorder,
    "--tab-border-top-color": topBorder(item),
    "--tab-border-bottom-color": activeBorder(item),
    "--tab-dirty-border-top-color": modifiedBorder(item),
  };
}
function actionKind(item: EditorTab) {
  if (item.sticky && props.showUnpin) return "unpin";
  if (
    !item.cannotClose &&
    props.showClose &&
    alt.value &&
    hovered.value === item.id
  )
    return "closeOthers";
  return item.sticky && !props.showClose ? "unpin" : "close";
}
function actionVisible(item: EditorTab) {
  return (
    (item.sticky && props.showUnpin) || (!item.cannotClose && props.showClose)
  );
}
function action(item: EditorTab) {
  const kind = actionKind(item);
  return [
    {
      id: kind,
      label:
        kind === "unpin"
          ? "Unpin Editor"
          : kind === "closeOthers"
            ? "Close Others"
            : "Close",
      icon:
        kind === "unpin"
          ? "pinned"
          : kind === "closeOthers"
            ? "close-all"
            : "close-small",
      disabled: kind === "closeOthers" && items.value.length <= 1,
      keybinding:
        kind === "closeOthers" ? (isMac ? "⌥+Click" : "Alt+Click") : undefined,
    },
  ];
}
function classes(item: EditorTab) {
  return [
    `sizing-${item.sticky && props.stickySizing === "shrink" ? "shrink" : props.sizing}`,
    item.sticky && `sticky-${props.stickySizing}`,
    actionVisible(item) && `tab-actions-${props.actionLocation}`,
    {
      active: item.id === activeId.value,
      selected: selected.value.has(item.id),
      "multi-selected": selected.value.has(item.id) && selected.value.size > 1,
      sticky: item.sticky,
      dirty: item.dirty,
      "has-icon": props.showIcons,
      "cannot-close": item.cannotClose,
      "pinned-action-off": item.sticky && !props.showUnpin,
      "close-action-off":
        !(item.sticky && props.showUnpin) &&
        !(!item.cannotClose && props.showClose),
      "tab-border-top": !!topBorder(item),
      "tab-border-bottom": !!activeBorder(item),
      "dirty-border-top": !!modifiedBorder(item),
    },
  ];
}
function label(item: EditorTab, index: number) {
  if (item.sticky && props.stickySizing === "compact")
    return props.showIcons ? "" : item.label.charAt(0).toUpperCase();
  return `${props.showIndex ? `${index + 1}: ` : ""}${item.label}`;
}
const descriptions = computed(() => {
  const result = new Map<string, string | undefined>();
  const groups = new Map<string, EditorTab[]>();
  for (const item of items.value) {
    const group = groups.get(item.label) || [];
    group.push(item);
    groups.set(item.label, group);
  }
  for (const group of groups.values()) {
    const values = [...new Set(group.map((item) => item.description || ""))];
    const labels = values.length > 1 ? shorten(values) : values;
    for (const item of group)
      result.set(
        item.id,
        values.length === 1 && !item.forceDescription
          ? ""
          : labels[values.indexOf(item.description || "")],
      );
  }
  return result;
});
function description(item: EditorTab) {
  return descriptions.value.get(item.id);
}
function ariaLabel(item: EditorTab) {
  return `${item.title || item.label}${item.preview ? ", preview" : ""}${item.sticky ? ", pinned" : ""}`;
}
function setNode(id: string, value: unknown) {
  if (value) nodes.set(id, value as HTMLElement);
  else nodes.delete(id);
}
function setActionBar(id: string, value: unknown) {
  if (value) actionBars.set(id, value as InstanceType<typeof ActionBar>);
  else actionBars.delete(id);
}
function updateFocusability() {
  for (const [id, bar] of actionBars) bar.setFocusable(id === activeId.value);
}
let anchor: string | undefined,
  blockReveal = false;
let recent: string[] = [];
for (const item of items.value) {
  recent.splice(recent.length ? 1 : 0, 0, item.id);
  if (item.id === activeId.value)
    recent = [item.id, ...recent.filter((id) => id !== item.id)];
}
function remember(id: string | undefined) {
  if (id)
    recent = [
      id,
      ...recent.filter(
        (value) =>
          value !== id && items.value.some((item) => item.id === value),
      ),
    ];
}
watch(activeId, remember, { flush: "sync" });
function select(
  id: string,
  additional: readonly string[] = [],
  preserveFocus = false,
) {
  activeId.value = id;
  remember(id);
  selectedIds.value = items.value
    .filter((item) => item.id === id || additional.includes(item.id))
    .map((item) => item.id);
  emit("activate", id, preserveFocus);
  nextTick(() => {
    updateFocusability();
    layout(true);
  });
}
function down(event: MouseEvent, item: EditorTab) {
  nodes.get(item.id)?.blur();
  alt.value = event.altKey;
  if (
    event.button !== 0 ||
    (isMac && event.ctrlKey) ||
    (event.target as Element).closest(".tab-actions")
  ) {
    if (event.button === 1) event.preventDefault();
    return;
  }
  if (event.shiftKey && activeId.value) {
    const stable =
      anchor && selected.value.has(anchor) ? anchor : activeId.value;
    anchor = stable;
    const from = items.value.findIndex((item) => item.id === stable),
      to = items.value.findIndex((entry) => entry.id === item.id);
    const min = Math.min(from, to),
      max = Math.max(from, to);
    const keep = [...selected.value] as string[];
    for (
      let index = from + (from < to ? -1 : 1);
      index >= 0 && index < items.value.length;
      index += from < to ? -1 : 1
    ) {
      const id = items.value[index]!.id;
      if (!selected.value.has(id)) break;
      keep.splice(keep.indexOf(id), 1);
    }
    select(item.id, [
      ...new Set([
        ...keep,
        ...items.value.slice(min, max + 1).map((item) => item.id),
      ]),
    ]);
  } else if (isMac ? event.metaKey : event.ctrlKey) {
    if (selected.value.has(item.id)) {
      const remaining = items.value.filter(
        (entry) => selected.value.has(entry.id) && entry.id !== item.id,
      );
      if (remaining.length)
        select(
          item.id === activeId.value
            ? recent.find((id) => remaining.some((entry) => entry.id === id))!
            : activeId.value!,
          remaining.map((item) => item.id),
        );
    } else {
      select(item.id, [...selected.value] as string[]);
      anchor = item.id;
    }
  } else
    select(
      item.id,
      selected.value.has(item.id) ? ([...selected.value] as string[]) : [],
    );
}
function up(event: MouseEvent, item: EditorTab) {
  event.preventDefault();
  event.stopPropagation();
  nodes.get(item.id)?.blur();
  if (
    event.button !== 0 ||
    (isMac && event.ctrlKey) ||
    (event.target as Element).closest(".tab-actions")
  )
    return;
  if (
    !(isMac ? event.metaKey : event.ctrlKey) &&
    !event.shiftKey &&
    selected.value.size > 1
  )
    select(item.id);
}
function beforeClose(id: string) {
  const viewport = scrollArea.value?.viewport;
  if (props.sizing !== "fixed" || !viewport?.matches(":hover")) return;
  const fixed = items.value.at(-1)?.id !== id;
  for (const node of nodes.values()) {
    if (fixed)
      node.style.setProperty(
        "--tab-sizing-current-width",
        `${node.getBoundingClientRect().width}px`,
      );
    else node.style.removeProperty("--tab-sizing-current-width");
  }
}
function clearFixedWidths() {
  for (const node of nodes.values())
    node.style.removeProperty("--tab-sizing-current-width");
}
watch(
  () => props.sizing,
  (value) => {
    if (value !== "fixed") clearFixedWidths();
  },
);
function runAction(item: EditorTab) {
  const kind = actionKind(item);
  if (kind === "unpin") emit("unpin", item.id);
  else {
    beforeClose(item.id);
    blockReveal = true;
    emit(
      "close",
      kind === "closeOthers"
        ? items.value
            .filter((entry) => !entry.sticky && entry.id !== item.id)
            .map((entry) => entry.id)
        : selected.value.has(item.id)
          ? items.value
              .filter((entry) => selected.value.has(entry.id))
              .map((entry) => entry.id)
          : [item.id],
    );
  }
}
function auxiliary(event: MouseEvent, item: EditorTab) {
  if (event.button !== 1) return;
  event.preventDefault();
  event.stopPropagation();
  if (
    item.cannotClose ||
    (item.sticky &&
      ["keyboardAndMouse", "mouse"].includes(props.preventStickyClose))
  )
    return;
  beforeClose(item.id);
  blockReveal = true;
  emit(
    "close",
    selected.value.has(item.id)
      ? items.value
          .filter((entry) => selected.value.has(entry.id))
          .map((entry) => entry.id)
      : [item.id],
  );
}
function keyup(event: KeyboardEvent, item: EditorTab) {
  if (
    event.target !== event.currentTarget ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  const index = items.value.findIndex((entry) => entry.id === item.id);
  const offset = ["ArrowLeft", "ArrowUp"].includes(event.key)
    ? index - 1
    : ["ArrowRight", "ArrowDown"].includes(event.key)
      ? index + 1
      : event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.value.length - 1
          : undefined;
  if (offset !== undefined) {
    const target = items.value[offset];
    if (!target) return;
    select(target.id, [], true);
    nextTick(() => nodes.get(target.id)?.focus());
  } else if (event.key === "Enter" || event.key === " ") {
    select(item.id);
    nodes.get(item.id)?.blur();
  } else return;
  event.preventDefault();
  event.stopPropagation();
}
function doubleClick(event: MouseEvent, item: EditorTab) {
  event.preventDefault();
  event.stopPropagation();
  if (item.preview) emit("pin", item.id);
  else if (props.doubleClickAction !== "off")
    emit("toggleGroupSize", props.doubleClickAction);
}
function context(event: MouseEvent | KeyboardEvent, item: EditorTab) {
  event.preventDefault();
  event.stopPropagation();
  emit("contextmenu", event, item);
}
function keydown(event: KeyboardEvent, item: EditorTab) {
  if (event.shiftKey && event.key === "F10") context(event, item);
}
function layout(force = false) {
  const area = scrollArea.value,
    viewport = area?.viewport;
  if (!area || !viewport) return;
  const old = area.getScrollDimensions();
  area.scanDomNode();
  const count = items.value.filter((item) => item.sticky).length;
  const width =
    count *
    (props.stickySizing === "compact"
      ? 38
      : props.stickySizing === "shrink"
        ? 80
        : 0);
  disableSticky.value = count > 0 && viewport.clientWidth - width < 120;
  viewport.classList.toggle("disable-sticky-tabs", disableSticky.value);
  viewport.style.setProperty(
    "--tab-sizing-fixed-min-width",
    `${props.fixedMinWidth}px`,
  );
  viewport.style.setProperty(
    "--tab-sizing-fixed-max-width",
    `${props.fixedMaxWidth}px`,
  );
  stickyWidth.value = disableSticky.value ? 0 : width;
  const tab = activeId.value && nodes.get(activeId.value);
  const staticTab =
    !disableSticky.value &&
    props.stickySizing !== "normal" &&
    items.value.find((item) => item.id === activeId.value)?.sticky;
  if (blockReveal) {
    blockReveal = false;
    return;
  }
  if (
    !tab ||
    staticTab ||
    (!force &&
      old.width === viewport.clientWidth &&
      old.scrollWidth === viewport.scrollWidth)
  )
    return;
  const x = tab.offsetLeft - stickyWidth.value,
    available = viewport.clientWidth - stickyWidth.value;
  if (
    tab.offsetWidth <= available &&
    scrollLeft.value + available < x + tab.offsetWidth
  )
    area.setScrollPosition({ scrollLeft: x + tab.offsetWidth - available });
  else if (scrollLeft.value > x || tab.offsetWidth > available)
    area.setScrollPosition({ scrollLeft: x });
}
watch(
  [
    activeId,
    () => props.items,
    () => props.compact,
    () => props.sizing,
    () => props.stickySizing,
    () => props.showIcons,
    () => props.showIndex,
    () => props.fixedMinWidth,
    () => props.fixedMaxWidth,
    () => props.reserveActionSpace,
    () => props.actionLocation,
    () => props.showClose,
    () => props.showUnpin,
  ],
  () =>
    nextTick(() => {
      updateFocusability();
      layout(true);
    }),
  { deep: true },
);
function modifiers(event: KeyboardEvent) {
  alt.value = event.altKey;
}
function blur() {
  alt.value = false;
  hovered.value = undefined;
}
onMounted(async () => {
  refreshTheme();
  await nextTick();
  updateFocusability();
  layout(true);
  themeObserver = new MutationObserver(refreshTheme);
  const theme = root.value?.closest(".vc-theme");
  if (theme) themeObserver.observe(theme, { attributes: true });
  resizeObserver = new ResizeObserver(() => layout());
  if (root.value) resizeObserver.observe(root.value);
  scrollArea.value?.viewport?.addEventListener("mouseleave", clearFixedWidths);
  document.addEventListener("keydown", modifiers);
  document.addEventListener("keyup", modifiers);
  window.addEventListener("blur", blur);
});
onBeforeUnmount(() => {
  themeObserver?.disconnect();
  resizeObserver?.disconnect();
  document.removeEventListener("keydown", modifiers);
  document.removeEventListener("keyup", modifiers);
  window.removeEventListener("blur", blur);
});
defineExpose({
  focus: (id = activeId.value) => id && nodes.get(id)?.focus(),
  reveal: () => layout(true),
});
</script>
<template>
  <div
    ref="root"
    :data-editor-tabs="uid"
    :class="{
      vs: light && !highContrast,
      'vs-dark': !light && !highContrast,
      'hc-black': highContrast && !light,
      'hc-light': highContrast && light,
    }"
    class="monaco-workbench file-icons-enabled vc-editor-tabs"
    :style="$slots.content ? { height: '100%' } : undefined"
  >
    <div class="part editor editor-tabs-multiple" :style="$slots.content ? { height: '100%' } : undefined">
      <div class="content" :style="$slots.content ? { height: '100%' } : undefined">
        <div class="editor-group-container" :class="{ active }">
          <div
            class="title tabs"
            :class="{
              'show-file-icons': showIcons,
              'tab-actions-reserve-space': reserveActionSpace,
            }"
            :style="{
              '--editor-group-tab-height': `${height}px`,
              backgroundColor: 'var(--vscode-editorGroupHeader-tabsBackground)',
            }"
          >
            <div
              class="tabs-and-actions-container"
              :class="{
                'tabs-border-bottom': !!bottomBorder,
                empty: !items.length,
              }"
              :style="{ '--tabs-border-bottom-color': bottomBorder }"
            >
              <TabsScrollArea
                ref="scrollArea"
                v-model:scroll-left="scrollLeft"
                :horizontal="scrollbar"
                :scrollbar-size="scrollbarSize === 'large' ? 8 : 3"
                :sticky-width="stickyWidth"
              >
                <div
                  v-for="(item, index) in items"
                  :key="item.id"
                  :ref="(value) => setNode(item.id, value)"
                  class="tab"
                  :class="classes(item)"
                  :style="tabStyle(item, index)"
                  role="tab"
                  draggable="true"
                  :aria-label="ariaLabel(item)"
                  aria-description=""
                  :aria-selected="selected.has(item.id)"
                  :tabindex="item.id === activeId ? 0 : -1"
                  :data-resource-name="item.label"
                  :data-id="item.id"
                  @mousedown="down($event, item)"
                  @mouseup="up($event, item)"
                  @auxclick="auxiliary($event, item)"
                  @keyup="keyup($event, item)"
                  @keydown="keydown($event, item)"
                  @dblclick="doubleClick($event, item)"
                  @contextmenu.capture="context($event, item)"
                  @mouseenter="
                    hovered = item.id;
                    alt = $event.altKey;
                  "
                  @mouseleave="hovered = undefined"
                >
                  <div class="tab-fill" aria-hidden="true" />
                  <div class="tab-connected-edge" aria-hidden="true" />
                  <div class="tab-divider" aria-hidden="true" />
                  <div class="tab-border-top-container" />
                  <IconLabel
                    :label="label(item, index)"
                    :description="
                      item.sticky && stickySizing === 'compact'
                        ? undefined
                        : description(item)
                    "
                    :italic="item.preview"
                    :title="item.title || item.label"
                    :extra-classes="[
                      ...(showIcons
                        ? [
                            `codicon-${item.icon || 'file'}`,
                            'predefined-file-icon',
                          ]
                        : []),
                      'tab-label',
                      'tab-label-has-badge',
                    ]"
                  />
                  <div class="tab-actions">
                    <ActionBar
                      :ref="(value) => setActionBar(item.id, value)"
                      :actions="action(item)"
                      aria-label="Tab actions"
                      @action="runAction(item)"
                    />
                  </div>
                  <div class="tab-fade-hider" />
                  <div class="tab-border-bottom-container" />
                </div>
              </TabsScrollArea>
              <div class="editor-actions hidden" />
              <div
                class="editor-actions-separator"
                aria-hidden="true"
                style="display: none"
              />
              <div class="editor-layout-actions hidden" />
            </div>
          </div>
          <slot name="content" />
        </div>
      </div>
    </div>
    <component :is="'style'" v-text="themeRules" />
    <Tooltip
      v-for="item in items"
      :key="item.id"
      :target="nodes.get(item.id) || null"
      :text="item.title || item.label"
      ><template v-if="item.preview" #content
        ><div class="rendered-markdown vc-editor-tab-preview">
          <p>
            {{ item.title || item.label }} (<em>preview</em>{{ " " }}
            <a
              href=""
              draggable="false"
              title="Configure Preview Mode"
              @click.prevent="emit('configurePreview')"
              ><span class="codicon codicon-gear" /></a
            >)
          </p>
        </div></template
      ></Tooltip
    >
  </div>
</template>
