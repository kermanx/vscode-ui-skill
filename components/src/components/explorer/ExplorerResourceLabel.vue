<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import IconLabel from '../icon-label/IconLabel.vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import { fileIconClasses } from './explorerModel';
import type { TreeDecoration } from '../tree/types';
const props = withDefaults(
  defineProps<{
    name: string;
    path: string;
    description?: string;
    kind?: 'file' | 'folder' | 'root';
    language?: string;
    decoration?: TreeDecoration;
    italic?: boolean;
    cut?: boolean;
    editor?: boolean;
  }>(),
  { kind: 'file' },
);
const label = ref<{ element?: HTMLElement }>();
const title = computed(
  () =>
    `${props.path}${props.decoration?.tooltip ? ` • ${props.decoration.tooltip}` : ''}`,
);
const classes = computed(() => [
  ...fileIconClasses(props.path, props.kind, props.language),
  props.editor ? 'open-editor' : 'explorer-item',
  ...(props.cut ? ['cut'] : []),
  ...(props.decoration?.color ? ['monaco-decoration-itemColor'] : []),
  ...(props.decoration?.badge
    ? ['monaco-decoration-badge', 'monaco-decoration-text-badge']
    : []),
]);
defineExpose({
  get element() {
    return label.value?.element;
  },
});
</script>
<template>
  <IconLabel
    ref="label"
    class="vc-explorer-resource"
    :label="name"
    :description="description"
    :title="title"
    :extra-classes="classes"
    :italic="italic"
    :strikethrough="decoration?.strikethrough"
    :support-highlights="!editor"
    :data-decoration="decoration?.badge"
    :style="{
      '--vc-explorer-decoration': decoration?.color
        ? `var(--vscode-${decoration.color.replaceAll('.', '-')})`
        : undefined,
    }"
  />
  <DelayedTooltip :target="label?.element" :text="title" placement="mouse" />
</template>
<style>
.vc-explorer-resource.monaco-decoration-itemColor {
  color: var(--vc-explorer-decoration);
}
.vc-explorer-resource[data-decoration]::after {
  content: attr(data-decoration);
  color: var(--vc-explorer-decoration);
}
</style>
