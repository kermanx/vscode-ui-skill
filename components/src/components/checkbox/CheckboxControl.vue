<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ checked: boolean; disabled?: boolean; compact?: boolean; ariaLabel?: string }>();
const emit = defineEmits<{ 'update:checked': [checked: boolean]; change: [checked: boolean, viaKeyboard: boolean] }>();
const element = ref<HTMLElement>();
const checked = ref(props.checked);
watch(() => props.checked, value => { checked.value = value; });
const accessibleLabel = computed(() => (props.ariaLabel || '').replace(/\$\((.*?)\)/g, (_match, icon) => ` ${icon} `).trim());
const style = computed(() => ({
  color: `var(--vscode-checkbox-${props.disabled ? 'disabled-foreground' : 'foreground'})`,
  backgroundColor: `var(--vscode-checkbox-${props.disabled ? 'disabled-background' : 'background'})`,
  borderColor: `var(--vscode-checkbox-${props.disabled ? 'disabled-background' : 'border'})`,
  '--monaco-custom-toggle-border-color': checked.value ? '#007ACC00' : undefined,
  width: props.compact ? '15px' : '18px', height: props.compact ? '15px' : '18px', fontSize: props.compact ? '13px' : '16px',
}));
function activate(viaKeyboard = false) {
  if (props.disabled) return;
  checked.value = !checked.value;
  emit('update:checked', checked.value);
  emit('change', checked.value, viaKeyboard);
}
function click(event: MouseEvent) {
  if (props.disabled) return;
  activate(); event.preventDefault(); event.stopPropagation();
}
function keydown(event: KeyboardEvent) {
  if (props.disabled) return;
  // The control accepts modified Space / Enter too, and activates on keydown.
  if (event.key === ' ' || event.key === 'Enter') {
    activate(true); event.preventDefault(); event.stopPropagation();
  }
}
defineExpose({ focus: () => element.value?.focus(), activate });
</script>
<template>
  <div v-bind="$attrs" ref="element" class="monaco-custom-toggle monaco-checkbox" :class="{ checked, disabled, codicon: checked, 'codicon-check': checked }"
    role="checkbox" :tabindex="disabled ? -1 : 0" :aria-checked="checked" :aria-disabled="!!disabled" :aria-label="accessibleLabel"
    :style="style" @click="click" @keydown="keydown" />
  <DelayedTooltip :target="element" :text="ariaLabel" strip-icons />
</template>
<style src="./checkbox.css" />
