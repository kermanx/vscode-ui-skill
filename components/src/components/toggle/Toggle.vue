<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
const props = withDefaults(defineProps<{
  title: string;
  icon?: string;
  checked?: boolean;
  disabled?: boolean;
  focusable?: boolean;
}>(), { checked: false, disabled: false, focusable: true });
const emit = defineEmits<{
  'update:checked': [checked: boolean];
  change: [checked: boolean, viaKeyboard: boolean];
  keydown: [event: KeyboardEvent];
}>();
const element = ref<HTMLElement>();
const checked = ref(props.checked);
watch(() => props.checked, value => { checked.value = value; });
const accessibleLabel = computed(() => props.title.replace(/\$\((.*?)\)/g, (_match, icon) => ` ${icon} `).trim());
const style = computed(() => ({
  '--monaco-custom-toggle-border-color': checked.value ? 'var(--vscode-inputOption-activeBorder)' : undefined,
  color: checked.value ? 'var(--vscode-inputOption-activeForeground)' : 'inherit',
  backgroundColor: checked.value ? 'var(--vscode-inputOption-activeBackground)' : '',
}));
function activate(viaKeyboard: boolean) {
  checked.value = !checked.value;
  emit('update:checked', checked.value);
  emit('change', checked.value, viaKeyboard);
}
function click(event: MouseEvent) {
  if (props.disabled) return;
  activate(false); event.preventDefault(); event.stopPropagation();
}
function keydown(event: KeyboardEvent) {
  if (props.disabled) return;
  // Modified Space / Enter still activate; keyup does not activate again.
  if (event.key === ' ' || event.key === 'Enter') {
    activate(true); event.preventDefault(); event.stopPropagation(); return;
  }
  emit('keydown', event);
}
defineExpose({ focus: () => element.value?.focus() });
</script>
<template>
  <div ref="element" class="monaco-custom-toggle" :class="[icon ? ['codicon', `codicon-${icon}`] : [], { checked, disabled }]"
    role="checkbox" :tabindex="focusable ? (disabled ? -1 : 0) : undefined" :aria-checked="checked" :aria-disabled="disabled" :aria-label="accessibleLabel"
    :style="style" @click="click" @keydown="keydown"><DelayedTooltip :target="element" :text="title" strip-icons /></div>
</template>
<style src="./toggle.css" />
