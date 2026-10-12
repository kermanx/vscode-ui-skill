<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { HoverTarget } from '../hover/types';
import Hover from '../hover/Hover.vue';
const props = withDefaults(
  defineProps<{
    target?: HTMLElement;
    text?: string;
    delay?: number;
    placement?: 'element' | 'mouse';
    stripIcons?: boolean;
  }>(),
  { placement: 'element', stripIcons: false },
);
const content = computed(() =>
  !props.stripIcons
    ? props.text || ''
    : (props.text || '').replace(
        /(\s)?(\\)?\$\([A-Za-z0-9-]+(?:~[A-Za-z]+)?\)(\s)?/g,
        (match, before, escaped, after) =>
          escaped ? match : before || after || '',
      ),
);
const anchor = ref<HoverTarget>(),
  shownText = ref('');
const open = ref(false),
  hover = ref<InstanceType<typeof Hover>>();
let pending: ReturnType<typeof setTimeout> | undefined,
  leaving: ReturnType<typeof setTimeout> | undefined,
  cleanup = () => {};
function cancel() {
  clearTimeout(pending);
  clearTimeout(leaving);
  pending = undefined;
  leaving = undefined;
  hover.value?.hide();
}
function over(event: MouseEvent) {
  clearTimeout(leaving);
  if (pending || open.value || !content.value) return;
  shownText.value = content.value;
  anchor.value = {
    targetElements: [props.target!],
    x: props.placement === 'mouse' ? event.clientX + 10 : undefined,
  };
  pending = setTimeout(
    () => {
      pending = undefined;
      open.value = true;
    },
    props.delay ?? (navigator.platform.includes('Mac') ? 1500 : 500),
  );
}
function leave() {
  if (pending) leaving = setTimeout(cancel, 200);
}
watch(
  () => props.target,
  (target) => {
    cleanup();
    cancel();
    if (!target) return;
    target.addEventListener('mouseover', over);
    target.addEventListener('mouseleave', leave);
    target.addEventListener('click', cancel);
    const down = () => {
      if (pending) cancel();
    };
    document.addEventListener('mousedown', down);
    window.addEventListener('blur', cancel);
    cleanup = () => {
      target.removeEventListener('mouseover', over);
      target.removeEventListener('mouseleave', leave);
      target.removeEventListener('click', cancel);
      document.removeEventListener('mousedown', down);
      window.removeEventListener('blur', cancel);
    };
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  cleanup();
  cancel();
});
defineExpose({ hide: cancel });
</script>
<template>
  <Hover
    ref="hover"
    v-model:open="open"
    :target="anchor || null"
    :content="shownText"
    compact
    :show-pointer="placement === 'element'"
  />
</template>
