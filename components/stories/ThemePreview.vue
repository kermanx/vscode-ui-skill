<script setup lang="ts">
import { computed, ref } from 'vue';
import { createTheme, type ThemeBase } from '../src/theme/createTheme';
import Button from '../src/components/button/Button.vue';
import DropdownButton from '../src/components/button/DropdownButton.vue';
import TreeView from '../src/components/tree/TreeView.vue';
import { treeNodes, expandedNodes } from './data';
const sample = `{
  // Paste the contents of a VS Code color theme here.
  "name": "Plum",
  "type": "dark",
  "colors": {
    "foreground": "#e1d6ed",
    "sideBar.background": "#241d2d",
    "button.background": "#805da9",
    "button.hoverBackground": "#9672bd",
    "button.foreground": "#ffffff",
    "focusBorder": "#be94eb",
    "list.activeSelectionBackground": "#57416e",
    "list.focusOutline": "#be94eb",
    "gitDecoration.modifiedResourceForeground": "#e8b16b",
  }
}`;
const source = ref(sample), base = ref<ThemeBase | ''>('');
const fileName = ref('theme.json'), files = ref<Record<string, string>>({});
const expanded = ref([...expandedNodes]), selected = ref<string[]>([]), message = ref('');
const result = computed(() => {
  try { return { theme: createTheme(source.value, { base: base.value || undefined, fileName: fileName.value, files: files.value }), error: '' }; }
  catch (error) { return { theme: createTheme({}), error: (error as Error).message }; }
});
async function upload(event: Event) {
  const chosen = [...((event.target as HTMLInputElement).files ?? [])];
  if (!chosen.length) return;
  files.value = Object.fromEntries(await Promise.all(chosen.map(async file => [file.webkitRelativePath || file.name, await file.text()])));
  fileName.value = Object.keys(files.value)[0];
  source.value = files.value[fileName.value];
}
function selectFile() { source.value = files.value[fileName.value]; }
</script>

<template>
  <main class="theme-page">
    <h1>导入 VS Code 配色</h1>
    <p>粘贴 JSON / JSONC，或选择主题文件。使用 include 时，把父主题文件一起选入；目录结构复杂时可选择整个主题目录。</p>
    <div class="theme-import-controls">
      <label>基础主题 <select v-model="base" aria-label="Base theme"><option value="">自动识别 type（默认 Dark+）</option><option value="dark">Dark+</option><option value="light">Light+</option><option value="hcDark">High Contrast Dark</option><option value="hcLight">High Contrast Light</option></select></label>
      <label class="gallery-action">选择文件<input aria-label="Theme files" type="file" accept=".json,.jsonc" multiple @change="upload" /></label>
      <label class="gallery-action">选择目录<input aria-label="Theme directory" type="file" webkitdirectory multiple @change="upload" /></label>
      <label v-if="Object.keys(files).length">入口文件 <select v-model="fileName" aria-label="Entry file" @change="selectFile"><option v-for="name in Object.keys(files)" :key="name" :value="name">{{ name }}</option></select></label>
    </div>
    <div class="theme-import-grid">
      <textarea v-model="source" aria-label="Theme JSON" spellcheck="false" />
      <div class="vc-theme theme-preview" :data-theme="result.theme.base" :style="result.theme.style" data-testid="imported-theme">
        <h2>{{ result.theme.name }}</h2>
        <div class="theme-button-row"><Button label="Create File" icon="add" @click="message = 'Create File'" /><DropdownButton label="Open Folder" :actions="[{ id: 'window', label: 'Open in New Window' }]" @action="message = $event" /></div>
        <TreeView :nodes="treeNodes" v-model:expanded-ids="expanded" v-model:selected-ids="selected" aria-label="Theme preview files" @action="(action, node) => message = `${node.label}: ${action.label}`" />
        <p>{{ message || '选择树节点、悬停按钮，检查主题配色。' }}</p>
      </div>
    </div>
    <p v-if="result.error" role="alert">{{ result.error }}</p>
    <p>支持 colors、透明色、type、include。缺省颜色沿用基础主题；不重新计算完整颜色注册表的派生值。tokenColors / semanticTokenColors 属于语法高亮，文件图标主题也需独立处理。</p>
  </main>
</template>

<style>
.theme-page { padding: 28px 36px; }
.theme-page h1 { margin: 0 0 16px; font-size: 24px; font-weight: 500; }
.theme-page p { line-height: 1.7; }
.theme-import-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin: 20px 0; }
.theme-import-controls label { display: flex; align-items: center; gap: 8px; }
.theme-import-controls input[type=file] { max-width: 210px; }
.theme-import-controls select { color-scheme: dark light; font: inherit; }
.theme-import-grid { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(320px, 1fr); gap: 24px; }
.theme-import-grid textarea { resize: vertical; min-height: 450px; color: inherit; background: transparent; border: 1px solid var(--vscode-button-secondaryBorder, var(--vscode-contrastBorder)); padding: 16px; font: 12px/1.6 monospace; tab-size: 2; }
.theme-preview { padding: 20px; border: 1px solid var(--vscode-button-secondaryBorder, var(--vscode-contrastBorder)); }
.theme-preview h2 { font-size: 16px; font-weight: 500; margin: 0 0 20px; }
.theme-button-row { display: flex; align-items: start; gap: 12px; margin-bottom: 24px; }
.theme-button-row > * { width: 184px; }
.theme-page [role=alert] { color: var(--vscode-list-errorForeground); }
@media(max-width:850px) { .theme-import-grid { grid-template-columns: 1fr; } }
</style>
