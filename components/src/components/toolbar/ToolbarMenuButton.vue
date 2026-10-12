<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Tooltip from '../tooltip/Tooltip.vue';
import Dropdown from '../dropdown/Dropdown.vue';
import Menu from '../menu/Menu.vue';
import type { MenuEntry } from '../menu/types';
const props = defineProps<{
  actions: readonly MenuEntry[];
  label: string;
  icon: string;
  tabindex: number;
  focused: boolean;
  alignment: 'left' | 'right';
}>();
const emit = defineEmits<{
  action: [id: string];
  focus: [];
  visibility: [visible: boolean];
}>();
const labelElement = ref<HTMLElement>(),
  anchor = ref<HTMLElement>(),
  portal = ref<HTMLElement>(),
  open = ref(false);
const dropdown = ref<InstanceType<typeof Dropdown>>();
watch(open, (value) => emit('visibility', value), { flush: 'sync' });
onMounted(() => {
  portal.value =
    anchor.value?.closest<HTMLElement>('.vc-theme') || document.body;
});
function keydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    event.stopPropagation();
    open.value = !open.value;
  }
}
function run(id: string) {
  dropdown.value?.close();
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
        :class="[`codicon-${icon}`, { focused }]"
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
  <Teleport v-if="portal" :to="portal">
    <Dropdown
      ref="dropdown"
      v-model:open="open"
      :anchor="anchor || null"
      :alignment="alignment"
    >
      <Menu :actions="actions" @action="run" @cancel="dropdown?.close()" />
    </Dropdown>
  </Teleport>
</template>
