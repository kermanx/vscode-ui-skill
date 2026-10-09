<script setup lang="ts">
import { computed, ref } from 'vue';
const props = defineProps<{ kind: 'button' | 'tree' | 'dropdown'; theme: string }>();
const revision = ref(0), large = ref(false), expandOnLabel = ref(false), multiple = ref(true);
const params = computed(() => `theme=${props.theme}&kind=${props.kind}&large=${large.value}&expandOnLabel=${expandOnLabel.value}&multiple=${multiple.value}`);
const vueUrl = computed(() => `./iframe.html?id=components-${({ tree: 'tree-view', button: 'button', dropdown: 'dropdown-button' })[props.kind]}--specimen&viewMode=story&globals=theme:${props.theme}&args=large:${large.value};expandOnLabel:${expandOnLabel.value};multiple:${multiple.value}`);
</script>

<template>
  <main class="review-page">
    <div class="eyebrow">CLASSIC WORKBENCH / COMPONENT STUDY</div>
    <header class="review-header">
      <div><h1>{{ ({ button: 'Button', tree: 'Tree View', dropdown: 'Dropdown Button' })[kind] }}</h1><p>同一份数据，两套独立实现。左侧运行克隆源码，右侧运行 Vue。</p></div>
      <button class="gallery-action" @click="revision++">Reset both</button>
    </header>
    <div v-if="kind === 'tree'" class="review-options">
      <label><input type="checkbox" v-model="large" /> 10,100 个节点</label>
      <label><input type="checkbox" v-model="multiple" /> 多选</label>
      <label><input type="checkbox" v-model="expandOnLabel" /> 点击标签展开</label>
    </div>
    <div class="comparison-grid">
      <section><div class="frame-heading"><strong>VS Code 原版</strong><span>114d61e88947</span></div>
        <iframe :key="`original-${revision}-${params}`" :src="`./reference/index.html?${params}`" title="VS Code original" />
      </section>
      <section><div class="frame-heading"><strong>Vue + UnoCSS</strong><span>复刻实现</span></div>
        <iframe :key="`vue-${revision}-${vueUrl}`" :src="vueUrl" title="Vue replica" />
      </section>
    </div>
    <div class="review-notes">
      <section><h2>复核操作</h2>
        <p v-if="kind !== 'tree'">尝试悬停、Tab、Enter、Space 和 Esc。禁用按钮仍在 Tab 顺序中，但不会触发操作。下拉菜单支持方向键导航、选择和关闭。</p>
        <p v-else>点击标签选中，点击箭头展开。悬停 / 选中 / 聚焦时显示行内操作，Tab 进入该行工具栏，← → 切换按钮。↑ ↓ 移动树焦点，Enter 选择，Space 切换展开。点击操作按钮不会改变树的选择。</p>
      </section>
      <section><h2>当前范例范围</h2>
        <p v-if="kind !== 'tree'">文字、图标、主次按钮、小尺寸、禁用，以及主操作 + 右侧下拉菜单的组合。左侧 Button / Dropdown Button 可分别复核。</p>
        <p v-else>同步数据、22px 行高、缩进线、多选、前缀跳转、虚拟滚动、行内按钮和 Git 状态标记。颜色与字母由节点数据提供，选中态按主题处理。异步加载、拖放、过滤器和 sticky scroll 尚未覆盖。</p>
      </section>
    </div>
    <footer>Classic UI · Modern UI disabled · 顶部画笔「Dark+（深色）」可切换明暗主题 · Themes / Import 可导入自己的配色</footer>
  </main>
</template>
