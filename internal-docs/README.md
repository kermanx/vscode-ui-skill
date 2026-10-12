# 组件开发（内部）

- 唯一依据是仓库根目录 `vscode/` 子模块固定的提交，Modern UI 关闭；不参考已有 vscode-ui skill。能够复制的源码、CSS、DOM 和算法优先直接复制，保留版权，仅改 Vue 接入所需部分。
- 以下实现路径相对于 `components/`。组件源码必须自包含，不写外部源码路径或要求读者查阅外部实现；来源对应关系只记在 [sources.md](sources.md)。本目录不随组件发布。
- `src/components/<name>/` 放 Vue 组件及必要的状态逻辑。原版 CSS 保留原 class 和选择器；UnoCSS 用于布局与范例组合，不引入 reset，不把精确数值替换成近似刻度。`src/theme/` 的 token 由原版注册表生成，不能凭印象手填。
- 参数只表达常见使用含义；不要把颜色、边距、圆角等内部规范做成配置项。原版的焦点、选择、事件时机等行为不能因参数精简而省略。
- 验收包含常见组合形态，不能只交付最简单的外观：按钮含右侧下拉，树行含操作栏和状态装饰。组合后的显隐、焦点、事件传播、主题优先级也要与原版对照；后续组件同样执行。
- `stories/` 给出 Review（原版 / Vue 独立 iframe）、Playground（参数和代码）、Specimen（确定性验收画布）。本目录的 `reference/` 直接运行原版类，禁止从 `src/components` 导入实现或样式来充当原版。
- 每个组件交付对应的 `tests/` 原版对照用例：同数据、字体、主题、尺寸和浏览器，检查关键操作、状态与截图。运行 `npm run check`、相关 Playwright 用例；构建配置变更时再跑 `npm run build` 和 `npm run storybook:build`。组件构建不读取克隆，发布文件只含 `dist/`、`src/`、README 和许可证。不以 Vue 自己的快照证明复刻正确。新增截图比较保持零容差；若浏览器对无关静止区域增量重绘，应保留初态整图对照，并将交互截图限定到实际变化的完整控件区域，不扩大像素容差。
- 按用户要求同时运行三个 subagent，每个负责独立组件，subagent 不再拆分派发。主 agent 负责公共接入与验收，每项通过后立即通知用户并继续派发下一项。只有实际错误暴露通用问题时才补充本文件。

从仓库根目录启动对照展示：

```sh
cd components
npm ci
node ../internal-docs/reference/build.mjs
npm run dev
```

对照脚本生成 `public/reference/` 和主题 token；更新基准时重新运行。日常组件构建使用 `npm run build`，不依赖该脚本或克隆。

并行开发时，热更新可能在截图中途重载页面。需要稳定验收时，先生成原版 fixture，再把 Storybook 构建到独立临时目录并用静态 HTTP 服务托管；设置 `PLAYWRIGHT_BASE_URL` 后，测试直接使用该快照，不启动开发服务器。构建快照在本轮验收结束前保持不变。

这次验证得到的提醒：

- CSS 之外还要检查调用方传入的 `defaultStyles`。未定义的颜色变量、内联 border、选择与焦点的优先级都会影响结果；只抄 CSS 不足以复刻。
- Button 的 Enter / Space 在 keydown 触发；禁用后仍可聚焦。Tree 点击箭头只改展开与焦点；选择是独立状态。滚轮归一化、滚动条像素取整也必须对照源码。
- 先确认对照数据映射正确：给叶节点传入 `collapsed` 会使 ObjectTree 把它当作可折叠节点。
- 原版类也依赖真实调用环境：操作项由 ActionBar 创建，延迟提示需要 HoverService。手工补外层 class 或保留空 hover delegate 会让两边一起遗漏行为，不能只凭两边截图相等验收。

- UnoCSS 自动扫描会把原版状态类 `invisible` 误生成 `visibility:hidden`，改变原版滚动条的合成行为；这些状态类通过 blocklist 排除，不能用补丁覆盖成近似外观。

- Storybook 的主题引用需保留 `globals: context.globals` 并读取 `globals.theme`；在 setup 中复制字符串会导致顶部主题切换后 iframe 留在旧主题。

- 公共构建入口与 Storybook preview 都先加载 ActionBar 基础 CSS，再加载组件组合样式；懒加载的 List / Menu 共存会暴露同优先级规则的加载顺序差异，不能靠调整单个示例的 import 顺序绕过。

- 组合验收要保留原版滚动条的尺寸和布局层级。Grid 的 SplitView 默认 Auto；轨道即使透明，10px slider 与 transform 仍会参与合成。把它改成 Hidden 的零宽轨道，或省略外层分割布局，会改变相邻阴影与图标的栅格化。

- 原版的全局图标样式表也是运行依赖。独立 fixture 要注入 `getIconsStyleSheet()` 的完整变量；公共包使用预生成的图标变量，避免原版与 Vue 同时缺失图标而误判为一致。
