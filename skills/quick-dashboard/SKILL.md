---
name: quick-dashboard
description: Build dashboards quickly with the required UI skill, highlighting, frontend stack, communication channel, task lifecycle, and trajectory UI library.
---

# Build a Dashboard Quickly

## UI

Use the [vscode-ui](../vscode-ui/SKILL.md) skill.

## Highlighting

Use Shiki for highlighting.

## Frontend Stack

Use Vite, Vue, and UnoCSS. Use `@unocss/preset-icons` with Iconify JSON for icons.

For a DSH plugin, use React and Tailwind CSS instead.

## Third-Party Software Configuration

When third-party software configuration is needed, never use the machine's global configuration directly unless the user specifies otherwise. Copy the global configuration into the repository, and store secrets in `.env`.

## Multiple Configurations

When multiple configurations are involved, prefer convention over configuration wherever possible, and use TypeScript configuration files.

Put each configuration component in its own file:

```ts
export default defineSomeConfigValue((options?: Options) => {
  // ...
})
```

A configuration file can import and compose these components:

```ts
import ConfigValue1 from '...'

export default defineConfig({
  configKey: [ConfigValue1({ option: value })],
})
```

## Communication

Use the Vite hot channel for communication whenever possible.

## Task Lifecycle

For long-running tasks, such as a task that must keep running in the background, use the relevant operating system facilities so the tasks continue running after the dashboard process restarts.

For tasks that are not long-running and instead run one round at a time, call Vite's `createServer` directly in the task script to start the dashboard in the same process. The dashboard and the task must share the same lifetime.

## Runtime Data

Persist all runtime data instead of placing it in a temporary directory for each run. The persistence directory should generally be a Git-ignored folder in the current repository, and its internal structure must be carefully considered.

## Logs

Keep logs available for review. Logs must be append-only, and their format may be loose and pragmatic.

## Agent Trajectories

If the dashboard involves agent trajectories, use Trajectory UI Lib instead of implementing the trajectory UI yourself. Ask the user for the library path when needed.
