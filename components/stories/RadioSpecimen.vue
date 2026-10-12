<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Radio from '../src/components/radio/Radio.vue';
import { radioExamples, replacementRadioOptions } from './RadioData';
defineProps<{ theme?: string }>();
const values = ref(radioExamples.map(group => group.selected));
const options = ref(radioExamples.map(group => group.options));
const enabled = ref(false);
const selections = ref<{ group: number; index: number }[]>([]), activations = ref<{ group: number; index: number }[]>([]);
watch([values, selections, activations], () => { (window as any).fixtureState = { values: values.value, selections: selections.value, activations: activations.value }; }, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
function replaceOptions() { options.value[6] = replacementRadioOptions; values.value[6] = 2; }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen">
      <div v-for="(group, index) in radioExamples" :key="index" :data-index="index" style="width:350px;max-width:100%">
        <Radio :options="options[index]" v-model="values[index]" :aria-label="group.label" :segmented="group.segmented" :arrow-key-behavior="group.arrowKeyBehavior"
          :disabled="index === 3 ? !enabled : undefined" @select="selected => selections.push({ group: index, index: selected })" @activate="selected => activations.push({ group: index, index: selected })" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="fixture-replace" @click="replaceOptions">Replace options</button>
      <button class="fixture-select" @click="values[6] = 0">Select first</button>
      <button class="fixture-enable" @click="enabled = !enabled">Toggle enabled</button>
    </div>
  </div>
</template>
