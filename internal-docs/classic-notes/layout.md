# Layout and surface selection

Use this reference before styling when deciding where a feature belongs in the
workbench. It defines the roles of the major surfaces, not their CSS or exact
geometry. Read [workbench shell](./workbench-shell.md) after the surface roles
are settled.

## Workbench model

Treat the workbench as containers that own items:

- The Activity Bar is a navigation surface for View Containers shown in the
  Primary Sidebar.
- The Primary and Secondary Sidebars render related Views. The Secondary
  Sidebar is an auxiliary location.
- The Editor contains one or more Editor Groups. Editor tabs represent open
  items and let users navigate between them.
- The Panel exposes View Containers such as Terminal, Problems, and Output.
  These can appear one at a time as panel tabs or in a split layout.
- The Status Bar provides contextual information and actions for the workspace
  and active file.

## Choose the surface

### Editor tabs

Use an editor tab for an open item in the Editor area. Files are the standard
case. Custom editors can present an alternative view of a resource, while an
editor webview can present distinct custom UI or a visualization.

Tabs provide navigation among open items and participate in Editor Groups. Do
not treat these statements as a general rule for tabs inside unrelated
controls; the official documentation describes editor tabs specifically.

### Panel tabs

Use the Panel for supporting functionality, especially Views that benefit from
horizontal space. Do not place a View there when it must remain visible: users
often minimize the Panel. Custom webview content placed there must resize and
reflow when moved to a Sidebar.

### Sidebars

Use a Sidebar to group related Views and content. Use the Secondary Sidebar as
an auxiliary location. Do not add Sidebar content that could be a simple
command, and do not duplicate existing functionality.

### Status Bar

Use the Status Bar for concise information and actions related to the workspace
or current context:

- Put primary, workspace-wide items on the left.
- Put secondary or active-file-context items on the right.
- Use short labels and icons only when they have a clear, necessary metaphor.
- Keep contributions limited; avoid multiple items unless necessary.
- Use a loading icon for discreet background progress. Move progress that needs
  attention to a progress notification.
- Reserve warning or error backgrounds for exceptional, highly visible states.

Do not use custom Status Bar colors.

## Sources

These roles come from the official VS Code documentation rather than inferred
CSS structure:

- [UX Guidelines overview](https://code.visualstudio.com/api/ux-guidelines/overview)
- [User interface: Tabs](https://code.visualstudio.com/docs/editing/getting-started/userinterface#_tabs)
- [Panel](https://code.visualstudio.com/api/ux-guidelines/panel)
- [Sidebars](https://code.visualstudio.com/api/ux-guidelines/sidebars)
- [Status Bar](https://code.visualstudio.com/api/ux-guidelines/status-bar)
- [Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
