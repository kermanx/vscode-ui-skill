<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import ActionBar from '../src/components/action-bar/ActionBar.vue';
import { actionBarActions, actionBarCases } from './actionBarData';
defineProps<{ theme?: string }>();
const actions = ref<string[]>([]), cancels = ref(0);
watch([actions, cancels], () => { (window as any).fixtureState = { actions: actions.value, cancels: cancels.value }; }, { immediate: true, deep: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:20px">
      <div v-for="item in actionBarCases" :key="item.id" :data-case="item.id" style="width:300px">
        <ActionBar :actions="actionBarActions" :aria-label="item.label" :orientation="item.orientation" :focus-only-enabled-items="item.focusOnlyEnabledItems" :prevent-loop-navigation="item.preventLoopNavigation"
          @action="actions.push(`${item.id}:${$event}`)" @cancel="cancels++" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
