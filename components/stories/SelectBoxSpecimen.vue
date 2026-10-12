<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SelectBox from '../src/components/select-box/SelectBox.vue';
import { selectExamples } from './SelectBoxData';
defineProps<{ theme?: string }>();
const values = ref(selectExamples.map(item => item.selected));
const state = { selections: values.value, events: [] as string[] };
onMounted(() => { (window as any).fixtureState = state; (window as any).fixtureReady = true; });
function fixtureProps(example: typeof selectExamples[number]) { const { selected, toolbar, ...props } = example; return props; }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:28px;padding:4px;box-sizing:border-box">
      <div v-for="(example, index) in selectExamples" :key="index" :data-index="index" style="width:184px" :class="{ 'monaco-action-bar': example.toolbar }">
        <SelectBox :class="{ 'action-item': example.toolbar }" v-bind="fixtureProps(example)" v-model="values[index]" @select="state.events.push(`${index}:${$event}`)" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
