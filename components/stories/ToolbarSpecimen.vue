<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Toolbar from '../src/components/toolbar/Toolbar.vue';
import TreeView from '../src/components/tree/TreeView.vue';
import { toolbarExamples, toolbarTreeNodes } from './ToolbarData';
import '../src/components/toolbar/upstream/part.css';
import '../src/components/toolbar/upstream/sidebarpart.css';
import '../src/components/toolbar/upstream/paneview.css';
defineProps<{ theme?: string }>();
const actions = ref<string[]>([]), visibility = ref<string[]>([]), selection = ref<string[]>([]);
watch([actions, visibility, selection], () => { (window as any).fixtureState = { actions: actions.value, visibility: visibility.value, selection: selection.value }; }, { immediate: true, deep: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme monaco-workbench fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:20px">
      <template v-for="item in toolbarExamples" :key="item.id">
        <div v-if="item.id === 'title'" class="part sidebar" :data-case="item.id">
          <div class="title"><div class="title-label"><h2>Explorer</h2></div><div class="title-actions">
            <Toolbar v-bind="item" @action="actions.push(`${item.id}:${$event}`)" @visibility="visibility.push(`${item.id}:${$event}`)" />
          </div></div>
        </div>
        <div v-else-if="item.id === 'panel'" class="monaco-pane-view" :data-case="item.id" style="height:88px">
          <div class="pane expanded">
            <div class="pane-header expanded actions-always-visible"><span class="codicon codicon-chevron-down" /><span class="title">Project files</span><div class="actions">
              <Toolbar v-bind="item" @action="actions.push(`${item.id}:${$event}`)" @visibility="visibility.push(`${item.id}:${$event}`)" />
            </div></div>
            <div class="pane-body"><TreeView :nodes="toolbarTreeNodes" :height="66" aria-label="Project files" v-model:selected-ids="selection" /></div>
          </div>
        </div>
        <div v-else :data-case="item.id" style="height:26px">
          <Toolbar v-bind="item" @action="actions.push(`${item.id}:${$event}`)" @visibility="visibility.push(`${item.id}:${$event}`)" />
        </div>
      </template>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
