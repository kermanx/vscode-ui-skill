<script setup lang="ts">
import { computed, ref } from 'vue';
const props = defineProps<{ theme: string }>();
const mode = ref('compare');
const side = ref('left');
const revision = ref(0);
const frames = ref<HTMLIFrameElement[]>([]);
const views = [
  { id: 'compare', label: '并排对照' },
  { id: 'original', label: 'VS Code 原版控件组合' },
  { id: 'replica', label: 'Vue 重写版' },
];
const sources = computed(() => [
  { id: 'original', label: 'VS Code 原版控件组合', url: `./reference/index.html?kind=workbench&theme=${props.theme}&side=${side.value}&demo=true` },
  { id: 'replica', label: 'Vue 重写版', url: `./iframe.html?id=compositions-workbench--specimen&viewMode=story&globals=theme:${props.theme}&side=${side.value}&demo=true` },
]);
function openQuick(kind:string){const visible=frames.value.filter(frame=>!frame.closest('section')?.classList.contains('is-hidden'));(visible.at(-1)?.contentWindow as any)?.fixtureApi?.quickOpen(kind);}
function toggle(part: 'sidebarVisible' | 'panelVisible' | 'statusBarVisible') {
  const first = frames.value.find(frame => !frame.closest('section')?.classList.contains('is-hidden') && (frame.contentWindow as any)?.fixtureReady);
  const api = (first?.contentWindow as any)?.fixtureApi;
  if (!api) return;
  const visible = !api.snapshot().layout[part];
  for (const frame of frames.value) (frame.contentWindow as any)?.fixtureApi?.set({ [part]: visible });
}
</script>

<template>
  <main class="workbench-demo">
    <header class="workbench-demo-toolbar">
      <strong>Classic Workbench</strong>
      <nav aria-label="演示版本">
        <button v-for="view in views" :key="view.id" :aria-pressed="mode === view.id" @click="mode = view.id">{{ view.label }}</button>
      </nav>
      <div class="workbench-demo-actions">
        <button @click="openQuick('files')">快速打开</button>
        <button @click="openQuick('commands')">命令面板</button>
        <button @click="openQuick('line')">跳转行</button>
        <button @click="openQuick('input')">输入</button>
        <button @click="openQuick('choice')">单选</button>
        <button @click="openQuick('multi')">多选</button>
        <button @click="toggle('sidebarVisible')">侧栏</button>
        <button @click="toggle('panelVisible')">底部面板</button>
        <button @click="toggle('statusBarVisible')">状态栏</button>
        <label>侧栏位置 <select v-model="side"><option value="left">左侧</option><option value="right">右侧</option></select></label>
        <button @click="revision++">重置</button>
      </div>
    </header>
    <div class="workbench-demo-frames" :class="{ 'is-compare': mode === 'compare' }">
      <section v-for="source in sources" :class="{ 'is-hidden': mode !== 'compare' && mode !== source.id }" :key="source.id">
        <div class="workbench-demo-caption">{{ source.label }}</div>
        <iframe :key="`${source.id}-${revision}-${source.url}`" ref="frames" :src="source.url" :title="source.label" />
      </section>
    </div>
    <footer>快捷输入按钮操作当前版本（并排时为 Vue）；也可点击任一工作台使用快捷键。点击 Activity Bar 切换侧栏。侧栏使用本地示例数据；SCM、调试、扩展、测试和端口展示控件组合，未接入对应服务。</footer>
  </main>
</template>

<style>
.workbench-demo { display:flex;flex-direction:column;height:100vh;min-height:620px;background:var(--vscode-editor-background); }
.workbench-demo-toolbar { display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:10px 14px;border-bottom:1px solid var(--vscode-panel-border);font-size:12px; }
.workbench-demo-toolbar strong { font-size:13px;font-weight:600; }
.workbench-demo-toolbar nav,.workbench-demo-actions { display:flex;align-items:center;gap:4px; }
.workbench-demo-actions { margin-left:auto;flex-wrap:wrap; }
.workbench-demo-toolbar button,.workbench-demo-toolbar select { font:inherit;color:inherit;background:transparent;border:1px solid transparent;border-radius:3px;padding:5px 8px;cursor:pointer; }
.workbench-demo-toolbar button:hover { background:var(--vscode-toolbar-hoverBackground); }
.workbench-demo-toolbar button[aria-pressed="true"] { background:var(--vscode-inputOption-activeBackground);border-color:var(--vscode-inputOption-activeBorder);color:var(--vscode-inputOption-activeForeground); }
.workbench-demo-toolbar select { background:var(--vscode-dropdown-background);border-color:var(--vscode-dropdown-border); }
.workbench-demo-toolbar label { margin:0 6px; }
.workbench-demo-frames { position:relative;display:flex;flex:1;min-height:0;overflow:auto; }
.workbench-demo-frames section { display:flex;flex-direction:column;flex:1;min-width:620px;min-height:0; }
.workbench-demo-frames section.is-hidden { position:absolute;inset:0;visibility:hidden;pointer-events:none; }
.workbench-demo-frames.is-compare section + section { border-left:1px solid var(--vscode-panel-border); }
.workbench-demo-caption { padding:7px 12px;font-size:11px;color:var(--vscode-descriptionForeground);background:var(--vscode-sideBar-background);border-bottom:1px solid var(--vscode-panel-border); }
.workbench-demo-frames iframe { display:block;flex:1;width:100%;min-height:0;border:0; }
.workbench-demo footer { padding:8px 14px;font-size:11px;color:var(--vscode-descriptionForeground);border-top:1px solid var(--vscode-panel-border); }
</style>
