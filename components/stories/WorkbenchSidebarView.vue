<script setup lang="ts">
import { computed, ref } from 'vue';
import SidebarTitle from '../src/components/sidebar-title/SidebarTitle.vue';
import Pane from '../src/components/pane/Pane.vue';
import PaneView from '../src/components/pane-view/PaneView.vue';
import TreeView from '../src/components/tree/TreeView.vue';
import InputBox from '../src/components/input-box/InputBox.vue';
import Button from '../src/components/button/Button.vue';
import { workbenchView } from './WorkbenchViewsData';
import './workbenchViews.css';
const props=defineProps<{id:string;height:number}>();
const config=workbenchView(props.id);
const root=ref<HTMLElement>(), input=ref<InstanceType<typeof InputBox>>();
const filter=ref('');
const expanded=ref(Object.fromEntries(config.sections.map(section=>[section.id,section.expanded!==false])));
const treeExpanded=ref(Object.fromEntries(config.sections.map(section=>[section.id,section.expandedIds || []])));
const selected=ref<Record<string,string[]>>({});
const filterHeight=config.filter ? config.filter.button ? 78 : 42 : 0;
const filtered=computed(()=>config.sections.map(section=>({...section,nodes:props.id==='extensions' && filter.value ? section.nodes.filter(node=>`${node.label} ${node.description}`.toLowerCase().includes(filter.value.toLowerCase())):section.nodes})));
function focus(){if(input.value)input.value.focus();else (root.value?.querySelector<HTMLElement>('.pane.expanded [role="tree"]') || root.value?.querySelector<HTMLElement>('.pane-header'))?.focus();}
defineExpose({focus});
</script>
<template>
  <div ref="root" class="part sidebar workbench-sidebar-view" :data-sidebar-view="id" :style="{height:`${height}px`}">
    <SidebarTitle :title="config.title" :secondary="[{id:'views',label:'Views'}]" />
    <div v-if="config.filter" class="workbench-view-input" :class="{'has-button':config.filter.button}">
      <InputBox ref="input" v-model="filter" :placeholder="config.filter.placeholder" :aria-label="config.filter.label" />
      <Button v-if="config.filter.button" :label="config.filter.button" :disabled="!filter.trim()" />
    </div>
    <PaneView :panes="config.sections" v-model:expanded="expanded" :style="{height:`${Math.max(0,height-35-filterHeight)}px`}">
      <template v-for="section in filtered" #[section.id]="{bodySize,expanded:sectionExpanded,setExpanded}">
        <Pane :title="section.title" :expanded="sectionExpanded" :actions="section.actions" @update:expanded="setExpanded">
          <TreeView :nodes="section.nodes" :height="bodySize" :aria-label="`${config.title} ${section.title}`" v-model:expanded-ids="treeExpanded[section.id]" v-model:selected-ids="selected[section.id]" />
        </Pane>
      </template>
    </PaneView>
  </div>
</template>
