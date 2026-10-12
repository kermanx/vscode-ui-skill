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
import ActionBar from "../action-bar/ActionBar.vue";
import type { ActionBarEntry } from "../action-bar/types";
import type { MenuEntry } from "../menu/types";
import { dropdownPopupHost } from "../dropdown/popupHost";
import NotificationsList from "./NotificationsList.vue";
import NotificationMenuAction from "./NotificationMenuAction.vue";
import { notificationKeyboard } from "./notificationKeyboard";
import { notificationFilters } from "./notificationFilters";
import { hasActiveProgress } from "./notificationState";
import type {
  NotificationItem,
  NotificationPosition,
  NotificationSource,
  NotificationsListHandle,
} from "./types";
import "./notificationsCenter.css";
const props = withDefaults(
  defineProps<{
    sources?: readonly NotificationSource[];
    statusBarVisible?: boolean;
    titleBarVisible?: boolean;
  }>(),
  { statusBarVisible: true, titleBarVisible: false },
);
const open = defineModel<boolean>("open", { default: false });
const items = defineModel<readonly NotificationItem[]>("items", {
  default: () => [],
});
const expandedIds = defineModel<readonly string[]>("expandedIds", {
  default: () => [],
});
const position = defineModel<NotificationPosition>("position", {
  default: "bottom-right",
});
const doNotDisturb = defineModel<boolean>("doNotDisturb", { default: false });
const mutedSourceIds = defineModel<readonly string[]>("mutedSourceIds", {
  default: () => [],
});
const emit = defineEmits<{
  close: [id: string];
  action: [id: string, actionId: string];
  link: [id: string, href: string];
  copy: [id: string, text: string];
  filter: [sourceId: string, filtered: boolean];
  restoreFocus: [];
  manageSources: [];
}>();
const root = ref<HTMLElement>(),
  center = ref<HTMLElement>(),
  list = ref<NotificationsListHandle>();
const disturbMenu = ref<InstanceType<typeof NotificationMenuAction>>(),
  positionMenu = ref<InstanceType<typeof NotificationMenuAction>>();
const width = ref(450),
  maxHeight = ref(400),
  created = ref(false);
let observer: ResizeObserver | undefined;
let closing = false;
provide(dropdownPopupHost, { container: root, layer: 2575 });
provide(
  notificationFilters,
  computed(() => new Set(mutedSourceIds.value)),
);
provide(notificationKeyboard, (event) => {
  if (
    event.key !== "Escape" ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return false;
  hide();
  return true;
});
const sources = computed(
  () =>
    props.sources || [
      ...new Map(
        items.value.flatMap((item) =>
          typeof item.source === "object"
            ? [[item.source.id, item.source] as const]
            : [],
        ),
      ).values(),
    ],
);
const toolbar = computed<ActionBarEntry[]>(() => [
  {
    id: "clear",
    label: "Clear All Notifications",
    icon: "notifications-clear-all",
    disabled: !items.value.some((item) => !hasActiveProgress(item)),
  },
  {
    id: "disturb",
    label: "Configure Do Not Disturb...",
    icon: "notifications-do-not-disturb",
  },
  {
    id: "position",
    label: "Configure Notifications Position...",
    icon: "notifications-position",
  },
  {
    id: "hide",
    label: "Hide Notifications",
    icon:
      position.value === "top-right"
        ? "notifications-hide-up"
        : "notifications-hide",
  },
]);
const positions = ["bottom-right", "bottom-left", "top-right"] as const;
const positionActions = computed<MenuEntry[]>(() =>
  positions.map((id, index) => ({
    id,
    label: ["Bottom Right", "Bottom Left", "Top Right"][index],
    checked: position.value === id,
  })),
);
const disturbActions = computed<MenuEntry[]>(() => {
  const entries: MenuEntry[] = [
    {
      id: "__toggle",
      label: `${doNotDisturb.value ? "Disable" : "Enable"} Do Not Disturb Mode`,
    },
  ];
  const sorted = [...sources.value].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  if (sorted.length) entries.push({ separator: true });
  entries.push(
    ...sorted.slice(0, 10).map((source) => ({
      id: source.id,
      label: source.label,
      checked: !mutedSourceIds.value.includes(source.id),
    })),
  );
  if (sorted.length > 10)
    entries.push({ separator: true }, { id: "__more", label: "More…" });
  return entries;
});
function layout() {
  if (!root.value) return;
  width.value = Math.max(0, Math.min(450, root.value.clientWidth - 16));
  maxHeight.value = Math.max(
    0,
    Math.min(
      400,
      root.value.clientHeight -
        35 -
        (props.statusBarVisible ? 22 : 0) -
        (props.titleBarVisible ? 22 : 0) -
        24,
    ),
  );
}
function hide() {
  if (!open.value || closing) return;
  const focused = center.value?.contains(document.activeElement);
  closing = true;
  open.value = false;
  if (focused) emit("restoreFocus");
}
async function show() {
  open.value = true;
  created.value = true;
  await nextTick();
  layout();
  await nextTick();
  list.value?.focusFirst();
}
function clearAll() {
  hide();
  const removed = items.value.filter((item) => !hasActiveProgress(item));
  items.value = items.value.filter(hasActiveProgress);
  for (const item of removed) emit("close", item.id);
}
function filter(sourceId: string, filtered: boolean) {
  mutedSourceIds.value = filtered
    ? [...mutedSourceIds.value.filter((id) => id !== sourceId), sourceId]
    : mutedSourceIds.value.filter((id) => id !== sourceId);
  emit("filter", sourceId, filtered);
}
function runDisturb(id: string) {
  if (id === "__toggle") doNotDisturb.value = !doNotDisturb.value;
  else if (id === "__more") emit("manageSources");
  else filter(id, !mutedSourceIds.value.includes(id));
}
function runToolbar(id: string) {
  if (id === "clear") clearAll();
  else if (id === "hide") hide();
  else if (id === "disturb") disturbMenu.value?.show();
  else positionMenu.value?.show();
}
function keydown(event: KeyboardEvent) {
  if (
    open.value &&
    event.key === "Escape" &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.defaultPrevented
  ) {
    hide();
    event.preventDefault();
  }
}
watch(
  open,
  (value, previous) => {
    if (value) void show();
    else {
      if (
        !closing &&
        previous &&
        center.value?.contains(document.activeElement)
      )
        emit("restoreFocus");
      closing = false;
    }
  },
  { immediate: true, flush: "sync" },
);
watch(doNotDisturb, (value) => {
  if (value) hide();
});
watch(
  () => items.value.length,
  (length, previous) => {
    if (!open.value || closing || !previous || length) return;
    const focused = center.value?.contains(document.activeElement);
    hide();
    // The center's removal handler restores focus after hide() as well.
    if (focused) emit("restoreFocus");
  },
  { flush: "sync" },
);
watch(() => [props.statusBarVisible, props.titleBarVisible], layout);
onMounted(() => {
  layout();
  observer = new ResizeObserver(layout);
  observer.observe(root.value!);
  window.addEventListener("keydown", keydown);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener("keydown", keydown);
});
defineExpose({ show, hide, clearAll, focus: () => list.value?.focusFirst() });
</script>
<template>
  <div
    ref="root"
    class="monaco-workbench vc-notifications-center-workbench"
    :class="{ nostatusbar: !statusBarVisible }"
  >
    <div
      v-if="created"
      ref="center"
      class="notifications-center"
      :class="[position, { visible: open }]"
      :style="{
        width: `${width}px`,
        top:
          position === 'top-right' ? `${7 + (titleBarVisible ? 35 : 0)}px` : '',
        border: '1px solid var(--vscode-notificationCenter-border)',
      }"
    >
      <div
        class="notifications-center-header"
        style="
          color: var(--vscode-notificationCenterHeader-foreground);
          background: var(--vscode-notificationCenterHeader-background);
        "
      >
        <span class="notifications-center-header-title">{{
          items.length ? "Notifications" : "No new notifications"
        }}</span>
        <div class="notifications-center-header-toolbar">
          <ActionBar
            :actions="toolbar"
            aria-label="Notification Center Actions"
            @action="runToolbar"
          >
            <template #item="{ entry, tabindex, focused, onFocus }">
              <NotificationMenuAction
                v-if="'id' in entry && entry.id === 'disturb'"
                ref="disturbMenu"
                :actions="disturbActions"
                :label="entry.label"
                :icon="entry.icon"
                :tabindex="tabindex"
                :focused="focused"
                @focus="onFocus"
                @action="runDisturb"
              />
              <NotificationMenuAction
                v-else-if="'id' in entry && entry.id === 'position'"
                ref="positionMenu"
                :actions="positionActions"
                :label="entry.label"
                :icon="entry.icon"
                :tabindex="tabindex"
                :focused="focused"
                @focus="onFocus"
                @action="position = $event as NotificationPosition"
              />
            </template>
          </ActionBar>
        </div>
      </div>
      <NotificationsList
        v-if="open"
        ref="list"
        v-model:items="items"
        v-model:expanded-ids="expandedIds"
        :max-height="maxHeight"
        :position="position"
        aria-label="Notifications Center"
        @close="emit('close', $event)"
        @action="(id, actionId) => emit('action', id, actionId)"
        @link="(id, href) => emit('link', id, href)"
        @copy="(id, text) => emit('copy', id, text)"
        @filter="filter"
      />
    </div>
  </div>
</template>
<style>
.vc-notifications-center-workbench {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.vc-notifications-center-workbench > .notifications-center,
.vc-notifications-center-workbench > .context-view {
  pointer-events: auto;
}
</style>
