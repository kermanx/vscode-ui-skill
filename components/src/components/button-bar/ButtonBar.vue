<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { ref, type ComponentPublicInstance } from 'vue';
import Button from '../button/Button.vue';
import DropdownButton from '../button/DropdownButton.vue';
import type { ButtonBarItem } from './types';
const props = withDefaults(
  defineProps<{
    items: readonly ButtonBarItem[];
    alignment?: 'horizontal' | 'vertical';
  }>(),
  { alignment: 'horizontal' },
);
const emit = defineEmits<{
  click: [id: string, event?: MouseEvent | KeyboardEvent];
  action: [id: string, actionId: string];
}>();
const element = ref<HTMLElement>();
const controls = new Map<string, { focus: () => void }>();
function bindControl(
  value: Element | ComponentPublicInstance | null,
  id: string,
) {
  if (value) controls.set(id, value as unknown as { focus: () => void });
  else controls.delete(id);
}
function focus(index = 0) {
  const item = props.items[index];
  if (item) controls.get(item.id)?.focus();
}
function keydown(event: KeyboardEvent) {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !element.value
  )
    return;
  const previous = props.alignment === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
  const next = props.alignment === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  if (event.key !== previous && event.key !== next) return;
  // Only button roots participate; an open dropdown menu is a separate control.
  const roots = [...element.value.children].filter((child) =>
    child.matches(
      '.monaco-button, .monaco-description-button, .monaco-button-dropdown',
    ),
  );
  const index = roots.findIndex((root) => root.contains(event.target as Node));
  if (index === -1) return;
  focus(
    event.key === previous
      ? index > 0
        ? index - 1
        : props.items.length - 1
      : index === props.items.length - 1
        ? 0
        : index + 1,
  );
  event.preventDefault();
  event.stopPropagation();
}
function descriptionParts(text: string) {
  const parts: { text?: string; icon?: string[] }[] = [];
  const regex = /(\\)?\$\(([A-Za-z0-9-]+(?:~[A-Za-z]+)?)\)/g;
  let start = 0,
    match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (start < match.index)
      parts.push({ text: text.substring(start, match.index) });
    start = match.index + match[0].length;
    if (match[1]) parts.push({ text: `$(${match[2]})` });
    else {
      const [icon, modifier] = match[2].split('~');
      parts.push({
        icon: [
          'codicon',
          `codicon-${icon}`,
          ...(modifier ? [`codicon-modifier-${modifier}`] : []),
        ],
      });
    }
  }
  if (start < text.length) parts.push({ text: text.substring(start) });
  return parts;
}
defineExpose({ focus });
</script>
<template>
  <div ref="element" class="vc-button-bar" @keydown="keydown">
    <template v-for="item in items" :key="item.id">
      <DropdownButton
        v-if="item.actions"
        :ref="(value) => bindControl(value, item.id)"
        :label="item.label"
        :actions="item.actions"
        :secondary="item.secondary"
        :disabled="item.disabled"
        :aria-label="item.ariaLabel"
        :include-primary="item.includePrimary"
        @click="emit('click', item.id, $event)"
        @action="emit('action', item.id, $event)"
      />
      <div
        v-else-if="item.description !== undefined"
        class="monaco-description-button"
      >
        <Button
          :ref="(value) => bindControl(value, item.id)"
          :label="item.label"
          :icon="item.icon"
          :secondary="item.secondary"
          :small="item.small"
          :disabled="item.disabled"
          :aria-label="item.ariaLabel"
          @click="emit('click', item.id, $event)"
        />
        <div class="monaco-button-description"
          ><template
            v-for="(part, index) in descriptionParts(item.description)"
            :key="index"
            ><span v-if="part.icon" :class="part.icon" /><template v-else>{{
              part.text
            }}</template></template
          ></div
        >
      </div>
      <Button
        v-else
        :ref="(value) => bindControl(value, item.id)"
        :label="item.label"
        :icon="item.icon"
        :secondary="item.secondary"
        :small="item.small"
        :disabled="item.disabled"
        :aria-label="item.ariaLabel"
        @click="emit('click', item.id, $event)"
      />
    </template>
  </div>
</template>
