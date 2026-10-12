<script setup lang="ts">
import { computed, ref } from 'vue';
interface Specimen { section?: 'components' | 'compositions'; id: string; title: string; height?: number; notes: string; scope?: string }
const specimens = {
  problems: { id: 'problems', title: 'Problems', height: 620, notes: '比较问题树、筛选、严重程度、消息展开、相关信息及快速修复请求。' },
  settings: { id: 'settings', title: 'Settings', height: 740, notes: '比较设置行、分组、搜索、作用域、修改标记与交互。' },
  search: { section: 'compositions', id: 'search', title: 'Search', height: 620, notes: '比较查找替换、文件筛选与分组搜索结果。' },
  workbench: { section: 'compositions', id: 'workbench', title: 'Workbench', height: 620, notes: '组合工作台布局与已验证的组件；中央文档与面板正文是应用提供的示例插槽。' },
  'workbench-layout': { section: 'compositions', id: 'workbench-layout', title: 'Workbench Layout', height: 620, notes: '比较经典左/右侧栏、底部面板和状态栏的布局；拖动分隔条并切换可见性。' },
  explorer: { section: 'compositions', id: 'explorer', title: 'Explorer', height: 620, notes: '比较 Open Editors、文件图标、工作区树、展开、多选与行内操作。' },
  'notifications-center': { id: 'notifications-center', title: 'Notifications Center', height: 600, notes: '比较通知中心标题、列表、全部清除、勿扰模式和来源设置；核对开关、位置、键盘与焦点恢复。' },
  'panel-title': { id: 'panel-title', title: 'Panel Title', height: 480, notes: '比较面板页签、焦点、溢出、徽标、固定状态及右侧工具栏。' },
  'editor-tabs': { id: 'editor-tabs', title: 'Editor Tabs', height: 360, notes: '比较活动、预览、固定和未保存状态；核对选择、关闭请求、键盘导航及横向滚动。', scope: '单行标签栏与宿主事件接口；未包含工作台拖放、双行固定标签及编辑器工具栏。' },
  'activity-bar': { id: 'activity-bar', title: 'Activity Bar', height: 620, notes: '比较视图切换、徽标、键盘导航及溢出；核对固定状态、提示和侧栏显示。' },
  'notification-toasts': { id: 'notification-toasts', title: 'Notification Toasts', height: 480, notes: '比较浮动通知的位置、堆叠、自动隐藏和焦点；核对展开、进度及通知中心打开时的行为。' },
  'quick-pick': { id: 'quick-pick', title: 'Quick Pick', height: 720, notes: '比较搜索匹配、分组、单选和多选；核对条目按钮、键盘导航、接受事件和动态列表。默认失焦关闭，切换两侧会关闭上一侧。' },
  'sidebar-title': { id: 'sidebar-title', title: 'Sidebar Title', height: 460, notes: '比较侧栏标题、长文字省略和操作区；核对菜单、键盘与标题提示。' },
  'status-bar': { id: 'status-bar', title: 'Status Bar', height: 420, notes: '比较状态栏条目、优先级、左右分组和语义状态；核对键盘导航、命令、提示、隐藏及窄幅布局。' },
  'notifications-list': { id: 'notifications-list', title: 'Notifications List', height: 720, notes: '比较通知消息、展开、按钮和进度；核对可变行高、焦点导航与关闭。' },
  banner: { id: 'banner', title: 'Banner', height: 240, notes: '比较消息、图标、动作链接和关闭；核对优先级队列、焦点循环及中性样式。' },
  'quick-input': { id: 'quick-input', title: 'Quick Input', height: 700, notes: '比较分步标题、输入与验证、忙碌进度和操作按钮；核对接受、关闭及焦点恢复。默认失焦关闭，切换两侧会关闭上一侧；选择 Keep open on blur 可同时查看。' },
  table: { id: 'table', title: 'Table', height: 540, notes: '比较表头分栏、尺寸约束、拖动重置和虚拟行；核对列表选择、键盘焦点及动态布局。' },
  hover: { id: 'hover', title: 'Hover', height: 720, notes: '比较文字、内容与操作链接，核对边缘定位、鼠标保持、键盘焦点、锁定和关闭。' },
  tooltip: { id: 'tooltip', title: 'Tooltip', height: 720, notes: '比较鼠标与键盘触发的延迟提示、元素与鼠标定位，以及取消和重新进入的时机。' },
  dialog: { id: 'dialog', title: 'Dialog', height: 700, notes: '比较确认、输入、复选框与详情组合；核对按钮顺序、焦点循环、取消、返回值及下拉菜单。' },
  'context-menu': { id: 'context-menu', title: 'Context Menu', height: 720, notes: '比较元素、鼠标与坐标锚点、边缘翻转，以及树和列表的键盘菜单、选择保持与焦点恢复。' },
  breadcrumbs: { id: 'breadcrumbs', title: 'Breadcrumbs', height: 680, notes: '比较文件和符号路径、焦点与选择、键盘命令和横向滚动。' },
  sash: { id: 'sash', title: 'Sash', height: 720, notes: '比较分隔条悬停、拖动、重置、边界光标，以及联动分隔条与交叉拖动。' },
  pane: { id: 'pane', title: 'Pane', height: 850, notes: '比较侧栏和面板分组、展开收起、焦点与标题操作；核对内容首次渲染和收起后状态保留。' },
  'split-view': { id: 'split-view', title: 'Split View', height: 720, notes: '比较横向和纵向布局、尺寸约束、比例缩放、吸附与隐藏恢复，以及多面板拖动和内容滚动。' },
  'scrollable-element': { id: 'scrollable-element', title: 'Scrollable Element', height: 650, notes: '比较双轴滚动、轨道、拖动、阴影和动态尺寸；核对嵌套容器到达边界时的滚轮传播。' },
  toolbar: { id: 'toolbar', title: 'Toolbar', height: 650, notes: '比较主操作、更多菜单、数量溢出以及标题栏组合；核对统一方向键导航、打开时机和关闭后的焦点。' },
  codicon: { id: 'codicon', title: 'Codicon', height: 440, notes: '比较普通图标、旋转、禁用修饰符及图标文字组合。', scope: '字体图标、修饰符、图标标记解析与无障碍命名。' },
  'keybinding-label': { id: 'keybinding-label', title: 'Keybinding Label', height: 340, notes: '比较不同平台的修饰键、组合快捷键、匹配高亮与未绑定状态。' },
  'progress-bar': { id: 'progress-bar', title: 'Progress Bar', height: 440, notes: '比较离散与无限进度；在 Playground 检查延时显示、完成和停止。' },
  'count-badge': { id: 'count-badge', title: 'Count Badge', height: 720, notes: '比较计数与文字形态、格式化、更新及移除后的布局。', scope: '计数与文字徽标；titleFormat 同时提供延迟悬浮提示。' },
  'button-bar': { id: 'button-bar', title: 'Button Bar', height: 450, notes: '比较横向与纵向按钮组，方向键循环经过禁用项；同时检查描述文字和下拉菜单组合。' },
  'action-bar': { id: 'action-bar', title: 'Action Bar', height: 440, notes: '比较图标、文字、分隔和选中状态；尝试水平与垂直方向键、禁用项焦点与按键激活。' },
  'icon-button': { id: 'icon-button', title: 'Icon Button', notes: '独立图标操作，复用 ActionBar 的焦点、禁用与松开按键激活行为。' },
  button: { id: 'button', title: 'Button', notes: '尝试悬停、Tab、Enter、Space 和 Esc。禁用按钮仍在 Tab 顺序中，但不会触发操作。', scope: '文字、图标、主次按钮、小尺寸和禁用状态。' },
  list: { id: 'list', title: 'List', notes: '比较焦点与选择、Ctrl / Cmd 与 Shift 多选、键盘导航和前缀查找；尝试行内操作、滚动条与动态更新。', scope: 'Open Editors 行组合：虚拟列表、图标、描述、状态装饰及行内操作栏。' },
  tree: { id: 'tree-view', title: 'Tree View', notes: '点击标签选中，点击箭头展开。悬停 / 选中 / 聚焦时显示行内操作，Tab 进入该行工具栏，← → 切换按钮。↑ ↓ 移动树焦点，Enter 选择，Space 切换展开。点击操作按钮不会改变树的选择。', scope: '同步数据、22px 行高、缩进线、多选、前缀跳转、虚拟滚动、行内按钮和 Git 状态标记。异步加载、拖放、过滤器和 sticky scroll 尚未覆盖。' },
  dropdown: { id: 'dropdown-button', title: 'Dropdown Button', notes: '尝试主操作与右侧箭头，检查菜单键盘导航、选择、关闭及焦点恢复。', scope: '主操作按钮与独立 Menu / Dropdown 组件的组合。' },
  menu: { id: 'menu', title: 'Menu', notes: '尝试方向键、Enter、Esc，核对禁用项、勾选项、分隔线、快捷键与递归子菜单。' },
  'dropdown-panel': { id: 'dropdown', title: 'Dropdown', notes: '打开弹层并选择菜单项，尝试 Esc、外部点击和窗口尺寸变化，关闭后检查触发器焦点。' },
  'replace-input': { id: 'replace-input', title: 'Replace Input', height: 900, notes: '核对保留大小写、历史、验证和多行限高滚动；检查查找与替换组合的 Tab 顺序、选项导航及焦点恢复。' },
  'find-input': { id: 'find-input', title: 'Find Input', height: 560, notes: '尝试大小写、全字与正则选项，核对历史、多行输入、验证和选项之间的键盘导航。' },
  'input-box': { id: 'input-box', title: 'Input Box', height: 520, notes: '尝试输入、选区、历史导航和右侧操作，检查禁用、只读及三种校验提示。', scope: '支持单行及多行自动高度；多行组合见 Find Input。支持延迟 hover；富文本提示尚未覆盖。' },
  checkbox: { id: 'checkbox', title: 'Checkbox', height: 390, notes: '上方四项是普通复选框，下方四项是操作栏复选框。操作栏文字区域悬停会高亮，启用时显示手形指针；普通复选框背景保持不变。点击或使用 Space / Enter 切换。', scope: 'Checkbox 与 CheckboxActionViewItem；带文字的示例对应操作栏，不代表设置页的复选框布局。' },
  'select-box': { id: 'select-box', title: 'Select Box', height: 500, notes: '对比平台原生与自绘下拉选择，检查禁用、说明文字、键盘导航、输入跳转和弹层定位。' },
  switch: { id: 'switch', title: 'Switch', notes: '比较开关状态、禁用、键盘焦点和带文字的组合；Enter 按下与 Space 松开采用原生按钮激活时机。' },
  radio: { id: 'radio', title: 'Radio', height: 420, notes: '比较经典与分段选项组，尝试左右方向键、聚焦后激活、禁用状态，以及动态更新选项和选中值。' },
  toggle: { id: 'toggle', title: 'Toggle', notes: '点击图标或使用 Space / Enter 切换，核对选中、禁用与查找选项工具条组合。' },
} satisfies Record<string, Specimen>;
const props = defineProps<{ kind: keyof typeof specimens; theme: string }>();
const specimen = computed<Specimen>(() => specimens[props.kind]);
const revision = ref(0), large = ref(false), expandOnLabel = ref(false), multiple = ref(true);
const params = computed(() => `theme=${props.theme}&kind=${props.kind}&large=${large.value}&expandOnLabel=${expandOnLabel.value}&multiple=${multiple.value}`);
const vueUrl = computed(() => `./iframe.html?id=${specimen.value.section || 'components'}-${specimens[props.kind].id}--specimen&viewMode=story&large=${large.value}&multiple=${multiple.value}&globals=theme:${props.theme}&args=large:${large.value};expandOnLabel:${expandOnLabel.value};multiple:${multiple.value}`);
</script>

<template>
  <main class="review-page">
    <div class="eyebrow">CLASSIC WORKBENCH / COMPONENT STUDY</div>
    <header class="review-header">
      <div><h1>{{ specimen.title }}</h1><p>同一份数据，两套独立实现。左侧运行克隆源码，右侧运行 Vue。</p></div>
      <button class="gallery-action" @click="revision++">Reset both</button>
    </header>
    <div v-if="kind === 'tree' || kind === 'list'" class="review-options">
      <label><input type="checkbox" v-model="large" /> {{ kind === 'tree' ? '10,100 个节点' : '10,000 项' }}</label>
      <label><input type="checkbox" v-model="multiple" /> 多选</label>
      <label v-if="kind === 'tree'"><input type="checkbox" v-model="expandOnLabel" /> 点击标签展开</label>
    </div>
    <div class="comparison-grid" :style="{ '--comparison-height': `${specimen.height || 354}px` }">
      <section><div class="frame-heading"><strong>VS Code 原版</strong><span>114d61e88947</span></div>
        <iframe :key="`original-${revision}-${params}`" :src="`./reference/index.html?${params}`" title="VS Code original" />
      </section>
      <section><div class="frame-heading"><strong>Vue + UnoCSS</strong><span>复刻实现</span></div>
        <iframe :key="`vue-${revision}-${vueUrl}`" :src="vueUrl" title="Vue replica" />
      </section>
    </div>
    <div class="review-notes">
      <section><h2>复核操作</h2>
        <p>{{ specimen.notes }}</p>
      </section>
      <section><h2>当前范例范围</h2>
        <p>{{ specimen.scope || '独立组件及常见组合；Playground 可调整参数，Specimen 用于确定性对照。' }}</p>
      </section>
    </div>
    <footer>Classic UI · Modern UI disabled · 顶部画笔「Dark+（深色）」可切换明暗主题 · Themes / Import 可导入自己的配色</footer>
  </main>
</template>
