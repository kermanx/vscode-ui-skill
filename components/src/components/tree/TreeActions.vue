<script setup lang="ts">
import ActionBar from '../action-bar/ActionBar.vue';
import type { TreeAction } from './types';
const props = defineProps<{ actions: readonly TreeAction[]; label: string }>();
const emit = defineEmits<{ action: [action: TreeAction] }>();
function run(id: string) {
  const action = props.actions.find((item) => item.id === id);
  if (action) emit('action', action);
}
</script>
<template>
  <div class="actions"
    ><ActionBar
      :actions="actions"
      :aria-label="`Actions for ${label}`"
      @action="run"
  /></div>
</template>
