<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import DropdownButton from '../src/components/button/DropdownButton.vue';
import { dropdownActions, dropdownExamples } from './dropdownData';
defineProps<{ theme?: string }>();
const clicks = ref(0), actions = ref<string[]>([]);
watch([clicks, actions], () => { (window as any).fixtureState = { focus: [], selection: [], expanded: [], clicks: clicks.value, escapes: 0, actions: actions.value }; }, { immediate: true, deep: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen">
      <div v-for="(example, index) in dropdownExamples" :key="index" class="button-host" :data-index="index">
        <DropdownButton v-bind="example" :actions="dropdownActions" @click="clicks++" @action="actions.push($event)" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
