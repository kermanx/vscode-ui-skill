<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import Breadcrumbs from '../src/components/breadcrumbs/Breadcrumbs.vue';
import { breadcrumbExamples, breadcrumbEventText } from './BreadcrumbsData';
import type { BreadcrumbItem } from '../src/components/breadcrumbs/types';
defineProps<{ theme?: string }>();
const examples = ref(breadcrumbExamples.map(item => ({...item,items:item.items.map(crumb=>({...crumb}))})));
const widgets = ref<InstanceType<typeof Breadcrumbs>[]>([]);
const state = { events: [] as string[], focus: [] as string[] };
onMounted(async () => { await nextTick(); state.events.length = 0; (window as any).fixtureState = state; (window as any).fixtureBreadcrumbs = widgets.value; (window as any).fixtureSetItems = (index: number, items: BreadcrumbItem[]) => examples.value[index].items = items; (window as any).fixtureReady = true; });
function outside() { document.querySelector<HTMLButtonElement>('.outside')?.focus(); }
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box">
      <div v-for="(example,index) in examples" :key="index" :data-index="index" style="width:300px">
        <Breadcrumbs ref="widgets" v-bind="example" @focus-item="state.events.push(breadcrumbEventText(index,$event))" @select-item="state.events.push(breadcrumbEventText(index,$event))" @focus-change="state.focus.push(`${index}:${$event}`)" @escape="outside" />
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
