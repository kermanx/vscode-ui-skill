<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { ref } from 'vue';
import CheckboxControl from './CheckboxControl.vue';
withDefaults(
  defineProps<{
    checked?: boolean;
    label?: string;
    ariaLabel?: string;
    disabled?: boolean;
  }>(),
  { checked: false, disabled: false },
);
const emit = defineEmits<{
  'update:checked': [checked: boolean];
  change: [checked: boolean, viaKeyboard: boolean];
}>();
const control = ref<InstanceType<typeof CheckboxControl>>();
defineExpose({ focus: () => control.value?.focus() });
</script>
<template>
  <div v-if="label" class="monaco-action-bar vc-checkbox-label-container">
    <ul class="actions-container" role="toolbar">
      <li
        class="action-item checkbox-action-item"
        role="presentation"
        :class="{ disabled }"
        @contextmenu.prevent.stop
      >
        <CheckboxControl
          ref="control"
          :checked="checked"
          :disabled="disabled"
          :aria-label="ariaLabel || label"
          @update:checked="emit('update:checked', $event)"
          @change="(value, keyboard) => emit('change', value, keyboard)"
        />
        <span
          class="checkbox-label"
          @mousedown.prevent="!disabled && control?.focus()"
          @click.stop.prevent="control?.activate(false)"
          >{{ label }}</span
        >
      </li>
    </ul>
  </div>
  <CheckboxControl
    v-else
    ref="control"
    :checked="checked"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @update:checked="emit('update:checked', $event)"
    @change="(value, keyboard) => emit('change', value, keyboard)"
  />
</template>
<style>
.vc-checkbox-label-container {
  display: inline-flex;
}
</style>
