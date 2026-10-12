<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { ref } from 'vue';
import QuickInputShell from './QuickInputShell.vue';
import type { QuickInputHideReason, QuickInputProps } from './types';
const props = withDefaults(defineProps<QuickInputProps>(), { enabled: true });
const open = defineModel<boolean>('open', { default: false });
const value = defineModel<string>('value', { default: '' });
const emit = defineEmits<{
  accept: [value: string];
  hide: [reason: QuickInputHideReason];
  button: [id: string];
  link: [href: string];
  change: [value: string];
}>();
const shell = ref<InstanceType<typeof QuickInputShell>>();
defineExpose({
  hide: () => shell.value?.hide(),
  accept: () => shell.value?.accept(),
  focus: () => shell.value?.focus(),
});
</script>
<template>
  <QuickInputShell
    ref="shell"
    v-bind="props"
    v-model:open="open"
    v-model:value="value"
    @accept="emit('accept', $event)"
    @hide="emit('hide', $event)"
    @button="emit('button', $event)"
    @link="emit('link', $event)"
    @change="emit('change', $event)"
  />
</template>
