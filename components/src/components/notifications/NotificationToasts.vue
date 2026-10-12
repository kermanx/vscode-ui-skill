<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch,
} from "vue";
import NotificationsList from "./NotificationsList.vue";
import { ariaLabel, hasPrimaryActions, isSticky } from "./notificationState";
import { notificationKeyboard } from "./notificationKeyboard";
import { notificationFilters } from "./notificationFilters";
import { dropdownPopupHost } from "../dropdown/popupHost";
import type {
  NotificationItem,
  NotificationPosition,
  NotificationsListHandle,
} from "./types";
import "./notificationsToasts.css";

const props = withDefaults(
  defineProps<{
    position?: NotificationPosition;
    statusBarVisible?: boolean;
    titleBarVisible?: boolean;
    centerVisible?: boolean;
  }>(),
  {
    position: "bottom-right",
    statusBarVisible: true,
    titleBarVisible: false,
    centerVisible: false,
  },
);
const items = defineModel<readonly NotificationItem[]>("items", {
  default: () => [],
});
const expandedIds = defineModel<readonly string[]>("expandedIds", {
  default: () => [],
});
const emit = defineEmits<{
  close: [id: string];
  action: [id: string, actionId: string];
  link: [id: string, href: string];
  copy: [id: string, text: string];
  filter: [sourceId: string, filtered: boolean];
  visibilityChange: [visible: boolean];
  restoreFocus: [];
}>();
const root = ref<HTMLElement>();
if (!inject(dropdownPopupHost, undefined))
  provide(dropdownPopupHost, { container: root, layer: 2575 });
provide(notificationKeyboard, surfaceKeydown);
const filteredSources = ref(new Set<string>());
provide(notificationFilters, filteredSources);
const records = shallowRef<string[]>([]),
  visibleIds = ref<string[]>([]),
  measuring = ref(false);
const width = ref(450),
  height = ref(0);
const lists = new Map<string, NotificationsListHandle>(),
  containers = new Map<string, HTMLElement>();
const timers = new Map<string, ReturnType<typeof setTimeout>>(),
  pending = new Map<string, number>();
const mouseOver = new Set<string>(),
  waitingForWindowFocus = new Set<string>(),
  faded = ref(new Set<string>());
const itemMap = computed(
  () => new Map(items.value.map((item) => [item.id, item])),
);
const rendered = computed(() =>
  records.value
    .filter(
      (id) =>
        (measuring.value || visibleIds.value.includes(id)) &&
        itemMap.value.has(id),
    )
    .map((id) => itemMap.value.get(id)!),
);
let observer: ResizeObserver | undefined,
  layoutFrame = 0,
  layoutRunning = false,
  lastIncrementTime = 0,
  countInInterval = 0;
const timeout = (item: NotificationItem) =>
  item.severity === "error"
    ? 15000
    : item.severity === "warning"
      ? 12000
      : 10000;
const visible = computed(() => records.value.length > 0);
function bindList(value: unknown, id: string) {
  if (value) lists.set(id, value as NotificationsListHandle);
  else lists.delete(id);
}
function bindContainer(value: unknown, id: string) {
  if (value) containers.set(id, value as HTMLElement);
  else containers.delete(id);
}
function schedulePurge(id: string) {
  const item = itemMap.value.get(id);
  if (!item) return;
  clearTimeout(timers.get(id));
  timers.set(
    id,
    setTimeout(() => {
      const item = itemMap.value.get(id);
      if (!item) return;
      if (!document.hasFocus()) waitingForWindowFocus.add(id);
      else if (
        isSticky(
          item,
          hasPrimaryActions(item) || expandedIds.value.includes(id),
        ) ||
        lists.get(id)?.hasFocus() ||
        mouseOver.has(id)
      )
        schedulePurge(id);
      else removeToast(id);
    }, timeout(item)),
  );
}
function windowFocused() {
  for (const id of waitingForWindowFocus) schedulePurge(id);
}
function requestLayout() {
  if (layoutFrame || layoutRunning || !root.value) return;
  layoutFrame = requestAnimationFrame(async () => {
    layoutFrame = 0;
    layoutRunning = true;
    measuring.value = true;
    const rect = root.value!.getBoundingClientRect();
    width.value = Math.min(450, rect.width - 16);
    height.value =
      rect.height -
      (props.statusBarVisible ? 22 : 0) -
      (props.titleBarVisible ? 22 : 0) -
      24;
    await nextTick();
    await nextTick();
    let single = height.value,
      multiple = Math.round(height.value * 0.618),
      shown = 0;
    const next: string[] = [];
    for (const id of records.value) {
      const size = containers.get(id)?.offsetHeight || 0;
      single -= size;
      multiple -= size;
      if (
        shown < 3 &&
        ((shown === 0 && single >= 0) || (shown > 0 && multiple >= 0))
      ) {
        next.push(id);
        shown++;
      }
    }
    visibleIds.value = next;
    measuring.value = false;
    await nextTick();
    layoutRunning = false;
  });
}
function optionalCoversInput() {
  const active = document.activeElement;
  if (
    !(active instanceof HTMLElement) ||
    !(active.matches("input, textarea") || active.isContentEditable) ||
    !root.value
  )
    return false;
  const item = active.getBoundingClientRect(),
    area = root.value.getBoundingClientRect();
  const left = item.left - area.left,
    top = item.top - area.top;
  return props.position === "bottom-left"
    ? left < area.width / 2 && top > area.height / 2
    : props.position === "top-right"
      ? left > area.width / 2 && top < area.height / 2
      : left > area.width / 2 && top > area.height / 2;
}
function addToast(item: NotificationItem) {
  if (
    props.centerVisible ||
    item.priority === "silent" ||
    (typeof item.source === "object" &&
      filteredSources.value.has(item.source.id) &&
      item.severity !== "error" &&
      item.priority !== "urgent") ||
    (item.priority === "optional" && optionalCoversInput()) ||
    pending.has(item.id) ||
    records.value.includes(item.id)
  )
    return;
  const now = Date.now();
  if (now - lastIncrementTime > 800) {
    lastIncrementTime = now;
    countInInterval = 0;
  }
  if (++countInInterval > 3) return;
  pending.set(
    item.id,
    requestAnimationFrame(() => {
      pending.delete(item.id);
      if (!itemMap.value.has(item.id)) return;
      records.value = [item.id, ...records.value];
      visibleIds.value = [item.id, ...visibleIds.value];
      schedulePurge(item.id);
      requestLayout();
    }),
  );
}
function focusAt(index: number) {
  const id = visibleIds.value[index];
  if (!id) return false;
  lists.get(id)?.focusFirst();
  return true;
}
function focusedIndex() {
  return visibleIds.value.findIndex((id) => lists.get(id)?.hasFocus());
}
function focusFirst() {
  return focusAt(0);
}
function focusLast() {
  return focusAt(visibleIds.value.length - 1);
}
function focusNext() {
  const index = focusedIndex();
  return index >= 0 && focusAt(index + 1);
}
function focusPrevious() {
  const index = focusedIndex();
  return index >= 0 && focusAt(index - 1);
}
function removeToast(id: string) {
  const wasFocused = lists.get(id)?.hasFocus();
  const restore = wasFocused && !(focusNext() || focusPrevious());
  cancelAnimationFrame(pending.get(id) || 0);
  pending.delete(id);
  clearTimeout(timers.get(id));
  timers.delete(id);
  waitingForWindowFocus.delete(id);
  mouseOver.delete(id);
  faded.value.delete(id);
  records.value = records.value.filter((value) => value !== id);
  visibleIds.value = visibleIds.value.filter((value) => value !== id);
  if (records.value.length) requestLayout();
  else if (restore) emit("restoreFocus");
}
function hide(restoreFocus = true) {
  const focused = !!root.value?.contains(document.activeElement);
  for (const value of pending.values()) cancelAnimationFrame(value);
  for (const value of timers.values()) clearTimeout(value);
  pending.clear();
  timers.clear();
  mouseOver.clear();
  waitingForWindowFocus.clear();
  faded.value.clear();
  records.value = [];
  visibleIds.value = [];
  if (restoreFocus && focused) emit("restoreFocus");
}
function filterSource(sourceId: string, filtered: boolean) {
  if (filtered)
    for (const id of records.value) {
      const item = itemMap.value.get(id);
      if (
        item &&
        typeof item.source === "object" &&
        item.source.id === sourceId &&
        item.severity !== "error" &&
        item.priority !== "urgent"
      )
        removeToast(id);
    }
  emit("filter", sourceId, filtered);
}
function updateItem(id: string, value: readonly NotificationItem[]) {
  if (!value.length) items.value = items.value.filter((item) => item.id !== id);
  else
    items.value = items.value.map((item) => (item.id === id ? value[0] : item));
}
function surfaceKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") focusNext();
  else if (event.key === "ArrowUp") focusPrevious();
  else if (event.key === "Home" || event.key === "PageUp") focusFirst();
  else if (event.key === "End" || event.key === "PageDown") focusLast();
  else if (event.key === "Escape") hide();
  else return false;
  return true;
}
function keydown(event: KeyboardEvent) {
  if (
    visible.value &&
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
  items,
  (value, previous) => {
    const ids = new Set(value.map((item) => item.id)),
      previousIds = new Set(previous.map((item) => item.id));
    for (const id of [...records.value, ...pending.keys()])
      if (!ids.has(id)) removeToast(id);
    for (const item of [...value].reverse())
      if (!previousIds.has(item.id)) addToast(item);
  },
  { deep: true },
);
watch(() => [props.statusBarVisible, props.titleBarVisible], requestLayout);
watch(
  () => props.centerVisible,
  (value) => {
    if (value) hide(false);
  },
);
watch(visible, (value) => emit("visibilityChange", value));
onMounted(() => {
  observer = new ResizeObserver(requestLayout);
  observer.observe(root.value!);
  for (const item of items.value) addToast(item);
  requestLayout();
  window.addEventListener("keydown", keydown);
  window.addEventListener("focus", windowFocused);
});
onBeforeUnmount(() => {
  hide(false);
  observer?.disconnect();
  cancelAnimationFrame(layoutFrame);
  window.removeEventListener("keydown", keydown);
  window.removeEventListener("focus", windowFocused);
});
defineExpose({
  hide,
  focus: focusFirst,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious,
});
</script>
<template>
  <div
    ref="root"
    class="monaco-workbench vc-notification-toasts-workbench"
    :class="{ nostatusbar: !statusBarVisible }"
  >
    <div
      class="notifications-toasts"
      :class="[position, { visible }]"
      :style="{
        top:
          position === 'top-right'
            ? `${3 + (titleBarVisible ? 35 : 0)}px`
            : undefined,
      }"
    >
      <div
        v-for="item in rendered"
        :key="item.id"
        :ref="(value) => bindContainer(value, item.id)"
        class="notification-toast-container"
        :data-id="item.id"
        :style="{ opacity: measuring ? '0' : undefined }"
        @mouseover="mouseOver.add(item.id)"
        @mouseout="mouseOver.delete(item.id)"
      >
        <div
          class="notification-toast"
          :class="
            faded.has(item.id)
              ? 'notification-fade-in-done'
              : 'notification-fade-in'
          "
          :style="{
            background: 'var(--vscode-notifications-background)',
            border: '1px solid var(--vscode-notificationToast-border)',
          }"
          @transitionend="faded.add(item.id)"
        >
          <NotificationsList
            :ref="(value) => bindList(value, item.id)"
            :items="[item]"
            v-model:expanded-ids="expandedIds"
            :style="{ width: `${width}px` }"
            :aria-label="ariaLabel(item)"
            :position="position"
            scrollbar="hidden"
            @update:items="updateItem(item.id, $event)"
            @close="emit('close', $event)"
            @action="(id, actionId) => emit('action', id, actionId)"
            @link="(id, href) => emit('link', id, href)"
            @copy="(id, text) => emit('copy', id, text)"
            @filter="filterSource"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<style>
.vc-notification-toasts-workbench {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.vc-notification-toasts-workbench > .notifications-toasts,
.vc-notification-toasts-workbench > .context-view {
  pointer-events: auto;
}
</style>
