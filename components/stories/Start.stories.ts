import type { Meta, StoryObj } from '@storybook/vue3-vite';
const groups = [
  { title: 'Compositions', items: [
    { section: 'compositions', id: 'workbench', story: 'demo', label: '完整工作台 Demo', description: '原版与 Vue 的整个布局：并排对照、单独全屏和区域切换' },
    { section: 'compositions', id: 'workbench', label: 'Workbench', description: '文件打开、页签、区域显隐、面板命令与状态栏的联动示例' },
    { section: 'components', id: 'settings', label: 'Settings Editor', description: '设置分组、搜索、作用域、校验、修改标识与行菜单' },
    { section: 'components', id: 'problems', label: 'Problems', description: '诊断分组、多行消息、筛选、快速修复与关联位置' },
    { section: 'compositions', id: 'workbench-layout', label: 'Workbench Layout', description: '侧栏、编辑区、底部面板和状态栏的尺寸与折叠布局' },
    { section: 'compositions', id: 'search', label: 'Search', description: '查找替换、文件筛选、结果分组与打开意图' },
    { section: 'compositions', id: 'explorer', label: 'Explorer', description: '工作区文件、Open Editors、文件图标、菜单与键盘导航' },
  ] },
  { title: 'Labels & feedback', items: [
    { id: 'notifications-center', label: 'Notifications Center', description: '通知中心、来源过滤、勿扰模式和全部清除' },
    { id: 'notification-toasts', label: 'Notification Toasts', description: '通知堆叠、自动隐藏、位置和焦点' },
    { id: 'notifications-list', label: 'Notifications List', description: '通知、展开、操作、进度与可变行高列表' },
    { id: 'banner', label: 'Banner', description: '消息、操作链接、优先级队列与关闭恢复' },
    { id: 'hover', label: 'Hover', description: '文字、内容、操作与边缘定位' },
    { id: 'tooltip', label: 'Tooltip', description: '延迟提示、鼠标保持和键盘焦点' },
    { id: 'dialog', label: 'Dialog', description: '确认、输入、详情与主按钮菜单' },
    { id: 'codicon', label: 'Codicon', description: '图标、动画与图标文字组合' },
    { id: 'keybinding-label', label: 'Keybinding Label', description: '平台快捷键与匹配高亮' },
    { id: 'count-badge', label: 'Count Badge', description: '计数、文字及标题栏徽标' },
    { id: 'progress-bar', label: 'Progress Bar', description: '离散与无限进度、完成和延时显示' },
  ] },
  { title: 'Buttons & menus', items: [
    { id: 'toolbar', label: 'Toolbar', description: '主操作、More 溢出及侧栏面板组合' },
    { id: 'action-bar', label: 'Action Bar', description: '独立操作栏与树行、输入框内的复用' },
    { id: 'icon-button', label: 'Icon Button', description: '独立图标按钮与标题栏操作组合' },
    { id: 'button-bar', label: 'Button Bar', description: '方向键导航、描述文字与下拉按钮组合' },
    { id: 'button', label: 'Button', description: '主次按钮、图标、小尺寸、禁用与键盘' },
    { id: 'dropdown-button', label: 'Dropdown Button', description: '主操作与菜单的组合按钮' },
    { id: 'menu', label: 'Menu', description: '快捷键、勾选、分隔与递归子菜单' },
    { id: 'context-menu', label: 'Context Menu', description: '鼠标与键盘菜单、列表树组合及边缘定位' },
    { id: 'dropdown', label: 'Dropdown', description: '独立触发器与浮层定位、关闭和焦点恢复' },
  ] },
  { title: 'Inputs & selection', items: [
    { id: 'quick-pick', label: 'Quick Pick', description: '筛选、多选、分组、行内按钮和虚拟列表' },
    { id: 'quick-input', label: 'Quick Input', description: '快速输入、步骤、验证、忙碌和焦点恢复' },
    { id: 'replace-input', label: 'Replace Input', description: '保留大小写、限高多行及查找替换组合' },
    { id: 'find-input', label: 'Find Input', description: '查找输入、多行、历史与图标选项组合' },
    { id: 'input-box', label: 'Input Box', description: '输入、校验、历史导航与行内操作' },
    { id: 'checkbox', label: 'Checkbox', description: '复选框、标签和表单组合' },
    { id: 'toggle', label: 'Toggle', description: '图标开关与查找选项工具条' },
    { id: 'switch', label: 'Switch', description: '原生键盘语义与文字组合开关' },
    { id: 'radio', label: 'Radio', description: '经典选项组与动画分段样式' },
    { id: 'select-box', label: 'Select Box', description: '平台原生与自绘下拉选择' },
  ] },
  { title: 'Workbench', items: [
    { id: 'activity-bar', label: 'Activity Bar', description: '视图切换、固定、徽标、溢出与键盘焦点' },
    { id: 'panel-title', label: 'Panel Title', description: '面板页签、徽标、固定与标题工具栏' },
    { id: 'editor-tabs', label: 'Editor Tabs', description: '预览、固定、多选、关闭、滚动与悬浮提示' },
    { id: 'status-bar', label: 'Status Bar', description: '状态条目、优先级、提示、命令和键盘导航' },
    { id: 'sidebar-title', label: 'Sidebar Title', description: '侧栏标题、操作区、菜单和文字裁切' },
  ] },
  { title: 'Navigation', items: [
    { id: 'table', label: 'Table', description: '可调列宽、约束、虚拟行和单元格组合' },
    { id: 'split-view', label: 'Split View', description: '尺寸约束、吸附、比例缩放和多面板布局' },
    { id: 'pane', label: 'Pane', description: '可折叠分组、标题操作和内容状态保留' },
    { id: 'sash', label: 'Sash', description: '分隔条、触摸拖动、联动与交叉边界' },
    { id: 'breadcrumbs', label: 'Breadcrumbs', description: '文件与符号路径、焦点、选择及横向滚动' },
    { id: 'scrollable-element', label: 'Scrollable Element', description: '双轴、轨道、阴影及嵌套滚动' },
    { id: 'list', label: 'List', description: '虚拟列表、多选、行内操作与状态装饰' },
    { id: 'tree-view', label: 'Tree View', description: '虚拟树、多选、行内操作与状态装饰' },
  ] },
];
const meta = { title: 'Start here' } satisfies Meta;
export default meta;
export const Review: StoryObj = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ setup: () => ({ groups, globals: context.globals }), template: `
    <main class="review-page component-index">
      <div class="eyebrow">CLASSIC WORKBENCH / COMPONENT STUDY</div>
      <h1>组件对照与组合</h1>
      <p>Review 并排运行原版与 Vue；Playground 调整参数；Specimen 展示固定验收场景。</p>
      <p>顶部画笔切换明暗和高对比度。<a :href="'./?path=/story/themes-import--preview&globals=theme:' + globals.theme" target="_top">导入自己的配色 →</a></p>
      <div class="component-index-groups">
        <section v-for="group in groups" :key="group.title"><h2>{{ group.title }}</h2>
          <ul><li v-for="item in group.items" :key="item.id">
            <a :href="'./?path=/story/' + ('section' in item ? item.section : 'components') + '-' + item.id + '--' + ('story' in item ? item.story : 'review') + '&globals=theme:' + globals.theme" target="_top">{{ item.label }}</a>
            <span>{{ item.description }}</span>
          </li></ul>
        </section>
      </div>
    </main>` }),
};
