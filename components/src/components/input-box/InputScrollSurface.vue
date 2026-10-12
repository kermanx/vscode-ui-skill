<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
const props = withDefaults(defineProps<{ enabled?: boolean; height?: number; contentHeight?: number; scrollTop?: number }>(), { height: 0, contentHeight: 0, scrollTop: 0 });
const emit = defineEmits<{ scroll: [position: number] }>();
const hovered = ref(false), dragging = ref(false), revealed = ref(false), faded = ref(false);
const needed = computed(() => props.contentHeight > props.height);
const sliderSize = computed(() => needed.value ? Math.round(Math.max(20, Math.floor(props.height * props.height / props.contentHeight))) : props.height);
const ratio = computed(() => needed.value ? (props.height - sliderSize.value) / (props.contentHeight - props.height) : 0);
const sliderPosition = computed(() => Math.round(props.scrollTop * ratio.value));
const scrollbarClass = computed(() => needed.value && revealed.value ? 'visible' : `invisible${needed.value && faded.value ? ' fade' : ''}`);
let hideTimer: ReturnType<typeof setTimeout> | undefined;
function hide() {
  if (hovered.value || dragging.value) return;
  faded.value = revealed.value; revealed.value = false;
}
function reveal() {
  revealed.value = true; faded.value = false;
  clearTimeout(hideTimer);
  if (!hovered.value && !dragging.value) hideTimer = setTimeout(hide, 500);
}
watch([() => props.height, () => props.contentHeight, () => props.scrollTop], reveal);
function setScroll(position: number) {
  const next = Math.max(0, Math.min(Math.round(position), props.contentHeight - props.height));
  if (next !== props.scrollTop) emit('scroll', next);
  return next !== props.scrollTop;
}
function wheel(event: WheelEvent) {
  if (event.defaultPrevented) return;
  // ScrollableElement uses StandardWheelEvent units and a 50px step; its
  // non-smooth surface deliberately disables physical-wheel interpolation.
  const legacy = event as WheelEvent & { wheelDeltaY?: number; wheelDeltaX?: number };
  const isFirefox = /Firefox\//.test(navigator.userAgent), isMac = /Mac/.test(navigator.platform);
  const oldChrome = Number(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] ?? 123) <= 122;
  const dpr = oldChrome ? window.devicePixelRatio : 1;
  let dy = legacy.wheelDeltaY !== undefined ? -legacy.wheelDeltaY / (120 * dpr) : event.deltaY / (event.deltaMode === 1 ? isFirefox && !isMac ? 3 : 1 : 40);
  const dx = legacy.wheelDeltaX !== undefined ? -legacy.wheelDeltaX / (120 * dpr) : event.deltaX / (event.deltaMode === 1 ? isFirefox && !isMac ? 3 : 1 : 40);
  if (Math.abs(dx) > Math.abs(dy) || (!isMac && event.shiftKey)) dy = 0;
  const delta = dy * 50 * (event.altKey ? 5 : 1);
  if (delta && setScroll(props.scrollTop + (delta < 0 ? Math.floor(delta) : Math.ceil(delta)))) {
    reveal(); event.preventDefault(); event.stopPropagation();
  }
}
let dragStartY = 0, dragStartX = 0, dragStartPosition = 0, dragStartRatio = 0;
function pointerDown(event: PointerEvent) {
  if (event.button !== 0 || !needed.value) return;
  const track = event.currentTarget as HTMLElement;
  let initial = props.scrollTop;
  if (!(event.target as HTMLElement).classList.contains('slider')) {
    initial = Math.max(0, Math.min(Math.round((event.clientY - track.getBoundingClientRect().top - sliderSize.value / 2) / ratio.value), props.contentHeight - props.height));
    setScroll(initial);
  }
  dragStartY = event.clientY; dragStartX = event.clientX;
  dragStartPosition = Math.round(initial * ratio.value); dragStartRatio = ratio.value;
  dragging.value = true; reveal();
  track.setPointerCapture(event.pointerId); event.preventDefault();
}
function pointerMove(event: PointerEvent) {
  if (!dragging.value || !dragStartRatio) return;
  const delta = /Win/.test(navigator.platform) && Math.abs(event.clientX - dragStartX) > 140 ? 0 : event.clientY - dragStartY;
  setScroll(Math.round((dragStartPosition + delta) / dragStartRatio));
}
function pointerUp() { dragging.value = false; hide(); }
onBeforeUnmount(() => clearTimeout(hideTimer));
</script>
<template>
  <div v-if="enabled" class="monaco-scrollable-element" role="presentation" style="position:relative;overflow:hidden"
    @mouseover="hovered = true; reveal()" @mouseleave="hovered = false; hide()" @wheel="wheel">
    <slot />
    <div class="invisible scrollbar horizontal" role="presentation" aria-hidden="true" style="position:absolute;width:0px;height:10px;left:0px;bottom:0px">
      <div class="slider" style="position:absolute;top:0px;left:0px;width:0px;height:10px;transform:translate3d(0px,0px,0px);contain:strict" />
    </div>
    <div class="scrollbar vertical" :class="scrollbarClass" role="presentation" aria-hidden="true" :style="{ position:'absolute', width:'10px', height:`${height}px`, right:'0px', top:'0px' }"
      @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @lostpointercapture="pointerUp">
      <div class="slider" :class="{ active: dragging }" :style="{ position:'absolute', top:`${sliderPosition}px`, left:'0px', width:'10px', height:`${sliderSize}px`, transform:'translate3d(0px,0px,0px)', contain:'strict' }" />
    </div>
    <div class="shadow" /><div class="shadow" :class="{ top: scrollTop > 0 }" /><div class="shadow" :class="{ 'top-left-corner': scrollTop > 0, top: scrollTop > 0 }" />
  </div>
  <slot v-else />
</template>
<style src="./scrollbars.css" />
