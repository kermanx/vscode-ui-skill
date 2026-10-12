<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import CompositeBar from '../composite-bar/CompositeBar.vue';
import type { CompositeItem } from '../composite-bar/types';
import '../sidebar-title/part.css';
import './activitybar.css';
import './activityaction.css';
import './theme.css';
const props = withDefaults(
  defineProps<{
    items: readonly CompositeItem[];
    side?: 'left' | 'right';
    iconClickBehavior?: 'toggle' | 'focus';
  }>(),
  { side: 'left', iconClickBehavior: 'toggle' },
);
const activeId = defineModel<string>('activeId'),
  sidebarVisible = defineModel<boolean>('sidebarVisible', { default: true });
const emit = defineEmits<{
  /** The host opens the view and, when requested, moves focus into its content. */
  open: [id: string, focus: boolean];
  visibility: [visible: boolean];
  pin: [id: string, pinned: boolean];
  badge: [id: string, enabled: boolean];
  command: [id: string, ...args: unknown[]];
}>();
const element = ref<HTMLElement>(),
  bar = ref<InstanceType<typeof CompositeBar>>(),
  border = ref('');
function open(id: string, focus: boolean) {
  if (
    sidebarVisible.value &&
    activeId.value === id &&
    props.iconClickBehavior === 'toggle'
  ) {
    sidebarVisible.value = false;
    emit('visibility', false);
    return;
  }
  activeId.value = id;
  sidebarVisible.value = true;
  emit('open', id, focus);
}
function colors() {
  if (element.value) {
    const css = getComputedStyle(element.value);
    border.value =
      css.getPropertyValue('--vscode-activityBar-border').trim() ||
      css.getPropertyValue('--vscode-contrastBorder').trim();
  }
}
let observer: MutationObserver | undefined;
onMounted(() => {
  colors();
  const theme = element.value?.closest('.vc-theme');
  if (theme) {
    observer = new MutationObserver(colors);
    observer.observe(theme, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });
  }
});
onBeforeUnmount(() => observer?.disconnect());
defineExpose({
  focus: (index?: number) => bar.value?.focus(index),
  pin: (id: string) => bar.value?.pin(id),
  unpin: (id: string) => bar.value?.unpin(id),
});
</script>
<template>
  <div
    class="monaco-workbench vc-activity-bar"
    style="height: 100%; width: 48px"
  >
    <div
      ref="element"
      class="part activitybar"
      :class="[side, { bordered: !!border }]"
      :style="{
        position: 'relative',
        backgroundColor: 'var(--vscode-activityBar-background)',
        borderColor: border,
      }"
    >
      <div class="content">
        <CompositeBar
          ref="bar"
          :items="items"
          :active-id="sidebarVisible ? activeId : undefined"
          :side="side"
          @open="open"
          @pin="(id, value) => emit('pin', id, value)"
          @badge="(id, value) => emit('badge', id, value)"
          @command="(id, ...args) => emit('command', id, ...args)"
        />
      </div>
    </div>
  </div>
</template>
