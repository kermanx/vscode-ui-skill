<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import Sash from '../src/components/sash/Sash.vue';
import type { SashEvent, SashHandle, SashState } from '../src/components/sash/types';
import { sashLayout, type SashId } from './SashData';
defineProps<{ theme?:string }>();
const host = ref<HTMLElement>();
const width = ref(380), layout = ref({ ...sashLayout });
const gridHorizontal = ref<SashHandle>(), gridTop = ref<SashHandle>(), gridBottom = ref<SashHandle>(), boundaryLeft = ref<SashHandle>(), boundaryRight = ref<SashHandle>();
const events = ref<object[]>([]), bubbled = ref(0), mounted = ref(true), boundaryEnabled = ref(true);
const forced = ref(new URLSearchParams(location.search).get('state') as SashState | null);
const mainState = computed<SashState>(() => forced.value || (layout.value.main <= 80 ? 'minimum' : layout.value.main >= width.value - 80 ? 'maximum' : 'enabled'));
const starts = new Map<SashId, number>();
const key = (id:SashId) => id === 'main' ? 'main' : id === 'grid-horizontal' ? 'gridY' : id === 'grid-top' || id === 'grid-bottom' ? 'gridX' : id === 'boundary-left' ? 'boundaryLeft' : id === 'boundary-right' ? 'boundaryRight' : 'boundaryBottom';
function record(id:SashId, phase:string, event?:SashEvent) {
  events.value.push({ id, phase, ...(event ? { event } : {}) });
  if (phase === 'start') starts.set(id, layout.value[key(id)]);
  if (phase === 'change' && event) {
    const horizontal = id === 'grid-horizontal' || id === 'boundary-bottom';
    const value = (starts.get(id) ?? 0) + (horizontal ? event.currentY - event.startY : event.currentX - event.startX);
    if (id === 'main') layout.value.main = Math.max(80, Math.min(width.value - 80, value));
    else if (id === 'grid-horizontal') layout.value.gridY = Math.max(24, Math.min(120, value));
    else if (id === 'grid-top' || id === 'grid-bottom') layout.value.gridX = Math.max(40, Math.min(width.value - 40, value));
    else layout.value[key(id)] = value;
  }
  if (phase === 'reset') layout.value[key(id)] = sashLayout[key(id)];
}
watch([layout, events, bubbled], () => { (window as any).fixtureState = { layout:{ ...layout.value }, events:events.value, bubbled:bubbled.value }; }, { deep:true, immediate:true });
let observer:ResizeObserver;
onMounted(() => { observer = new ResizeObserver(() => { width.value = host.value!.querySelector<HTMLElement>('[data-demo="split"]')!.clientWidth; }); observer.observe(host.value!); (window as any).fixtureReady = true; });
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div ref="host" class="specimen button-specimen" data-testid="specimen" @mousedown="bubbled++">
      <div style="position:relative;height:120px;overflow:visible" data-demo="split">
        <div :style="{ position:'absolute', left:'0px', top:'0px', width:`${layout.main}px`, height:'100%', boxSizing:'border-box', padding:'8px', borderRight:'1px solid var(--vscode-sideBarSectionHeader-border)' }">Explorer</div>
        <div :style="{ position:'absolute', left:`${layout.main}px`, top:'0px', right:'0px', height:'100%', padding:'8px', boxSizing:'border-box' }">Editor</div>
        <Sash v-if="mounted" data-sash="main" :position="layout.main" :state="mainState" @drag-start="record('main','start',$event)" @change="record('main','change',$event)" @end="record('main','end')" @reset="record('main','reset')" />
      </div>
      <div style="position:relative;height:144px;overflow:visible" data-demo="grid">
        <div style="position:absolute;inset:0"><div style="position:absolute;left:8px;top:8px">Top left</div><div :style="{ position:'absolute',left:`${layout.gridX + 8}px`,top:'8px' }">Top right</div><div :style="{ position:'absolute',left:'8px',top:`${layout.gridY + 8}px` }">Bottom left</div><div :style="{ position:'absolute',left:`${layout.gridX + 8}px`,top:`${layout.gridY + 8}px` }">Bottom right</div></div>
        <Sash ref="gridHorizontal" data-sash="grid-horizontal" orientation="horizontal" :position="layout.gridY" :state="boundaryEnabled ? 'enabled' : 'disabled'" @drag-start="record('grid-horizontal','start',$event)" @change="record('grid-horizontal','change',$event)" @end="record('grid-horizontal','end')" @reset="record('grid-horizontal','reset')" />
        <Sash ref="gridTop" data-sash="grid-top" :position="layout.gridX" :length="layout.gridY" :linked-sash="gridBottom" :orthogonal-end-sash="gridHorizontal" @drag-start="record('grid-top','start',$event)" @change="record('grid-top','change',$event)" @end="record('grid-top','end')" @reset="record('grid-top','reset')" />
        <Sash ref="gridBottom" data-sash="grid-bottom" :position="layout.gridX" :offset="layout.gridY" :length="144-layout.gridY" :linked-sash="gridTop" :orthogonal-start-sash="gridHorizontal" @drag-start="record('grid-bottom','start',$event)" @change="record('grid-bottom','change',$event)" @end="record('grid-bottom','end')" @reset="record('grid-bottom','reset')" />
      </div>
      <div style="position:relative;height:80px;overflow:visible" data-demo="boundary">
        <div :style="{ position:'absolute',left:`${layout.boundaryLeft}px`,top:'0px',width:`${layout.boundaryRight-layout.boundaryLeft}px`,height:`${layout.boundaryBottom}px`,border:'1px solid var(--vscode-sideBarSectionHeader-border)',boxSizing:'border-box',padding:'8px' }">Orthogonal boundary corners</div>
        <Sash ref="boundaryLeft" data-sash="boundary-left" :position="layout.boundaryLeft" :length="layout.boundaryBottom" @drag-start="record('boundary-left','start',$event)" @change="record('boundary-left','change',$event)" @end="record('boundary-left','end')" @reset="record('boundary-left','reset')" />
        <Sash ref="boundaryRight" data-sash="boundary-right" :position="layout.boundaryRight" :length="layout.boundaryBottom" @drag-start="record('boundary-right','start',$event)" @change="record('boundary-right','change',$event)" @end="record('boundary-right','end')" @reset="record('boundary-right','reset')" />
        <Sash data-sash="boundary-bottom" orientation="horizontal" :position="layout.boundaryBottom" :offset="layout.boundaryLeft" :length="layout.boundaryRight-layout.boundaryLeft" :orthogonal-start-sash="boundaryLeft" :orthogonal-end-sash="boundaryRight" orthogonal-edge="south" @drag-start="record('boundary-bottom','start',$event)" @change="record('boundary-bottom','change',$event)" @end="record('boundary-bottom','end')" @reset="record('boundary-bottom','reset')" />
      </div>
      <iframe title="Embedded content" srcdoc="<body style='margin:0;font:13px sans-serif'>Embedded content</body>" style="height:28px;width:100%;border:0" />
    </div>
    <button class="outside">Move focus outside</button>
    <button class="fixture-state" @click="forced = forced === 'disabled' ? 'enabled' : 'disabled'">Toggle disabled</button>
    <button class="fixture-boundary" @click="boundaryEnabled = !boundaryEnabled">Toggle boundary</button>
    <button class="fixture-unmount" @click="mounted = !mounted">Toggle main sash</button>
  </div>
</template>
