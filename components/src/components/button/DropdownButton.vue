<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import Menu from '../menu/Menu.vue';
import Dropdown from '../dropdown/Dropdown.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import { provideInstantHoverDelegate } from '../tooltip/delegate';
import Button from './Button.vue';
import type { DropdownAction } from './dropdownTypes';
provideInstantHoverDelegate();
const props = withDefaults(
  defineProps<{
    label: string;
    title?: boolean | string;
    actions: readonly DropdownAction[];
    secondary?: boolean;
    disabled?: boolean;
    includePrimary?: boolean;
    ariaLabel?: string;
  }>(),
  { secondary: false, disabled: false, includePrimary: true },
);
const emit = defineEmits<{
  click: [event?: MouseEvent | KeyboardEvent];
  action: [id: string];
}>();
const primary = ref<InstanceType<typeof Button>>(),
  trigger = ref<HTMLAnchorElement>();
const dropdown = ref<InstanceType<typeof Dropdown>>();
const open = ref(false),
  highlighted = ref(false);
const menuActions = computed(() =>
  props.includePrimary
    ? [{ id: '__primary', label: props.label }, ...props.actions]
    : props.actions,
);
const palette = computed(() => (props.secondary ? 'secondary' : ''));
const buttonStyle = computed(() => ({
  color: `var(--vscode-button-${props.secondary ? 'secondaryForeground' : 'foreground'})`,
  backgroundColor: `var(--vscode-button-${props.secondary ? (highlighted.value ? 'secondaryHoverBackground' : 'secondaryBackground') : highlighted.value ? 'hoverBackground' : 'background'})`,
  border: `1px solid var(--vscode-button-${props.secondary ? 'secondaryBorder' : 'border'})`,
}));
const separatorStyle = computed(() => ({
  backgroundColor: `var(--vscode-button-${palette.value ? 'secondaryBackground' : 'background'})`,
  borderTop: `1px solid var(--vscode-button-${palette.value ? 'secondaryBorder' : 'border'})`,
  borderBottom: `1px solid var(--vscode-button-${palette.value ? 'secondaryBorder' : 'border'})`,
}));
function show() {
  if (!props.disabled && menuActions.value.length) void dropdown.value?.show();
}
function triggerKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!props.disabled && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    event.stopPropagation();
    show();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    trigger.value?.blur();
  }
}
function run(id: string, event?: MouseEvent | KeyboardEvent) {
  dropdown.value?.close();
  if (props.includePrimary && id === '__primary') emit('click', event);
  else emit('action', id);
}
defineExpose({
  focus: () => primary.value?.focus(),
  close: () => dropdown.value?.close(),
});
</script>

<template>
  <div class="monaco-button-dropdown" :class="{ disabled }">
    <Button
      ref="primary"
      :label="label"
      :title="title"
      :secondary="secondary"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @click="emit('click', $event)"
    />
    <Tooltip :target="trigger" text="More Actions..." placement="element" />
    <div class="monaco-button-dropdown-separator" :style="separatorStyle"
      ><div style="background-color: var(--vscode-button-separator)"
    /></div>
    <a
      ref="trigger"
      class="monaco-button monaco-dropdown-button codicon codicon-chevron-down"
      :class="{ secondary, disabled }"
      role="button"
      tabindex="0"
      aria-label="More Actions..."
      aria-haspopup="true"
      :aria-expanded="open"
      :aria-disabled="disabled"
      :style="buttonStyle"
      @click.stop.prevent="show"
      @keydown="triggerKey"
      @mouseover="!disabled && (highlighted = true)"
      @mouseout="highlighted = false"
      @focus="!disabled && (highlighted = true)"
      @blur="!disabled && (highlighted = false)"
    />
  </div>
  <Dropdown
    ref="dropdown"
    v-model:open="open"
    :anchor="trigger || null"
    :disabled="disabled"
  >
    <Menu :actions="menuActions" @action="run" @cancel="dropdown?.close()" />
  </Dropdown>
</template>
