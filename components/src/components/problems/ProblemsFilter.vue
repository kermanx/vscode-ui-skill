<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import InputBox from '../input-box/InputBox.vue';
import ActionBar from '../action-bar/ActionBar.vue';
import ProblemsFilterAction from './ProblemsFilterAction.vue';
import type { ProblemSeverity } from './types';
const props = defineProps<{ total: number; filtered: number; width: number }>();
const value = defineModel<string>({ default: '' });
const severities = defineModel<ProblemSeverity[]>('severities', {
  default: () => ['error', 'warning', 'info'],
});
const emit = defineEmits<{ filter: [value: string]; accept: [] }>();
const input = ref<InstanceType<typeof InputBox>>(),
  toolbar = ref<InstanceType<typeof ActionBar>>();
const history: readonly string[] = [];
const actions = [{ id: 'filter', label: 'More Filters...', icon: 'filter' }];
const menu = computed(() =>
  [
    ['error', 'Show Errors'],
    ['warning', 'Show Warnings'],
    ['info', 'Show Infos'],
  ].map(([id, label]) => ({
    id,
    label,
    checked: severities.value.includes(id as ProblemSeverity),
  })),
);
const badge = computed(() =>
  props.total && props.total !== props.filtered
    ? `Showing ${props.filtered} of ${props.total}`
    : '',
);
let timeout: ReturnType<typeof setTimeout>;
function change(text: string) {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    input.value?.addToHistory();
    emit('filter', text);
  }, 300);
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    toolbar.value?.focus();
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    emit('accept');
  }
}
function toggle(id: string) {
  const severity = id as ProblemSeverity;
  severities.value = severities.value.includes(severity)
    ? severities.value.filter((x) => x !== severity)
    : [...severities.value, severity];
}
defineExpose({ focus: () => input.value?.focus() });
onBeforeUnmount(() => clearTimeout(timeout));
</script>
<template>
  <div class="viewpane-filter-container" :class="{ grow: width > 700 }">
    <div
      class="viewpane-filter"
      :class="{ small: width < 400 }"
      :style="{
        '--problem-filter-padding': width < 400 || !badge ? '25px' : '150px',
      }"
    >
      <InputBox
        ref="input"
        v-model="value"
        :history="history"
        aria-label="Filter Problems"
        placeholder="Filter (e.g. text, **/*.ts, !**/node_modules/**, @source:ts)"
        @change="change"
        @keydown="keydown"
      />
      <div class="viewpane-filter-controls">
        <div
          class="viewpane-filter-badge"
          :class="{ hidden: !badge }"
          style="
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border: 1px solid var(--vscode-contrastBorder);
          "
        >
          {{ badge }}
        </div>
        <ActionBar ref="toolbar" :actions="actions"
          ><template #item="{ tabindex, focused, onFocus }"
            ><ProblemsFilterAction
              :actions="menu"
              :tabindex="tabindex"
              :focused="focused"
              :checked="severities.length < 3"
              @focus="onFocus"
              @action="toggle" /></template
        ></ActionBar>
      </div>
    </div>
  </div>
</template>
