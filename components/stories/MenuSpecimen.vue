<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Menu from '../src/components/menu/Menu.vue';
import { menuActions, longMenuActions } from './menuData';
defineProps<{ theme?: string }>();
const entries = new URLSearchParams(location.search).get('long') === 'true' ? longMenuActions : menuActions;
const actions = ref<string[]>([]), cancels = ref(0);
watch([actions, cancels], () => { (window as any).fixtureState = { actions: actions.value, cancels: cancels.value }; }, { immediate: true, deep: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="width:max-content;position:relative"><Menu :actions="entries" aria-label="File menu" @action="actions.push($event)" @cancel="cancels++" /></div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
