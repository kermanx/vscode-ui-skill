<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import './menu.css';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import {
  StandardWheelEvent,
  type IMouseWheelEvent,
} from '../../internal/standardWheelEvent';
import { positionSubmenu } from '../dropdown/layout';
import type { MenuEntry } from './types';
const props = withDefaults(
  defineProps<{
    actions: readonly MenuEntry[];
    ariaLabel?: string;
    /** A submenu returns focus to its parent on Left Arrow. */
    submenu?: boolean;
  }>(),
  { submenu: false },
);
const emit = defineEmits<{
  action: [id: string, event?: MouseEvent | KeyboardEvent];
  cancel: [];
  blur: [];
}>();
const root = ref<HTMLElement>(),
  list = ref<HTMLElement>(),
  panel = ref<HTMLElement>();
const viewport = ref<HTMLElement>();
const maxHeight = ref(Math.max(10, window.innerHeight - 35));
const scrollTop = ref(0),
  scrollHeight = ref(0),
  clientWidth = ref(0),
  clientHeight = ref(0),
  dragging = ref(false);
const hasScrollbar = computed(() => scrollHeight.value > clientHeight.value);
const thumbHeight = computed(() =>
  hasScrollbar.value
    ? Math.max(
        20,
        Math.floor(
          (clientHeight.value * clientHeight.value) / scrollHeight.value,
        ),
      )
    : clientHeight.value,
);
const thumbRatio = computed(() =>
  hasScrollbar.value
    ? (clientHeight.value - thumbHeight.value) /
      (scrollHeight.value - clientHeight.value)
    : 0,
);
const thumbTop = computed(() => Math.round(scrollTop.value * thumbRatio.value));
function measure() {
  if (viewport.value) {
    scrollHeight.value = viewport.value.scrollHeight;
    clientWidth.value = viewport.value.clientWidth;
    clientHeight.value = viewport.value.clientHeight;
    scrollTop.value = viewport.value.scrollTop;
  }
}
function setScroll(top: number) {
  if (viewport.value) {
    viewport.value.scrollTop = Math.max(
      0,
      Math.min(scrollHeight.value - clientHeight.value, top),
    );
    measure();
  }
}
function wheel(event: WheelEvent) {
  const normalized = new StandardWheelEvent(
    event as unknown as IMouseWheelEvent,
  );
  let delta =
    Math.abs(normalized.deltaX) > Math.abs(normalized.deltaY)
      ? 0
      : normalized.deltaY;
  if (!navigator.platform.includes('Mac') && event.shiftKey) delta = 0;
  if (event.altKey) delta *= 5;
  delta *= 50;
  setScroll(
    scrollTop.value - (delta < 0 ? Math.floor(delta) : Math.ceil(delta)),
  );
  event.preventDefault();
  event.stopPropagation();
}
function scrollbarDown(event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
  const track = event.currentTarget as HTMLElement;
  if (!(event.target as HTMLElement).classList.contains('slider'))
    setScroll(
      (event.clientY -
        track.getBoundingClientRect().top -
        thumbHeight.value / 2) /
        thumbRatio.value,
    );
  const start = event.clientY,
    sliderPosition = thumbTop.value;
  dragging.value = true;
  track.setPointerCapture(event.pointerId);
  const move = (e: PointerEvent) =>
    setScroll(
      Math.round((sliderPosition + e.clientY - start) / thumbRatio.value),
    );
  const up = () => {
    dragging.value = false;
    track.removeEventListener('pointermove', move);
    track.removeEventListener('pointerup', up);
    track.removeEventListener('lostpointercapture', up);
  };
  track.addEventListener('pointermove', move);
  track.addEventListener('pointerup', up);
  track.addEventListener('lostpointercapture', up);
}
let resizeObserver: ResizeObserver | undefined;
onMounted(async () => {
  maxHeight.value = Math.max(
    10,
    window.innerHeight - root.value!.getBoundingClientRect().top - 35,
  );
  await nextTick();
  measure();
  resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(viewport.value!);
});
watch(
  () => props.actions,
  () => nextTick(measure),
);
const childMenu = ref<{ focus: (selectFirst?: boolean) => void }>();
function setPanel(element: unknown) {
  panel.value = element as HTMLElement | undefined;
}
function setChild(instance: unknown) {
  childMenu.value = instance as typeof childMenu.value;
}
const focused = ref(-1),
  childIndex = ref(-1),
  styled = ref(new Set<number>());
const childPosition = ref({ top: '0px', left: '0px' });
const openedAt = performance.now();
let hoverIndex = -1;
let showTimer: ReturnType<typeof setTimeout> | undefined,
  hideTimer: ReturnType<typeof setTimeout> | undefined;
const entries = computed(() =>
  props.actions.filter(
    (item, index, items) =>
      !('separator' in item) ||
      (index > 0 &&
        index < items.length - 1 &&
        !('separator' in items[index - 1])),
  ),
);
const childActions = computed(() => {
  const item = entries.value[childIndex.value];
  if (!item || 'separator' in item) return [];
  return item.children?.length
    ? item.children
    : [{ id: '__empty', label: '(empty)', disabled: true }];
});
const actionCount = computed(
  () => entries.value.filter((item) => !('separator' in item)).length,
);
function isEnabled(item: MenuEntry) {
  return (
    !('separator' in item) && (item.children !== undefined || !item.disabled)
  );
}
function itemElement(index: number) {
  return list.value?.children[index]?.firstElementChild as
    | HTMLElement
    | undefined;
}
function focusIndex(index: number) {
  const item = entries.value[index];
  if (!item || !isEnabled(item)) return;
  styled.value.add(index);
  focused.value = index;
  itemElement(index)?.focus();
}
function move(step: number) {
  const items = entries.value;
  let index =
    focused.value < 0 ? (step > 0 ? items.length - 1 : 0) : focused.value;
  for (let count = 0; count < items.length; count++) {
    index = (index + step + items.length) % items.length;
    if (isEnabled(items[index])) {
      focusIndex(index);
      return;
    }
  }
}
function focus(selectFirst = false) {
  if (selectFirst) {
    focused.value = -1;
    move(1);
  } else if (focused.value >= 0) itemElement(focused.value)?.focus();
  else list.value?.focus({ preventScroll: true });
}
function closeChild() {
  if (childIndex.value < 0) return;
  focusIndex(childIndex.value);
  childIndex.value = -1;
}
async function openChild(index: number, selectFirst = true) {
  const item = entries.value[index];
  if (!item || 'separator' in item || !item.children) return;
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  if (childIndex.value === index) {
    childMenu.value?.focus(false);
    return;
  }
  childIndex.value = index;
  childPosition.value = { top: '0px', left: '0px' };
  await nextTick();
  if (!panel.value || childIndex.value !== index) return;
  const entry = list.value!.children[index].getBoundingClientRect();
  const padding =
    parseFloat(getComputedStyle(list.value!.parentElement!).paddingTop) || 0;
  const bounds = panel.value.getBoundingClientRect();
  childPosition.value = positionSubmenu(
    entry,
    bounds.width,
    bounds.height,
    padding,
  );
  childMenu.value?.focus(selectFirst);
}
function run(index: number, event?: MouseEvent | KeyboardEvent) {
  const item = entries.value[index];
  if (!item || !isEnabled(item) || 'separator' in item) return;
  if (item.children) {
    void openChild(index);
    return;
  }
  emit('action', item.id, event);
}
function keydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const current = entries.value[focused.value];
  if (
    current &&
    !('separator' in current) &&
    current.children &&
    (event.key === 'ArrowRight' || event.key === 'Enter')
  ) {
    /* submenu opens on keyup */
  } else if (event.key === 'ArrowDown') move(1);
  else if (event.key === 'ArrowUp') move(-1);
  else if (
    event.key === 'Home' ||
    (/Linux/.test(navigator.platform) && event.key === 'PageUp')
  ) {
    focused.value = -1;
    move(1);
  } else if (
    event.key === 'End' ||
    (/Linux/.test(navigator.platform) && event.key === 'PageDown')
  ) {
    focused.value = -1;
    move(-1);
  } else if (event.key === 'Escape') emit('cancel');
  else if (props.submenu && event.key === 'ArrowLeft') {
    /* return to parent on keyup */
  } else if (
    event.key === 'Enter' ||
    (event.key === ' ' && !/Win/.test(navigator.platform))
  )
    run(focused.value, event);
  else if (event.key !== 'Tab') return;
  event.preventDefault();
  event.stopPropagation();
}
function keyup(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (props.submenu && event.key === 'ArrowLeft') {
    event.preventDefault();
    event.stopPropagation();
    emit('cancel');
  } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    void openChild(focused.value);
  }
}
function hover(index: number, event: MouseEvent) {
  if (!event.movementX && !event.movementY) return;
  focusIndex(index);
  const item = entries.value[index];
  if (hoverIndex !== index) {
    hoverIndex = index;
    clearTimeout(showTimer);
    if (item && !('separator' in item) && item.children)
      showTimer = setTimeout(() => {
        void openChild(index, false);
      }, 250);
  }
}
function leaveItem(index: number) {
  if (hoverIndex === index) {
    hoverIndex = -1;
    clearTimeout(showTimer);
  }
  if (childIndex.value === index)
    hideTimer = setTimeout(() => {
      if (!list.value?.children[index]?.contains(document.activeElement))
        childIndex.value = -1;
    }, 750);
}
function leave(event: MouseEvent) {
  if (!viewport.value?.contains(event.relatedTarget as Node)) {
    focused.value = -1;
    list.value?.focus({ preventScroll: true });
  }
}
function blur() {
  queueMicrotask(() => {
    if (!root.value?.contains(document.activeElement)) emit('blur');
  });
}
function mouseRun(index: number, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (performance.now() - openedAt >= 100)
    setTimeout(() => run(index, event), 0);
}
function style(index: number) {
  return {
    color:
      index === focused.value
        ? 'var(--vscode-list-hoverForeground)'
        : 'var(--vscode-menu-foreground)',
    backgroundColor:
      index === focused.value
        ? 'var(--vscode-list-hoverBackground)'
        : undefined,
    outline:
      index === focused.value
        ? '1px solid var(--vscode-menu-selectionBorder)'
        : undefined,
    outlineOffset: index === focused.value ? '-1px' : undefined,
  };
}
function position(index: number) {
  return entries.value
    .slice(0, index + 1)
    .filter((item) => !('separator' in item)).length;
}
onBeforeUnmount(() => {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  resizeObserver?.disconnect();
});
defineExpose({ focus });
</script>
<template>
  <div
    ref="root"
    class="monaco-menu-container vc-menu-root"
    role="presentation"
    @focusout="blur"
  >
    <div
      class="monaco-scrollable-element vc-menu-scrollable"
      @wheel="wheel"
      style="
        overflow: hidden;
        background-color: var(--vscode-menu-background);
        color: var(--vscode-menu-foreground);
        border-radius: var(--vscode-cornerRadius-large);
      "
    >
      <div
        ref="viewport"
        class="monaco-menu"
        :style="{ maxHeight: `${maxHeight}px`, overflow: 'hidden' }"
        @scroll="
          measure();
          childIndex = -1;
        "
        role="presentation"
        @mouseleave="leave"
        @keydown="keydown"
        @keyup="keyup"
        @contextmenu.prevent
      >
        <div class="monaco-action-bar vertical">
          <ul
            ref="list"
            class="actions-container"
            role="menu"
            tabindex="0"
            :aria-label="ariaLabel"
          >
            <li
              v-for="(action, index) in entries"
              :key="index"
              class="action-item"
              :class="{
                disabled: !isEnabled(action),
                focused: index === focused,
              }"
              :tabindex="
                'separator' in action ? undefined : index === 0 ? 0 : -1
              "
              :aria-disabled="!isEnabled(action) || undefined"
              role="presentation"
              @mousedown.stop.prevent
              @mousemove.stop="hover(index, $event)"
              @mouseleave="leaveItem(index)"
            >
              <a
                v-if="'separator' in action"
                class="action-label separator disabled"
                role="separator"
                tabindex="-1"
              />
              <a
                v-else
                class="action-menu-item"
                :class="{
                  disabled: !isEnabled(action),
                  checked: action.checked,
                  'monaco-submenu-item': action.children,
                }"
                :role="
                  action.checked === undefined ? 'menuitem' : 'menuitemcheckbox'
                "
                :aria-checked="action.checked"
                :aria-disabled="!isEnabled(action) || undefined"
                :tabindex="isEnabled(action) ? 0 : undefined"
                :aria-haspopup="action.children ? 'true' : undefined"
                :aria-expanded="
                  action.children ? childIndex === index : undefined
                "
                :aria-posinset="position(index)"
                :aria-setsize="actionCount"
                :style="style(index)"
                @mouseup="mouseRun(index, $event)"
                @click.stop.prevent
              >
                <span
                  class="menu-item-check codicon codicon-check"
                  role="none"
                  style="color: inherit"
                /><span class="action-label">{{ action.label }}</span>
                <span v-if="action.keybinding" class="keybinding">{{
                  action.keybinding
                }}</span>
                <span
                  v-if="action.children"
                  class="submenu-indicator codicon codicon-menu-submenu"
                  aria-hidden="true"
                  :style="
                    styled.has(index)
                      ? {
                          color:
                            index === focused
                              ? 'var(--vscode-list-hoverForeground)'
                              : 'var(--vscode-menu-foreground)',
                        }
                      : undefined
                  "
                />
              </a>
              <div
                v-if="childIndex === index"
                :ref="setPanel"
                class="monaco-submenu menubar-menu-items-holder context-view monaco-menu-container"
                :style="{ ...childPosition, position: 'fixed', zIndex: 1 }"
              >
                <Menu
                  :ref="setChild"
                  :actions="childActions"
                  submenu
                  @action="(id, event) => emit('action', id, event)"
                  @cancel="closeChild"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div
        role="presentation"
        aria-hidden="true"
        class="invisible scrollbar horizontal"
        :style="{
          position: 'absolute',
          width: `${Math.max(0, clientWidth - 7)}px`,
          height: 0,
          left: 0,
          bottom: 0,
        }"
      >
        <div
          class="slider"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '10px',
            width: `${Math.max(0, clientWidth - 7)}px`,
            transform: 'translate3d(0px, 0px, 0px)',
            contain: 'strict',
          }"
        />
      </div>
      <div
        role="presentation"
        aria-hidden="true"
        class="scrollbar vertical"
        :class="hasScrollbar ? 'visible' : 'invisible'"
        :style="{
          width: '7px',
          height: `${clientHeight}px`,
          right: 0,
          top: 0,
          position: 'absolute',
        }"
        @pointerdown="scrollbarDown"
      >
        <div
          class="slider"
          :class="{ active: dragging }"
          :style="{
            position: 'absolute',
            width: '7px',
            left: 0,
            height: `${thumbHeight}px`,
            top: 0,
            transform: `translate3d(0px, ${thumbTop}px, 0px)`,
            contain: 'strict',
          }"
        />
      </div>
      <div v-if="scrollTop > 0" class="shadow top" /><div
        v-if="scrollTop > 0"
        class="shadow top-left-corner top"
      />
    </div>
  </div>
</template>
