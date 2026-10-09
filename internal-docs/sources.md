# 内部来源与验收记录（不随组件发布）

基准：`vscode/`，提交 `114d61e889475758fd1c3b3fcbdd04e9717940c4`；Modern UI 关闭。下面的源码路径均相对于该目录。

- Button：`src/vs/base/browser/ui/button/button.ts` 的 DOM、颜色状态、keydown、disabled；同目录 `button.css` 原样复制到组件目录。
- DropdownButton：同文件的 `ButtonWithDropdown`；菜单来自 `src/vs/base/browser/ui/menu/menu.ts` 的 Classic CSS、菜单项与 `actionbar.ts` 键盘行为。原版对照实际运行 `ContextMenuHandler` / `ContextView`，涵盖定位、关闭与焦点恢复。
- Tree：`src/vs/base/browser/ui/tree/abstractTree.ts`（缩进、展开、焦点）、`objectTree.ts`；`src/vs/base/browser/ui/list/listWidget.ts`（鼠标、多选、键盘、分页、主题优先级）。同步数据、22px 行高、8px 缩进、常显缩进线，关闭平滑滚动与横向滚动。
- Tree 基础 CSS：`src/vs/base/browser/ui/tree/media/tree.css`、`src/vs/base/browser/ui/list/list.css`、`src/vs/base/browser/ui/scrollbar/media/scrollbars.css` 原样保留在 Tree 的 `upstream/`。
- 树行组合：`src/vs/workbench/browser/parts/views/treeView.ts` 的 `TreeRenderer`，`media/views.css` 中标签与操作栏样式；`iconLabel/iconLabel.ts`、`iconlabel.css`、`actionbar/actionbar.ts`、`actionbar.css`。装饰逻辑来自 `services/decorations/browser/decorationsService.ts`，对照程序直接运行 `IconLabel`、`ActionBar`、`DecorationsService`。Git 默认色来自 `extensions/git/package.json`。
- 滚动：`src/vs/base/browser/mouseEvent.ts` 的 `StandardWheelEvent` 提取到 `src/internal/standardWheelEvent.ts`（环境标志本地化、target 类型允许 null）；滚动条尺寸与拖动取整来自 `src/vs/base/browser/ui/scrollbar/scrollbarState.ts`，滚轮步长来自同目录 `scrollableElement.ts`。
- 主题：`src/vs/platform/theme/common/colorRegistry.ts`、`src/vs/workbench/common/theme.ts` 和 `extensions/theme-defaults/themes/{dark_plus,light_plus,hc_black,hc_light}.json`。调用方样式采用 `src/vs/platform/theme/browser/defaultStyles.ts`。字体、焦点与绘制上下文来自 `src/vs/workbench/browser/media/style.css`。
- 菜单尺寸使用 `platform/theme/common/sizeRegistry.ts` 的默认值；阴影取 `workbench/browser/media/style.css`。主题导入对齐 `workbench/services/themes/common/colorThemeData.ts` 的 JSONC、include 和 colors 覆盖规则，仅迁移显式配色，未重建完整注册表的派生颜色算法。

内部验证：按 [README.md](README.md) 生成原版对照，再在 `components/` 运行 `npm test`。

当前比较环境：macOS + Playwright Chromium，DPR 1。默认截图零容差；高对比度次按钮圆角边框 / 焦点轮廓的 Chromium 增量栅格化存在 ≤2/255 通道变化（包括焦点离开后），仅在该按钮四角 8px 内豁免此级别变化，同时精确比较布局、字体、边框和颜色。Tree 与其余像素没有放宽。
