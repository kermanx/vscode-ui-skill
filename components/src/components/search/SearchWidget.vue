<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import FindInput from '../find-input/FindInput.vue';
import ReplaceInput from '../replace-input/ReplaceInput.vue';
import ActionBar from '../action-bar/ActionBar.vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import type { InputBoxMessage } from '../input-box/types';
const props = withDefaults(
  defineProps<{
    width: number;
    searchOnType?: boolean;
    searchDelay?: number;
    replaceEnabled?: boolean;
    searchHistory?: readonly string[];
    replaceHistory?: readonly string[];
  }>(),
  { searchOnType: true, searchDelay: 300 },
);
const query = defineModel<string>('query', { default: '' });
const replacement = defineModel<string>('replacement', { default: '' });
const matchCase = defineModel<boolean>('matchCase', { default: false });
const wholeWord = defineModel<boolean>('wholeWord', { default: false });
const regex = defineModel<boolean>('regex', { default: false });
const preserveCase = defineModel<boolean>('preserveCase', { default: false });
const replaceShown = defineModel<boolean>('replaceShown', { default: true });
const emit = defineEmits<{
  submit: [triggeredOnType: boolean, delay: number];
  cancel: [focus: boolean];
  replaceAll: [];
  change: [];
  options: [];
  blur: [];
  replaceState: [active: boolean];
}>();
const find = ref<InstanceType<typeof FindInput>>(),
  replace = ref<InstanceType<typeof ReplaceInput>>(),
  bar = ref<InstanceType<typeof ActionBar>>(),
  toggle = ref<HTMLElement>(),
  element = ref<HTMLElement>();
const enabled = ref(props.replaceEnabled);
watch(
  () => props.replaceEnabled,
  (value) => (enabled.value = value),
);
const active = computed(() => replaceShown.value && enabled.value);
watch(active, (value) => emit('replaceState', !!value));
const actions = computed(() => [
  {
    id: 'replaceAll',
    label: enabled.value
      ? 'Replace All'
      : 'Replace All (Submit Search to Enable)',
    icon: 'replace-all',
    disabled: !enabled.value,
  },
]);
function validate(value: string): InputBoxMessage | null {
  if (!value || !regex.value) return null;
  try {
    new RegExp(value, 'u');
    return null;
  } catch (error) {
    return { type: 'error', content: (error as Error).message };
  }
}
async function submit(triggeredOnType = false, delay = 0) {
  await nextTick();
  find.value?.validate();
  if (!validate(query.value)) emit('submit', triggeredOnType, delay);
}
async function changed() {
  await nextTick();
  find.value?.clearMessage();
  enabled.value = false;
  emit('change');
  if (props.searchOnType) {
    let multiplier = 1;
    if (regex.value) {
      try {
        const count =
          `
\t\t\t\t\t\t\t\t~!@#$%^&*()_+
\t\t\t\t\t\t\t\t\`1234567890-=
\t\t\t\t\t\t\t\tqwertyuiop[]\\
\t\t\t\t\t\t\t\tQWERTYUIOP{}|
\t\t\t\t\t\t\t\tasdfghjkl;'
\t\t\t\t\t\t\t\tASDFGHJKL:"
\t\t\t\t\t\t\t\tzxcvbnm,./
\t\t\t\t\t\t\t\tZXCVBNM<>? `.match(new RegExp(query.value, 'ug'))?.length ?? 0;
        multiplier = count < 50 ? 1 : count < 100 ? 5 : 10;
      } catch {
        return;
      }
    }
    submit(true, props.searchDelay * multiplier);
  }
}
function plain(event: KeyboardEvent) {
  return !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}
function key(event: KeyboardEvent, which: 'find' | 'replace') {
  if (
    event.key === 'Enter' &&
    event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.shiftKey
  ) {
    (which === 'find' ? find.value : replace.value)?.insertAtCursor('\n');
    event.preventDefault();
    return;
  }
  if (event.key === 'Enter' && plain(event)) {
    if (which === 'find') find.value?.submit();
    submit();
    event.preventDefault();
  } else if (event.key === 'Escape' && plain(event) && which === 'find') {
    emit('cancel', true);
    event.preventDefault();
  } else if (
    event.key === 'Tab' &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    if (which === 'replace' && event.shiftKey) find.value?.focus();
    else if (!event.shiftKey) {
      if (which === 'find' && replaceShown.value) replace.value?.focus();
      else find.value?.focusCaseSensitive();
    } else return;
    event.preventDefault();
  } else if (
    (event.key === 'PageUp' || event.key === 'PageDown') &&
    plain(event) &&
    which === 'find'
  ) {
    const input = event.target as HTMLTextAreaElement;
    const index = event.key === 'PageUp' ? 0 : input.value.length;
    input.setSelectionRange(index, index);
    event.preventDefault();
  }
}
function optionKeys(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const target = (event.target as HTMLElement).dataset.option;
  if (event.key !== 'Tab') return;
  if (target === 'case' && event.shiftKey && replaceShown.value)
    replace.value?.focus();
  else if (target === 'regex' && !event.shiftKey && replaceShown.value)
    replace.value?.focusPreserveCase();
  else if (target === 'preserve') {
    if (event.shiftKey) find.value?.focusRegex();
    else if (active.value) bar.value?.focus();
    else emit('blur');
  } else if (
    (event.target as HTMLElement).closest('.monaco-action-bar') &&
    event.shiftKey
  )
    find.value?.focusRegex();
  else return;
  event.preventDefault();
  event.stopPropagation();
}
function toggleKey(event: KeyboardEvent) {
  if (!plain(event)) return;
  if (event.key === 'Enter' || event.key === ' ') {
    replaceShown.value = !replaceShown.value;
    event.preventDefault();
    event.stopPropagation();
  } else if (event.key === 'Escape') {
    toggle.value?.blur();
    event.preventDefault();
    event.stopPropagation();
  }
}
let historyTimer: ReturnType<typeof setTimeout> | undefined;
function replacementChanged() {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(() => replace.value?.submit(), 500);
  emit('change');
}
onBeforeUnmount(() => clearTimeout(historyTimer));
defineExpose({
  focus: (select = true, focusReplace = false) => {
    const target =
      focusReplace && replaceShown.value ? replace.value : find.value;
    target?.focus();
    if (select) target?.select();
  },
  focusReplace: () => replace.value?.focus(),
  focusRegex: () => find.value?.focusRegex(),
  focusPreserve: () => replace.value?.focusPreserveCase(),
  focusReplaceAll: () => bar.value?.focus(),
  select: () => find.value?.select(),
  submit,
  complete: () => {
    enabled.value = props.replaceEnabled;
  },
  isReplaceActive: active,
});
</script>
<template>
  <div
    ref="element"
    class="search-widget"
    style="position: relative"
    @keydown="optionKeys"
  >
    <a
      ref="toggle"
      class="monaco-button toggle-replace-button codicon"
      :class="replaceShown ? 'codicon-chevron-down' : 'codicon-chevron-right'"
      role="button"
      tabindex="0"
      aria-label="Toggle Replace"
      :aria-expanded="replaceShown"
      @click="replaceShown = !replaceShown"
      @keydown="toggleKey"
    />
    <DelayedTooltip :target="toggle" text="Toggle Replace" />
    <div class="search-container input-box">
      <FindInput
        ref="find"
        v-model="query"
        v-model:match-case="matchCase"
        v-model:whole-word="wholeWord"
        v-model:regex="regex"
        aria-label="Search: Type Search Term and press Enter to search"
        placeholder="Search"
        multiline
        wrap
        :max-height="134"
        :history="searchHistory || []"
        :validate="validate"
        @change="changed"
        @keydown="key($event, 'find')"
        @option-change="emit('options')"
      />
    </div>
    <div class="replace-container" :class="{ disabled: !replaceShown }">
      <div class="replace-input">
        <ReplaceInput
          ref="replace"
          v-model="replacement"
          v-model:preserve-case="preserveCase"
          :style="{ width: `${width - 56}px` }"
          aria-label="Replace: Type replace term and press Enter to preview"
          placeholder="Replace"
          multiline
          wrap
          :max-height="134"
          :history="replaceHistory || []"
          @change="replacementChanged"
          @keydown="key($event, 'replace')"
          @option-change="emit('change')"
        />
      </div>
      <ActionBar ref="bar" :actions="actions" @action="emit('replaceAll')" />
    </div>
  </div>
</template>
<style src="../button/button.css" />
