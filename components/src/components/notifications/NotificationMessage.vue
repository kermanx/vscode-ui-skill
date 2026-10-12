<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed } from 'vue';
import type { NotificationItem } from './types';
import { messageParts, linkTitle } from './notificationState';
const props = defineProps<{ message: NotificationItem['message'] }>();
const emit = defineEmits<{ link: [href: string] }>();
const parts = computed(() => messageParts(props.message));
function open(href: string, event: Event) {
  event.preventDefault();
  event.stopPropagation();
  emit('link', href);
}
function keydown(href: string, event: KeyboardEvent) {
  if (
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    (event.key === 'Enter' || event.key === ' ')
  )
    open(href, event);
}
</script>
<template>
  <span
    ><template v-for="(part, index) in parts" :key="index"
      ><template v-if="typeof part === 'string'">{{ part }}</template
      ><a
        v-else
        :href="part.href"
        :title="linkTitle(part)"
        tabindex="0"
        @click="open(part.href, $event)"
        @keydown="keydown(part.href, $event)"
        >{{ part.label }}</a
      ></template
    ></span
  >
</template>
