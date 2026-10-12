<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import ActionBar from '../action-bar/ActionBar.vue';
import type { InputBoxAction } from './types';
const props = defineProps<{ actions: readonly InputBoxAction[]; label: string }>();
const emit = defineEmits<{ action: [action: InputBoxAction] }>();
function run(id: string) { const action = props.actions.find(item => item.id === id); if (action) emit('action', action); }
</script>
<template>
  <ActionBar :actions="actions" :aria-label="`Actions for ${label}`" @action="run" />
</template>
