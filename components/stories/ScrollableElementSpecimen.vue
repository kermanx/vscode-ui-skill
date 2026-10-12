<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ScrollableElement from '../src/components/scrollable-element/ScrollableElement.vue';
import type { ScrollableEvent, ScrollbarVisibility } from '../src/components/scrollable-element/types';
import { scrollableRows } from './ScrollableElementData';
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search);
const mode = (key: string): ScrollbarVisibility => ['hidden', 'visible'].includes(params.get(key) || '') ? params.get(key) as ScrollbarVisibility : 'auto';
const horizontal = ref(mode('horizontal')), vertical = ref(mode('vertical'));
const main = ref<InstanceType<typeof ScrollableElement>>();
const height = ref(176), rowCount = ref(28), width = ref(760), contentHeight = ref<number>();
const state: Record<string, ScrollableEvent> = {};
function scrolled(id: string, event: ScrollableEvent) { state[id] = event; (window as any).fixtureState = { ...state }; }
function resize() { contentHeight.value = undefined; height.value = 132; rowCount.value = 12; width.value = 580; }
function shrink() { contentHeight.value = undefined; height.value = 176; rowCount.value = 2; width.value = 200; }
function changeModes() { horizontal.value = horizontal.value === 'hidden' ? 'auto' : 'hidden'; vertical.value = vertical.value === 'visible' ? 'auto' : 'visible'; }
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen">
      <ScrollableElement ref="main" data-index="0" :height="height" :horizontal="horizontal" :vertical="vertical" :scroll-by-page="params.get('paged') === 'true'" :shadows="params.get('shadows') !== 'false'" @scroll="scrolled('main', $event)">
        <div :style="{ width: `${width}px`, height: contentHeight === undefined ? undefined : `${contentHeight}px` }"><div v-for="row in scrollableRows.slice(0, rowCount)" :key="row.label" style="display:flex;height:22px;line-height:22px;white-space:nowrap"><span style="width:380px;flex-shrink:0">{{ row.label }}</span><span>{{ row.detail }}</span></div></div>
      </ScrollableElement>
      <ScrollableElement data-index="1" :height="44" horizontal="visible" vertical="hidden" @scroll="scrolled('horizontal', $event)"><div style="width:760px"><div v-for="row in scrollableRows.slice(0, 2)" :key="row.label" style="display:flex;height:22px;line-height:22px;white-space:nowrap"><span style="width:380px;flex-shrink:0">{{ row.label }}</span><span>{{ row.detail }}</span></div></div></ScrollableElement>
      <ScrollableElement data-index="2" :height="132" @scroll="scrolled('outer', $event)">
        <div style="height:22px;line-height:22px">Nested scrolling</div>
        <ScrollableElement data-index="3" :height="66" style="width:260px" :contain-wheel="params.get('contain') === 'true'" @scroll="scrolled('inner', $event)"><div style="width:500px"><div v-for="row in scrollableRows.slice(0, 10)" :key="row.label" style="height:22px;line-height:22px;white-space:nowrap">{{ row.label }} — nested content</div></div></ScrollableElement>
        <div v-for="row in scrollableRows.slice(0, 10)" :key="row.label" style="height:22px;line-height:22px;white-space:nowrap">{{ row.label }} — outer content</div>
      </ScrollableElement>
    </div>
    <button class="outside">Move focus outside</button>
    <button class="fixture-position" @click="main?.setScrollPosition({ scrollTop: 231, scrollLeft: 163 })">Set position</button>
    <button class="fixture-resize" @click="resize">Resize content</button>
    <button class="fixture-shrink" @click="shrink">Shrink content</button>
    <button class="fixture-huge" @click="width = 100000; contentHeight = 100000">Huge content</button>
    <button class="fixture-modes" @click="changeModes">Change modes</button>
  </div>
</template>
