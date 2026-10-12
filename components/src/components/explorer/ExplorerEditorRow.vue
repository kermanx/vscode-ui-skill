<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue';
import ActionBar from '../action-bar/ActionBar.vue';
import ExplorerResourceLabel from './ExplorerResourceLabel.vue';
import type { ExplorerEditorRow } from './explorerModel';
const props = defineProps<{ row: ExplorerEditorRow; hasDirty: boolean }>();
const emit = defineEmits<{ action: [id: string] }>();
const label = ref<{ element?: HTMLElement }>();
const groupLabel = ref<HTMLElement>();
const actions = computed(() =>
  props.row.editor
    ? [
        {
          id: props.row.editor.sticky ? 'unpin' : 'close',
          label: props.row.editor.sticky ? 'Unpin Editor' : 'Close Editor',
          icon: props.row.editor.sticky ? 'pinned' : 'close',
        },
      ]
    : [
        {
          id: 'saveGroup',
          label: 'Save All in Group',
          icon: 'save-all',
          disabled: !props.hasDirty,
        },
        { id: 'closeGroup', label: 'Close Group', icon: 'close-all' },
      ],
);
function update() {
  const row = (label.value?.element || groupLabel.value)?.closest(
    '.monaco-list-row',
  );
  const dirty = !!props.row.editor?.dirty && !props.row.editor.saving;
  const sticky = !!props.row.editor?.sticky;
  if (row && row.classList.contains('dirty') !== dirty)
    row.classList.toggle('dirty', dirty);
  if (row && row.classList.contains('sticky') !== sticky)
    row.classList.toggle('sticky', sticky);
  row?.setAttribute(
    'aria-label',
    props.row.editor
      ? `${props.row.editor.name}, ${props.row.editor.description}`
      : props.row.group.label,
  );
}
let observer: MutationObserver | undefined;
onMounted(() => {
  update();
  const row = (label.value?.element || groupLabel.value)?.closest(
    '.monaco-list-row',
  );
  if (row) {
    observer = new MutationObserver(update);
    observer.observe(row, { attributes: true, attributeFilter: ['class'] });
  }
});
onBeforeUnmount(() => observer?.disconnect());
watch(
  () => props.row,
  () => nextTick(update),
  { deep: true },
);
</script>
<template>
  <template v-if="row.editor"
    ><ActionBar
      :actions="actions"
      @action="emit('action', $event)" /><ExplorerResourceLabel
      ref="label"
      :name="row.editor.name"
      :path="row.editor.path"
      :description="row.editor.description"
      :language="row.editor.language"
      :decoration="row.editor.decoration"
      :italic="row.editor.preview"
      editor
  /></template>
  <template v-else
    ><div ref="groupLabel" class="editor-group">
      <span class="name">{{ row.group.label }}</span>
    </div>
    <ActionBar :actions="actions" @action="emit('action', $event)"
  /></template>
</template>
