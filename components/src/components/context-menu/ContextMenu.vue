<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { nextTick, ref, shallowRef } from 'vue';
import Dropdown from '../dropdown/Dropdown.vue';
import Menu from '../menu/Menu.vue';
import type { DropdownAnchor } from '../dropdown/types';
import type { MenuEntry } from '../menu/types';
import type { ContextMenuAnchor } from './types';
const props = withDefaults(
  defineProps<{
    actions: readonly MenuEntry[];
    alignment?: 'left' | 'right';
    autoSelectFirstItem?: boolean;
  }>(),
  { alignment: 'left', autoSelectFirstItem: false },
);
const emit = defineEmits<{
  action: [id: string];
  visibility: [visible: boolean];
}>();
const marker = ref<HTMLElement>(),
  portal = ref<HTMLElement>(),
  anchor = ref<DropdownAnchor | null>(null);
const shownActions = shallowRef<readonly MenuEntry[]>([]);
const open = ref(false),
  dropdown = ref<InstanceType<typeof Dropdown>>(),
  menu = ref<InstanceType<typeof Menu>>();
async function show(at: ContextMenuAnchor) {
  await nextTick();
  if (!props.actions.length) return;
  if (open.value) {
    dropdown.value?.close();
    await nextTick();
  }
  const element = 'getBoundingClientRect' in at ? at : marker.value;
  portal.value =
    element?.closest<HTMLElement>('.vc-theme') ||
    marker.value?.closest<HTMLElement>('.vc-theme') ||
    document.body;
  anchor.value =
    'clientX' in at
      ? { x: at.clientX, y: at.clientY, width: 2, height: 2 }
      : at;
  shownActions.value = [...props.actions];
  open.value = true;
}
function shown() {
  menu.value?.focus(props.autoSelectFirstItem);
  emit('visibility', true);
}
function close() {
  dropdown.value?.close();
}
function run(id: string) {
  close();
  emit('action', id);
}
defineExpose({ show, close });
</script>
<template>
  <span ref="marker" hidden />
  <Teleport v-if="portal" :to="portal">
    <Dropdown
      ref="dropdown"
      v-model:open="open"
      :anchor="anchor"
      :alignment="alignment"
      @show="shown"
      @close="emit('visibility', false)"
    >
      <Menu ref="menu" :actions="shownActions" @action="run" @cancel="close" />
    </Dropdown>
  </Teleport>
</template>
