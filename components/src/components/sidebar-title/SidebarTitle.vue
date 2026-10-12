<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import Toolbar from '../toolbar/Toolbar.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import type { ActionBarEntry } from '../action-bar/types';
import type { MenuEntry } from '../menu/types';
import './part.css';
import './compositepart.css';
import './sidebarpart.css';

const props = withDefaults(
  defineProps<{
    title: string;
    keybinding?: string;
    primary?: readonly ActionBarEntry[];
    secondary?: readonly MenuEntry[];
  }>(),
  { primary: () => [], secondary: () => [] },
);
const emit = defineEmits<{
  action: [id: string];
  visibility: [visible: boolean];
}>();
const label = ref<HTMLElement>();
const toolbar = ref<InstanceType<typeof Toolbar>>();
const tooltip = computed(() =>
  props.keybinding ? `${props.title} (${props.keybinding})` : props.title,
);
defineExpose({ focus: (index?: number) => toolbar.value?.focus(index) });
</script>

<template>
  <div class="monaco-workbench">
    <div
      class="part sidebar"
      style="
        background-color: var(--vscode-sideBar-background);
        color: var(--vscode-sideBar-foreground);
      "
    >
      <div
        class="composite title"
        :class="{ 'has-actions': primary.length || secondary.length }"
        style="border-bottom: 1px solid var(--vscode-sideBarTitle-border)"
      >
        <div class="title-label">
          <h2
            ref="label"
            style="color: var(--vscode-sideBarTitle-foreground)"
            >{{ title }}</h2
          >
        </div>
        <div class="title-actions">
          <Toolbar
            ref="toolbar"
            :primary="primary"
            :secondary="secondary"
            more-label="Views and More Actions..."
            alignment="right"
            @action="emit('action', $event)"
            @visibility="emit('visibility', $event)"
          />
        </div>
      </div>
    </div>
    <Tooltip :target="label" :text="tooltip" placement="mouse" />
  </div>
</template>
