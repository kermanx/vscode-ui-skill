<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from 'vue';
import FindInput from '../find-input/FindInput.vue';
import Toolbar from '../toolbar/Toolbar.vue';
import ProgressBar from '../progress-bar/ProgressBar.vue';
import QuickInputMessage from './QuickInputMessage.vue';
import CheckboxControl from '../checkbox/CheckboxControl.vue';
import CountBadge from '../count-badge/CountBadge.vue';
import Button from '../button/Button.vue';
import type { QuickPickShellState } from './quickPickShell';
import type { QuickInputHideReason, QuickInputProps } from './types';
const props = withDefaults(defineProps<QuickInputProps & { picker?: QuickPickShellState }>(), {
  enabled: true,
  busy: false,
  ignoreFocusOut: false,
  severity: 'ignore',
  buttons: () => [],
});
const open = defineModel<boolean>('open', { default: false });
const value = defineModel<string>('value', { default: '' });
const emit = defineEmits<{
  accept: [value: string];
  hide: [reason: QuickInputHideReason];
  button: [id: string];
  link: [href: string];
  change: [value: string];
  keydown: [event: KeyboardEvent];
  toggleAll: [checked: boolean];
  focusList: [];
  opened: [];
}>();
const root = ref<HTMLElement>();
const input = ref<InstanceType<typeof FindInput>>();
const progress = ref<InstanceType<typeof ProgressBar>>();
const prefix = `vc-quick-input-${useId()}-`;
const width = ref(600);
const left = ref(0);
const maxListHeight = ref(440);
let active = false;
let disposed = false;
let lifecycle = 0;
let previousFocus: HTMLElement | undefined;
let blurTimer: number | undefined;
let busyTimer: number | undefined;
let observer: ResizeObserver | undefined;
const stepText = computed(() =>
  props.step
    ? `${props.step}${props.totalSteps ? `/${props.totalSteps}` : ''}`
    : '',
);
const titleText = computed(() =>
  props.title
    ? `${props.title}${stepText.value ? ` (${stepText.value})` : ''}`
    : stepText.value || '\u00a0',
);
const showTitle = computed(
  () =>
    !!props.title ||
    !!props.step ||
    props.backButton ||
    props.buttons.length > 0,
);
const showDescription = computed(() => !!props.description || (!props.picker && !!props.step));
const descriptionBelow = computed(() => !props.picker || !props.picker.hideInput || (props.picker.canSelectMany && !props.picker.hideCheckAll));
const inputLabel = computed(
  () =>
    props.ariaLabel ||
    (props.placeholder
      ? `${props.placeholder}${props.title ? ` - ${props.title}` : ''}`
      : props.title || (props.picker ? 'Type to narrow down results.' : 'input')),
);
const message = computed(
  () =>
    props.validationMessage ||
    (props.picker ? props.prompt || '' : props.prompt
      ? `${props.prompt} (Press 'Enter' to confirm or 'Escape' to cancel)`
      : "Press 'Enter' to confirm your input or 'Escape' to cancel"),
);
const inputMessage = computed(() =>
  props.severity === 'ignore'
    ? undefined
    : { type: props.severity, content: '' },
);
const messageStyle = computed(() =>
  props.severity === 'ignore'
    ? {}
    : {
        color: `var(--vscode-inputValidation-${props.severity}Foreground)`,
        backgroundColor: `var(--vscode-inputValidation-${props.severity}Background)`,
        border: `1px solid var(--vscode-inputValidation-${props.severity}Border)`,
        marginBottom: '-2px',
      },
);
const leftActions = computed(() =>
  props.backButton
    ? [{ id: 'back', label: 'Back', icon: 'quick-input-back' }]
    : [],
);
const rightActions = computed(() =>
  props.buttons.map((button) => ({
    id: button.id,
    label: button.tooltip,
    icon: button.icon,
  })),
);
function element() {
  return root.value?.querySelector<HTMLInputElement>('.quick-input-box input');
}
function layout() {
  const parent = root.value?.parentElement;
  if (parent) {
    width.value = Math.min(parent.clientWidth * 0.62, 600);
    maxListHeight.value = Math.floor(parent.clientHeight * 0.4 / 44) * 44 + 6;
    left.value = Math.round(parent.clientWidth * 0.5 - width.value / 2);
  }
}
function clearBusyTimer() {
  if (busyTimer !== undefined) {
    clearTimeout(busyTimer);
    busyTimer = undefined;
  }
}
function updateBusy() {
  if (!active) return;
  if (props.busy) {
    if (
      busyTimer === undefined &&
      !progress.value?.getContainer()?.classList.contains('infinite')
    )
      busyTimer = window.setTimeout(() => {
        busyTimer = undefined;
        if (active) {
          progress.value?.infinite();
          progress.value?.getContainer()?.removeAttribute('aria-hidden');
        }
      }, 800);
  } else {
    clearBusyTimer();
    progress.value?.stop();
    progress.value?.getContainer()?.setAttribute('aria-hidden', 'true');
  }
}
function focus() {
  if (props.picker?.hideInput) emit('focusList');
  else input.value?.focus();
}
function select() {
  input.value?.select(
    props.valueSelection
      ? { start: props.valueSelection[0], end: props.valueSelection[1] }
      : undefined,
  );
}
function inputChanged(next: string) {
  if (next !== value.value) {
    value.value = next;
    emit('change', next);
  }
}
function accept() {
  emit('accept', value.value);
}
function hide(reason: QuickInputHideReason = 'other') {
  if (!active) return;
  const closingLifecycle = ++lifecycle;
  const returnFocus = previousFocus;
  const restore = !!root.value?.contains(document.activeElement) && (reason !== 'blur' || document.hasFocus());
  active = false;
  clearBusyTimer();
  window.removeEventListener('keydown', keydown);
  open.value = false;
  emit('hide', reason);
  void nextTick(() => {
    if (closingLifecycle !== lifecycle) return;
    if (!disposed && open.value) {
      void beginOpen();
      return;
    }
    if (restore) {
      let target = returnFocus;
      while (target && !target.offsetParent)
        target = target.parentElement ?? undefined;
      if (target?.offsetParent) target.focus();
    }
    previousFocus = undefined;
  });
}
function keydown(event: KeyboardEvent) {
  if (
    !active ||
    event.defaultPrevented ||
    event.isComposing ||
    !root.value?.contains(event.target as Node)
  )
    return;
  emit('keydown', event);
  if (event.defaultPrevented) return;
  const mac = navigator.userAgent.includes('Macintosh');
  if (event.key === 'Enter' && (!event.metaKey || (mac && !event.shiftKey))) {
    event.preventDefault();
    event.stopPropagation();
    accept();
  } else if (
    event.key === 'Escape' &&
    !event.shiftKey &&
    (!event.metaKey || mac)
  ) {
    event.preventDefault();
    event.stopPropagation();
    hide();
  }
}
function focusIn(event: FocusEvent) {
  if (blurTimer !== undefined) {
    clearTimeout(blurTimer);
    blurTimer = undefined;
  }
  if (
    event.relatedTarget instanceof HTMLElement &&
    !root.value?.contains(event.relatedTarget)
  )
    previousFocus = event.relatedTarget;
}
function focusOut() {
  if (blurTimer !== undefined) clearTimeout(blurTimer);
  blurTimer = window.setTimeout(() => {
    blurTimer = undefined;
    if (active) {
      if (!props.ignoreFocusOut) hide('blur');
      previousFocus = undefined;
    }
  }, 0);
}
async function beginOpen() {
  if (disposed) return;
  const openingLifecycle = ++lifecycle;
  const focused = document.activeElement as HTMLElement;
  if (
    !previousFocus ||
    (focused !== document.body && !root.value?.contains(focused))
  )
    previousFocus = focused;
  active = true;
  clearBusyTimer();
  await nextTick();
  if (!active || openingLifecycle !== lifecycle) return;
  layout();
  progress.value?.stop();
  progress.value?.getContainer()?.setAttribute('aria-hidden', 'true');
  const target = element();
  target?.setAttribute('aria-describedby', `${prefix}message`);
  target?.setAttribute('aria-controls', `${prefix}list`);
  window.addEventListener('keydown', keydown);
  focus();
  select();
  updateBusy();
  emit('opened');
}
watch(
  open,
  (value) => {
    if (value) void beginOpen();
    else if (active) hide();
  },
  { immediate: true },
);
watch(() => props.busy, updateBusy);
watch(
  () => props.valueSelection,
  () => {
    if (active) void nextTick(select);
  },
);
onMounted(() => {
  layout();
  observer = new ResizeObserver(layout);
  if (root.value?.parentElement) observer.observe(root.value.parentElement);
});
onBeforeUnmount(() => {
  disposed = true;
  if (active) hide();
  clearBusyTimer();
  if (blurTimer !== undefined) clearTimeout(blurTimer);
  observer?.disconnect();
  window.removeEventListener('keydown', keydown);
});
function syncActiveDescendant() {
  const target = element();
  if (!target || document.activeElement !== target || !props.picker) return;
  for (const [name, value] of Object.entries({ 'aria-activedescendant': props.picker.activeDescendant, 'aria-haspopup': props.picker.activeDescendant ? 'listbox' : undefined, 'aria-autocomplete': props.picker.activeDescendant ? 'list' : undefined })) {
    if (value) target.setAttribute(name, value); else target.removeAttribute(name);
  }
}
function inputKeydown(event: KeyboardEvent) {
  if (props.picker && !['Shift','Control','Alt','Meta'].includes(event.key)) {
    for (const name of ['aria-activedescendant','aria-haspopup','aria-autocomplete']) element()?.removeAttribute(name);
  }
}
watch(() => props.picker?.activeDescendant, () => nextTick(syncActiveDescendant));
defineExpose({ hide, accept, focus, getInput: element, getRoot: () => root.value });
</script>
<template>
  <div
    ref="root"
    v-show="open"
    class="quick-input-widget show-file-icons"
    :class="{ 'show-checkboxes': picker?.canSelectMany, 'hidden-input': picker?.hideInput && !description }"
    tabindex="-1"
    :style="{
      width: `${width}px`,
      left: `${left}px`,
      top: '0px',
      backgroundColor: 'var(--vscode-quickInput-background)',
      color: 'var(--vscode-quickInput-foreground)',
      border: '1px solid var(--vscode-widget-border)',
    }"
    @focus.capture="focusIn"
    @focusout="focusOut"
    @focus.self="focus"
  >
    <div
      class="quick-input-titlebar"
      :style="{
        display: showTitle ? undefined : 'none',
        backgroundColor: 'var(--vscode-quickInputTitle-background)',
      }"
    >
      <Toolbar
        class="quick-input-left-action-bar"
        :primary="leftActions"
        @action="enabled && emit('button', $event)"
      />
      <div class="quick-input-title">{{ titleText }}</div>
      <Toolbar
        class="quick-input-right-action-bar"
        :primary="rightActions"
        @action="enabled && emit('button', $event)"
      />
    </div>
    <div class="quick-input-header">
      <CheckboxControl v-if="picker && picker.canSelectMany && !picker.hideCheckAll" compact :checked="picker.allVisibleChecked" :disabled="!enabled" aria-label="Toggle all checkboxes" @change="(checked, viaKeyboard) => { emit('toggleAll', checked); if (!viaKeyboard) input?.focus(); }" />
      <div class="quick-input-description" :style="{ display: showDescription && !descriptionBelow ? undefined : 'none' }">
        {{ description }}
      </div>
      <div class="quick-input-and-message" :style="{ display: picker?.hideInput ? 'none' : undefined }">
        <div class="quick-input-filter">
          <div class="quick-input-box">
            <FindInput
              ref="input"
              :model-value="value"
              :show-options="false"
              :placeholder="placeholder || ''"
              :aria-label="inputLabel"
              :password="password"
              :readonly="!enabled"
              :message="inputMessage"
              @update:model-value="inputChanged"
              @keydown="inputKeydown"
            />
          </div>
          <div v-if="picker" class="quick-input-visible-count" aria-live="polite" aria-atomic="true"><CountBadge :count="picker.visibleCount" count-format="{0} Results" /></div>
          <div v-if="picker?.canSelectMany && !picker.hideCountBadge" class="quick-input-count" aria-live="polite"><CountBadge :count="picker.selectedCount" count-format="{0} Selected" /></div>
        </div>
        <div
          :id="`${prefix}message`"
          class="quick-input-message"
          :style="{ ...messageStyle, display: picker && !message ? 'none' : undefined }"
        >
          <QuickInputMessage :text="message" @link="emit('link', $event)" />
        </div>
      </div>
      <Toolbar class="quick-input-inline-action-bar" :primary="[]" />
      <div v-if="picker?.showOk" class="quick-input-action"><Button :label="picker.okLabel" :disabled="!enabled" @click="accept" /></div>
    </div>
    <ProgressBar ref="progress" class="quick-input-progress" :style="{ display: picker?.hideInput && !description ? 'none' : undefined }" />
    <div class="quick-input-html-widget" tabindex="-1" />
    <div
      class="quick-input-description"
      :style="{ display: showDescription && descriptionBelow ? undefined : 'none' }"
    >
      {{ description }}
    </div>
    <div v-if="!picker" class="quick-input-list" style="display: none">
      <div :id="`${prefix}list`" role="listbox" aria-label="Quick Input" />
    </div>
    <slot :list-id="`${prefix}list`" :max-height="maxListHeight" />
  </div>
</template>
<style src="./quickInput.css" />
