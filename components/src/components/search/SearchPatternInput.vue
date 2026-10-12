<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import InputBox from '../input-box/InputBox.vue';
import Toggle from '../toggle/Toggle.vue';
const props = defineProps<{
  kind: 'include' | 'exclude';
  width: number;
  changedFilesAvailable?: boolean;
  history?: readonly string[];
}>();
const value = defineModel<string>({ default: '' });
const onlyOpenEditors = defineModel<boolean>('onlyOpenEditors', {
  default: false,
});
const onlyChangedFiles = defineModel<boolean>('onlyChangedFiles', {
  default: false,
});
const useIgnoreFiles = defineModel<boolean>('useIgnoreFiles', {
  default: true,
});
const emit = defineEmits<{
  submit: [triggeredOnType: boolean];
  cancel: [];
  options: [];
}>();
const input = ref<InstanceType<typeof InputBox>>();
const label = computed(() =>
  props.kind === 'include' ? 'files to include' : 'files to exclude',
);
const controlsWidth = computed(() => (props.kind === 'include' ? 44 : 22));
function key(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    input.value?.addToHistory();
    emit('submit', false);
  } else if (event.key === 'Escape') emit('cancel');
}
function option(
  kind: 'open' | 'changed' | 'ignore',
  checked: boolean,
  viaKeyboard: boolean,
) {
  if (kind === 'open' && checked) onlyChangedFiles.value = false;
  else if (kind === 'changed' && checked) onlyOpenEditors.value = false;
  emit('options');
  if (!viaKeyboard) input.value?.focus();
}
watch(
  () => props.changedFilesAvailable,
  (enabled) => {
    if (!enabled) onlyChangedFiles.value = false;
  },
);
defineExpose({
  focus: () => input.value?.focus(),
  select: () => input.value?.select(),
});
</script>
<template>
  <div class="file-types" :class="kind === 'include' ? 'includes' : 'excludes'">
    <h4>{{ label }}</h4>
    <div class="monaco-findInput" @keyup="key">
      <InputBox
        ref="input"
        v-model="value"
        :style="{ width: `${width - 28 - controlsWidth - 2}px` }"
        :aria-label="label"
        :placeholder="`e.g. *.ts, src/**/${kind}`"
        :show-placeholder-on-focus="true"
        :history="history || []"
        @change="emit('submit', true)"
      />
      <div class="controls">
        <template v-if="kind === 'include'"
          ><Toggle
            v-model:checked="onlyChangedFiles"
            icon="edit-code"
            title="Search only in Changed Files (Source Control)"
            :disabled="!changedFilesAvailable"
            @change="
              (checked, keyboard) => option('changed', checked, keyboard)
            " /><Toggle
            v-model:checked="onlyOpenEditors"
            icon="book"
            title="Search only in Open Editors"
            @change="
              (checked, keyboard) => option('open', checked, keyboard)
            " /></template
        ><Toggle
          v-else
          v-model:checked="useIgnoreFiles"
          class="useExcludesAndIgnoreFiles"
          icon="exclude"
          title="Use Exclude Settings and Ignore Files"
          @change="(checked, keyboard) => option('ignore', checked, keyboard)"
        />
      </div>
    </div>
  </div>
</template>
