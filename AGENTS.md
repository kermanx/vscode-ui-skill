# 项目结构

- `skills/`：可安装的 skills；`vscode-ui/SKILL.md` 放必读指导，`references/component-index.md` 放组件索引。
- `components/src/`：参考组件、样式、主题与共享逻辑；`index.ts` 是公共入口。
- `components/stories/`：Storybook 示例；`components/tests/`：交互与原版对照测试。
- `internal-docs/`：开发约定、来源记录和对照工具。
- `vscode/`：供开发时参考的 VS Code 源码子模块。

# 组件索引

每次新增或删除组件，必须同步更新 [component-index.md](skills/vscode-ui/references/component-index.md)，并修正相关条目的引用。
