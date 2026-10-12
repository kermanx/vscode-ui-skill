<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { ref, watch } from 'vue';
const props = withDefaults(
  defineProps<{
    checked?: boolean;
    ariaLabel: string;
    /** Hover content, for a host-provided hover service. Defaults to ariaLabel. */
    title?: string;
    disabled?: boolean;
  }>(),
  { checked: false, disabled: false },
);
const emit = defineEmits<{
  'update:checked': [checked: boolean];
  change: [checked: boolean];
}>();
const element = ref<HTMLButtonElement>();
const checked = ref(props.checked);
watch(
  () => props.checked,
  (value) => {
    checked.value = value;
  },
);
function click(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (props.disabled) return;
  checked.value = !checked.value;
  emit('update:checked', checked.value);
  emit('change', checked.value);
}
defineExpose({ focus: () => element.value?.focus() });
</script>
<template>
  <button
    ref="element"
    type="button"
    class="monaco-switch"
    :class="{ checked }"
    role="switch"
    :aria-label="ariaLabel"
    :aria-checked="checked"
    :disabled="disabled"
    @click="click"
    ><div class="monaco-switch-thumb"
  /></button>
</template>
<style src="./switch.css" />
