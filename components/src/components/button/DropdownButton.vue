<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import Button from './Button.vue';
import type { DropdownAction } from './dropdownTypes';
const props = withDefaults(defineProps<{
  label: string;
  actions: readonly DropdownAction[];
  secondary?: boolean;
  disabled?: boolean;
  includePrimary?: boolean;
  ariaLabel?: string;
}>(), { secondary: false, disabled: false, includePrimary: true });
const emit = defineEmits<{ click: [event?: MouseEvent | KeyboardEvent]; action: [id: string] }>();
const primary = ref<InstanceType<typeof Button>>(), trigger = ref<HTMLAnchorElement>();
const popup = ref<HTMLElement>(), list = ref<HTMLElement>();
const open = ref(false), highlighted = ref(false), focused = ref(-1);
const position = ref({ left: '0px', top: '0px' });
let returnFocus: HTMLElement | null = null;
let openedAt = 0;
const menuActions = computed(() => {
  const items: DropdownAction[] = props.includePrimary ? [{ id: '__primary', label: props.label }, ...props.actions] : [...props.actions];
  return items.filter((item, index) => !('separator' in item) || (index > 0 && index < items.length - 1 && !('separator' in items[index - 1])));
});
const palette = computed(() => props.secondary ? 'secondary' : '');
const buttonStyle = computed(() => ({
  color: `var(--vscode-button-${props.secondary ? 'secondaryForeground' : 'foreground'})`,
  backgroundColor: `var(--vscode-button-${props.secondary ? (highlighted.value ? 'secondaryHoverBackground' : 'secondaryBackground') : (highlighted.value ? 'hoverBackground' : 'background')})`,
  border: `1px solid var(--vscode-button-${props.secondary ? 'secondaryBorder' : 'border'})`,
}));
const separatorStyle = computed(() => ({
  backgroundColor: `var(--vscode-button-${palette.value ? 'secondaryBackground' : 'background'})`,
  borderTop: `1px solid var(--vscode-button-${palette.value ? 'secondaryBorder' : 'border'})`,
  borderBottom: `1px solid var(--vscode-button-${palette.value ? 'secondaryBorder' : 'border'})`,
}));
async function show() {
  if (props.disabled || !menuActions.value.length || open.value) return;
  returnFocus = document.activeElement as HTMLElement;
  focused.value = -1;
  const anchor = trigger.value!.getBoundingClientRect();
  position.value = { left: `${anchor.left}px`, top: `${anchor.bottom}px` };
  open.value = true;
  openedAt = performance.now();
  await nextTick();
  const menu = { width: popup.value!.offsetWidth, height: popup.value!.offsetHeight };
  position.value = {
    left: `${Math.max(0, Math.min(anchor.left, window.innerWidth - menu.width))}px`,
    top: `${menu.height <= window.innerHeight - anchor.bottom ? anchor.bottom : Math.max(0, anchor.top - menu.height)}px`,
  };
  list.value?.focus();
  window.addEventListener('mousedown', outside);
  window.addEventListener('blur', close);
  window.addEventListener('resize', close);
}
function close() {
  if (!open.value) return;
  if (popup.value?.contains(document.activeElement)) returnFocus?.focus();
  open.value = false;
  window.removeEventListener('mousedown', outside);
  window.removeEventListener('blur', close);
  window.removeEventListener('resize', close);
}
function outside(event: MouseEvent) {
  if (!event.defaultPrevented && event.button !== 2 && !popup.value?.contains(event.target as Node)) close();
}
function blur() { queueMicrotask(() => { if (open.value && !popup.value?.contains(document.activeElement)) close(); }); }
function triggerKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!props.disabled && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopPropagation(); void show(); }
  else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); trigger.value?.blur(); }
}
function focus(index: number) {
  const item = menuActions.value[index];
  if (!item || 'separator' in item || item.disabled) return;
  focused.value = index;
  (list.value?.children[index]?.firstElementChild as HTMLElement)?.focus();
}
function move(step: number) {
  const items = menuActions.value;
  let index = focused.value < 0 ? (step > 0 ? items.length - 1 : 0) : focused.value;
  for (let count = 0; count < items.length; count++) {
    index = (index + step + items.length) % items.length;
    const item = items[index];
    if (!('separator' in item) && !item.disabled) { focus(index); return; }
  }
}
function run(index: number, event?: MouseEvent | KeyboardEvent) {
  const item = menuActions.value[index];
  if (!item || 'separator' in item || item.disabled) return;
  close();
  if (props.includePrimary && index === 0) emit('click', event); else emit('action', item.id);
}
function menuKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'ArrowDown') move(1);
  else if (event.key === 'ArrowUp') move(-1);
  else if (event.key === 'Home') { focused.value = -1; move(1); }
  else if (event.key === 'End') { focused.value = -1; move(-1); }
  else if (event.key === 'Escape') close();
  else if (event.key === 'Enter' || (event.key === ' ' && !/Win/.test(navigator.platform))) run(focused.value, event);
  else if (event.key !== 'Tab') return;
  event.preventDefault(); event.stopPropagation();
}
function hover(index: number, event: MouseEvent) { if (event.movementX || event.movementY) focus(index); }
function leave(event: MouseEvent) {
  if (!popup.value?.contains(event.relatedTarget as Node)) { focused.value = -1; list.value?.focus(); }
}
function mouseRun(index: number, event: MouseEvent) {
  event.preventDefault(); event.stopPropagation();
  if (performance.now() - openedAt >= 100) setTimeout(() => run(index, event), 0);
}
watch(() => props.disabled, value => { if (value) close(); });
onBeforeUnmount(close);
defineExpose({ focus: () => primary.value?.focus(), close });
</script>

<template>
  <div class="monaco-button-dropdown" :class="{ disabled }">
    <Button ref="primary" :label="label" :secondary="secondary" :disabled="disabled" :aria-label="ariaLabel" @click="emit('click', $event)" />
    <div class="monaco-button-dropdown-separator" :style="separatorStyle"><div style="background-color:var(--vscode-button-separator)" /></div>
    <a ref="trigger" class="monaco-button monaco-dropdown-button codicon codicon-chevron-down" :class="{ secondary, disabled }"
      role="button" tabindex="0" aria-label="More Actions..." aria-haspopup="true" :aria-expanded="open" :aria-disabled="disabled" :style="buttonStyle"
      @click.stop.prevent="show" @keydown="triggerKey"
      @mouseover="!disabled && (highlighted = true)" @mouseout="highlighted = false"
      @focus="!disabled && (highlighted = true)" @blur="!disabled && (highlighted = false)" />
  </div>
  <div v-if="open" ref="popup" class="context-view monaco-menu-container vc-dropdown-menu" role="presentation" :style="position" @focusout="blur" @contextmenu.prevent>
    <div class="context-view-block" @mousedown.stop @click.stop="close" />
    <div class="monaco-scrollable-element" style="overflow:hidden;background-color:var(--vscode-menu-background);color:var(--vscode-menu-foreground);border-radius:var(--vscode-cornerRadius-large)">
      <div class="monaco-menu" role="presentation" @mouseleave="leave" @keydown="menuKey">
        <div class="monaco-action-bar vertical">
          <ul ref="list" class="actions-container" role="menu" tabindex="0" :aria-label="label">
            <li v-for="(action, index) in menuActions" :key="index" class="action-item" :class="{ disabled: 'separator' in action || action.disabled, focused: index === focused }" role="presentation" @mousemove="hover(index, $event)">
              <a v-if="'separator' in action" class="action-label separator disabled" role="separator" tabindex="-1" />
              <a v-else class="action-menu-item" :class="{ disabled: action.disabled, checked: action.checked }"
                :role="action.checked === undefined ? 'menuitem' : 'menuitemcheckbox'" :aria-checked="action.checked" :aria-disabled="action.disabled || undefined" :tabindex="action.disabled ? undefined : 0"
                :style="{ color: index === focused ? 'var(--vscode-list-hoverForeground)' : 'var(--vscode-menu-foreground)', backgroundColor: index === focused ? 'var(--vscode-list-hoverBackground)' : undefined, outline: index === focused ? '1px solid var(--vscode-menu-selectionBorder)' : undefined, outlineOffset: index === focused ? '-1px' : undefined }"
                @mouseup="mouseRun(index, $event)" @click.stop.prevent>
                <span class="menu-item-check codicon codicon-check" role="none" style="color:inherit" /><span class="action-label">{{ action.label }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./menu.css" />
