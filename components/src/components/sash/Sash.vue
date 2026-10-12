<script setup lang="ts">
/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type {
  SashEvent,
  SashHandle,
  SashOrientation,
  SashOrthogonalEdge,
  SashState,
} from './types';
import {
  SashController,
  sashController,
  type SashPointerEvent,
} from './sashController';
import { registerSashTouch } from './sashTouch';
const props = withDefaults(
  defineProps<{
    orientation?: SashOrientation;
    state?: SashState;
    /** The divider's center along its movement axis, in the layout owner's coordinates. */
    position: number;
    /** Start and extent on the perpendicular axis; omitted values fill the parent. */
    offset?: number;
    length?: number;
    linkedSash?: SashHandle;
    orthogonalStartSash?: SashHandle;
    orthogonalEndSash?: SashHandle;
    orthogonalEdge?: SashOrthogonalEdge;
  }>(),
  { orientation: 'vertical', state: 'enabled' },
);
const emit = defineEmits<{
  dragStart: [event: SashEvent];
  change: [event: SashEvent];
  end: [];
  reset: [];
}>();
const element = ref<HTMLElement>();
const active = ref(false),
  hover = ref(false);
const controller = new SashController(
  () => element.value,
  () => props,
  {
    active: (value) => {
      active.value = value;
    },
    hover: (value) => {
      hover.value = value;
    },
    start: (event) => emit('dragStart', event),
    change: (event) => emit('change', event),
    end: () => emit('end'),
    reset: () => emit('reset'),
  },
);
const state = computed(() => props.state);
const positionStyle = computed(() =>
  props.orientation === 'vertical'
    ? {
        left: `${props.position - 2}px`,
        top: props.offset === undefined ? undefined : `${props.offset}px`,
        height: props.length === undefined ? undefined : `${props.length}px`,
      }
    : {
        top: `${props.position - 2}px`,
        left: props.offset === undefined ? undefined : `${props.offset}px`,
        width: props.length === undefined ? undefined : `${props.length}px`,
      },
);
const classes = computed(() => ({
  [props.orientation]: true,
  mac: navigator.platform.includes('Mac'),
  disabled: props.state === 'disabled',
  minimum: props.state === 'minimum',
  maximum: props.state === 'maximum',
  active: active.value,
  hover: hover.value,
  ...(props.orthogonalEdge
    ? { [`orthogonal-edge-${props.orthogonalEdge}`]: true }
    : {}),
}));
watch(
  () => props.state,
  () => controller.stateChanged(),
  { flush: 'sync' },
);
let removeTouch: (() => void) | undefined;
let doubleTapTimer: ReturnType<typeof setTimeout> | undefined;
function gestureStart(event: Event) {
  controller.begin(event as SashPointerEvent, 'gesture');
}
function tap(event: Event) {
  if (doubleTapTimer) {
    clearTimeout(doubleTapTimer);
    doubleTapTimer = undefined;
    controller.reset(event as SashPointerEvent);
  } else
    doubleTapTimer = setTimeout(() => {
      doubleTapTimer = undefined;
    }, 250);
}
onMounted(() => {
  const el = element.value!;
  removeTouch = registerSashTouch(el);
  el.addEventListener('-monaco-gesturestart', gestureStart);
  el.addEventListener('-monaco-gesturetap', tap);
});
onBeforeUnmount(() => {
  removeTouch?.();
  clearTimeout(doubleTapTimer);
  element.value?.removeEventListener('-monaco-gesturestart', gestureStart);
  element.value?.removeEventListener('-monaco-gesturetap', tap);
  controller.dispose();
});
defineExpose({
  element,
  state,
  clearHoverState: () => controller.leave(),
  [sashController]: controller,
});
</script>
<template>
  <div
    ref="element"
    class="monaco-sash"
    :class="classes"
    :style="positionStyle"
    @mousedown="controller.begin($event, 'mouse')"
    @dblclick="controller.reset($event)"
    @mouseenter="controller.enter()"
    @mouseleave="controller.leave()"
  >
    <div
      v-if="orthogonalStartSash && orthogonalStartSash.state !== 'disabled'"
      class="orthogonal-drag-handle start"
      @mouseenter="controller.enterOrthogonal(true)"
      @mouseleave="controller.leaveOrthogonal(true)"
    />
    <div
      v-if="orthogonalEndSash && orthogonalEndSash.state !== 'disabled'"
      class="orthogonal-drag-handle end"
      @mouseenter="controller.enterOrthogonal(false)"
      @mouseleave="controller.leaveOrthogonal(false)"
    />
  </div>
</template>
<style src="./sash.css" />
