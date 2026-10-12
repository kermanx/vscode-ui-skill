<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Codicon from '../codicon/Codicon.vue';
import { StandardWheelEvent, type IMouseWheelEvent } from '../../internal/standardWheelEvent';
import { ScrollbarState } from '../scrollable-element/scrollbarState';
import HighlightedLabel from '../highlighted-label/HighlightedLabel.vue';
import type { BreadcrumbItem, BreadcrumbItemEvent } from './types';
const props = withDefaults(defineProps<{
  items: readonly BreadcrumbItem[]; disabled?: boolean;
  scrollbarVisibility?: 'auto' | 'visible' | 'hidden'; scrollbarSize?: 'default' | 'large';
}>(), { scrollbarVisibility: 'auto', scrollbarSize: 'default' });
const emit = defineEmits<{ focusItem: [event: BreadcrumbItemEvent]; selectItem: [event: BreadcrumbItemEvent]; focusChange: [focused: boolean]; escape: [] }>();
const host = ref<HTMLElement>(), root = ref<HTMLElement>();
const focused = ref(-1), selected = ref(-1), selectedStyle = ref(-1), domFocused = ref(false);
const width = ref(0), scrollWidth = ref(0), scrollLeft = ref(0);
const rendered = ref<BreadcrumbItem[]>([]);
const hovered = ref(false), dragging = ref(false), revealed = ref(false), faded = ref(false);
const needed = computed(() => scrollWidth.value > width.value);
const thickness = computed(() => props.scrollbarVisibility === 'hidden' ? 0 : props.scrollbarSize === 'large' ? 8 : 3);
const scrollbar = computed(() => new ScrollbarState(0, thickness.value, 0, width.value, scrollWidth.value, scrollLeft.value));
const sliderSize = computed(() => scrollbar.value.getSliderSize());
const sliderPosition = computed(() => scrollbar.value.getSliderPosition());
const barClass = computed(() => needed.value && props.scrollbarVisibility !== 'hidden' && (props.scrollbarVisibility === 'visible' || revealed.value) ? 'visible' : `invisible${needed.value && faded.value ? ' fade' : ''}`);
let timer: ReturnType<typeof setTimeout> | undefined, revealFrame = 0, observer: ResizeObserver | undefined;
function nodes() { return [...(root.value?.querySelectorAll<HTMLElement>(':scope > .monaco-breadcrumb-item') ?? [])]; }
function notify(type: 'focus' | 'select', index: number, payload?: unknown) {
  const event = { type, item: props.items[index], node: nodes()[index], payload };
  if (type === 'focus') emit('focusItem', event); else emit('selectItem', event);
}
function setScroll(position: number) {
  const next = Math.max(0, Math.min(Math.round(position), scrollWidth.value - width.value));
  if (next === scrollLeft.value) return false;
  scrollLeft.value = next; if (root.value) root.value.scrollLeft = next;
  return true;
}
function revealIndex(index: number, minimal: boolean) {
  cancelAnimationFrame(revealFrame);
  const node = nodes()[index]; if (!node) return;
  const run = () => { if (!minimal || node.offsetLeft > scrollLeft.value + width.value || node.offsetLeft < scrollLeft.value) setScroll(node.offsetLeft); };
  if (minimal) run(); else revealFrame = requestAnimationFrame(run);
}
function focusIndex(index: number, payload?: unknown) {
  focused.value = index >= 0 && index < props.items.length ? index : -1;
  nodes().forEach((node, i) => node.classList.toggle('focused', i === focused.value));
  nodes()[focused.value]?.focus(); revealIndex(focused.value, true); notify('focus', focused.value, payload);
}
function selectIndex(index: number, payload?: unknown) {
  selected.value = index >= 0 && index < props.items.length ? index : -1; selectedStyle.value = selected.value;
  notify('select', selected.value, payload);
}
function focus() { if (props.items.length) focusIndex(focused.value >= 0 ? focused.value : props.items.length - 1); else root.value?.focus(); }
function focusPrev(payload?: unknown) { if (focused.value > 0) focusIndex(focused.value - 1, payload); }
function focusNext(payload?: unknown) { if (focused.value + 1 < props.items.length) focusIndex(focused.value + 1, payload); }
function keydown(event: KeyboardEvent) {
  const mac = /Mac/.test(navigator.platform);
  const plain = !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
  const navModifier = !event.shiftKey && !event.metaKey && (mac ? event.altKey && !event.ctrlKey : event.ctrlKey && !event.altKey);
  if ((plain || navModifier) && event.key === 'ArrowLeft') focusPrev();
  else if ((plain || navModifier) && event.key === 'ArrowRight') focusNext();
  else if (plain && ['Enter', 'ArrowDown'].includes(event.key)) selectIndex(focused.value, 'pick');
  else if (plain && event.key === ' ' || event.key === 'Enter' && !event.shiftKey && !event.altKey && (mac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey)) selectIndex(focused.value, 'reveal');
  else if (plain && event.key === 'Escape') { focusIndex(-1); selectIndex(-1); emit('escape'); }
  else return;
  event.preventDefault(); event.stopPropagation();
}
function click(index: number, event: MouseEvent) { if (!props.disabled) { focusIndex(index, event); selectIndex(index, event); } }
function focusIn() { if (!domFocused.value) { domFocused.value = true; emit('focusChange', true); } }
function focusOut() { setTimeout(() => { if (domFocused.value && !root.value?.contains(document.activeElement)) { domFocused.value = false; emit('focusChange', false); } }); }
async function layout() { await nextTick(); if (!root.value || !host.value) return; width.value = host.value.clientWidth; await nextTick(); scrollWidth.value = root.value.scrollWidth; scrollLeft.value = root.value.scrollLeft; setScroll(scrollLeft.value); }
watch(() => props.items, async items => {
  let prefix = 0;
  while (prefix < items.length && prefix < rendered.value.length && JSON.stringify(items[prefix]) === JSON.stringify(rendered.value[prefix])) prefix++;
  if (selectedStyle.value >= prefix) selectedStyle.value = -1;
  rendered.value = items.map(item => ({ ...item }));
  await nextTick(); focusIndex(-1); await layout();
}, { deep: true, immediate: true });
function hide() { if (!hovered.value && !dragging.value) { faded.value = revealed.value; revealed.value = false; } }
function revealBar() { revealed.value = true; faded.value = false; clearTimeout(timer); if (!hovered.value && !dragging.value) timer = setTimeout(hide, 500); }
function wheel(event: WheelEvent) {
  if (event.defaultPrevented) return;
  const normalized = new StandardWheelEvent(event as unknown as IMouseWheelEvent);
  let dx = normalized.deltaX, dy = normalized.deltaY;
  if (dx + dy === 0) dx = dy = 0;
  else if (Math.abs(dy) >= Math.abs(dx)) dx = 0; else dy = 0;
  // Breadcrumbs configures scrollYToX on the original ScrollableElement.
  if (dx === 0) dx = dy;
  const delta = dx * 50 * (event.altKey ? 5 : 1);
  if (delta && setScroll(scrollLeft.value - (delta < 0 ? Math.floor(delta) : Math.ceil(delta)))) { revealBar(); event.preventDefault(); event.stopPropagation(); }
}
let dragX = 0, dragY = 0, dragState: ScrollbarState | undefined;
function pointerDown(event: PointerEvent) {
  if (event.button !== 0 || !needed.value) return;
  const track = event.currentTarget as HTMLElement;
  if (!(event.target as HTMLElement).classList.contains('slider')) setScroll(scrollbar.value.getDesiredScrollPositionFromOffset(event.clientX - track.getBoundingClientRect().left));
  dragX = event.clientX; dragY = event.clientY; dragState = scrollbar.value.clone();
  dragging.value = true; revealBar(); track.setPointerCapture(event.pointerId); event.preventDefault();
}
function pointerMove(event: PointerEvent) { if (dragging.value && dragState) { const reset = /Win/.test(navigator.platform) && Math.abs(event.clientY - dragY) > 140; setScroll(reset ? dragState.getScrollPosition() : dragState.getDesiredScrollPositionFromDelta(event.clientX - dragX)); } }
function pointerUp() { dragging.value = false; hide(); }
onMounted(() => { observer = new ResizeObserver(layout); observer.observe(host.value!); void layout(); void document.fonts.ready.then(layout); });
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(timer); cancelAnimationFrame(revealFrame); });
const indexOf = (id?: string) => props.items.findIndex(item => item.id === id);
defineExpose({ focus, domFocus: focus, isDOMFocused: () => !!root.value?.contains(document.activeElement), setFocused: (id?: string, payload?: unknown) => focusIndex(indexOf(id), payload), getFocused: () => props.items[focused.value], focusPrev, focusNext, setSelection: (id?: string, payload?: unknown) => selectIndex(indexOf(id), payload), getSelection: () => props.items[selected.value], reveal: (id: string) => revealIndex(indexOf(id), false), revealLast: () => revealIndex(props.items.length - 1, false), layout });
</script>
<template>
  <div ref="host" class="vc-breadcrumbs-control">
    <div class="monaco-scrollable-element" role="presentation" style="position:relative;overflow:hidden" @mouseover="hovered = true; revealBar()" @mouseleave="hovered = false; hide()" @wheel="wheel">
      <div ref="root" class="monaco-breadcrumbs" :class="{ disabled }" tabindex="0" role="list" :style="{ overflow:'hidden', width:`${width}px`, height:'22px' }" @keydown="keydown" @focusin="focusIn" @focusout="focusOut">
        <div v-for="(item, index) in rendered" :key="index" class="monaco-breadcrumb-item" :class="[{ focused: focused === index, selected: selectedStyle === index, 'outline-element': item.kind === 'symbol' }, item.kind === 'file' || item.kind === 'folder' ? item.kind : '']" tabindex="-1" role="listitem" @click="click(index, $event)">
          <Codicon v-if="item.kind === 'symbol' && item.icon" :name="item.icon" class="outline-element-icon inline codicon-colored" />
          <div class="monaco-icon-label" :class="{ nowrap: item.kind === 'symbol', deprecated: item.deprecated }" aria-label="">
            <Codicon v-if="item.kind !== 'symbol' && item.icon" :name="item.icon" class="monaco-icon-label-iconpath" style="background-repeat:no-repeat;background-position:center;background-size:contain" />
            <div class="monaco-icon-label-container"><span class="monaco-icon-name-container"><a class="label-name"><HighlightedLabel v-if="item.kind === 'symbol'" :text="item.label" escape-new-lines /><template v-else>{{ item.label }}</template></a></span><span v-if="item.description" class="monaco-icon-description-container"><span class="label-description">{{ item.description }}</span></span></div>
          </div>
          <div v-if="item.kind === 'symbol'" class="outline-element-decoration" />
          <Codicon name="chevron-right" />
        </div>
      </div>
      <div class="scrollbar horizontal" :class="barClass" role="presentation" aria-hidden="true" :style="{ position:'absolute', width:`${width}px`,height:`${thickness}px`,left:'0px',bottom:'0px' }" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" @lostpointercapture="pointerUp">
        <div class="slider" :class="{active:dragging}" :style="{ position:'absolute',top:'0px',left:`${sliderPosition}px`,width:`${sliderSize}px`,height:`${thickness}px`,transform:'translate3d(0px,0px,0px)',contain:'strict' }" />
      </div>
      <div class="invisible scrollbar vertical" role="presentation" aria-hidden="true" style="position:absolute;width:0px;height:22px;right:0px;top:0px"><div class="slider" style="position:absolute;top:0px;left:0px;width:0px;height:22px;transform:translate3d(0px,0px,0px);contain:strict" /></div>
    </div>
  </div>
</template>
<style src="./breadcrumbsWidget.css" />
<style src="./iconlabel.css" />
<style src="./documentSymbolsTree.css" />
<style src="./symbolIcons.css" />
<style src="../input-box/scrollbars.css" />
<style src="./breadcrumbsControl.css" />
