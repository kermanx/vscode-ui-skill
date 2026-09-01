# Composition patterns

These recipes mirror the current Classic workbench. Assemble them from the existing trees, lists, inputs, action bars, badges, progress, and messages. Do not add generic cards, floating containers, or shared surface geometry around them. Walkthrough cards are a component-specific exception described below.

## Explorer

- **Composition.** Let a file tree fill the view body. A row is an icon and name label with optional decorations or a small count; root folders, folders, and files share the same reading axis. Rename in place by replacing the row label with an input rather than opening a dialog.
- **Priority and actions.** The hierarchy and current selection are primary. Put view-wide creation, refresh, collapse, and overflow commands in the view title; put item-specific commands in the row's context menu.
- **Constraint and states.** Ellipsize long names and compress chains of single-child folders before sacrificing the tree. A delayed progress treatment covers folder resolution. With no folder, replace the tree with a short welcome and a direct open-folder action, plus recent or add-folder alternatives when applicable. Keep a root load failure on the affected root; use a notification for a nested failure that has no stable row presentation.

## Search

- **Composition.** Stack search and replace controls above a disclosure for include/exclude scope, then an inline message region, then a folder/file/match tree that consumes the remaining height. Match rows combine line context, the highlighted match or replacement preview, and a trailing action bar.
- **Priority and actions.** Query text and match context are primary. Scope details, line numbers, result counts, and provider messages are secondary. Keep replace hidden until requested, row actions hidden until hover, selection, or focus, and destructive replace-all behind confirmation with visible progress.
- **Constraint and states.** Ellipsize snippets and labels. When a narrow row needs its toolbar, remove count badges before match text. Put malformed-query feedback on the search input. Put canceled, no-result, and no-folder explanations in the message region. Offer the recovery the state actually supports, such as searching again, searching all files, opening Search settings, or opening a folder.

## Source Control

- **Composition.** Use one compressible tree for repository headers, the commit-message editor, an optional provider action, change groups, folders, and resource rows. Within a repository, the commit input precedes the changes it will act on.
- **Priority and actions.** The commit input, provider action, and changed resources are primary. Repository descriptions and counts disambiguate or summarize. Omit a redundant repository wrapper when one provider is visible; restore repository headers when several must be distinguished. Put provider commands in a responsive header toolbar and resource commands in contextual row actions and menus.
- **Constraint and states.** Ellipsize provider and resource labels while keeping icons and actionable controls available. Let the commit editor grow only within bounded vertical space. Anchor validation to that editor and show its detail while the input is engaged. With no repositories, replace the tree with a welcome message that providers can extend with setup actions.

## Run and Debug

- **Composition.** Place the run configuration and start control at the top, then arrange Variables, Watch, Call Stack, and Breakpoints as independently collapsible views. Give Variables and Call Stack more initial space than Watch and Breakpoints; keep loaded scripts collapsed until the active debugger supports them.
- **Priority and actions.** During a session, execution controls and the selected stack frame's data are primary. The control strip changes with state: running offers pause, stopped offers continue and stepping, and attach sessions substitute disconnect behavior for ordinary termination. Keep row actions contextual and errors attached to the failing variable, expression, thread, or frame when that row exists.
- **Constraint and states.** Preserve the start button and configuration affordance while allowing the configuration label to ellipsize. On crowded debug rows, let actions take space from state badges or line metadata before the main label. Show progress while the debugger initializes. When idle, replace runtime data with context-driven welcome content: offer Run and Debug when a debugger is available, open a debuggable file when the active editor is unsuitable, and link to creating a launch configuration or opening a folder when setup requires it. If all debug extensions are disabled, show the explanatory message without inventing enable or install controls.

## Problems

- **Composition.** Put filtering in the view header and use the body for either a resource/diagnostic/related-information tree or an explicitly selected table. The tree preserves diagnostic relationships; the table exposes message, file, source, code, and severity as comparable columns.
- **Priority and actions.** The diagnostic message and owning resource are primary. Source, code, and line details are secondary. Keep quick fixes and row actions hidden until hover, selection, or focus; a quick fix can temporarily take the severity icon's slot instead of widening the row.
- **Constraint and states.** Ellipsize messages, paths, and table cells. Keep tree-versus-table a user choice rather than changing modes merely because width changed. Distinguish a genuinely clean workspace from results hidden by filters; the latter state includes a clear-filters action and a filtered-versus-total count.

## Outline

- **Composition.** Use a single symbol tree beneath a thin progress lane. Sorting, follow-cursor, filter-on-type, and collapse/expand commands belong in the view toolbar rather than in every row.
- **Priority and actions.** Symbol names and hierarchy are primary. Opening a symbol reveals its source location, while sorting and follow-cursor remain optional modes rather than changing the base composition.
- **Constraint and states.** Make loading, message, and tree mutually exclusive body states. Delay the loading message and indeterminate progress enough to avoid flashing them for fast symbol providers. Use distinct messages when the active editor cannot provide an outline and when it can but returns no symbols.

## Settings

- **Composition.** Keep search persistent at the top, place scope selectors immediately below it, and split the body into a settings table of contents and a settings list. A setting row reads as category and label, indicators, description, then its control; deprecation and validation stay with that row.
- **Priority and actions.** Search and the settings list are primary. The table of contents, result count, sync note, and per-setting indicators are secondary. Reveal the per-setting overflow action from the title area on hover or focus instead of reserving a permanently busy action column.
- **Constraint and states.** Remove the table of contents at narrow widths while preserving search, scope, and the same settings list. Let controls use the full row or a key/value split as their data requires. During search, use delayed progress. If filters produce no settings, replace both navigation and results with a no-results message and a clear-filters action.

## Extensions

- **Composition.** Put a search field and search actions in the view header, then show context-appropriate result panes such as installed, recommended, or marketplace results. Each pane owns its count, message, and extension list. An extension row combines artwork, name, short description, publisher, status or metrics, and install/manage actions.
- **Priority and actions.** The extension name, concise purpose, and applicable install or manage command are primary. Publisher, ratings, install count, runtime location, and update state are supporting information. Keep extension-wide status such as disabled or incompatible extensions, restart requirements, and private-marketplace state in the dismissible header notification; keep query-specific messages inside the pane they affect.
- **Constraint and states.** As width tightens, reduce or remove artwork, ratings, and secondary badges before name, description, and actions. Use row-shaped placeholders while results load. Replace an empty list with a pane-local no-results message. Keep recoverable offline or query problems in that pane; use notifications for action failures or service errors that are not owned by one result pane.

## Terminal

- **Composition.** Give the terminal canvas the high-priority side of a split and an optional terminal list the low-priority side. The list row combines icon, name, optional description and status, and contextual actions; editing the name happens inline. Split terminals remain within the primary canvas and use a restrained seam between instances.
- **Priority and actions.** The active terminal's text and cursor are primary. Terminal identity, grouping, and status are secondary. Hide the terminal list when it adds no information for a single terminal or group; reveal row actions on hover, selection, or focus.
- **Constraint and states.** Collapse the terminal list to icons before taking useful width from the canvas, dropping descriptions with the text mode. Choose one primary status visual from competing statuses by severity, but do not let a text-only status displace an existing icon status. Opening an empty terminal view creates an instance when process support is available; creation failures surface as notifications instead of leaving an unexplained blank canvas.

## Feedback and notifications

- **Choose the smallest scope that owns the problem.** Input validation belongs beside its input; empty, filtered, loading, and query errors belong in the affected surface or pane; row-scoped failures belong on the row. Escalate to a notification when an operation has no durable local owner, fails after leaving the surface, or needs a workbench-level recovery action.
- **Compose a notification in two levels.** The collapsed row is severity, message, and contextual toolbar. Expansion reveals wrapped detail, source, and primary action buttons; progress spans the item. Do not offer close while progress is running. Keep secondary configuration, expansion, and dismissal controls out of the resting row until hover, focus, or expansion.
- **Separate interruption from history.** Transient toasts announce recent work without replacing the focused surface; a notification center retains the list, unread state, in-progress indication, filtering, and clear-all controls. When available height cannot fit every toast, queue the overflow while retaining it in the center.

## Empty workspace

- **Use the shell rather than placeholder data.** Replace the Explorer tree with a no-folder welcome whose primary recovery opens a folder; offer recent workspaces or adding a folder as secondary paths when they apply. Feature views that require a workspace state the missing prerequisite in their own body and link directly to the corresponding recovery.
- **Keep the editor canvas quiet but useful.** An empty editor group can show a small shortcut watermark for a few high-value commands. In an empty window, open file or folder and open recent join universal commands; in an existing workspace, workspace navigation and tool commands take their place.
- **Preserve user context in the wording and action.** If opening a folder would close current editors, offer adding a folder as the non-destructive alternative.

## Welcome and getting started

- **Composition.** On the index, separate immediate Start commands, Recent workspaces, and Walkthrough cards under a restrained product header, with low-priority startup preferences in the footer. Keep the groups bounded: Start shows up to ten entries without a More link, while Recent and Walkthroughs show up to five entries and can expose More.
- **Priority and actions.** Start actions are primary; recent workspaces resume context; walkthroughs are optional guided work. A walkthrough detail view pairs a step list with explanatory media, exposes progress on its card, and puts the step's action inside the expanded step.
- **Constraint and states.** Stack the index columns and remove the oversized header when space is constrained. In walkthrough details, remove media before the step list. When there are no walkthroughs, give the Recent list the freed column and allow it to show more entries. When there are no recent workspaces, explain the state inline and offer open folder.
