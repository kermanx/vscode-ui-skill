<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount, type ComponentPublicInstance } from 'vue';
import type { RadioOption } from './types';
const props = withDefaults(defineProps<{
  options: readonly RadioOption[];
  modelValue?: number;
  ariaLabel?: string;
  disabled?: boolean;
  segmented?: boolean;
  arrowKeyBehavior?: 'select' | 'focus';
}>(), { arrowKeyBehavior: 'select', disabled: undefined });
const emit = defineEmits<{ 'update:modelValue': [index: number]; select: [index: number]; activate: [index: number] }>();
const element = ref<HTMLElement>();
const indicator = ref<HTMLElement>();
const buttons: HTMLAnchorElement[] = [];
const selected = ref(initialSelection());
const focusIndex = ref(selected.value);
const disabledOverride = ref(props.disabled);
const generation = ref(0);
const ready = ref(false), animateSelection = ref(false);
const bounds = ref<{ left: number; top: number; width: number; height: number }>();
let observer: ResizeObserver | undefined;
function initialSelection() {
  if (props.modelValue !== undefined) return props.modelValue;
  const index = props.options.findIndex(option => option.isActive);
  return index === -1 ? 0 : index;
}
function buttonDisabled(index: number) { return disabledOverride.value ?? !!props.options[index]?.disabled; }
function bindButton(value: Element | ComponentPublicInstance | null, index: number) { if (value instanceof HTMLAnchorElement) buttons[index] = value; }
function layoutSelectionIndicator(animate = false) {
  const button = buttons[selected.value];
  if (!props.segmented || !button) return;
  const next = { left: button.offsetLeft, top: button.offsetTop, width: button.offsetWidth, height: button.offsetHeight };
  if (!next.width || !next.height) return;
  const previous = bounds.value;
  if (previous && previous.left === next.left && previous.top === next.top && previous.width === next.width && previous.height === next.height) return;
  animateSelection.value = animate && !!previous;
  ready.value = true; bounds.value = next;
}
const indicatorStyle = computed(() => bounds.value ? { width: `${bounds.value.width}px`, height: `${bounds.value.height}px`, transform: `translate(${bounds.value.left}px, ${bounds.value.top}px)` } : undefined);
function setActiveItem(index: number, notify = false) {
  if (index < 0 || index >= props.options.length) throw new Error('Invalid Index');
  if (!bounds.value) layoutSelectionIndicator();
  const changed = selected.value !== index;
  selected.value = index; focusIndex.value = index;
  void nextTick(() => layoutSelectionIndicator(changed));
  if (notify && changed) { emit('update:modelValue', index); emit('select', index); }
}
function selectItem(index: number) { if (props.options[index] && selected.value !== index) setActiveItem(index, true); }
function focusItem(index: number) {
  if (!buttons[index]) throw new Error('Invalid Index');
  focusIndex.value = index;
  // Update the DOM before moving focus, like the imperative control.
  buttons.forEach((button, candidate) => { button.tabIndex = candidate === index ? 0 : -1; });
  buttons[index].focus();
}
function navigate(from: number, delta: number) {
  const count = props.options.length;
  for (let offset = 1; offset <= count; offset++) {
    const index = (((from + delta * offset) % count) + count) % count;
    if (props.options[index].disabled) continue;
    if (props.arrowKeyBehavior === 'select') selectItem(index);
    focusItem(index); return;
  }
}
function activate(index: number) { selectItem(index); emit('activate', index); }
function click(event: MouseEvent, index: number) {
  if (buttonDisabled(index)) { event.preventDefault(); event.stopPropagation(); return; }
  activate(index);
}
function keydown(event: KeyboardEvent, index: number) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!buttonDisabled(index) && (event.key === ' ' || event.key === 'Enter')) activate(index);
  else if (event.key === 'Escape') buttons[index]?.blur();
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') navigate(index, 1);
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') navigate(index, -1);
  else return;
  event.preventDefault(); event.stopPropagation();
}
function labelParts(text: string) {
  const parts: { text?: string; icon?: string[] }[] = [];
  const regex = /(\\)?\$\(([A-Za-z0-9-]+(?:~[A-Za-z]+)?)\)/g;
  let start = 0, match: RegExpExecArray | null;
  const appendText = (value: string) => { if (value.trim()) parts.push({ text: value.trim() }); };
  while ((match = regex.exec(text)) !== null) {
    appendText(text.substring(start, match.index)); start = match.index + match[0].length;
    if (match[1]) appendText(`$(${match[2]})`);
    else { const [icon, modifier] = match[2].split('~'); parts.push({ icon: ['codicon', `codicon-${icon}`, ...(modifier ? [`codicon-modifier-${modifier}`] : [])] }); }
  }
  appendText(text.substring(start)); return parts;
}
function observe() {
  observer?.disconnect();
  if (!props.segmented) return;
  observer ??= new ResizeObserver(() => layoutSelectionIndicator());
  if (element.value) observer.observe(element.value);
  buttons.forEach(button => observer!.observe(button));
  layoutSelectionIndicator();
}
watch(() => props.options, async () => {
  generation.value++; buttons.length = 0; bounds.value = undefined; ready.value = false; animateSelection.value = false;
  selected.value = initialSelection(); focusIndex.value = selected.value;
  disabledOverride.value = props.disabled ? true : undefined;
  await nextTick(); observe();
}, { deep: true });
watch(() => props.modelValue, index => { if (index !== undefined && index !== selected.value) setActiveItem(index); });
watch(() => props.disabled, value => { disabledOverride.value = value; focusIndex.value = selected.value; });
watch(() => props.segmented, async () => { bounds.value = undefined; ready.value = false; await nextTick(); observe(); });
onMounted(observe);
onBeforeUnmount(() => { observer?.disconnect(); indicator.value?.getAnimations().forEach(animation => animation.cancel()); });
async function whenSelectionAnimationSettles() {
  await nextTick();
  while (indicator.value) {
    const animations = indicator.value.getAnimations().filter(animation => animation.playState !== 'finished' && animation.playState !== 'idle');
    if (!animations.length) return;
    await Promise.all(animations.map(async animation => { try { await animation.finished; } catch (error) { if (!(error instanceof DOMException) || error.name !== 'AbortError') throw error; } }));
  }
}
defineExpose({ focusItem, focusActiveItem: () => { if (props.options.length) focusItem(selected.value); }, whenSelectionAnimationSettles });
</script>
<template>
  <div ref="element" class="monaco-custom-radio" :class="{ segmented, 'selection-indicator-ready': ready, 'animate-selection': animateSelection }" role="radiogroup" :aria-label="ariaLabel">
    <div v-if="segmented" ref="indicator" class="monaco-radio-selection" aria-hidden="true" :style="indicatorStyle" />
    <a v-for="(option, index) in options" :key="`${generation}-${index}`" :ref="value => bindButton(value, index)"
      class="monaco-button monaco-text-button" :class="{ active: selected === index, 'previous-active': selected === index - 1, disabled: buttonDisabled(index) }"
      role="radio" :tabindex="focusIndex === index ? 0 : -1" :aria-checked="selected === index" :aria-disabled="buttonDisabled(index)" :aria-label="option.ariaLabel ?? option.tooltip"
      @click="click($event, index)" @keydown="keydown($event, index)">
      <template v-for="(part, partIndex) in labelParts(option.text)" :key="partIndex"><span v-if="part.icon" :class="part.icon" /><span v-else :data-label="segmented ? part.text : undefined">{{ part.text }}</span></template>
    </a>
  </div>
</template>
<style src="../button/button.css" />
<style src="./radio.css" />
