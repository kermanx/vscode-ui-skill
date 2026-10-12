# VS Code UI Skills

[Browse the live Storybook](https://kermanx.github.io/vscode-ui-skill/) · [Open the workbench demo](https://kermanx.github.io/vscode-ui-skill/?path=/story/compositions-workbench--demo)

The Storybook includes interactive Vue examples and original VS Code comparisons. GitHub Actions rebuilds and deploys it when component or reference code changes on `main`; the deployment can also be run manually.

## Repository layout

- [`skills/`](skills/) — installable agent skills.
- [`components/`](components/) — self-contained Vue + UnoCSS component examples, Storybook, and tests.
- [`internal-docs/`](internal-docs/) — development notes, source mappings, and the original-component comparison fixture; excluded from the component package.
- [`vscode/`](vscode/) — pinned source reference.

## VS Code source reference

[`vscode/`](vscode) is a shallow Git submodule of [microsoft/vscode](https://github.com/microsoft/vscode), pinned to a specific commit for checking component implementations, styles, and theme roles. It is reference material for maintaining the skills and is not required to install or use them.

Initialize it after cloning this repository:

```bash
git submodule update --init --depth 1 vscode
```

The submodule also declares `shallow = true` in `.gitmodules` so new submodule clones default to shallow history.

## vscode-ui

A framework-agnostic agent skill for adapting the styles and behavior of this repository's Classic component code to a project's own UI. The reference targets VS Code with `workbench.experimental.modernUI` disabled. Agents read source from a cached Git clone and record the reference revision and components in derived code comments.

### Install

Install interactively with the Vercel Skills CLI:

```bash
npx skills add kermanx/vscode-ui-skill --skill vscode-ui
```

Install globally for Codex:

```bash
npx skills add kermanx/vscode-ui-skill --skill vscode-ui --global --agent codex --yes
```

For project work, install into the project's `.agents/skills` even when a global installation exists. Prefer the project installation for shared guidance.

The entrypoint [`skills/vscode-ui/SKILL.md`](skills/vscode-ui/SKILL.md) contains all required guidance: source access, adaptation, provenance, updates, and verification. The optional [component index](skills/vscode-ui/references/component-index.md) locates implementations and related components. Reading the reference requires no build, Storybook setup, or VS Code submodule initialization. Projects must not directly depend on code or assets in the installed skill or reference cache.

## quick-dashboard

An agent skill for building dashboards quickly with the required UI skill, highlighting, frontend stack, communication channel, task lifecycle, and trajectory UI library.

### Install

Install interactively with the Vercel Skills CLI:

```bash
npx skills add kermanx/vscode-ui-skill --skill quick-dashboard
```

Install globally for Codex:

```bash
npx skills add kermanx/vscode-ui-skill --skill quick-dashboard --global --agent codex --yes
```

The skill entrypoint is [`skills/quick-dashboard/SKILL.md`](skills/quick-dashboard/SKILL.md).
