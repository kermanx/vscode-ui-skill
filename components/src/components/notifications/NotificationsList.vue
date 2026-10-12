<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  provide,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import ScrollableElement from '../scrollable-element/ScrollableElement.vue';
import ContextMenu from '../context-menu/ContextMenu.vue';
import { dropdownPopupHost } from '../dropdown/popupHost';
import { notificationKeyboard } from './notificationKeyboard';
import { notificationFilters } from './notificationFilters';
import NotificationRow from './NotificationRow.vue';
import { RangeMap } from './rangeMap';
import {
  ariaLabel as ariaLabelFor,
  hasActiveProgress,
  hasPrimaryActions,
  notificationHeight,
  rawMessage,
} from './notificationState';
import type {
  NotificationAction,
  NotificationItem,
  NotificationPosition,
} from './types';
import '../list/upstream/list.css';
import './notificationsList.css';
import './notificationsActions.css';
import './notificationsLayout.css';
import './notificationIcons.css';

const props = withDefaults(
  defineProps<{
    maxHeight?: number;
    ariaLabel?: string;
    position?: NotificationPosition;
    scrollbar?: 'auto' | 'hidden';
  }>(),
  {
    ariaLabel: 'Notifications List',
    position: 'bottom-right',
    scrollbar: 'auto',
  },
);
const items = defineModel<readonly NotificationItem[]>('items', {
  default: () => [],
});
const expandedIds = defineModel<readonly string[]>('expandedIds', {
  default: () => [],
});
const emit = defineEmits<{
  close: [id: string];
  action: [id: string, actionId: string];
  link: [id: string, href: string];
  copy: [id: string, text: string];
  filter: [sourceId: string, filtered: boolean];
  focusChange: [id?: string];
  layout: [height: number];
}>();
const root = ref<HTMLElement>(),
  helper = ref<HTMLElement>(),
  list = ref<HTMLElement>();
if (!inject(dropdownPopupHost, undefined))
  provide(dropdownPopupHost, { container: root, layer: 2575 });
const scrollable = ref<InstanceType<typeof ScrollableElement>>(),
  contextMenu = ref<InstanceType<typeof ContextMenu>>();
const scrollTop = ref(0),
  focused = ref<string>();
const heights = ref<number[]>([]),
  filteredSources = inject(notificationFilters, ref(new Set<string>()));
const surfaceKeydown = inject(notificationKeyboard, undefined);
const uid = getCurrentInstance()!.uid;
const rowId = (id: string) => `notification-${uid}-${id}`;
const isExpanded = (item: NotificationItem) =>
  hasPrimaryActions(item) || expandedIds.value.includes(item.id);
const range = computed(() => {
  const value = new RangeMap();
  value.splice(
    0,
    0,
    heights.value.map((size) => ({ size })),
  );
  return value;
});
const height = computed(() =>
  Math.min(range.value.size, props.maxHeight ?? Number.POSITIVE_INFINITY),
);
const first = computed(() =>
  Math.max(0, range.value.indexAt(scrollTop.value) - 1),
);
const last = computed(() =>
  Math.min(
    items.value.length,
    range.value.indexAfter(scrollTop.value + height.value) + 1,
  ),
);
const rendered = computed(() => items.value.slice(first.value, last.value));
let observer: ResizeObserver | undefined,
  blurTimer: ReturnType<typeof setTimeout>;
let contextItem: NotificationItem | undefined;

function relativeTop(index: number): number | null {
  if (index < 0) return null;
  const top = range.value.positionAt(index),
    size = heights.value[index];
  if (top < scrollTop.value || top + size > scrollTop.value + height.value)
    return null;
  return Math.abs((scrollTop.value - top) / (size - height.value));
}
function restoreRelativeTop(relative: number | null, index: number) {
  if (relative === null || !Number.isFinite(relative) || index < 0) return;
  const top = Math.floor(
    (heights.value[index] - height.value) * Math.max(0, Math.min(1, relative)) +
      range.value.positionAt(index),
  );
  nextTick(() => {
    scrollable.value?.scanDomNode();
    setScroll(top);
    scrollable.value?.setScrollPosition({ scrollTop: scrollTop.value });
  });
}
function measure(preserveFocus = false) {
  if (!helper.value) return;
  const focusedIndex = items.value.findIndex(
    (item) => item.id === focused.value,
  );
  const relative = preserveFocus ? relativeTop(focusedIndex) : null;
  const values = items.value.map((item) =>
    notificationHeight(item, isExpanded(item), helper.value!),
  );
  const collapsible = items.value
    .filter(
      (item, index) =>
        !hasPrimaryActions(item) && isExpanded(item) && values[index] === 42,
    )
    .map((item) => item.id);
  if (collapsible.length)
    expandedIds.value = expandedIds.value.filter(
      (id) => !collapsible.includes(id),
    );
  if (
    values.some((value, index) => value !== heights.value[index]) ||
    values.length !== heights.value.length
  )
    heights.value = values;
  restoreRelativeTop(relative, focusedIndex);
  nextTick(() => {
    scrollable.value?.scanDomNode();
    if (preserveFocus && list.value?.contains(document.activeElement))
      list.value.focus();
  });
}
function setFocus(id?: string) {
  if (focused.value !== id) {
    focused.value = id;
    emit('focusChange', id);
  }
}
function setScroll(value: number) {
  scrollTop.value = Math.max(
    0,
    Math.min(value, range.value.size - height.value),
  );
}
function reveal(id: string) {
  const index = items.value.findIndex((item) => item.id === id);
  if (index < 0) return;
  const top = range.value.positionAt(index),
    size = heights.value[index] || 42;
  if (top < scrollTop.value) setScroll(top);
  else if (top + size > scrollTop.value + height.value)
    setScroll(top + size - height.value);
}
function focus(id?: string) {
  if (id !== undefined) {
    setFocus(id);
    reveal(id);
  }
  list.value?.focus();
}
function focusFirst() {
  focus(items.value[0]?.id);
}
function close(item: NotificationItem) {
  if (hasActiveProgress(item)) return;
  items.value = items.value.filter((value) => value.id !== item.id);
  emit('close', item.id);
}
function toggle(item: NotificationItem, value = !isExpanded(item)) {
  if (hasPrimaryActions(item)) return;
  expandedIds.value = value
    ? [...expandedIds.value.filter((id) => id !== item.id), item.id]
    : expandedIds.value.filter((id) => id !== item.id);
  measure(true);
}
function runAction(
  item: NotificationItem,
  action: NotificationAction,
  primary: boolean,
) {
  emit('action', item.id, action.id);
  if (primary && !action.keepOpen) {
    items.value = items.value.filter((value) => value.id !== item.id);
    emit('close', item.id);
  }
}
function filter(item: NotificationItem) {
  if (typeof item.source !== 'object') return;
  const id = item.source.id,
    value = !filteredSources.value.has(id);
  if (value) filteredSources.value.add(id);
  else filteredSources.value.delete(id);
  emit('filter', id, value);
}
function context(event: MouseEvent, item: NotificationItem) {
  event.preventDefault();
  event.stopPropagation();
  setFocus(item.id);
  contextItem = item;
  contextMenu.value?.show(event);
}
function copy() {
  if (contextItem) emit('copy', contextItem.id, rawMessage(contextItem));
}
function mousedown(event: MouseEvent) {
  if (
    !(event.target instanceof HTMLElement) ||
    event.target.closest('input, textarea')
  )
    return;
  if (document.activeElement !== event.target) list.value?.focus();
}
function blurred() {
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    if (document.hasFocus() && !list.value?.contains(document.activeElement))
      setFocus();
  }, 0);
}
function focusin() {
  clearTimeout(blurTimer);
}
async function pageFocus(next: boolean) {
  const index = items.value.findIndex((item) => item.id === focused.value);
  if (next) {
    const last = Math.max(
      0,
      range.value.indexAt(scrollTop.value + height.value) - 1,
    );
    if (last > index) focus(items.value[last]?.id);
    else if (scrollTop.value + height.value < range.value.size) {
      setScroll(scrollTop.value + height.value);
      setFocus();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await pageFocus(true);
    }
  } else {
    const first =
      scrollTop.value === 0 ? 0 : range.value.indexAfter(scrollTop.value - 1);
    if (index !== first && index >= first) focus(items.value[first]?.id);
    else if (scrollTop.value > 0) {
      setScroll(scrollTop.value - height.value);
      setFocus();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await pageFocus(false);
    }
  }
}
function keydown(event: KeyboardEvent) {
  if (
    !(event.target instanceof Node) ||
    !list.value?.contains(event.target) ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    (event.metaKey &&
      !(navigator.platform.includes('Mac') && event.key === 'Backspace'))
  )
    return;
  if (surfaceKeydown?.(event)) {
    event.preventDefault();
    return;
  }
  let index = items.value.findIndex((item) => item.id === focused.value);
  const item = items.value[index < 0 ? 0 : index];
  if (event.key === 'ArrowDown')
    focus(
      items.value[Math.min(items.value.length - 1, Math.max(0, index + 1))]?.id,
    );
  else if (event.key === 'ArrowUp')
    focus(items.value[Math.max(0, index - 1)]?.id);
  else if (event.key === 'Home') focusFirst();
  else if (event.key === 'End') focus(items.value.at(-1)?.id);
  else if (event.key === 'PageDown' || event.key === 'PageUp')
    void pageFocus(event.key === 'PageDown');
  else if (item && event.key === 'ArrowRight') toggle(item, true);
  else if (item && event.key === 'ArrowLeft') toggle(item, false);
  else if (item && (event.key === 'Enter' || event.key === ' ')) toggle(item);
  else if (
    item &&
    ((event.key === 'Delete' && !navigator.platform.includes('Mac')) ||
      (event.key === 'Backspace' &&
        event.metaKey &&
        navigator.platform.includes('Mac')))
  )
    close(item);
  else return;
  event.preventDefault();
}
function tab(event: KeyboardEvent) {
  if (
    event.key !== 'Tab' ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.target !== list.value ||
    !focused.value
  )
    return;
  const target = document
    .getElementById(rowId(focused.value))
    ?.querySelector<HTMLElement>('[tabindex]');
  if (
    target &&
    target.tabIndex !== -1 &&
    getComputedStyle(target).visibility !== 'hidden' &&
    getComputedStyle(target).display !== 'none'
  ) {
    event.preventDefault();
    event.stopPropagation();
    target.focus();
  }
}
watch(
  () => items.value,
  (value, previous) => {
    const index = previous.findIndex((item) => item.id === focused.value),
      hadFocus = !!list.value?.contains(document.activeElement);
    const preserve =
      value.length !== previous.length ||
      value.some(
        (item, index) =>
          item.id !== previous[index]?.id ||
          hasActiveProgress(item) !==
            (previous[index] ? hasActiveProgress(previous[index]) : false) ||
          item.actions !== previous[index]?.actions,
      );
    const relative = preserve ? relativeTop(index) : null;
    measure();
    if (index >= 0 && !value.some((item) => item.id === focused.value))
      setFocus(value[Math.max(0, Math.min(value.length - 1, index - 1))]?.id);
    restoreRelativeTop(
      relative,
      value.findIndex((item) => item.id === focused.value),
    );
    if (hadFocus && value.length) nextTick(() => list.value?.focus());
  },
  { deep: true },
);
watch(expandedIds, () => measure(true), { deep: true });
watch(height, (value) => {
  setScroll(scrollTop.value);
  emit('layout', value);
});
onMounted(() => {
  measure();
  observer = new ResizeObserver(() => measure());
  if (root.value) observer.observe(root.value);
  window.addEventListener('keydown', keydown);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(blurTimer);
  window.removeEventListener('keydown', keydown);
});
defineExpose({
  focus,
  focusFirst,
  hasFocus: () => !!list.value?.contains(document.activeElement),
  getFocus: () => focused.value,
  reveal,
  getHeight: () => height.value,
});
</script>
<template>
  <div class="monaco-workbench vc-notifications-workbench">
    <div ref="root" class="notifications-list-container">
      <div ref="helper" class="notification-offset-helper" />
      <div
        ref="list"
        class="monaco-list mouse-support vc-notifications-list"
        :class="{ 'element-focused': focused !== undefined }"
        :style="{ height: `${height}px` }"
        tabindex="0"
        role="list"
        :aria-label="ariaLabel"
        :aria-activedescendant="focused ? rowId(focused) : undefined"
        @mousedown="mousedown"
        @focusout="blurred"
        @focusin="focusin"
        @keydown="tab"
      >
        <ScrollableElement
          ref="scrollable"
          v-model:scroll-top="scrollTop"
          :height="height"
          horizontal="hidden"
          :vertical="scrollbar"
          contain-wheel
        >
          <div class="monaco-list-rows" :style="{ height: `${range.size}px` }">
            <div
              v-for="(item, offset) in rendered"
              :id="rowId(item.id)"
              :key="item.id"
              class="monaco-list-row"
              :class="{ focused: focused === item.id }"
              :data-id="item.id"
              :data-index="first + offset"
              :style="{
                top: `${range.positionAt(first + offset)}px`,
                height: `${heights[first + offset]}px`,
              }"
              role="dialog"
              :aria-label="ariaLabelFor(item)"
              :aria-posinset="first + offset + 1"
              :aria-setsize="items.length"
              @click="setFocus(item.id)"
              @dblclick="toggle(item)"
              @contextmenu="context($event, item)"
            >
              <NotificationRow
                :item="item"
                :expanded="isExpanded(item)"
                :position="position"
                :filtered="
                  typeof item.source === 'object' &&
                  filteredSources.has(item.source.id)
                "
                @close="close(item)"
                @toggle="toggle(item)"
                @action="(action, primary) => runAction(item, action, primary)"
                @link="emit('link', item.id, $event)"
                @filter="filter(item)"
              />
            </div>
          </div>
        </ScrollableElement>
      </div>
      <ContextMenu
        ref="contextMenu"
        :actions="[{ id: 'copy', label: 'Copy Text' }]"
        @action="copy"
      />
    </div>
  </div>
</template>
