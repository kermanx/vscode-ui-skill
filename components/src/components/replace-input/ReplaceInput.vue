<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import InputBox from '../input-box/InputBox.vue';
import Toggle from '../toggle/Toggle.vue';
import type { InputBoxMessage, InputBoxSelection } from '../input-box/types';
import type { ReplaceInputOptionsState } from './types';
const props = withDefaults(
  defineProps<{
    ariaLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    showOptions?: boolean;
    focusInputOnOptionClick?: boolean;
    preserveCaseTitleSuffix?: string;
    history?: readonly string[];
    multiline?: boolean;
    wrap?: boolean;
    maxHeight?: number;
    message?: InputBoxMessage | null;
    validate?: (
      value: string,
      options: ReplaceInputOptionsState,
    ) => InputBoxMessage | null;
  }>(),
  {
    ariaLabel: 'Replace',
    placeholder: 'Replace',
    showOptions: true,
    focusInputOnOptionClick: true,
    wrap: false,
    preserveCaseTitleSuffix: '',
  },
);
const value = defineModel<string>({ default: '' });
const preserveCase = defineModel<boolean>('preserveCase', { default: false });
const emit = defineEmits<{
  change: [value: string];
  optionChange: [viaKeyboard: boolean];
  input: [];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
  mousedown: [event: MouseEvent];
  preserveCaseKeydown: [event: KeyboardEvent];
}>();
const inputBox = ref<InstanceType<typeof InputBox>>(),
  controls = ref<HTMLElement>();
const highlight = ref<number>();
const validator = computed(() => {
  const options = { preserveCase: preserveCase.value };
  return props.validate
    ? (text: string) => props.validate!(text, options)
    : undefined;
});
function optionChanged(viaKeyboard: boolean) {
  emit('optionChange', viaKeyboard);
  if (!viaKeyboard && props.focusInputOnOptionClick) inputBox.value?.focus();
  void nextTick(() => inputBox.value?.validate());
}
function navigate(event: KeyboardEvent) {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)
  )
    return;
  const toggle = controls.value?.querySelector<HTMLElement>(
    '.monaco-custom-toggle',
  );
  if (document.activeElement !== toggle) return;
  if (event.key === 'Escape') {
    toggle?.blur();
    inputBox.value?.focus();
  } else toggle?.focus();
  event.preventDefault();
  event.stopPropagation();
}
function isInputEvent(event: Event) {
  return (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  );
}
defineExpose({
  focus: () => inputBox.value?.focus(),
  select: (range?: InputBoxSelection) => inputBox.value?.select(range),
  getSelection: () => inputBox.value?.getSelection(),
  insertAtCursor: (text: string) => inputBox.value?.insertAtCursor(text),
  clear: () => {
    inputBox.value?.clearMessage();
    value.value = '';
    inputBox.value?.focus();
  },
  submit: () => inputBox.value?.addToHistory(),
  getHistory: () => inputBox.value?.getHistory() ?? [],
  showPreviousValue: () => inputBox.value?.showPreviousValue(),
  showNextValue: () => inputBox.value?.showNextValue(),
  validate: () => inputBox.value?.validate(),
  showMessage: (message: InputBoxMessage) =>
    inputBox.value?.showMessage(message),
  clearMessage: () => inputBox.value?.clearMessage(),
  focusPreserveCase: () =>
    controls.value
      ?.querySelector<HTMLElement>('.monaco-custom-toggle')
      ?.focus(),
  highlightOptions: () => {
    highlight.value = highlight.value === 1 ? 0 : 1;
  },
});
</script>
<template>
  <div
    class="monaco-findInput"
    :class="[
      { disabled },
      highlight === undefined ? '' : `highlight-${highlight}`,
    ]"
    :style="{ '--vc-input-controls-width': showOptions ? '22px' : '0px' }"
    @keydown="navigate"
    @keyup="isInputEvent($event) && emit('keyup', $event)"
    @mousedown="isInputEvent($event) && emit('mousedown', $event)"
    @input="isInputEvent($event) && emit('input')"
  >
    <InputBox
      ref="inputBox"
      v-model="value"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      :history="history"
      :validate="validator"
      :message="message"
      :multiline="multiline"
      :wrap="wrap"
      :max-height="maxHeight"
      @change="emit('change', $event)"
      @keydown="emit('keydown', $event)"
    />
    <div
      ref="controls"
      class="controls"
      :style="{ display: showOptions ? 'block' : 'none' }"
    >
      <Toggle
        v-model:checked="preserveCase"
        data-option="preserve"
        :title="`Preserve Case${preserveCaseTitleSuffix}`"
        icon="preserve-case"
        :disabled="disabled"
        @change="(_checked, viaKeyboard) => optionChanged(viaKeyboard)"
        @keydown="emit('preserveCaseKeydown', $event)"
      />
    </div>
  </div>
</template>
<style src="../find-input/findInput.css" />
<style>
[data-theme='light'] .monaco-findInput.disabled {
  background-color: #e1e1e1;
}
[data-theme='dark'] .monaco-findInput.disabled {
  background-color: #333;
}
[data-theme='hcDark'] .monaco-findInput.highlight-0 .controls,
[data-theme='dark'] .monaco-findInput.highlight-0 .controls {
  animation: monaco-findInput-highlight-dark-0 100ms linear 0s;
}
[data-theme='hcDark'] .monaco-findInput.highlight-1 .controls,
[data-theme='dark'] .monaco-findInput.highlight-1 .controls {
  animation: monaco-findInput-highlight-dark-1 100ms linear 0s;
}
</style>
