<script setup lang="ts">
/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
import {
  computed,
  nextTick,
  ref,
  useId,
  watch,
  onBeforeUnmount,
  onMounted,
} from "vue";
import { useList } from "./useList";
import type { ListItem } from "./types";
import { isContextMenuKey } from "../../internal/contextMenuKeyboard";
import type { ContextMenuAnchor } from "../context-menu/types";
import {
  StandardWheelEvent,
  type IMouseWheelEvent,
} from "../../internal/standardWheelEvent";

const props = withDefaults(
  defineProps<{
    items: readonly ListItem[];
    ariaLabel?: string;
    height?: number;
    /** Internal delegate height; public List keeps the Open Editors height. */
    rowHeight?: number;
    multiple?: boolean;
  }>(),
  { ariaLabel: "List", height: 264, rowHeight: 22, multiple: true },
);
const selected = defineModel<string[]>("selectedIds", { default: () => [] });
const emit = defineEmits<{
  focusChange: [id: string | undefined];
  contextmenu: [
    item: ListItem | undefined,
    event: MouseEvent | KeyboardEvent,
    anchor?: ContextMenuAnchor,
  ];
  scroll: [top: number];
}>();
const element = ref<HTMLElement>();
const viewport = ref<HTMLElement>();
const scrollTop = ref(0);
const hovering = ref(false);
const dragging = ref(false);
const scrolling = ref(false);
let scrollTimer: ReturnType<typeof setTimeout>;
const instanceId = useId();
const rowId = (id: string) => `${instanceId}-${encodeURIComponent(id)}`;
function setScroll(top: number) {
  const bounded = Math.max(0, Math.min(totalHeight.value - props.height, top));
  scrollTop.value = bounded;
  if (viewport.value) viewport.value.scrollTop = bounded;
}
function reveal(index: number) {
  if (index < 0) return;
  const top = index * props.rowHeight;
  if (top < scrollTop.value) setScroll(top);
  else if (top + props.rowHeight > scrollTop.value + props.height)
    setScroll(top + props.rowHeight - props.height);
}
const list = useList(
  props,
  selected,
  reveal,
  (id) => emit("focusChange", id),
  () => props.rowHeight,
);
const { focused } = list;
const rows = computed(() => props.items);
const selectedSet = computed(() => new Set(selected.value));
const totalHeight = computed(() => rows.value.length * props.rowHeight);
const first = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - 1),
);
const renderedRows = computed(() =>
  rows.value.slice(
    first.value,
    Math.ceil((scrollTop.value + props.height) / props.rowHeight) + 1,
  ),
);
const hasScrollbar = computed(() => totalHeight.value > props.height);
const thumbHeight = computed(() =>
  Math.max(20, Math.floor((props.height * props.height) / totalHeight.value)),
);
const thumbRatio = computed(
  () => (props.height - thumbHeight.value) / (totalHeight.value - props.height),
);
const thumbTop = computed(() => Math.round(scrollTop.value * thumbRatio.value));
const activeDescendant = computed(() =>
  renderedRows.value.some((row) => row.id === focused.value)
    ? rowId(focused.value!)
    : undefined,
);
watch([totalHeight, () => props.height], () =>
  nextTick(() => {
    setScroll(scrollTop.value);
    showScrollbar();
  }),
);
onMounted(showScrollbar);

let contextKeyDown = false;
function keyup(event: KeyboardEvent) {
  contextKeyDown = false;
  if (!isContextMenuKey(event)) return;
  event.preventDefault();
  event.stopPropagation();
  const item = rows.value.find((item) => item.id === focused.value);
  const anchor = focused.value
    ? document.getElementById(rowId(focused.value)) || element.value
    : element.value;
  emit("contextmenu", item, event, anchor);
}
function contextmenu(event: MouseEvent) {
  if (contextKeyDown) return;
  const id = (event.target as HTMLElement).closest<HTMLElement>(
    ".monaco-list-row",
  )?.dataset.id;
  list.focus(id);
  const item = rows.value.find((item) => item.id === focused.value);
  emit("contextmenu", item, event, event);
}
function keydown(event: KeyboardEvent) {
  contextKeyDown = isContextMenuKey(event);
  if (contextKeyDown) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (
    event.key === "Tab" &&
    event.target === element.value &&
    !event.shiftKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    focused.value
  ) {
    const row = document.getElementById(rowId(focused.value));
    const action = row?.querySelector<HTMLElement>("[tabindex]");
    if (
      action &&
      action.tabIndex !== -1 &&
      getComputedStyle(action).visibility !== "hidden" &&
      getComputedStyle(action).display !== "none"
    ) {
      event.preventDefault();
      event.stopPropagation();
      action.focus();
      return;
    }
  }
  list.keydown(event, scrollTop.value, props.height, setScroll);
}

function scroll() {
  scrollTop.value = viewport.value?.scrollTop ?? 0;
  emit("scroll", scrollTop.value);
  showScrollbar();
}
function showScrollbar() {
  scrolling.value = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    scrolling.value = false;
  }, 500);
}
function wheel(event: WheelEvent) {
  const normalized = new StandardWheelEvent(
    event as unknown as IMouseWheelEvent,
  );
  let deltaY = normalized.deltaY;
  if (Math.abs(normalized.deltaX) > Math.abs(deltaY)) deltaY = 0;
  if (!navigator.platform.includes("Mac") && event.shiftKey) deltaY = 0;
  if (event.altKey) deltaY *= 5;
  const delta = 50 * deltaY;
  const previous = scrollTop.value;
  setScroll(previous - (delta < 0 ? Math.floor(delta) : Math.ceil(delta)));
  // Consume wheel events whenever the content needs a scrollbar.
  if (hasScrollbar.value || previous !== scrollTop.value) {
    event.preventDefault();
    event.stopPropagation();
  }
}
function scrollbarDown(event: PointerEvent) {
  event.preventDefault();
  const track = event.currentTarget as HTMLElement;
  const onThumb = (event.target as HTMLElement).classList.contains(
    "vc-list-thumb",
  );
  if (!onThumb)
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
    track.removeEventListener("pointermove", move);
    track.removeEventListener("pointerup", up);
    track.removeEventListener("lostpointercapture", up);
  };
  track.addEventListener("pointermove", move);
  track.addEventListener("pointerup", up);
  track.addEventListener("lostpointercapture", up);
}
defineExpose({
  focus: () => element.value?.focus(),
  reveal: (id: string) => reveal(rows.value.findIndex((row) => row.id === id)),
  setFocus: (id?: string) => list.focus(id, true),
  getFocus: () => focused.value,
  setScrollTop: setScroll,
  getScrollTop: () => scrollTop.value,
});
onBeforeUnmount(() => clearTimeout(scrollTimer));
</script>

<template>
  <div
    ref="element"
    class="vc-list monaco-list mouse-support"
    :class="{ 'element-focused': focused !== undefined }"
    role="list"
    tabindex="0"
    :style="{ height: `${height}px` }"
    :aria-label="ariaLabel"
    :aria-multiselectable="multiple || undefined"
    :aria-activedescendant="activeDescendant"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @keydown="keydown"
    @keyup="keyup"
    @contextmenu="contextmenu"
    @mousedown="element?.focus()"
    @wheel="wheel"
  >
    <div
      ref="viewport"
      class="vc-list-viewport monaco-scrollable-element"
      @scroll="scroll"
      @click.self="list.blank()"
    >
      <div
        class="vc-list-rows monaco-list-rows"
        :style="{ height: `${totalHeight}px` }"
        @click.self="list.blank()"
      >
        <div
          v-for="(item, i) in renderedRows"
          :id="rowId(item.id)"
          :key="item.id"
          :data-id="item.id"
          :data-index="first + i"
          :data-parity="(first + i) % 2 ? 'odd' : 'even'"
          class="vc-list-row monaco-list-row"
          :class="{
            focused: focused === item.id,
            selected: selectedSet.has(item.id),
          }"
          :style="{
            top: `${(first + i) * rowHeight}px`,
            height: `${rowHeight}px`,
            lineHeight: `${rowHeight}px`,
          }"
          role="listitem"
          :aria-label="
            [
              item.label,
              item.decoration?.tooltip,
              item.actions?.length ? 'has actions' : undefined,
            ]
              .filter(Boolean)
              .join(', ')
          "
          :aria-posinset="first + i + 1"
          :aria-setsize="items.length"
          :aria-selected="selectedSet.has(item.id)"
          @click="list.click(item, $event)"
          @auxclick="$event.button === 1 && list.click(item, $event)"
        >
          <slot :item="item" :index="first + i" />
        </div>
      </div>
    </div>
    <div
      v-if="hasScrollbar"
      class="vc-list-scrollbar"
      :class="{ visible: hovering || dragging || scrolling }"
      @pointerdown="scrollbarDown"
    >
      <div
        class="vc-list-thumb"
        :class="{ active: dragging }"
        :style="{ height: `${thumbHeight}px`, top: `${thumbTop}px` }"
      />
    </div>
    <div v-if="scrollTop > 0" class="vc-list-shadow" />
    <div v-if="scrollTop > 0" class="vc-list-shadow vc-list-shadow-corner" />
  </div>
</template>
<style src="./upstream/list.css" />
<style src="./list.css" />
