<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { dropdownPopupHost } from './popupHost';
import { positionDropdown } from './layout';
import type { DropdownAnchor } from './types';
const props = withDefaults(defineProps<{
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  /** Use an existing trigger instead of rendering the default trigger. */
  anchor?: DropdownAnchor | null;
  alignment?: 'left' | 'right';
}>(), { label: 'More Actions', disabled: false, alignment: 'left' });
const open = defineModel<boolean>('open', { default: false });
const popupHost = inject(dropdownPopupHost, undefined);
const emit = defineEmits<{ close: []; show: [] }>();
const trigger = ref<HTMLElement>(), popup = ref<HTMLElement>();
const position = ref({ left: '0px', top: '0px' });
let returnFocus: HTMLElement | null = null;
function removeListeners() {
  window.removeEventListener('mousedown', outside);
  window.removeEventListener('blur', close);
  window.removeEventListener('resize', close);
}
function close() {
  if (!open.value) return;
  if (popup.value?.contains(document.activeElement)) returnFocus?.focus();
  open.value = false;
}
async function show() {
  if (props.disabled || open.value) return;
  open.value = true;
  await nextTick();
}
function toggle() { if (open.value) close(); else void show(); }
function outside(event: MouseEvent) {
  if (!event.defaultPrevented && event.button !== 2 && !popup.value?.contains(event.target as Node)) close();
}
function blur() { queueMicrotask(() => { if (open.value && !popup.value?.contains(document.activeElement)) close(); }); }
function triggerKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); toggle(); }
}
watch(open, async (value, previous) => {
  if (!value) {
    if (popup.value?.contains(document.activeElement)) returnFocus?.focus();
    removeListeners(); if (previous) emit('close'); return;
  }
  if (props.disabled) { open.value = false; return; }
  returnFocus = document.activeElement as HTMLElement;
  position.value = { left: '0px', top: '0px' };
  await nextTick();
  const element = props.anchor || trigger.value;
  if (!element || !popup.value || !open.value) return;
  const anchor = 'getBoundingClientRect' in element ? element.getBoundingClientRect() : new DOMRect(element.x, element.y, element.width || 1, element.height || 2);
  position.value = positionDropdown(anchor, popup.value.offsetWidth, popup.value.offsetHeight, props.alignment);
  const target = popup.value.querySelector<HTMLElement>('[role="menu"], [autofocus], [tabindex], input, button');
  target?.focus({ preventScroll: target.getAttribute('role') === 'menu' });
  window.addEventListener('mousedown', outside);
  window.addEventListener('blur', close);
  window.addEventListener('resize', close);
  emit('show');
}, { immediate: true });
watch(() => props.disabled, value => { if (value) close(); });
onBeforeUnmount(() => { close(); removeListeners(); });
defineExpose({ show, close, toggle, focus: () => trigger.value?.focus() });
</script>
<template>
  <div v-if="anchor === undefined" class="monaco-dropdown" :class="{ active: open }" @click.stop.prevent @mousedown.stop.prevent>
    <div ref="trigger" class="dropdown-label" role="button" tabindex="0" :aria-label="ariaLabel || label" aria-haspopup="true" :aria-expanded="open" :aria-disabled="disabled"
      @mousedown="!disabled && $event.button === 0 && toggle()" @keydown="triggerKey">
      <slot name="trigger" :open="open" :disabled="disabled">{{ label }}</slot>
    </div>
  </div>
  <Teleport :to="popupHost?.container.value || 'body'" :disabled="!popupHost?.container.value">
  <div v-if="open" ref="popup" class="context-view monaco-menu-container vc-dropdown-menu" role="presentation" :style="{ ...position, zIndex: popupHost?.layer }" @focusout="blur" @contextmenu.prevent @keydown.esc.stop.prevent="close">
    <div class="context-view-block" @mousedown.stop @click.stop="close" />
    <slot :close="close" />
  </div>
  </Teleport>
</template>
<style src="./dropdown.css" />
<style>
.vc-dropdown-menu { position: fixed; z-index: 2575; box-shadow: var(--vscode-shadow-lg, 0 0 12px var(--vscode-widget-shadow)); border-radius: var(--vscode-cornerRadius-large); outline: 0; border: none; }
.vc-theme:is([data-theme="hcDark"], [data-theme="hcLight"]) .vc-dropdown-menu { box-shadow: none; }
.vc-dropdown-menu .context-view-block { position: fixed; cursor: initial; inset: 0; z-index: -1; }
</style>
