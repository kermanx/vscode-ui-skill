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
- Button：`label`、`icon`、`secondary`、`small`、`disabled`、`ariaLabel`；`click` / `escape` 事件，`focus()` 方法。Enter / Space 在按下时触发，禁用按钮仍参与 Tab 导航。
- DropdownButton：主操作 + 右侧下拉。`actions` 接收 `{ id, label, disabled?, checked? }` 或 `{ separator: true }`，`includePrimary` 默认把主操作列在菜单首项。`click` 执行主操作，`action` 返回菜单操作 ID；支持菜单键盘导航、关闭与焦点恢复。
- TreeView：`nodes`、`height`、`multiple`、`expandOnLabel`、`ariaLabel`；展开与选择使用独立 v-model，焦点通过 `focusChange` 事件报告。提供 `focus()`、`reveal(id)`、`collapseAll()`。
- 树节点可带 `actions: [{ id, label, icon, disabled? }]`，通过 `@action="(action, node) => ..."` 响应。操作栏在悬停、选中或聚焦时出现，Tab 从树进入该行操作栏；按钮操作不改变树选择。
- 树节点可带 `decoration: { badge, color, tooltip, strikethrough }`。例如 `{ badge: 'M', color: 'gitDecoration.modifiedResourceForeground', tooltip: 'Modified' }`；只提供展示数据，无需连接 Git。
- 树范例支持同步数据、22px 行高、多选、前缀跳转、虚拟滚动与行内操作 / 装饰。异步加载、拖放、过滤器和 sticky scroll 尚未覆盖；下拉菜单支持平面操作列表。
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
