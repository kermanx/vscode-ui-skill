# Classic Workbench · Vue + UnoCSS

自包含的组件范例。安装常规 npm 依赖后即可构建，不需要其他源码仓库。

```sh
npm ci
npm run build       # 组件、CSS 与类型声明
npm run dev         # Storybook，http://localhost:6006
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, TreeView } from 'vscode-classic-examples';
import 'vscode-classic-examples/style.css';

const nodes = [{ id: 'project', label: 'Project', children: [{ id: 'file', label: 'main.ts' }] }];
const expanded = ref(['project']);
const selected = ref<string[]>([]);
</script>

<template>
  <div class="vc-theme" data-theme="dark">
    <Button label="Create File" icon="add" @click="selected = []" />
    <TreeView :nodes="nodes" v-model:expanded-ids="expanded"
      v-model:selected-ids="selected" aria-label="Project files" />
  </div>
</template>
```

- 主题：`dark`、`light`、`hcDark`、`hcLight`。
- Codicon：`name`、`spin`、`disabled`、`label`、`title`；支持图标修饰符，并提供图标类名、标记拆分和无障碍标签辅助函数。
- KeybindingLabel：`chords`、`matches`、`os`、`unbound`、`disableTitle`；展示平台修饰键、连续快捷键与匹配高亮。
- CountBadge：`count`、`countFormat`、`titleFormat`、`variant`（`count` / `text`）；按 `titleFormat` 显示延迟提示，并暴露 `hoverContent`。
- ProgressBar：`total`、`worked`、`infinite`、`visible`、`showDelay`、`ariaLabel`；`worked` 属性表示绝对值。ref 提供 `worked()` 累加、`done()` 延迟 200ms 清理、`stop()` 立即清理及显示 / 隐藏方法；不播放无障碍进度音效。
- List：`items`、`v-model:selectedIds`、`multiple`、`height`、`ariaLabel`；支持虚拟滚动、焦点与选择分离、键盘导航、行内 ActionBar、图标 / 描述 / 装饰及稳定 ID 的数据更新。
- Button：`label`、`icon`、`secondary`、`small`、`disabled`、`ariaLabel`、`title`（文字或 `true` 使用 label）；`click` / `escape` 事件，`focus()` 方法。Enter / Space 在按下时触发，禁用按钮仍参与 Tab 导航。
- DropdownButton：主操作 + 右侧下拉，`title` 控制主按钮提示。`actions` 接收 `{ id, label, disabled?, checked? }` 或 `{ separator: true }`，`includePrimary` 默认把主操作列在菜单首项。`click` 执行主操作，`action` 返回菜单操作 ID；支持菜单键盘导航、关闭与焦点恢复。
- InputBox：`v-model`、`placeholder`、`password`、`readonly`、`disabled`、`message` / `validate`、`history`、`actions`、`tooltip`、`hideHoverOnValueChange`。支持延迟提示、选区方法、历史导航、右侧操作，以及 `multiline` / `wrap` 自动高度输入；`maxHeight` 可限制多行高度并显示滚动条，暂不包含富文本提示。
- QuickPick：复用 QuickInput 外壳，`v-model:open` / `value` / `activeIds` / `selectedIds`，支持单选、多选、模糊或连续匹配、描述及详情筛选、分隔组、行内按钮、可变行高虚拟列表和分页导航。`willAccept` 可否决接受；`accept` 返回所选 ID、修饰键及后台接受状态。支持 `keepScrollPosition`、外部选择和忙碌状态。
- QuickInput：`v-model:open` / `value`、标题与步骤、提示 / 验证、密码 / 选区、返回及标题按钮。支持 800ms 延迟忙碌状态、Escape 关闭、失焦关闭和焦点恢复；`accept` 只通知调用方，`enabled=false` 将输入设为只读。容器需使用 `position: relative`。
- FindInput：复用 InputBox / Toggle，组合大小写、全字与正则选项，支持额外选项、历史、验证、IME、多行输入及选项间键盘导航。
- ReplaceInput：`v-model`、`v-model:preserveCase`、`history`、`message` / `validate`、`multiline`、`maxHeight`；组合保留大小写选项，支持历史、焦点导航及多行限高滚动。实际匹配与替换由调用方执行。
- IconButton：`icon`、`label`、`tooltip`、`disabled`、`checked`；复用单项 ActionBar，`click(event)` 在松开激活键时触发，提供 `focus()`。
- Checkbox：`checked` / `v-model:checked`、可选操作栏 `label`、`ariaLabel`、`disabled`；`change(checked, viaKeyboard)`。带标签时整项提供操作栏悬停背景，启用时显示手形指针。点击标签聚焦并切换；Space / Enter 在按下时切换，禁用状态跳过 Tab。
- Dialog：`v-model:open`、`message` / `detail`、`type`、`buttons` / `cancelId`，支持输入、复选框、详情 / 正文 / 页脚插槽和主按钮菜单。按钮按平台顺序排列，`result` 返回原始按钮索引、复选框状态和提交的输入值；取消不返回输入值。处理焦点循环、关闭与焦点恢复。
- Hover：`target`、`content` 或内容插槽、`actions`、`position`、`showPointer`、`compact`，支持边缘翻转、内容滚动、焦点循环与 Alt 保持。`sticky` 保持弹层直至 Escape、外部点击或窗口失焦。通过 `v-model:open` 或 `show()` / `hide()` 控制；内容插槽接收已经渲染的内容，不包含 Markdown 解析器。
- Tooltip：包装单个触发器或传入 `target`，支持文字 / 内容插槽、操作链接、鼠标或元素定位。默认延迟在 macOS 为 1500ms，其他平台为 500ms；处理取消、重新进入、键盘触发和焦点恢复。
- Banner：`v-model:items` 表达按展示顺序排列的消息；高优先级先显示，同级显示最新项，关闭后恢复队列中的上一项。支持图标、动作链接、中性样式及消息插槽，提供 `show()` / `hide()` 与焦点方法；自定义消息内容使用显式 `ariaLabel`。
- Menu：独立操作列表，支持分隔、勾选、禁用、快捷键文字和递归 `children` 子菜单；`action(id)` / `cancel` 事件。
- Dropdown：独立弹层，`v-model:open` 控制开关，默认插槽接收 `close`；可使用内置触发器，或传入 `anchor` 元素。处理定位、外部点击、Esc 和焦点恢复。
- Toggle：`icon`、`title`、`v-model:checked`、`disabled`、`focusable`；可组合成查找选项工具条。`title` 同时用于无障碍标签与延迟提示。
- Radio：`options`、`v-model` 选中索引、`segmented`、`arrowKeyBehavior`；支持经典选项组和带动画的分段样式，`select` 区分选项变化，`activate` 包含重复激活。省略 `disabled` 保留各项禁用状态；显式设为 `false` 会启用全部项。
- Switch：`v-model:checked`、`ariaLabel`、`disabled`；采用原生按钮的 Enter / Space 时机，并支持 `aria-description` 等属性。
- SelectBox：`options`、`v-model` 索引、`custom`、`disabled`、`hideDisabled`、`placement`；默认在 macOS 使用原生选择器，可切换自绘列表。选项支持禁用、分隔、detail、右侧标记和纯文本描述，暂不包含 Markdown 描述及描述悬浮框。
- Toolbar：`primary`、`secondary`、`maxItems`、`alignment`、`ariaLabel`；复用 ActionBar / Menu / Dropdown。更多菜单与普通操作共享焦点导航，`action(id)` 回报操作，`visibility` 回报菜单开关。
- ContextMenu：`actions`、`alignment`、`autoSelectFirstItem`；`show(anchor)` 接受元素、鼠标事件或视口坐标，`close()` 关闭并恢复焦点。Tree / List 的 `contextmenu(item, event, anchor)` 同时支持鼠标与键盘调用，空白处的 item 为 undefined；菜单不改变已有选择。
- ActionBar：`actions`、`orientation`、`focusOnlyEnabledItems`、`preventLoopNavigation`；支持图标、文字、分隔、快捷键、禁用和选中状态。`action(id, event)`、`cancel`、`blur`，并提供 `focus()` / `setFocusable()`；树行、输入框与 IconButton 复用同一实现。
- ButtonBar：`items`、`alignment`（键盘导航方向）；复用 Button / DropdownButton，支持描述文字。布局交由调用方，`click` / `action` 带回按钮 ID。
- ScrollableElement：默认插槽承载内容，`height`、`horizontal` / `vertical` 控制视口和轨道，支持 `v-model:scrollTop` / `scrollLeft`。提供自动测量、双轴滚动、阴影、嵌套边界传播、轨道翻页及 `scanDomNode()` / `setScrollPosition()`；不处理宿主键盘导航。
- Breadcrumbs：`items` 表达文件与符号路径，`disabled`、`scrollbarVisibility`、`scrollbarSize` 表达常见显示状态。提供焦点、选择、reveal 与布局方法；`selectItem` 的 pick / reveal 意图交给宿主处理。左右键移动焦点，Enter / Down 打开选择，Space 请求打开目标，Escape 通知宿主恢复焦点。
- Sash：`position`、`offset`、`length` 定位分隔条，`orientation` 与 `state` 表达方向和边界光标。通过 `dragStart` / `change` / `end` / `reset` 交给宿主更新布局，支持关联分隔条和交叉边界；自身不限制尺寸，也不处理键盘导航。
- SplitView：`views` 描述初始尺寸、最小 / 最大尺寸、比例分配、优先级和吸附；`v-model:sizes` 请求后续尺寸，内容按 id 插槽提供。支持横纵向、多面板约束传播、隐藏与恢复、动态重排、Alt 对称拖动和物理滚轮平滑滚动；`sashReset` 交给宿主决定重置行为。
- Table：`columns` 描述列权重与宽度约束，`rows` 描述单元格，`height` 控制表格高度。固定 24px 表头与行高，支持虚拟滚动、多选、键盘导航、贯穿表体的分隔条和双击比例重置；文本、图标、高亮、快捷键标签可通过单元格或列插槽组合。提供 `resizeColumn()`、焦点、滚动和列宽查询方法。
- Workbench 组合示例：Storybook 的 `Compositions / Workbench / 完整工作台 Demo` 提供原版与 Vue 并排对照及各自的全窗口视图，布局随窗口变化；顶部控制可同时切换两侧的区域显隐和侧栏位置。ActivityBar、Explorer、EditorTabs、PanelTitle、StatusBar 与 WorkbenchLayout 接到同一组状态，展示文件打开、关闭后重开、预览固定、面板命令和拖动布局。键盘与鼠标操作均通过宿主动作回调同步正文和显隐；关闭活动标签恢复编辑器焦点，隐藏侧栏优先保留当前面板焦点。编辑器正文及面板正文由宿主插槽提供，不包含代码编辑器或终端引擎。
- Demo 的 Activity Bar 七个入口分别展示 Explorer、Search、Source Control、Run and Debug、Extensions、Testing、Ports，并保留切换前的输入、树状态和 section 尺寸。Search 使用已有搜索控件；另外五个视图使用本地数据演示 SidebarTitle、PaneView、Pane、TreeView、InputBox 和 Button 的组合，没有接入 Git、调试器、扩展市场、测试运行器或端口服务；其行渲染也不代表 VS Code 完整业务视图。
- PaneView：通过 `panes` 定义 id、初始 size、minimumBodySize / maximumBodySize 与 headerVisible，具名插槽提供 `bodySize`、`expanded` 和 `setExpanded`，配合 Pane 渲染 section。支持 `v-model:expanded` / `v-model:sizes`、22px 标题、原版顺序插入的初始分配、拖动分隔条、折叠恢复高度和标题上下键导航；Explorer 的编辑器与文件区共同使用这一容器。
- WorkbenchLayout：用 `activity` / `sidebar` / `editor` / `panel` / `status` / `overlays` 插槽组合工作台，`sidebarSide` 控制左右侧栏。双向绑定区域可见性、`sidebarWidth` 和 `panelHeight`；支持尺寸约束、拖动折叠与恢复、双击分隔条复位，`preferredSidebarWidth` 默认300，面板复位到容器高度的40%。提供区域焦点与显隐方法；当前为单侧栏和底部面板。
- SettingsEditor：`groups`、`height`、`workspaceLabel`，双向绑定 `values`、`target`、`query`、`category`、`allProfiles`。支持 User / Workspace 作用域、布尔 / 文字 / 数字 / 整数 / 枚举 / 多行设置、校验、废弃提示、修改标识、重置和复制菜单；目录支持键盘、拖动宽度与窄屏隐藏。搜索支持普通文本、`@modified`、`@id:`、`@tag:`。ref 的 `setSearchImeEnabled(enabled)` 暂停搜索输入并在恢复时还原焦点和选区。`change` / `openJson` / `copy` / `focus` 交给宿主处理；复杂值通过 JSON 入口编辑，不包含数组 / 对象专用编辑器、Monaco 建议、AI 搜索或远程作用域。
- SearchView：`results`、`height`、`searched`、`searching`，双向绑定查询、替换文字、匹配选项、文件筛选和结果展开 / 选择。组合查找替换输入、查询详情、结果摘要和文件匹配树，支持历史、验证、键盘、菜单与按键搜索延迟；`submit`、`open`、`replace`、`dismiss`、`action` 交由宿主处理。搜索后端、磁盘替换、Notebook 与 AI 搜索不包含在此组件中。
- Problems：`items`、`height`；双向绑定 `filter`、`severities`、`expandedIds`、`selectedIds`、`collapsedMessageIds`。支持文件分组、多行诊断、关联位置、筛选高亮、快速修复菜单与虚拟滚动；通过 `open` / `action` / `link` / `focusChange` 回报交互，提供 `focus()`、`focusFilter()`、`reveal()`、`collapseAll()`、`getFocus()`。资源 ID 为 `resource:${filePath}`，诊断及关联位置使用调用方提供的 ID；当前为树模式，诊断获取与修复执行由宿主处理。
- Explorer：`roots` / `editorGroups` 提供文件与打开编辑器，`v-model:expandedIds` / `selectedIds` / `activeEditorId` 控制状态。组合标题、可折叠 Open Editors、工作区树和 Seti 文件图标；`open` 返回 pinned / preserveFocus / sideBySide 等打开意图，关闭、取消固定及菜单操作交给调用方。提供 `focusFiles()` / `focusEditors()` / `collapseAll()`，支持键盘、多选和虚拟滚动；不包含文件后端、内联重命名、compact folders、嵌套与拖放。
- SidebarTitle：`title` / `keybinding`、`primary` / `secondary`；组合固定高度的侧栏标题、主操作和 Views and More Actions 菜单，长标题自动省略。支持标题提示、操作栏键盘导航和 `focus()`；`action(id)` 返回被执行的操作。
- ActivityBar：`items`、`v-model:activeId` / `sidebarVisible`、`side` / `iconClickBehavior`，支持图标、数字及进度徽标、固定状态、溢出菜单、延迟提示与方向键焦点。鼠标点击300ms内防重入；固定与徽标菜单操作通过事件通知宿主。提供 focus / pin / unpin。宿主处理 `open(id, focus)`，在 `focus=true` 时将焦点移到对应视图内容；Storybook 已提供可聚焦内容区。当前不包含 Accounts / Manage 和工作台拖放。
- PanelTitle：`items`、`v-model:activeId`、`icons`、`primary` / `secondary`，提供35px底部面板标题、文本或图标页签、徽标、溢出、固定菜单和右侧工具栏。支持 open / pin / badge / command / action / visibility 事件及 focus / pin / unpin 方法；宿主在 `open(id, true)` 时聚焦面板内容，全局面板布局命令交由宿主处理。
- EditorTabs：`items`、`v-model:activeId` / `selectedIds`，支持预览、固定、未保存、禁止关闭、Ctrl / Cmd 与 Shift 多选、方向键、横向滚动和同名描述缩短。`sizing` / `stickySizing` / `compact` 控制布局；`close` / `pin` / `unpin` / `contextmenu` / `configurePreview` 交由宿主处理。宿主处理 `activate(id, preserveFocus)`，仅在 `preserveFocus=false` 时聚焦编辑器正文。关闭前保持固定宽度，鼠标离开后恢复。当前覆盖单行标签栏，未包含工作台拖放、双行固定标签和编辑器工具栏。
- StatusBar：`entries`、`v-model:hiddenIds`、`hasFolder` / `inactive`。条目支持左右分组、数字或相对优先级、紧凑分组、语义颜色、进度、提示与命令；方向键 / Home / End 导航，Escape 从条目返回状态栏，再次 Escape 通过 `escape` 事件交由宿主聚焦编辑器。右键菜单管理条目可见性，`command` / `hide` 交由宿主处理；窄窗口按状态栏布局裁切内容。支持 `focus()` / `focusNextEntry()` / `focusPreviousEntry()` / `updateEntryVisibility()`。
- NotificationToasts：`v-model:items` / `expandedIds`、三种 `position`、`centerVisible`、标题栏及状态栏偏移。最多显示三条，按信息 / 警告 / 错误分别在 10 / 12 / 15 秒后隐藏；进度、sticky、展开、鼠标与焦点会保留通知。自动隐藏和 Escape 保留通知模型；关闭按钮才移除。提供 focus / focusFirst / focusLast / focusNext / focusPrevious / hide。
- NotificationsCenter：`v-model:open` / `items` / `expandedIds` / `position` / `doNotDisturb` / `mutedSourceIds`，支持来源菜单、位置菜单、全部清除、空状态和焦点恢复。全部清除保留正在进行的进度；`manageSources` 由宿主继续处理。提供 show / hide / clearAll / focus。
- NotificationsList：`v-model:items` / `expandedIds`、`maxHeight`；支持分级消息、链接、来源、主次操作和进度，以及可变行高的虚拟滚动。方向键、Home / End / Page 导航，Delete（macOS Cmd+Backspace）关闭无活动进度的通知；`action` / `link` / `copy` / `filter` 通知宿主。支持 `focus()` / `focusFirst()` / `reveal()`；来源过滤事件交由宿主应用到后续通知。
- Pane：垂直可折叠分组，`title` / `description`、`v-model:expanded`、`collapsible`、`headerVisible`、`location`，支持标题操作栏、计数和内容插槽。首次展开才创建内容，收起 200ms 后移出页面，重新展开保留 DOM 和子组件状态；尺寸由宿主分配。
- TreeView：`nodes`、`height`、`multiple`、`expandOnLabel`、`ariaLabel`；展开与选择使用独立 v-model，焦点通过 `focusChange` 事件报告。提供 `focus()`、`reveal(id)`、`collapseAll()`。
- 树节点可带 `actions: [{ id, label, icon, disabled? }]`，通过 `@action="(action, node) => ..."` 响应。操作栏在悬停、选中或聚焦时出现，Tab 从树进入该行操作栏；按钮操作不改变树选择。
- 树节点可带 `decoration: { badge, color, tooltip, strikethrough }`。例如 `{ badge: 'M', color: 'gitDecoration.modifiedResourceForeground', tooltip: 'Modified' }`；只提供展示数据，无需连接 Git。
- 树范例支持同步数据、22px 行高、多选、前缀跳转、虚拟滚动与行内操作 / 装饰。异步加载、拖放、过滤器和 sticky scroll 尚未覆盖。
- 验收环境为 macOS / Chromium。源码包含必要的行为实现、样式和预计算主题；许可证见 [License.txt](./License.txt)。

导入 VS Code 颜色主题：

```vue
<script setup lang="ts">
import { createTheme } from 'vscode-classic-examples';
import themeJson from './my-theme.json';
const theme = createTheme(themeJson, { base: 'dark' });
</script>

<template>
  <div class="vc-theme" :data-theme="theme.base" :style="theme.style">
    <!-- Place components here. -->
  </div>
</template>
```

`createTheme` 也接受 JSONC 字符串（注释、尾逗号）。`colors` 中的颜色 ID 映射为 `--vscode-*` 变量，支持透明色；缺省颜色使用基础主题。省略 `base` 时根据 `type` 识别，无法识别则使用 `dark`。有 `include` 时传入 `{ fileName: 'themes/custom.json', files: { 'base.json': baseTheme } }`，相对路径按入口文件解析；不会自动加载外部文件。

这只迁移 UI 配色，不包含 `tokenColors` / `semanticTokenColors` 语法高亮或文件图标主题，也不重算完整注册表中的派生默认值。Storybook 顶部画笔菜单可切换明暗，`Themes / Import` 可上传或粘贴主题进行预览。

Quick Input 工作台入口：Demo 顶部按钮或工作台内的 ⌘P、⌘⇧P / F1、Ctrl+G 分别打开快速文件、命令和行号。输入 `>` / `:` 可切换模式；支持键盘选择、Enter 接受、Escape / 失焦关闭。状态栏行列与语言入口也连接浮层。普通输入包含验证，单选更新语言标签，多选与输入结果显示在 Output 示例区。并排时顶部按钮操作 Vue 版，可在原版一侧使用快捷键验证。条目是本地示例；跳转作用于正文插槽的行选择与滚动，不包含 Monaco 编辑器或完整 Quick Access 后端。

QuickPick 的 `filterValue` 可转换筛选文本（例如去除命令前缀），保留输入框中的显示值。
