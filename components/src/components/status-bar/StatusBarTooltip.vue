<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  provide,
  ref,
  watch,
} from "vue";
import Hover from "../hover/Hover.vue";
import { hoverDelegateKey, instantHoverKey } from "../tooltip/delegate";
import type { StatusBarCommand, StatusBarTooltip } from "./types";
const props = defineProps<{
  target?: HTMLElement;
  tooltip?: string | StatusBarTooltip;
}>();
const emit = defineEmits<{ command: [command: StatusBarCommand] }>();
const delegate = inject(hoverDelegateKey)!;
const instant = ref(false);
provide(instantHoverKey, instant);
const hover = ref<InstanceType<typeof Hover>>(),
  open = ref(false),
  sticky = ref(false);
const content = computed(() =>
  typeof props.tooltip === "string" ? props.tooltip : props.tooltip?.content,
);
const actions = computed(() =>
  typeof props.tooltip === "object"
    ? props.tooltip.commands.map((command) => ({
        id: command.id,
        label: command.title || "",
      }))
    : [],
);
let pending: ReturnType<typeof setTimeout> | undefined,
  cleanup = () => {},
  mouseDown = false,
  hadWidget = false;
function markHidden() {
  if (hadWidget) delegate.lastHideTime = Date.now();
}
function cancelPending() {
  clearTimeout(pending);
  pending = undefined;
}
function hide() {
  cancelPending();
  markHidden();
  hadWidget = false;
  hover.value?.hide();
  sticky.value = false;
}
async function show(focus = true) {
  hide();
  sticky.value = focus;
  instant.value = Date.now() - delegate.lastHideTime < 200;
  await nextTick();
  await hover.value?.show(focus);
}
function prepare(event: Event) {
  if (pending || mouseDown || !content.value) return;
  if (
    event instanceof FocusEvent &&
    (!event.relatedTarget ||
      (event.relatedTarget as HTMLElement).closest?.(".monaco-hover"))
  )
    return;
  instant.value = Date.now() - delegate.lastHideTime < 200;
  pending = setTimeout(
    () => {
      pending = undefined;
      sticky.value = false;
      open.value = true;
    },
    instant.value ? 0 : navigator.platform.includes("Mac") ? 1500 : 500,
  );
}
watch(
  () => props.target,
  (target) => {
    cleanup();
    hide();
    if (!target) return;
    target.setAttribute("custom-hover", "true");
    const leave = () => {
      mouseDown = false;
      markHidden();
      cancelPending();
    };
    const down = () => {
        mouseDown = true;
        hide();
      },
      up = () => {
        mouseDown = false;
      };
    const blur = (event: FocusEvent) => {
      if (
        !(event.relatedTarget as HTMLElement)?.closest(
          ".workbench-hover-container",
        )
      )
        hide();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    target.addEventListener("mouseover", prepare, true);
    target.addEventListener("focus", prepare, true);
    target.addEventListener("mouseleave", leave, true);
    target.addEventListener("mousedown", down, true);
    target.addEventListener("mouseup", up, true);
    target.addEventListener("blur", blur, true);
    target.addEventListener("keydown", key);
    cleanup = () => {
      target.removeEventListener("mouseover", prepare, true);
      target.removeEventListener("focus", prepare, true);
      target.removeEventListener("mouseleave", leave, true);
      target.removeEventListener("mousedown", down, true);
      target.removeEventListener("mouseup", up, true);
      target.removeEventListener("blur", blur, true);
      target.removeEventListener("keydown", key);
    };
  },
  { immediate: true },
);
function action(id: string) {
  const command =
    typeof props.tooltip === "object" &&
    props.tooltip.commands.find((command) => command.id === id);
  if (command) emit("command", command);
}
onBeforeUnmount(() => {
  markHidden();
  cleanup();
  cancelPending();
});
defineExpose({ show, hide, isSticky: () => open.value && sticky.value });
</script>
<template>
  <Hover
    ref="hover"
    v-model:open="open"
    :target="target || null"
    :content="content"
    position="below"
    compact
    show-pointer
    hide-on-key-down
    :sticky="sticky"
    :trap-focus="sticky"
    :max-height-ratio="0.9"
    :actions="actions"
    @show="hadWidget = true"
    @action="action"
  />
</template>
