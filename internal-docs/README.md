# 组件开发（内部）

- 唯一依据是仓库根目录 `vscode/` 子模块固定的提交，Modern UI 关闭；不参考已有 vscode-ui skill。能够复制的源码、CSS、DOM 和算法优先直接复制，保留版权，仅改 Vue 接入所需部分。
- 以下实现路径相对于 `components/`。组件源码必须自包含，不写外部源码路径或要求读者查阅外部实现；来源对应关系只记在 [sources.md](sources.md)。本目录不随组件发布。
- `src/components/<name>/` 放 Vue 组件及必要的状态逻辑。原版 CSS 保留原 class 和选择器；UnoCSS 用于布局与范例组合，不引入 reset，不把精确数值替换成近似刻度。`src/theme/` 的 token 由原版注册表生成，不能凭印象手填。
- 参数只表达常见使用含义；不要把颜色、边距、圆角等内部规范做成配置项。原版的焦点、选择、事件时机等行为不能因参数精简而省略。
- 验收包含常见组合形态，不能只交付最简单的外观：按钮含右侧下拉，树行含操作栏和状态装饰。组合后的显隐、焦点、事件传播、主题优先级也要与原版对照；后续组件同样执行。
- `stories/` 给出 Review（原版 / Vue 独立 iframe）、Playground（参数和代码）、Specimen（确定性验收画布）。本目录的 `reference/` 直接运行原版类，禁止从 `src/components` 导入实现或样式来充当原版。
- 每个组件交付对应的 `tests/` 原版对照用例：同数据、字体、主题、尺寸和浏览器，检查关键操作、状态与截图。运行 `npm run check`、相关 Playwright 用例；构建配置变更时再跑 `npm run build` 和 `npm run storybook:build`。组件构建不读取克隆，发布文件只含 `dist/`、`src/`、README 和许可证。不以 Vue 自己的快照证明复刻正确。
- 后续每次仅派发一个组件给一个 subagent，验收通过才派下一个；subagent 不再拆分派发。只有实际错误暴露通用问题时才补充本文件。

从仓库根目录启动对照展示：

```sh
cd components
npm ci
node ../internal-docs/reference/build.mjs
npm run dev
```

对照脚本生成 `public/reference/` 和主题 token；更新基准时重新运行。日常组件构建使用 `npm run build`，不依赖该脚本或克隆。

这次验证得到的提醒：

- CSS 之外还要检查调用方传入的 `defaultStyles`。未定义的颜色变量、内联 border、选择与焦点的优先级都会影响结果；只抄 CSS 不足以复刻。
- Button 的 Enter / Space 在 keydown 触发；禁用后仍可聚焦。Tree 点击箭头只改展开与焦点；选择是独立状态。滚轮归一化、滚动条像素取整也必须对照源码。
- 先确认对照数据映射正确：给叶节点传入 `collapsed` 会使 ObjectTree 把它当作可折叠节点。
