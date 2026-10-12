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

A framework-agnostic agent skill for building developer interfaces in the current VS Code Classic workbench visual language: the UI with `workbench.experimental.modernUI` explicitly disabled. It covers design foundations, workbench structure, controls, collections, navigation, overlays, editor surfaces, interaction states, and representative compositions.

### Install

Install interactively with the Vercel Skills CLI:

```bash
npx skills add kermanx/vscode-ui-skill --skill vscode-ui
```

Install globally for Codex:

```bash
npx skills add kermanx/vscode-ui-skill --skill vscode-ui --global --agent codex --yes
```

The skill entrypoint is [`skills/vscode-ui/SKILL.md`](skills/vscode-ui/SKILL.md). Supporting references are loaded on demand.

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
