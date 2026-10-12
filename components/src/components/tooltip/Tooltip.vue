<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
} from 'vue';
import { hoverDelegateKey, instantHoverKey } from './delegate';
import Hover from '../hover/Hover.vue';
import type { HoverAction, HoverTarget } from '../hover/types';
const props = withDefaults(
  defineProps<{
    target?: HTMLElement | null;
    text?: string;
    delay?: number;
    placement?: 'mouse' | 'element';
    actions?: readonly HoverAction[];
  }>(),
  { placement: 'mouse', actions: () => [] },
);
const delegate = inject(hoverDelegateKey, undefined);
const instant = ref(false);
provide(instantHoverKey, instant);
let hadWidget = false;
function markHidden() {
  if (delegate && hadWidget) delegate.lastHideTime = Date.now();
}
function shown() {
  hadWidget = true;
  emit('show');
}
function hidden() {
  emit('hide');
}
const emit = defineEmits<{ action: [id: string]; show: []; hide: [] }>();
const wrapper = ref<HTMLElement>(),
  hover = ref<InstanceType<typeof Hover>>(),
  open = ref(false),
  anchor = ref<HoverTarget>();
const element = computed(
  () =>
    props.target ||
    (wrapper.value?.firstElementChild as HTMLElement | undefined),
);
let timer: ReturnType<typeof setTimeout> | undefined,
  mouseDown = false,
  cleanup = () => {},
  cleanupPending = () => {};
function cancelPending() {
  clearTimeout(timer);
  timer = undefined;
  cleanupPending();
  cleanupPending = () => {};
}
function hide() {
  cancelPending();
  markHidden();
  hadWidget = false;
  hover.value?.hide();
}
async function show(focus = false) {
  hide();
  await nextTick();
  if (!element.value) return;
  anchor.value = { targetElements: [element.value] };
  await nextTick();
  await hover.value?.show(focus);
}
function prepare(event: MouseEvent | FocusEvent) {
  if (timer || mouseDown || !element.value) return;
  if (
    event instanceof FocusEvent &&
    (!event.relatedTarget ||
      (event.relatedTarget as HTMLElement)?.closest?.('.monaco-hover') ||
      ['INPUT', 'TEXTAREA'].includes(element.value.tagName))
  )
    return;
  anchor.value = { targetElements: [element.value] };
  const move = (e: MouseEvent) => {
    if (props.placement === 'mouse' && anchor.value) anchor.value.x = e.x + 10;
  };
  if (event instanceof MouseEvent) move(event);
  const pendingTarget = element.value;
  pendingTarget.addEventListener('mousemove', move);
  cleanupPending = () => pendingTarget.removeEventListener('mousemove', move);
  instant.value = !!delegate && Date.now() - delegate.lastHideTime < 200;
  timer = setTimeout(
    async () => {
      cancelPending();
      await nextTick();
      open.value = true;
    },
    instant.value
      ? 0
      : (props.delay ?? (navigator.platform.includes('Mac') ? 1500 : 500)),
  );
}
function attach() {
  cleanup();
  hide();
  if (!element.value) return;
  const target = element.value;
  target.setAttribute('custom-hover', 'true');
  target.removeAttribute('title');
  const over = (event: Event) => prepare(event as MouseEvent);
  const focus = (event: Event) => prepare(event as FocusEvent);
  const down = () => {
      mouseDown = true;
      hide();
    },
    up = () => {
      mouseDown = false;
    };
  const leave = () => {
    mouseDown = false;
    markHidden();
    cancelPending();
  };
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open.value) hide();
  };
  const blur = (event: FocusEvent) => {
    if (
      !(event.relatedTarget as HTMLElement)?.closest(
        '.workbench-hover-container',
      )
    )
      hide();
  };
  target.addEventListener('mouseover', over, true);
  target.addEventListener('focus', focus, true);
  target.addEventListener('mousedown', down, true);
  target.addEventListener('mouseup', up, true);
  target.addEventListener('mouseleave', leave, true);
  target.addEventListener('blur', blur, true);
  target.addEventListener('keydown', escape);
  cleanup = () => {
    target.removeAttribute('custom-hover');
    target.removeEventListener('mouseover', over, true);
    target.removeEventListener('focus', focus, true);
    target.removeEventListener('mousedown', down, true);
    target.removeEventListener('mouseup', up, true);
    target.removeEventListener('mouseleave', leave, true);
    target.removeEventListener('blur', blur, true);
    target.removeEventListener('keydown', escape);
  };
}
onMounted(attach);
watch(element, attach);
onBeforeUnmount(() => {
  cleanup();
  cancelPending();
});
defineExpose({
  show,
  hide,
  focus: () => hover.value?.focus(),
  layout: () => hover.value?.layout(),
});
</script>
<template>
  <span v-if="!target" ref="wrapper" style="display: contents"><slot /></span>
  <Hover
    ref="hover"
    v-model:open="open"
    :target="anchor || null"
    :content="text"
    position="below"
    compact
    :show-pointer="placement === 'element'"
    :actions="actions"
    hide-on-key-down
    @action="emit('action', $event)"
    @show="shown"
    @hide="hidden"
    ><template v-if="$slots.content" #default><slot name="content" /></template
  ></Hover>
</template>
