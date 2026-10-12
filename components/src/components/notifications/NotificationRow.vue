<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import ActionBar from "../action-bar/ActionBar.vue";
import Button from "../button/Button.vue";
import DropdownButton from "../button/DropdownButton.vue";
import ProgressBar from "../progress-bar/ProgressBar.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import NotificationMessage from "./NotificationMessage.vue";
import NotificationMenuAction from "./NotificationMenuAction.vue";
import {
  hasActiveProgress,
  hasPrimaryActions,
  sourceLabel,
} from "./notificationState";
import type {
  NotificationAction,
  NotificationItem,
  NotificationPosition,
} from "./types";
import type { ActionBarEntry } from "../action-bar/types";
import type { MenuEntry } from "../menu/types";

const props = defineProps<{
  item: NotificationItem;
  expanded: boolean;
  position: NotificationPosition;
  filtered?: boolean;
}>();
const emit = defineEmits<{
  close: [];
  toggle: [];
  action: [action: NotificationAction, primary: boolean];
  link: [href: string];
  filter: [];
}>();
const message = ref<HTMLElement>(),
  source = ref<HTMLElement>();
const overflow = ref(false),
  menu = ref<InstanceType<typeof NotificationMenuAction>>();
const progress = ref<InstanceType<typeof ProgressBar>>();
const controls = new Map<number, { focus(): void }>();
const sourceText = computed(() =>
  props.expanded ? sourceLabel(props.item) : undefined,
);
const primary = computed(() =>
  props.expanded ? props.item.actions?.primary || [] : [],
);
const toolbar = computed<ActionBarEntry[]>(() => {
  const actions: ActionBarEntry[] = [];
  if (props.item.actions?.secondary?.length)
    actions.push({
      id: "configure",
      label: "More Actions...",
      icon: "notifications-configure",
    });
  if (
    !hasPrimaryActions(props.item) &&
    (props.expanded || sourceLabel(props.item) || overflow.value)
  )
    actions.push({
      id: "toggle",
      label: props.expanded ? "Collapse Notification" : "Expand Notification",
      icon: props.expanded
        ? props.position === "top-right"
          ? "notifications-collapse-up"
          : "notifications-collapse"
        : props.position === "top-right"
          ? "notifications-expand-down"
          : "notifications-expand",
    });
  if (!hasActiveProgress(props.item))
    actions.push({
      id: "close",
      label: "Clear Notification",
      icon: "notifications-clear",
    });
  return actions;
});
const secondary = computed<MenuEntry[]>(() => {
  const actions: MenuEntry[] = [];
  if (typeof props.item.source === "object") {
    actions.push({
      id: "__filter",
      label: props.filtered
        ? `Turn On All Notifications from '${props.item.source.label}'`
        : `Turn Off Info and Warning Notifications from '${props.item.source.label}'`,
    });
    if (props.item.actions?.secondary?.length)
      actions.push({ separator: true });
  }
  actions.push(...(props.item.actions?.secondary || []));
  return actions;
});
function runToolbar(id: string) {
  if (id === "close") emit("close");
  else if (id === "toggle") emit("toggle");
  else menu.value?.show();
}
function runSecondary(id: string) {
  if (id === "__filter") emit("filter");
  else {
    const action = props.item.actions?.secondary?.find(
      (action) => action.id === id,
    );
    if (action) emit("action", action, false);
  }
}
function bindControl(value: unknown, index: number) {
  if (value) controls.set(index, value as { focus(): void });
  else controls.delete(index);
}
function buttonsKeydown(event: KeyboardEvent) {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !["ArrowLeft", "ArrowRight"].includes(event.key)
  )
    return;
  const target = (event.target as HTMLElement).closest(
    ".monaco-button-dropdown, .monaco-button",
  );
  const index = [...(event.currentTarget as HTMLElement).children].findIndex(
    (child) => child === target || child.contains(target),
  );
  if (index === -1) return;
  const count = primary.value.length;
  controls
    .get(
      event.key === "ArrowLeft"
        ? index > 0
          ? index - 1
          : count - 1
        : index === count - 1
          ? 0
          : index + 1,
    )
    ?.focus();
  event.preventDefault();
  event.stopPropagation();
}
function runPrimary(action: NotificationAction, event?: Event) {
  event?.preventDefault();
  event?.stopPropagation();
  emit("action", action, true);
}
function runChoice(action: NotificationAction, id: string) {
  const selected = action.menu?.find((item) => item.id === id);
  if (selected) emit("action", selected, true);
}
async function measure() {
  await nextTick();
  overflow.value =
    !hasPrimaryActions(props.item) &&
    !props.expanded &&
    !!message.value &&
    message.value.scrollWidth > message.value.clientWidth;
}
function renderProgress() {
  const bar = progress.value;
  if (!bar) return;
  if (!hasActiveProgress(props.item)) {
    bar.stop().hide();
    return;
  }
  const state = props.item.progress!;
  if (state.infinite) bar.infinite().show();
  else if (
    typeof state.total === "number" ||
    typeof state.worked === "number"
  ) {
    if (typeof state.total === "number" && !bar.hasTotal())
      bar.total(state.total);
    if (typeof state.worked === "number") bar.setWorked(state.worked).show();
  } else bar.done().hide();
}
function middleUp(event: MouseEvent) {
  if (event.button === 1) {
    event.preventDefault();
    event.stopPropagation();
  }
}
function auxiliary(event: MouseEvent) {
  if (event.button === 1 && !hasActiveProgress(props.item)) {
    event.preventDefault();
    event.stopPropagation();
    emit("close");
  }
}
onMounted(() => {
  void measure();
  renderProgress();
});
watch(() => [props.item.message, props.expanded], measure);
watch(() => props.item.progress, renderProgress, { deep: true });
</script>
<template>
  <div
    class="notification-list-item"
    :class="{ expanded }"
    @mouseup="middleUp"
    @auxclick="auxiliary"
  >
    <div class="notification-list-item-details-row">
      <div ref="source" class="notification-list-item-source">
        {{ sourceText ? `Source: ${sourceText}` : "" }}
      </div>
      <div
        class="notification-list-item-buttons-container"
        @keydown="buttonsKeydown"
      >
        <template v-for="(action, index) in primary" :key="action.id">
          <DropdownButton
            v-if="action.menu"
            :ref="(value) => bindControl(value, index)"
            :label="action.label"
            :actions="action.menu"
            :secondary="index > 0"
            title
            @click="runPrimary(action, $event)"
            @action="runChoice(action, $event)"
          />
          <Button
            v-else
            :ref="(value) => bindControl(value, index)"
            :label="action.label"
            :secondary="index > 0"
            title
            @click="runPrimary(action, $event)"
          />
        </template>
      </div>
    </div>
    <div class="notification-list-item-main-row">
      <div
        class="notification-list-item-icon codicon"
        :class="`codicon-${item.severity || 'info'}`"
      />
      <div ref="message" class="notification-list-item-message">
        <NotificationMessage
          :key="String(expanded)"
          :message="item.message"
          @link="emit('link', $event)"
        />
      </div>
      <div class="notification-list-item-toolbar-container">
        <ActionBar
          :actions="toolbar"
          aria-label="Notification Actions"
          @action="runToolbar"
        >
          <template #item="{ entry, tabindex, focused, onFocus }">
            <NotificationMenuAction
              v-if="'id' in entry && entry.id === 'configure'"
              ref="menu"
              :actions="secondary"
              :tabindex="tabindex"
              :focused="focused"
              @focus="onFocus"
              @action="runSecondary"
            />
          </template>
        </ActionBar>
      </div>
    </div>
  </div>
  <ProgressBar ref="progress" :visible="false" />
  <Tooltip
    v-if="overflow"
    :target="message"
    :text="message?.textContent || ''"
  />
  <Tooltip v-if="sourceText" :target="source" :text="sourceText" />
</template>
