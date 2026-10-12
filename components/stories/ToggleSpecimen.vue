<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Toggle from '../src/components/toggle/Toggle.vue';
defineProps<{ theme?: string }>();
const values = ref([false, true, false, true, false, false, true, false]);
const changes = ref<{ index: number; checked: boolean; viaKeyboard: boolean }[]>([]);
const keys = ref<string[]>([]);
const bubbled = ref(0);
watch([values, changes, keys, bubbled], () => { (window as any).fixtureState = { values: values.value, changes: changes.value, keys: keys.value, bubbled: bubbled.value }; }, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
const options = [
  { title: 'Match Case', icon: 'case-sensitive' }, { title: 'Match Whole Word', icon: 'whole-word' },
  { title: 'Use Regular Expression', icon: 'regex', disabled: true }, { title: 'Preserve Case', icon: 'preserve-case', disabled: true },
  { title: '$(regex) Empty toggle', focusable: false },
];
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen" @click="bubbled++">
      <div v-for="(option, index) in options" :key="index" style="display:flex;align-items:center;min-height:22px" :data-index="index">
        <Toggle v-model:checked="values[index]" v-bind="option" @change="(checked, viaKeyboard) => changes.push({ index, checked, viaKeyboard })" @keydown="keys.push($event.key)" />
      </div>
      <div role="toolbar" aria-label="Find options" style="display:flex;align-items:center;min-height:22px" data-testid="find-options">
        <div v-for="(option, offset) in options.slice(0, 3)" :key="offset" :data-index="offset + 5">
          <Toggle v-model:checked="values[offset + 5]" :title="option.title" :icon="option.icon"
            @change="(checked, viaKeyboard) => changes.push({ index: offset + 5, checked, viaKeyboard })" @keydown="keys.push($event.key)" />
        </div>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
