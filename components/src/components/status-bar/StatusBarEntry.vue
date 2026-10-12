<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref, toRaw } from "vue";
import { splitLabelWithIcons, asClassNameArray } from "../codicon/icons";
import StatusBarTooltip from "./StatusBarTooltip.vue";
import {
  StatusBarShowTooltipCommand,
  StatusBarToggleTooltipCommand,
  type StatusBarCommand,
  type StatusBarEntry,
} from "./types";
const props = defineProps<{
  entry: StatusBarEntry;
  itemClasses?: readonly string[];
  hidden?: boolean;
  hoverBackground?: string;
}>();
const emit = defineEmits<{
  command: [command: string | StatusBarCommand];
  over: [];
  out: [];
}>();
const element = ref<HTMLElement>(),
  label = ref<HTMLElement>(),
  tooltip = ref<InstanceType<typeof StatusBarTooltip>>();
const parts = computed(() =>
  splitLabelWithIcons(
    `${props.entry.showProgress && props.entry.text ? "\u00a0" : ""}${props.entry.text}`,
  ),
);
let pinnedOnPointerDown: boolean | undefined;
function run(command: string | StatusBarCommand | undefined, pointer = false) {
  if (!command) return;
  command = typeof command === "object" ? toRaw(command) : command;
  if (
    command === StatusBarShowTooltipCommand ||
    command === StatusBarToggleTooltipCommand
  ) {
    if (
      command === StatusBarToggleTooltipCommand &&
      (pointer ? pinnedOnPointerDown : tooltip.value?.isSticky())
    )
      tooltip.value?.hide();
    else void tooltip.value?.show(true);
  } else emit("command", command);
  pinnedOnPointerDown = undefined;
}
function keydown(event: KeyboardEvent) {
  if (
    !props.entry.command ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    run(props.entry.command);
  } else if (["Escape", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    tooltip.value?.hide();
  }
}
defineExpose({
  element,
  focus: () => label.value?.focus(),
  hideHover: () => tooltip.value?.hide(),
});
</script>
<template>
  <div
    :id="entry.id"
    ref="element"
    class="statusbar-item"
    :class="[
      entry.alignment || 'left',
      itemClasses,
      {
        'has-command': !!entry.command,
        'has-beak': entry.showBeak,
        'has-background-color': entry.kind && entry.kind !== 'standard',
      },
      entry.kind && entry.kind !== 'standard' ? `${entry.kind}-kind` : '',
    ]"
    :aria-label="entry.ariaLabel"
    :aria-hidden="hidden ? true : undefined"
    :style="{ display: hidden ? 'none' : undefined }"
  >
    <a
      ref="label"
      class="statusbar-item-label"
      :class="{ disabled: !entry.command }"
      :role="entry.role || 'button'"
      tabindex="-1"
      :aria-label="entry.ariaLabel"
      :style="{
        display: entry.text ? undefined : 'none',
        backgroundColor: hoverBackground,
      }"
      @click="run(entry.command, $event.detail > 0)"
      @pointerdown="
        pinnedOnPointerDown =
          $event.button === 0 ? tooltip?.isSticky() : undefined
      "
      @keydown="keydown"
      @mouseover="emit('over')"
      @mouseout="emit('out')"
      ><span
        v-if="entry.showProgress"
        class="codicon"
        :class="
          entry.showProgress === 'syncing'
            ? 'codicon-sync codicon-modifier-spin'
            : 'codicon-loading codicon-modifier-spin'
        "
      /><template v-for="(part, index) in parts" :key="index"
        ><span
          v-if="'icon' in part"
          :class="asClassNameArray({ id: part.icon })"
        />{{ "text" in part ? part.text : "" }}</template
      ></a
    >
    <div class="status-bar-item-beak-container" />
    <StatusBarTooltip
      ref="tooltip"
      :target="element"
      :tooltip="entry.tooltip"
      @command="emit('command', $event)"
    />
  </div>
</template>
