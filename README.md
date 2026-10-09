# VS Code UI Skills

## Repository layout

- [`skills/`](skills/) — installable agent skills.
- [`components/`](components/) — self-contained Vue + UnoCSS component examples, Storybook, and tests.
- [`internal-docs/`](internal-docs/) — development notes, source mappings, and the original-component comparison fixture; excluded from the component package.
- [`vscode/`](vscode/) — pinned source reference.


## vscode-ui

A framework-agnostic agent skill for building developer interfaces in the current VS Code Classic workbench visual language: the default UI with `workbench.experimental.modernUI` disabled. It covers design foundations, workbench structure, controls, collections, navigation, overlays, editor surfaces, interaction states, and representative compositions.

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
