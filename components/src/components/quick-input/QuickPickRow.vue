<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import IconLabel from '../icon-label/IconLabel.vue';
import CheckboxControl from '../checkbox/CheckboxControl.vue';
import KeybindingLabel from '../keybinding-label/KeybindingLabel.vue';
import Toolbar from '../toolbar/Toolbar.vue';
import type { QuickPickRow } from './quickPickModel';
import type { QuickPickItem } from './quickPickTypes';
const props = defineProps<{
  row: QuickPickRow;
  canSelectMany: boolean;
  checked: boolean;
  focusInside: boolean;
}>();
const emit = defineEmits<{
  checked: [checked: boolean];
  button: [id: string];
}>();
const entry = ref<HTMLElement>();
const label = ref<{ element?: HTMLElement }>();
const item = computed(() =>
  props.row.entry.type === 'separator'
    ? undefined
    : (props.row.entry as QuickPickItem),
);
const checkbox = computed(
  () => props.canSelectMany && item.value && item.value.pickable !== false,
);
const actions = computed(() =>
  (props.row.entry.buttons || []).map((button) => ({
    id: button.id,
    label: button.tooltip,
    icon: button.icon,
  })),
);
const os = navigator.platform.includes('Mac')
  ? 'macintosh'
  : navigator.platform.includes('Win')
    ? 'windows'
    : 'linux';
let icon: HTMLDivElement | undefined;
let themeObserver: MutationObserver | undefined;
function updateCallerNodes() {
  const target = label.value?.element;
  if (!target) return;
  if (!icon) {
    icon = document.createElement('div');
    target.prepend(icon);
  }
  const theme =
    target.closest<HTMLElement>('[data-theme]')?.dataset.theme || 'dark';
  const image = item.value?.iconPath;
  icon.className = image
    ? 'quick-input-list-icon'
    : item.value?.icon
      ? `quick-input-list-icon codicon codicon-${item.value.icon}`
      : '';
  const path =
    image &&
    (theme === 'light' || theme === 'hcLight'
      ? image.light || image.dark
      : image.dark);
  icon.style.backgroundImage = path ? `url(${JSON.stringify(path)})` : '';
  icon.style.color = item.value?.iconColor
    ? `var(--vscode-${item.value.iconColor.replaceAll('.', '-')})`
    : '';
  entry.value
    ?.querySelectorAll('.quick-input-list-entry-action-bar .action-label')
    .forEach((element, index) =>
      element.classList.toggle(
        'always-visible',
        !!props.row.entry.buttons?.[index]?.alwaysVisible,
      ),
    );
}
function labelClick(event: MouseEvent) {
  if (checkbox.value && !event.defaultPrevented && !item.value?.disabled)
    emit('checked', !props.checked);
}
watch(
  () => props.row,
  () => nextTick(updateCallerNodes),
  { deep: true },
);
onMounted(() => {
  updateCallerNodes();
  const theme = entry.value?.closest('[data-theme]');
  if (theme) {
    themeObserver = new MutationObserver(updateCallerNodes);
    themeObserver.observe(theme, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }
});
onBeforeUnmount(() => themeObserver?.disconnect());
</script>
<template>
  <div
    ref="entry"
    class="quick-input-list-entry"
    :data-quick-input-id="item?.id"
    :class="{
      'not-pickable': item?.pickable === false,
      'quick-input-list-separator-as-item': row.entry.type === 'separator',
      'quick-input-list-separator-border':
        row.entry.type === 'separator' ||
        (!!row.separator && row.childIndex !== 0),
      'has-actions': !!actions.length,
      'focus-inside': row.entry.type === 'separator' && focusInside,
    }"
  >
    <label class="quick-input-list-label" @click="labelClick">
      <CheckboxControl
        v-if="checkbox"
        compact
        :checked="checked"
        :disabled="item?.disabled"
        :aria-label="row.entry.label"
        @change="(value) => emit('checked', value)"
      />
      <div class="quick-input-list-rows">
        <div class="quick-input-list-row">
          <IconLabel
            ref="label"
            :label="row.entry.label || ''"
            :description="row.entry.description"
            :matches="row.labelHighlights"
            :description-matches="row.descriptionHighlights"
            :italic="item?.italic"
            :strikethrough="item?.strikethrough"
            support-highlights
            support-description-highlights
            support-icons
            label-escape-new-lines
          />
          <div class="quick-input-list-entry-keybinding">
            <!-- Native QuickInputList uses KeybindingLabel without a foreground override. -->
            <KeybindingLabel
              :chords="item?.keybinding"
              :os="os"
              style="color: inherit"
            />
          </div>
        </div>
        <div class="quick-input-list-row">
          <div class="quick-input-list-label-meta">
            <IconLabel
              :label="item?.detail || ''"
              :matches="row.detailHighlights"
              :title="item?.detail ? { value: item.detail } : undefined"
              support-highlights
              support-icons
              label-escape-new-lines
              :style="{ display: item && !item.detail ? 'none' : undefined }"
            />
          </div>
        </div>
      </div>
    </label>
    <div
      class="quick-input-list-separator"
      :style="{ display: row.separator?.label ? undefined : 'none' }"
    >
      {{ row.separator?.label }}
    </div>
    <Toolbar
      class="quick-input-list-entry-action-bar"
      :primary="actions"
      @action="emit('button', $event)"
    />
  </div>
</template>

<style>
/* QuickInputController applies the default foreground to keys, while focused keys inherit the row. */
.quick-input-list .monaco-keybinding > .monaco-keybinding-key {
  color: var(--vscode-keybindingLabel-foreground);
}
</style>
