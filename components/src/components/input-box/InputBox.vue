<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import InputActions from './InputActions.vue';
import InputScrollSurface from './InputScrollSurface.vue';
import type { InputBoxAction, InputBoxMessage, InputBoxSelection } from './types';
const props = withDefaults(defineProps<{
  placeholder?: string;
  tooltip?: string;
  hideHoverOnValueChange?: boolean;
  ariaLabel?: string;
  password?: boolean;
  type?: 'text' | 'password' | 'number';
  step?: string | number;
  multiline?: boolean;
  wrap?: boolean;
  maxHeight?: number;
  readonly?: boolean;
  disabled?: boolean;
  showPlaceholderOnFocus?: boolean;
  message?: InputBoxMessage | null;
  validate?: (value: string) => InputBoxMessage | null;
  actions?: readonly InputBoxAction[];
  history?: readonly string[];
}>(), { placeholder: '', ariaLabel: 'Input', type: 'text', wrap: true, actions: () => [] });
const value = defineModel<string>({ default: '' });
const emit = defineEmits<{ change: [value: string]; focus: [event: FocusEvent]; blur: [event: FocusEvent]; action: [action: InputBoxAction]; keydown: [event: KeyboardEvent] }>();
const element = ref<HTMLElement>(), input = ref<HTMLInputElement | HTMLTextAreaElement>(), actionBar = ref<InstanceType<typeof InputActions>>();
const tooltip = ref<InstanceType<typeof DelayedTooltip>>();
const popup = ref<HTMLElement>(), mirror = ref<HTMLElement>();
const inputHeight = ref<number>();
const contentHeight = ref(0), scrollTop = ref(0);
function syncInputScroll() { scrollTop.value = input.value?.scrollTop ?? 0; }
function setInputScroll(position: number) { if (input.value) { input.value.scrollTop = position; syncInputScroll(); } }
const mirrorText = computed(() => {
  const suffix = value.value.endsWith('\n') ? ' ' : '';
  return (value.value + suffix).replace(/\u000c/g, '') ? value.value + suffix : '\u00a0';
});
function layoutInput() {
  if (props.multiline && mirror.value) {
    contentHeight.value = mirror.value.offsetHeight;
    inputHeight.value = Math.min(contentHeight.value, props.maxHeight ?? Infinity);
    void nextTick(syncInputScroll);
  }
  layoutMessage();
}
watch(value, () => { if (props.hideHoverOnValueChange) tooltip.value?.hide(); });
watch([value, () => props.multiline, () => props.wrap, () => props.maxHeight], () => nextTick(layoutInput));
const focused = ref(false), actionsWidth = ref(0), messagePosition = ref({ left: '0px', top: '0px', width: '0px' });
const validation = ref<InputBoxMessage | null>(null);
const manualMessage = ref<InputBoxMessage | null>();
function validateValue(text: string) { manualMessage.value = undefined; validation.value = props.validate?.(text) ?? null; }
function validateInput() { validateValue(value.value); }
const historyStatus = ref('');
const message = computed(() => manualMessage.value !== undefined ? manualMessage.value : props.validate ? validation.value : props.message);
const messageType = computed(() => message.value?.type || 'error');
const showMessage = computed(() => focused.value && !!message.value?.content && !props.disabled);
const messageStyle = computed(() => ({
  backgroundColor: `var(--vscode-inputValidation-${messageType.value}Background)`,
  color: `var(--vscode-inputValidation-${messageType.value}Foreground)`,
  border: `1px solid var(--vscode-inputValidation-${messageType.value}Border)`,
}));
const boxStyle = computed(() => ({
  backgroundColor: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)',
  overflow: props.multiline ? 'hidden' : undefined,
  border: message.value ? `1px solid var(--vscode-inputValidation-${messageType.value}Border, transparent)` : '1px solid var(--vscode-input-border, transparent)',
}));
const history = ref<string[]>([]);
const historyHint = ref(false);
let historyObserver: MutationObserver | undefined;
function addHistoryHint() {
  if (props.history && history.value.length) historyHint.value = true;
}
let historyIndex = 0;
watch(() => props.history, items => { history.value = [...new Set(items)].slice(-100); historyIndex = history.value.length; }, { immediate: true });
const placeholder = computed(() => {
  if (props.showPlaceholderOnFocus && !focused.value) return '';
  if (!historyHint.value) return props.placeholder;
  return props.placeholder + (props.placeholder.endsWith(')') ? ' or ⇅ for history' : ' (⇅ for history)');
});
const tooltipText = computed(() => props.history && historyHint.value ? props.placeholder + (props.placeholder.endsWith(')') ? ' or ⇅ for history' : ' (⇅ for history)') : props.tooltip ?? props.placeholder);
let lastNotifiedValue = value.value;
function notifyValue(next: string) {
  if (lastNotifiedValue === next) return;
  lastNotifiedValue = next; emit('change', next); validateValue(next);
}
function updateValue(next: string) {
  if (value.value === next) return;
  value.value = next;
  notifyValue(next);
}
function nativeInput(event: Event) {
  const next = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  // A multiline paste can dispatch several native input events with the same
  // final value. The widget reports every native event, while value setters dedupe.
  if (next === lastNotifiedValue) {
    emit('change', next); validateValue(next);
  } else updateValue(next);
}
watch(() => props.disabled, disabled => { if (disabled) { input.value?.blur(); focused.value = false; } });
watch(() => props.validate, validateInput);
watch(() => props.message, () => { manualMessage.value = undefined; });
watch(value, notifyValue, { flush: 'sync' });
function addToHistory() {
  if (!value.value || value.value === (history.value[historyIndex] ?? history.value.at(-1))) return;
  history.value = [...history.value.filter(item => item !== value.value), value.value].slice(-100);
  historyIndex = history.value.length;
}
function navigateHistory(previous: boolean) {
  if (!history.value.includes(value.value)) addToHistory();
  function move() {
    historyIndex = previous ? Math.max(0, historyIndex - 1) : Math.min(history.value.length, historyIndex + 1);
    return history.value[historyIndex];
  }
  let next = move();
  if (next && next === value.value) next = move();
  if (next || !previous) { updateValue(next ?? ''); historyStatus.value = next || 'Cleared Input'; }
}
function keydown(event: KeyboardEvent) {
  emit('keydown', event);
  if (event.defaultPrevented || event.cancelBubble || !props.history || props.readonly || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault(); event.stopPropagation(); navigateHistory(event.key === 'ArrowUp');
  }
}
function layoutMessage() {
  if (!element.value) return;
  const box = element.value.getBoundingClientRect();
  const height = popup.value?.getBoundingClientRect().height ?? 0;
  messagePosition.value = { left: `${Math.min(box.left, Math.max(0, window.innerWidth - box.width))}px`, top: `${box.bottom + height > window.innerHeight && box.top >= height ? box.top - height : box.bottom}px`, width: `${box.width}px` };
}
watch([showMessage, message], () => nextTick(layoutMessage));
function select(range?: InputBoxSelection) {
  input.value?.select();
  if (range && input.value) {
    input.value.setSelectionRange(range.start, range.end);
    if (range.end === input.value.value.length) input.value.scrollLeft = input.value.scrollWidth;
  }
}
function getSelection(): InputBoxSelection | null {
  return input.value?.selectionStart == null ? null : { start: input.value.selectionStart, end: input.value.selectionEnd ?? input.value.selectionStart };
}
async function insertAtCursor(text: string) {
  const start = input.value?.selectionStart, end = input.value?.selectionEnd;
  if (start == null || end == null) return;
  updateValue(value.value.slice(0, start) + text + value.value.slice(end));
  await nextTick(); input.value?.setSelectionRange(start + 1, start + 1); layoutInput();
}
let observer: ResizeObserver;
onMounted(() => {
  validateInput();
  // The history widget observes class mutations, including the empty-state
  // change after a programmatic clear while the input is already blurred.
  historyObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) if (!mutation.target.textContent) addHistoryHint();
  });
  historyObserver.observe(input.value!, { attributeFilter: ['class'] });
  observer = new ResizeObserver(() => {
    actionsWidth.value = element.value?.querySelector<HTMLElement>('.monaco-action-bar')?.offsetWidth ?? 0;
    layoutInput();
  });
  observer.observe(element.value!);
  layoutInput();
  if (actionBar.value?.$el) observer.observe(actionBar.value.$el);
  window.addEventListener('resize', layoutMessage);
  window.addEventListener('scroll', layoutMessage, true);
});
watch(() => props.actions, () => nextTick(() => { actionsWidth.value = element.value?.querySelector<HTMLElement>('.monaco-action-bar')?.offsetWidth ?? 0; }));
onBeforeUnmount(() => { observer?.disconnect(); historyObserver?.disconnect(); window.removeEventListener('resize', layoutMessage); window.removeEventListener('scroll', layoutMessage, true); });
defineExpose({ validate: validateInput, showMessage: (message: InputBoxMessage) => { manualMessage.value = message; }, clearMessage: () => { manualMessage.value = null; }, insertAtCursor, layout: layoutInput, focus: () => input.value?.focus(), blur: () => input.value?.blur(), select, getSelection, addToHistory,
  showPreviousValue: () => navigateHistory(true), showNextValue: () => navigateHistory(false), getHistory: () => [...history.value] });
</script>

<template>
  <InputScrollSurface :enabled="multiline" :height="inputHeight" :content-height="contentHeight" :scroll-top="scrollTop" @scroll="setInputScroll">
  <div ref="element" class="monaco-inputbox" :class="[message ? messageType : 'idle', { 'synthetic-focus': focused }]" :style="boxStyle">
    <div class="ibwrapper"><component :is="multiline ? 'textarea' : 'input'" ref="input" class="input" :class="{ empty: !value }" :type="multiline ? undefined : password ? 'password' : type" :step="multiline ? undefined : step"
      autocorrect="off" autocapitalize="off" spellcheck="false" :wrap="multiline && wrap ? undefined : 'off'"
      :value="value" :placeholder="placeholder" :aria-label="ariaLabel" :aria-invalid="validation ? true : undefined"
      :readonly="readonly" :disabled="disabled" :style="{ backgroundColor: 'inherit', color: 'var(--vscode-input-foreground)', width: `calc(100% - ${actionsWidth}px - var(--vc-input-controls-width, 0px))`, height: multiline && inputHeight !== undefined ? `${inputHeight}px` : undefined }"
      @input="nativeInput" @keydown="keydown" @scroll="syncInputScroll"
      @focus="focused = true; addHistoryHint(); emit('focus', $event)" @blur="focused = false; historyHint = false; emit('blur', $event)" />
      <div v-if="multiline" ref="mirror" class="mirror" :style="{ whiteSpace: wrap ? undefined : 'pre', wordWrap: wrap ? undefined : 'initial', paddingRight: actions.length ? `calc(${actionsWidth}px + var(--vc-input-controls-width, 0px))` : 'var(--vc-input-controls-width, 6px)' }">{{ mirrorText }}</div>
    </div>
    <DelayedTooltip ref="tooltip" :target="input" :text="tooltipText" placement="mouse" />
    <InputActions v-if="actions.length" ref="actionBar" :actions="actions" :label="ariaLabel" @action="emit('action', $event)" />
  </div>
  </InputScrollSurface>
  <div v-if="showMessage" ref="popup" class="vc-input-context-view" :style="messagePosition">
    <div class="monaco-inputbox-container"><span class="monaco-inputbox-message" :class="messageType" :style="messageStyle">{{ message?.content }}</span></div>
  </div>
  <span class="vc-input-alert" role="status" aria-live="polite">{{ historyStatus }}</span>
  <span v-if="showMessage" class="vc-input-alert" role="alert">{{ `${messageType[0]!.toUpperCase()}${messageType.slice(1)}: ${message?.content}` }}</span>
</template>
<style src="./inputBox.css" />
<style>
.vc-input-context-view { position: fixed; z-index: 2575; font-size: 13px; }
.vc-input-alert { position: absolute; left: -999em; width: 1px; height: 1px; overflow: hidden; }
</style>
