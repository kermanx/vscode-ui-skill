<script setup lang="ts">
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
import { Scrollable } from '../scrollable-element/scrollable';
import { MouseWheelClassifier } from '../scrollable-element/mouseWheelClassifier';
import { ScrollbarState } from '../scrollable-element/scrollbarState';
import { useScrollbarVisibility } from '../scrollable-element/useScrollbarVisibility';
import type {
  ScrollbarVisibility,
  ScrollPosition,
  ScrollDimensions,
  ScrollableEvent,
} from '../scrollable-element/types';
const props = withDefaults(
  defineProps<{
    height?: number;
    stickyWidth?: number;
    scrollbarSize?: number;
    /** Animate physical wheel input with the SplitView smooth scrolling behavior. */
    smoothWheel?: boolean;
    horizontal?: ScrollbarVisibility;
    vertical?: ScrollbarVisibility;
    shadows?: boolean;
    /** Keep wheel events inside this container, including at its scroll boundaries. */
    containWheel?: boolean;
    /** Clicking the track moves one viewport instead of centering the slider. */
    scrollByPage?: boolean;
  }>(),
  {
    horizontal: 'auto',
    vertical: 'hidden',
    shadows: false,
    containWheel: false,
    scrollByPage: false,
    scrollbarSize: 3,
    stickyWidth: 0,
  },
);
const scrollTop = defineModel<number>('scrollTop', { default: 0 });
const scrollLeft = defineModel<number>('scrollLeft', { default: 0 });
const emit = defineEmits<{ scroll: [event: ScrollableEvent] }>();
const viewport = ref<HTMLElement>();
const content = viewport;
const dimensions = ref<ScrollDimensions>({
  width: 0,
  height: 0,
  scrollWidth: 0,
  scrollHeight: 0,
});
const position = ref<ScrollPosition>({ scrollTop: 0, scrollLeft: 0 });
const smoothState = new Scrollable({
  forceIntegerValues: true,
  smoothScrollDuration: 125,
  scheduleAtNextAnimationFrame: (callback) => {
    const id = requestAnimationFrame(callback);
    return { dispose: () => cancelAnimationFrame(id) };
  },
});
smoothState.onScroll = (event) =>
  changed({ scrollTop: event.scrollTop, scrollLeft: event.scrollLeft });
const isMac = navigator.platform.includes('Mac');
const isWindows = navigator.platform.includes('Win');
const size = (mode: ScrollbarVisibility) => (mode === 'hidden' ? 0 : 10);
const horizontalSize = () =>
  props.horizontal === 'hidden' ? 0 : props.scrollbarSize;
const horizontalState = new ScrollbarState(
  0,
  horizontalSize(),
  size(props.vertical),
  0,
  0,
  0,
);
const verticalState = new ScrollbarState(0, size(props.vertical), 0, 0, 0, 0);
function geometry(state: ScrollbarState) {
  return {
    needed: state.isNeeded(),
    track: state.getRectangleLargeSize(),
    size: state.getRectangleSmallSize(),
    slider: state.getSliderSize(),
    offset: state.getSliderPosition(),
  };
}
const horizontalGeometry = ref(geometry(horizontalState));
const verticalGeometry = ref(geometry(verticalState));
const dragging = ref<'horizontal' | 'vertical'>();
const rawVisible = ref(false);
let mouseOver = false;
let hideTimer: ReturnType<typeof setTimeout>;
const horizontalClass = useScrollbarVisibility(
  () => props.horizontal,
  () => horizontalGeometry.value.needed,
  rawVisible,
);
const verticalClass = useScrollbarVisibility(
  () => props.vertical,
  () => verticalGeometry.value.needed,
  rawVisible,
);
const topShadow = computed(() => position.value.scrollTop > 0);
const leftShadow = computed(() => position.value.scrollLeft > 0);
function hide() {
  if (!mouseOver && !dragging.value) rawVisible.value = false;
}
function reveal() {
  rawVisible.value = true;
  if (!mouseOver && !dragging.value) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 500);
  }
}
function over() {
  mouseOver = true;
  reveal();
}
function leave() {
  mouseOver = false;
  hide();
}
function renderScrollbars() {
  horizontalState.setScrollSize(dimensions.value.scrollWidth);
  horizontalState.setScrollPosition(position.value.scrollLeft);
  horizontalState.setVisibleSize(dimensions.value.width);
  verticalState.setScrollSize(dimensions.value.scrollHeight);
  verticalState.setScrollPosition(position.value.scrollTop);
  verticalState.setVisibleSize(dimensions.value.height);
  horizontalGeometry.value = geometry(horizontalState);
  verticalGeometry.value = geometry(verticalState);
}
function validate(update: Partial<ScrollPosition>): ScrollPosition {
  return {
    scrollTop: Math.max(
      0,
      Math.min(
        dimensions.value.scrollHeight - dimensions.value.height,
        update.scrollTop ?? position.value.scrollTop,
      ),
    ),
    scrollLeft: Math.max(
      0,
      Math.min(
        dimensions.value.scrollWidth - dimensions.value.width,
        update.scrollLeft ?? position.value.scrollLeft,
      ),
    ),
  };
}
function changed(next: ScrollPosition, dimensionChanged = false) {
  const topChanged = position.value.scrollTop !== next.scrollTop;
  const leftChanged = position.value.scrollLeft !== next.scrollLeft;
  if (topChanged || leftChanged) position.value = next;
  scrollTop.value = next.scrollTop;
  scrollLeft.value = next.scrollLeft;
  if (viewport.value) {
    if (topChanged) viewport.value.scrollTop = next.scrollTop;
    if (leftChanged) viewport.value.scrollLeft = next.scrollLeft;
  }
  if (topChanged || leftChanged || dimensionChanged) {
    renderScrollbars();
    reveal();
    emit('scroll', { ...dimensions.value, ...next });
  }
}
function setScrollPosition(update: Partial<ScrollPosition>) {
  if (props.smoothWheel) smoothState.setScrollPositionNow(update);
  else changed(validate(update));
}
function nativeScroll() {
  if (!props.smoothWheel || !viewport.value) return;
  const { scrollTop, scrollLeft } = viewport.value;
  if (
    Math.abs(scrollTop - position.value.scrollTop) > 1 ||
    Math.abs(scrollLeft - position.value.scrollLeft) > 1
  )
    setScrollPosition({ scrollTop, scrollLeft });
}
function scanDomNode() {
  const el = viewport.value;
  if (!el) return;
  const next = {
    width: el.clientWidth,
    height: el.clientHeight,
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
  };
  const dimensionChanged = Object.keys(next).some(
    (key) =>
      next[key as keyof ScrollDimensions] !==
      dimensions.value[key as keyof ScrollDimensions],
  );
  if (dimensionChanged) dimensions.value = next;
  if (props.smoothWheel) smoothState.setScrollDimensions(next, false);
  changed(validate(position.value), dimensionChanged);
  if (
    el.scrollTop !== position.value.scrollTop ||
    el.scrollLeft !== position.value.scrollLeft
  )
    setScrollPosition({ scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });
}
watch([scrollTop, scrollLeft], ([top, left]) => {
  if (
    viewport.value &&
    (top !== position.value.scrollTop || left !== position.value.scrollLeft)
  )
    setScrollPosition({ scrollTop: top, scrollLeft: left });
});
watch(
  [() => props.horizontal, () => props.vertical, () => props.scrollbarSize],
  () => {
    horizontalState.setScrollbarSize(horizontalSize());
    horizontalGeometry.value = geometry(horizontalState);
    horizontalState.setOppositeScrollbarSize(size(props.vertical));
    verticalState.setScrollbarSize(size(props.vertical));
    verticalGeometry.value = geometry(verticalState);
  },
);
function wheel(event: WheelEvent) {
  if (event.defaultPrevented) return;
  const normalized = new StandardWheelEvent(
    event as unknown as IMouseWheelEvent,
  );
  MouseWheelClassifier.INSTANCE.accept(
    Date.now(),
    normalized.deltaX,
    normalized.deltaY,
  );
  let deltaX = normalized.deltaX,
    deltaY = normalized.deltaY;
  if (deltaX + deltaY === 0) {
    deltaX = deltaY = 0;
  } else if (Math.abs(deltaY) >= Math.abs(deltaX)) deltaX = 0;
  else deltaY = 0;
  if (!deltaX) {
    deltaX = deltaY;
    deltaY = 0;
  }
  if (!isMac && event.shiftKey && !deltaX) {
    deltaX = deltaY;
    deltaY = 0;
  }
  if (event.altKey) {
    deltaX *= 5;
    deltaY *= 5;
  }
  const roundDelta = (delta: number) =>
    delta < 0 ? Math.floor(delta * 50) : Math.ceil(delta * 50);
  const future = props.smoothWheel
    ? smoothState.getFutureScrollPosition()
    : position.value;
  const next = validate({
    scrollTop: future.scrollTop - roundDelta(deltaY),
    scrollLeft: future.scrollLeft - roundDelta(deltaX),
  });
  const didScroll =
    next.scrollTop !== future.scrollTop ||
    next.scrollLeft !== future.scrollLeft;
  if (didScroll) {
    if (
      props.smoothWheel &&
      MouseWheelClassifier.INSTANCE.isPhysicalMouseWheel()
    )
      smoothState.setScrollPositionSmooth(next);
    else setScrollPosition(next);
  }
  if (didScroll || props.containWheel) {
    event.preventDefault();
    event.stopPropagation();
  }
}
let stopDragging: (() => void) | undefined;
function pointerDown(event: PointerEvent, axis: 'horizontal' | 'vertical') {
  const track = event.currentTarget as HTMLElement;
  const onSlider = (event.target as HTMLElement).classList.contains('slider');
  const state = axis === 'horizontal' ? horizontalState : verticalState;
  const writePosition = (value: number) =>
    setScrollPosition(
      axis === 'horizontal' ? { scrollLeft: value } : { scrollTop: value },
    );
  const pointerPosition = (e: PointerEvent) =>
    axis === 'horizontal' ? e.pageX : e.pageY;
  const orthogonalPosition = (e: PointerEvent) =>
    axis === 'horizontal' ? e.pageY : e.pageX;
  if (!onSlider && (event.button === 0 || event.pointerType !== 'mouse')) {
    const offset = axis === 'horizontal' ? event.offsetX : event.offsetY;
    writePosition(
      props.scrollByPage
        ? state.getDesiredScrollPositionFromOffsetPaged(offset)
        : state.getDesiredScrollPositionFromOffset(offset),
    );
  }
  if (event.button !== 0) return;
  event.preventDefault();
  stopDragging?.();
  const initial = state.clone(),
    start = pointerPosition(event),
    orthogonalStart = orthogonalPosition(event);
  const target = event.target as Element;
  let source: Element | Window = target;
  try {
    target.setPointerCapture(event.pointerId);
  } catch {
    source = window;
  }
  const move = (raw: Event) => {
    const e = raw as PointerEvent;
    if (e.buttons !== event.buttons) {
      stopDragging?.();
      return;
    }
    e.preventDefault();
    if (isWindows && Math.abs(orthogonalPosition(e) - orthogonalStart) > 140)
      writePosition(initial.getScrollPosition());
    else
      writePosition(
        initial.getDesiredScrollPositionFromDelta(pointerPosition(e) - start),
      );
  };
  const up = () => stopDragging?.();
  stopDragging = () => {
    source.removeEventListener('pointermove', move);
    source.removeEventListener('pointerup', up);
    source.removeEventListener('pointercancel', up);
    try {
      target.releasePointerCapture(event.pointerId);
    } catch {
      /* The browser may already have released the pointer. */
    }
    stopDragging = undefined;
    dragging.value = undefined;
    hide();
  };
  source.addEventListener('pointermove', move);
  source.addEventListener('pointerup', up);
  source.addEventListener('pointercancel', up);
  dragging.value = axis;
  reveal();
}
let resizeObserver: ResizeObserver;
let mutationObserver: MutationObserver;
let scanFrame = 0;
function scheduleScan() {
  if (!scanFrame)
    scanFrame = requestAnimationFrame(() => {
      scanFrame = 0;
      scanDomNode();
    });
}
function observeContent() {
  resizeObserver.disconnect();
  if (viewport.value) resizeObserver.observe(viewport.value);
  if (content.value) {
    resizeObserver.observe(content.value);
    for (const child of content.value.children) resizeObserver.observe(child);
  }
}
onMounted(async () => {
  const initial = { scrollTop: scrollTop.value, scrollLeft: scrollLeft.value };
  await nextTick();
  scanDomNode();
  setScrollPosition(initial);
  resizeObserver = new ResizeObserver(scheduleScan);
  observeContent();
  mutationObserver = new MutationObserver(() => {
    observeContent();
    scheduleScan();
  });
  mutationObserver.observe(content.value!, {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: true,
  });
});
onBeforeUnmount(() => {
  smoothState.dispose();
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
  clearTimeout(hideTimer);
  cancelAnimationFrame(scanFrame);
  stopDragging?.();
});
defineExpose({
  scanDomNode,
  setScrollPosition,
  getScrollPosition: () => ({ ...position.value }),
  getScrollDimensions: () => ({ ...dimensions.value }),
  viewport,
});
</script>
<template>
  <div
    class="monaco-scrollable-element"
    :class="{ mac: isMac }"
    role="presentation"
    :style="{
      position: 'relative',
      overflow: 'hidden',
      height: height === undefined ? undefined : `${height}px`,
    }"
    @wheel="wheel"
    @mouseover="over"
    @mouseleave="leave"
  >
    <div
      ref="viewport"
      class="tabs-container"
      role="tablist"
      aria-multiselectable="true"
      draggable="true"
      @scroll="nativeScroll"
      style="overflow: hidden"
      @load.capture="scheduleScan"
    >
      <slot />
    </div>
    <div
      class="scrollbar horizontal"
      :class="horizontalClass"
      role="presentation"
      aria-hidden="true"
      :style="{
        position: 'absolute',
        width: `${horizontalGeometry.track}px`,
        height: `${horizontalGeometry.size}px`,
        left: '0px',
        bottom: '0px',
      }"
      @pointerdown="pointerDown($event, 'horizontal')"
    >
      <div
        class="slider"
        :class="{ active: dragging === 'horizontal' }"
        :style="{
          position: 'absolute',
          top: '0px',
          left: `${horizontalGeometry.offset}px`,
          width: `${horizontalGeometry.slider}px`,
          height: `${horizontalGeometry.size}px`,
          transform: 'translate3d(0px, 0px, 0px)',
          contain: 'strict',
        }"
        @click.left.stop
      />
    </div>
    <div
      class="scrollbar vertical"
      :class="verticalClass"
      role="presentation"
      aria-hidden="true"
      :style="{
        position: 'absolute',
        width: `${verticalGeometry.size}px`,
        height: `${verticalGeometry.track}px`,
        right: '0px',
        top: '0px',
      }"
      @pointerdown="pointerDown($event, 'vertical')"
    >
      <div
        class="slider"
        :class="{ active: dragging === 'vertical' }"
        :style="{
          position: 'absolute',
          top: `${verticalGeometry.offset}px`,
          left: '0px',
          width: `${verticalGeometry.size}px`,
          height: `${verticalGeometry.slider}px`,
          transform: 'translate3d(0px, 0px, 0px)',
          contain: 'strict',
        }"
        @click.left.stop
      />
    </div>
    <div
      class="sticky-tabs-background"
      aria-hidden="true"
      :style="{ width: `${stickyWidth}px` }"
    />
    <div class="tab-connected-overflow-edge" aria-hidden="true">
      <div class="tab-connected-overflow-right" />
    </div>
    <template v-if="shadows"
      ><div class="shadow" :class="{ left: leftShadow }" />
      <div class="shadow" :class="{ top: topShadow }" />
      <div
        class="shadow"
        :class="{
          'top-left-corner': topShadow || leftShadow,
          top: topShadow,
          left: leftShadow,
        }"
    /></template>
  </div>
</template>
<style src="../scrollable-element/scrollbars.css" />
