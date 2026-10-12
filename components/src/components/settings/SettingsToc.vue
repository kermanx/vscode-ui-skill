<!-- Copyright (c) Microsoft Corporation. Licensed under the MIT License. -->
<script setup lang="ts">
import { ref, useId } from 'vue';
import ScrollableElement from '../scrollable-element/ScrollableElement.vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
const props = defineProps<{
  groups: readonly { id: string; label: string; count: number }[];
  height: number;
}>();
const selected = defineModel<string>({ default: '' });
const focused = ref(''),
  root = ref<HTMLElement>();
const uid = useId();
const elements = ref<Record<string, HTMLElement>>({});
function select(id: string) {
  focused.value = id;
  selected.value = id;
  root.value?.focus();
}
function keydown(event: KeyboardEvent) {
  let index = props.groups.findIndex((group) => group.id === focused.value);
  if (event.key === 'ArrowDown')
    index = Math.min(props.groups.length - 1, index + 1);
  else if (event.key === 'ArrowUp') index = Math.max(0, index - 1);
  else if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = props.groups.length - 1;
  else if (event.key === 'Enter' || event.key === ' ') {
    if (focused.value) selected.value = focused.value;
    event.preventDefault();
    return;
  } else return;
  focused.value = props.groups[index]?.id || '';
  selected.value = focused.value;
  event.preventDefault();
  event.stopPropagation();
}
</script>
<template>
  <div
    ref="root"
    class="monaco-list vc-settings-toc-list mouse-support"
    tabindex="0"
    role="tree"
    aria-label="Settings Table of Contents"
    :aria-activedescendant="focused ? `${uid}-${focused}` : undefined"
    @keydown="keydown"
    ><ScrollableElement :height="height" horizontal="hidden"
      ><div
        class="monaco-list-rows"
        :style="{ height: `${groups.length * 22}px` }"
        ><div
          v-for="(group, index) in groups"
          :id="`${uid}-${group.id}`"
          :key="group.id"
          class="monaco-list-row"
          :class="{
            focused: focused === group.id,
            selected: selected === group.id,
          }"
          :style="{
            top: `${index * 22}px`,
            height: '22px',
            lineHeight: '22px',
          }"
          role="treeitem"
          :aria-label="`${group.label}, group`"
          aria-level="1"
          :aria-selected="selected === group.id"
          :aria-setsize="groups.length"
          :aria-posinset="index + 1"
          @click="select(group.id)"
          ><div class="monaco-tl-row"
            ><div class="monaco-tl-indent" style="width: 0" /><div
              class="monaco-tl-twistie"
              style="padding-left: 8px"
            /><div class="monaco-tl-contents"
              ><div
                :ref="
                  (element) => {
                    if (element) elements[group.id] = element as HTMLElement;
                  }
                "
                class="settings-toc-entry"
                >{{ group.label
                }}<DelayedTooltip
                  :target="elements[group.id]"
                  :text="group.label" /></div
              ><div class="settings-toc-count">{{
                group.count ? ` (${group.count})` : ''
              }}</div></div
            ></div
          ></div
        ></div
      ></ScrollableElement
    ></div
  >
</template>
