<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import Button from '../src/components/button/Button.vue';
import TreeView from '../src/components/tree/TreeView.vue';
import { buttons, treeNodes, expandedNodes, largeNodes } from './data';

const props = defineProps<{ kind: 'button' | 'tree'; theme?: string; large?: boolean; multiple?: boolean; expandOnLabel?: boolean }>();
const expanded = ref(props.large ? largeNodes.map(n => n.id) : [...expandedNodes]);
const selected = ref<string[]>([]);
const focused = ref<string>();
const clicks = ref(0), escapes = ref(0);
const actions = ref<string[]>([]);
const nodes = computed(() => props.large ? largeNodes : treeNodes);
const state = computed(() => ({ focus: focused.value ? [focused.value] : [], selection: selected.value, expanded: expanded.value, clicks: clicks.value, escapes: escapes.value, actions: actions.value }));
watch(state, value => { (window as any).fixtureState = value; }, { immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>

<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div v-if="kind === 'button'" class="specimen button-specimen" data-testid="specimen">
      <div v-for="(button, index) in buttons" :key="index" class="button-host">
        <Button v-bind="button" :data-index="index" @click="clicks++" @escape="escapes++" />
      </div>
    </div>
    <div v-else class="specimen tree-specimen" data-testid="specimen">
      <TreeView :nodes="nodes" aria-label="Project files" :multiple="multiple ?? true" :expand-on-label="expandOnLabel"
        v-model:expanded-ids="expanded" v-model:selected-ids="selected" @focus-change="focused = $event" @action="(action, node) => actions = [...actions, `${node.id}:${action.id}`]" />
    </div>
    <button class="outside" @click="() => {}">Move focus outside</button>
  </div>
</template>
