<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import InputBox from '../input-box/InputBox.vue';
import Toggle from '../toggle/Toggle.vue';
import type { InputBoxMessage, InputBoxSelection } from '../input-box/types';
import type {
  FindInputEvent,
  FindInputOptionsState,
  FindInputToggle,
} from './types';
const props = withDefaults(
  defineProps<{
    ariaLabel?: string;
    placeholder?: string;
    password?: boolean;
    readonly?: boolean;
    message?: InputBoxMessage | null;
    disabled?: boolean;
    showOptions?: boolean;
    collapsed?: boolean;
    focusInputOnOptionClick?: boolean;
    additionalToggles?: readonly FindInputToggle[];
    history?: readonly string[];
    multiline?: boolean;
    maxHeight?: number;
    wrap?: boolean;
    validate?: (
      value: string,
      options: FindInputOptionsState,
    ) => InputBoxMessage | null;
  }>(),
  {
    ariaLabel: 'Find',
    placeholder: 'Find',
    showOptions: true,
    focusInputOnOptionClick: true,
    additionalToggles: () => [],
    wrap: false,
  },
);
const value = defineModel<string>({ default: '' });
const matchCase = defineModel<boolean>('matchCase', { default: false });
const wholeWord = defineModel<boolean>('wholeWord', { default: false });
const regex = defineModel<boolean>('regex', { default: false });
const activeOptions = defineModel<string[]>('activeOptions', {
  default: () => [],
});
const emit = defineEmits<{
  change: [value: string];
  optionChange: [viaKeyboard: boolean];
  input: [event: FindInputEvent];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
  mousedown: [event: MouseEvent];
}>();
const root = ref<HTMLElement>(),
  controls = ref<HTMLElement>(),
  inputBox = ref<InstanceType<typeof InputBox>>();
const isComposing = ref(false),
  highlight = ref<number>();
const optionsState = computed<FindInputOptionsState>(() => ({
  matchCase: props.showOptions && matchCase.value,
  wholeWord: props.showOptions && wholeWord.value,
  regex: props.showOptions && regex.value,
}));
const validator = computed(() => {
  const state = optionsState.value;
  return props.validate
    ? (text: string) => props.validate!(text, state)
    : undefined;
});
const controlsWidth = computed(() =>
  props.collapsed
    ? 0
    : ((props.showOptions ? 3 : 0) + props.additionalToggles.length) * 22,
);
function optionChanged(viaKeyboard: boolean, common = true) {
  emit('optionChange', viaKeyboard);
  if (!viaKeyboard && props.focusInputOnOptionClick) inputBox.value?.focus();
  if (common) void nextTick(() => inputBox.value?.validate());
}
function changeAdditional(id: string, checked: boolean, viaKeyboard: boolean) {
  activeOptions.value = checked
    ? [...activeOptions.value, id]
    : activeOptions.value.filter((value) => value !== id);
  optionChanged(viaKeyboard, false);
}
function navigate(event: KeyboardEvent) {
  if (
    !props.showOptions ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)
  )
    return;
  const toggles = [
    ...controls.value!.querySelectorAll<HTMLElement>('.monaco-custom-toggle'),
  ];
  const index = toggles.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  if (event.key === 'Escape') {
    toggles[index].blur();
    inputBox.value?.focus();
  } else
    toggles[
      (index + (event.key === 'ArrowRight' ? 1 : toggles.length - 1)) %
        toggles.length
    ].focus();
  event.preventDefault();
  event.stopPropagation();
}
function isInputEvent(event: Event) {
  return (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  );
}
function compositionStart(event: CompositionEvent) {
  if (isInputEvent(event)) isComposing.value = true;
}
function compositionEnd(event: CompositionEvent) {
  if (isInputEvent(event)) {
    isComposing.value = false;
    emit('input', { fromCompositionEnd: true });
  }
}
defineExpose({
  focus: () => inputBox.value?.focus(),
  select: (range?: InputBoxSelection) => inputBox.value?.select(range),
  submit: () => inputBox.value?.addToHistory(),
  getHistory: () => inputBox.value?.getHistory() ?? [],
  showPreviousValue: () => inputBox.value?.showPreviousValue(),
  showNextValue: () => inputBox.value?.showNextValue(),
  insertAtCursor: (text: string) => inputBox.value?.insertAtCursor(text),
  clearMessage: () => inputBox.value?.clearMessage(),
  validate: () => inputBox.value?.validate(),
  isImeSessionInProgress: isComposing,
  focusCaseSensitive: () =>
    controls.value?.querySelector<HTMLElement>('[data-option="case"]')?.focus(),
  focusRegex: () =>
    controls.value
      ?.querySelector<HTMLElement>('[data-option="regex"]')
      ?.focus(),
  highlightOptions: () => {
    highlight.value = highlight.value === 1 ? 0 : 1;
  },
});
</script>
<template>
  <div
    ref="root"
    class="monaco-findInput"
    :class="[
      { disabled },
      highlight === undefined ? '' : `highlight-${highlight}`,
    ]"
    :style="{ '--vc-input-controls-width': `${controlsWidth}px` }"
    @keydown="navigate"
    @keyup="isInputEvent($event) && emit('keyup', $event)"
    @mousedown="isInputEvent($event) && emit('mousedown', $event)"
    @input="
      isInputEvent($event) && emit('input', { fromCompositionEnd: false })
    "
    @compositionstart="compositionStart"
    @compositionend="compositionEnd"
  >
    <InputBox
      ref="inputBox"
      v-model="value"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      :password="password"
      :readonly="readonly"
      :message="message"
      :disabled="disabled"
      :history="history"
      :validate="validator"
      :multiline="multiline"
      :max-height="maxHeight"
      :wrap="wrap"
      @change="emit('change', $event)"
      @keydown="emit('keydown', $event)"
    />
    <div
      ref="controls"
      class="controls"
      :style="{
        display:
          collapsed || (!showOptions && !additionalToggles.length)
            ? 'none'
            : undefined,
      }"
    >
      <template v-if="showOptions">
        <Toggle
          v-model:checked="matchCase"
          data-option="case"
          title="Match Case"
          icon="case-sensitive"
          :disabled="disabled"
          @change="(_checked, viaKeyboard) => optionChanged(viaKeyboard)"
        />
        <Toggle
          v-model:checked="wholeWord"
          data-option="word"
          title="Match Whole Word"
          icon="whole-word"
          :disabled="disabled"
          @change="(_checked, viaKeyboard) => optionChanged(viaKeyboard)"
        />
        <Toggle
          v-model:checked="regex"
          data-option="regex"
          title="Use Regular Expression"
          icon="regex"
          :disabled="disabled"
          @change="(_checked, viaKeyboard) => optionChanged(viaKeyboard)"
        />
      </template>
      <Toggle
        v-for="toggle in additionalToggles"
        :key="toggle.id"
        :checked="activeOptions.includes(toggle.id)"
        :data-option="toggle.id"
        :title="toggle.title"
        :icon="toggle.icon"
        :disabled="disabled"
        @change="
          (checked, viaKeyboard) =>
            changeAdditional(toggle.id, checked, viaKeyboard)
        "
      />
    </div>
  </div>
</template>
<style src="./findInput.css" />
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
