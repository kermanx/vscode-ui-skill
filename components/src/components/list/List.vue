<script setup lang="ts">
/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
import { ref } from "vue";
import "../action-bar/actionbar.css";
import ListBase from "./ListBase.vue";
import ActionBar from "../action-bar/ActionBar.vue";
import type { ListItem } from "./types";
import type { ContextMenuAnchor } from "../context-menu/types";
const props = withDefaults(
  defineProps<{
    items: readonly ListItem[];
    ariaLabel?: string;
    height?: number;
    multiple?: boolean;
  }>(),
  { ariaLabel: "List", height: 264, multiple: true },
);
const selected = defineModel<string[]>("selectedIds", { default: () => [] });
const emit = defineEmits<{
  focusChange: [id: string | undefined];
  contextmenu: [
    item: ListItem | undefined,
    event: MouseEvent | KeyboardEvent,
    anchor?: ContextMenuAnchor,
  ];
  action: [id: string, item: ListItem, event: Event];
}>();
const base = ref<InstanceType<typeof ListBase>>();
defineExpose({
  focus: () => base.value?.focus(),
  reveal: (id: string) => base.value?.reveal(id),
  setFocus: (id?: string) => base.value?.setFocus(id),
});
</script>
<template>
  <div class="open-editors">
    <ListBase
      ref="base"
      v-bind="props"
      v-model:selected-ids="selected"
      @focus-change="emit('focusChange', $event)"
      @contextmenu="
        (item, event, anchor) => emit('contextmenu', item, event, anchor)
      "
      ><template #default="{ item }">
        <ActionBar
          :actions="item.actions || []"
          :aria-label="`Actions for ${item.label}`"
          @action="(id, event) => emit('action', id, item, event)"
        />
        <div
          class="monaco-icon-label open-editor vc-list-resource"
          :class="{
            italic: item.italic,
            strikethrough: item.decoration?.strikethrough,
          }"
          :data-decoration="item.decoration?.badge"
          :style="
            item.decoration?.color
              ? {
                  '--vc-decoration-color': `var(--vscode-${item.decoration.color.replaceAll('.', '-')})`,
                }
              : undefined
          "
        >
          <div
            v-if="item.icon"
            class="monaco-icon-label-iconpath codicon"
            :class="`codicon-${item.icon}`"
            style="
              background-repeat: no-repeat;
              background-position: center;
              background-size: contain;
            "
          />
          <div class="monaco-icon-label-container">
            <span class="monaco-icon-name-container"
              ><a class="label-name">{{ item.label }}</a></span
            ><span
              v-if="item.description"
              class="monaco-icon-description-container"
              ><span class="label-description">{{
                item.description
              }}</span></span
            >
          </div>
        </div>
      </template></ListBase
    >
  </div>
</template>
<style src="./upstream/iconlabel.css" />
<style src="./upstream/openeditors.css" />
