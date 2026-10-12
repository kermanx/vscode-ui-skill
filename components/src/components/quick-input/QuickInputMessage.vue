<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed } from 'vue';
import { asClassNameArray, splitLabelWithIcons } from '../codicon/icons';
const props = defineProps<{ text: string }>();
const emit = defineEmits<{ link: [href: string] }>();
const parts = computed(() => {
  const result: (
    | { text: string }
    | { icon: string }
    | { label: string; href: string; title: string; tabIndex: number }
  )[] = [];
  const regex =
    /\[([^\]]+)\]\(((?:https?:\/\/|command:|file:)[^\)\s]+)(?: (["'])(.+?)(\3))?\)/gi;
  let start = 0;
  let tabIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(props.text))) {
    if (start < match.index)
      result.push(...splitLabelWithIcons(props.text.slice(start, match.index)));
    const [, label, href, , title] = match;
    result.push({
      label,
      href,
      title:
        title ||
        (href.startsWith('command:')
          ? `Click to execute command '${href.substring(8)}'`
          : href),
      tabIndex: tabIndex++,
    });
    start = match.index + match[0].length;
  }
  if (start < props.text.length)
    result.push(...splitLabelWithIcons(props.text.slice(start)));
  return result;
});
function key(event: KeyboardEvent, href: string) {
  if (
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    ['Enter', ' '].includes(event.key)
  ) {
    event.preventDefault();
    event.stopPropagation();
    emit('link', href);
  }
}
</script>
<template>
  <template v-for="(part, index) in parts" :key="index"
    ><a
      v-if="'href' in part"
      :href="part.href"
      :title="part.title"
      :tabindex="part.tabIndex"
      style="text-decoration: underline"
      @click.stop.prevent="emit('link', part.href)"
      @keydown="key($event, part.href)"
      >{{ part.label }}</a
    ><span
      v-else-if="'icon' in part"
      :class="asClassNameArray({ id: part.icon })"
    /><template v-else>{{ part.text }}</template></template
  >
</template>
