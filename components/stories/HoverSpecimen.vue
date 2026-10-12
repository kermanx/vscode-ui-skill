<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Hover from '../src/components/hover/Hover.vue';
import Tooltip from '../src/components/tooltip/Tooltip.vue';
import { hoverFixtureOptions } from './HoverData';
defineProps<{ theme?: string }>();
const options = hoverFixtureOptions(), target = ref<HTMLElement>(), hover = ref<InstanceType<typeof Hover>>(), tooltip = ref<InstanceType<typeof Tooltip>>();
const nestedTarget = ref<HTMLElement>(), nestedHover = ref<InstanceType<typeof Hover>>();
const state = { actions: [] as string[], visibility: [] as boolean[] };
function show(focus = true) { (options.tooltip ? tooltip.value : hover.value)?.show(focus); }
onMounted(() => { (window as any).fixtureState = state; (window as any).showHover = show; (window as any).hideHover = () => (options.tooltip ? tooltip.value : hover.value)?.hide(); (window as any).showNestedHover = () => nestedHover.value?.show(true); (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="height:300px;position:relative">
      <button ref="target" class="hover-target" style="position:absolute;left:110px;top:110px;width:120px;height:26px" @click="!options.tooltip && show()">Hover target</button>
      <Tooltip v-if="options.tooltip" ref="tooltip" :target="target" :text="options.content" :delay="options.delay" :placement="options.placement" :actions="options.actions" @action="state.actions.push($event)" @show="state.visibility.push(true)" @hide="state.visibility.push(false)"><template v-if="options.html" #content><div><button v-if="options.nested" ref="nestedTarget" class="nested-target" @click="nestedHover?.show(true)">Nested target</button><p>Rendered <strong>HTML</strong> and <code>code</code>.</p><a href="#details" @click.prevent="state.actions.push('link')">Read details</a></div></template></Tooltip>
      <Hover v-else ref="hover" :target="target || null" :content="options.content" :position="options.position" :alignment="options.alignment" :show-pointer="options.pointer" :compact="options.compact" :actions="options.actions" :sticky="options.sticky" :force-position="options.force" :hide-on-hover="options.hideOnHover" trap-focus @action="state.actions.push($event)" @show="state.visibility.push(true)" @hide="state.visibility.push(false)"><template v-if="options.html"><div><button v-if="options.nested" ref="nestedTarget" class="nested-target" @click="nestedHover?.show(true)">Nested target</button><p>Rendered <strong>HTML</strong> and <code>code</code>.</p><a href="#details" @click.prevent="state.actions.push('link')">Read details</a></div></template></Hover>
      <Hover v-if="options.nested" ref="nestedHover" :target="nestedTarget || null" position="right" trap-focus><div><p>Nested hover content.</p><button class="nested-inside">Keep parent open</button></div></Hover>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
