<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { ref } from 'vue';
import Tooltip from '../tooltip/Tooltip.vue';
import Dropdown from '../dropdown/Dropdown.vue';
import Menu from '../menu/Menu.vue';
import type { MenuEntry } from '../menu/types';
withDefaults(
  defineProps<{
    actions: readonly MenuEntry[];
    tabindex: number;
    focused: boolean;
    label?: string;
    icon?: string;
  }>(),
  { label: 'More Actions...', icon: 'notifications-configure' },
);
const emit = defineEmits<{ action: [id: string]; focus: [] }>();
const anchor = ref<HTMLElement>(),
  labelElement = ref<HTMLElement>(),
  popup = ref<InstanceType<typeof Dropdown>>(),
  open = ref(false);
function keydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.stopPropagation();
    open.value = !open.value;
  }
}
function run(id: string) {
  popup.value?.close();
  emit('action', id);
}
defineExpose({
  show: () => {
    open.value = true;
  },
});
</script>
<template>
  <div
    ref="anchor"
    class="monaco-dropdown"
    :class="{ active: open }"
    @click.stop.prevent
    @mousedown.stop.prevent
  >
    <div
      class="dropdown-label"
      @mousedown="$event.button === 0 && (open = !open)"
      @keydown="keydown"
    >
      <Tooltip :target="labelElement" :text="label" placement="element" />
      <a
        ref="labelElement"
        class="action-label codicon"
        :class="[{ focused }, `codicon-${icon}`]"
        role="button"
        aria-haspopup="true"
        :aria-expanded="open"
        aria-disabled="false"
        :aria-label="label"
        :tabindex="tabindex"
        @focus="emit('focus')"
      />
    </div>
  </div>
  <Dropdown ref="popup" v-model:open="open" :anchor="anchor || null"
    ><Menu :actions="actions" @action="run" @cancel="popup?.close()"
  /></Dropdown>
</template>
