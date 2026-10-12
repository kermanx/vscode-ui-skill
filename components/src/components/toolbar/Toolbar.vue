<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { provideInstantHoverDelegate } from '../tooltip/delegate';
import ActionBar from '../action-bar/ActionBar.vue';
import ToolbarMenuButton from './ToolbarMenuButton.vue';
import type { ActionBarEntry } from '../action-bar/types';
import type { MenuEntry } from '../menu/types';
import './toolbar.css';
provideInstantHoverDelegate();
const props = withDefaults(defineProps<{
  primary: readonly ActionBarEntry[];
  secondary?: readonly MenuEntry[];
  ariaLabel?: string;
  moreLabel?: string;
  moreIcon?: string;
  /** Horizontal alignment of the secondary menu with its trigger. */
  alignment?: 'left' | 'right';
  /** Maximum visible items, including the More Actions button. */
  maxItems?: number;
  /** Keep the native trailing toolbar separator. */
  trailingSeparator?: boolean;
}>(), { secondary: () => [], moreLabel: 'More Actions...', moreIcon: 'toolbar-more', alignment: 'left' });
const emit = defineEmits<{ action: [id: string]; visibility: [visible: boolean] }>();
const bar = ref<InstanceType<typeof ActionBar>>(), more = ref<InstanceType<typeof ToolbarMenuButton>>();
const moreId = 'toolbar.toggle.more';
function clean<T extends ActionBarEntry | MenuEntry>(actions: readonly T[]): T[] {
  const result: T[] = [];
  for (const action of actions) {
    if ('separator' in action && (!result.length || 'separator' in result[result.length - 1]!)) continue;
    result.push(action);
  }
  if (result.length && 'separator' in result[result.length - 1]!) result.pop();
  return result;
}
const groups = computed(() => {
  const primary: ActionBarEntry[] = [], overflow: ActionBarEntry[] = [];
  let count = 0;
  for (const action of props.primary) {
    count++;
    if (props.maxItems !== undefined && count >= props.maxItems) overflow.push(action);
    else primary.push(action);
  }
  const secondary: MenuEntry[] = clean(overflow);
  if (secondary.length && props.secondary.length) secondary.push({ separator: true });
  secondary.push(...props.secondary);
  const actions = clean(primary);
  if (secondary.length) actions.push({ id: moreId, label: props.moreLabel, icon: props.moreIcon });
  if (actions.length && props.trailingSeparator) actions.push({ separator: true });
  return { primary: actions, secondary };
});
function run(id: string) { if (id === moreId) more.value?.show(); else emit('action', id); }
defineExpose({ focus: (index?: number) => bar.value?.focus(index) });
</script>
<template>
  <div class="monaco-toolbar">
    <ActionBar ref="bar" :actions="groups.primary" :aria-label="ariaLabel" :class="{ 'has-overflow': groups.secondary.length > 0 }" @action="run">
      <template #item="{ entry, tabindex, focused, onFocus }">
        <ToolbarMenuButton v-if="'id' in entry && entry.id === moreId" ref="more" :actions="groups.secondary" :label="moreLabel" :icon="moreIcon" :tabindex="tabindex" :focused="focused" :alignment="alignment"
          @focus="onFocus" @action="emit('action', $event)" @visibility="emit('visibility', $event)" />
      </template>
    </ActionBar>
  </div>
</template>
