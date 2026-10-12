<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CompositeBar from '../composite-bar/CompositeBar.vue';
import Toolbar from '../toolbar/Toolbar.vue';
import type { CompositeItem } from '../composite-bar/types';
import type { ActionBarEntry } from '../action-bar/types';
import type { MenuEntry } from '../menu/types';
import '../sidebar-title/part.css';
import '../sidebar-title/compositepart.css';
import './panelpart.css';
const props = withDefaults(defineProps<{
  items: readonly CompositeItem[];
  icons?: boolean;
  primary?: readonly ActionBarEntry[];
  secondary?: readonly MenuEntry[];
}>(), { icons: false, primary: () => [], secondary: () => [] });
const activeId = defineModel<string>('activeId');
const emit = defineEmits<{
  open: [id: string, focus: boolean];
  pin: [id: string, pinned: boolean];
  badge: [id: string, enabled: boolean];
  command: [id: string, ...args: unknown[]];
  action: [id: string];
  visibility: [visible: boolean];
}>();
const element = ref<HTMLElement>(), actions = ref<HTMLElement>(), bar = ref<InstanceType<typeof CompositeBar>>();
const available = ref(Infinity), border = ref(''), titleBorder = ref('');
function open(id: string, focus: boolean) { activeId.value = id; emit('open', id, focus); }
function layout() {
  if (!element.value) return;
  const actionWidth = [...(actions.value?.querySelectorAll<HTMLElement>('.actions-container > .action-item') || [])].reduce((width, item) => width + item.clientWidth + 4, 0);
  available.value = Math.max(50, element.value.clientWidth - 16 - actionWidth - (activeId.value ? 8 : 0));
}
function colors() {
  if (!element.value) return;
  const style = getComputedStyle(element.value);
  titleBorder.value = style.getPropertyValue('--vscode-contrastBorder').trim();
  border.value = style.getPropertyValue('--vscode-panel-border').trim() || style.getPropertyValue('--vscode-contrastBorder').trim();
}
let observer: ResizeObserver | undefined, themeObserver: MutationObserver | undefined;
onMounted(() => {
  colors(); layout();
  observer = new ResizeObserver(layout); observer.observe(element.value!);
  const theme = element.value?.closest('.vc-theme');
  if (theme) { themeObserver = new MutationObserver(colors); themeObserver.observe(theme, { attributes: true, attributeFilter: ['data-theme', 'style'] }); }
});
watch(() => [props.primary, props.secondary, activeId.value], () => nextTick(layout), { deep: true });
onBeforeUnmount(() => { observer?.disconnect(); themeObserver?.disconnect(); });
defineExpose({ focus: (index?: number) => bar.value?.focus(index), pin: (id: string) => bar.value?.pin(id), unpin: (id: string) => bar.value?.unpin(id) });
</script>
<template>
  <div class="monaco-workbench vc-panel-title">
    <div ref="element" class="part panel bottom pane-composite-part" style="position:relative;background-color:var(--vscode-panel-background)">
      <div class="composite title has-composite-bar" @contextmenu="bar?.contextMenu($event)" :class="{ 'has-actions': primary.length || secondary.length }" :style="{ borderTopColor: border, borderBottom: titleBorder ? `1px solid ${titleBorder}` : undefined }">
        <div class="composite-bar-container">
          <CompositeBar ref="bar" :items="items" :active-id="activeId" orientation="horizontal" :icons="icons" :available-size="available"
            @open="open" @pin="(id, value) => emit('pin', id, value)" @badge="(id, value) => emit('badge', id, value)" @command="(id, ...args) => emit('command', id, ...args)" />
        </div>
        <div class="title-label"><h2></h2></div>
        <div ref="actions" class="title-actions">
          <Toolbar :primary="primary" :secondary="secondary" trailing-separator more-label="Views and More Actions..." alignment="right" @action="emit('action', $event)" @visibility="emit('visibility', $event)" />
        </div>
        <div class="global-actions has-no-actions"><div class="monaco-toolbar"><div class="monaco-action-bar"><ul role="toolbar" class="actions-container highlight-toggled" /></div></div></div>
      </div>
    </div>
  </div>
</template>
