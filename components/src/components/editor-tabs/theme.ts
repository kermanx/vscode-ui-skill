// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import { Color } from "../../internal/color";
export function editorTabsTheme(
  colors: Record<string, string>,
  highContrast: boolean,
  light: boolean,
  scope: string,
): string {
  const rules: string[] = [];
  const collector = { addRule: (rule: string) => rules.push(rule) };
  const theme = {
    getColor: (id: string) =>
      colors[id] ? Color.Format.CSS.parse(colors[id].replace(/([,(]\s*)\./g, "$10.")) : undefined,
  };
  const isSafari =
    typeof navigator !== "undefined" &&
    /Safari/.test(navigator.userAgent) &&
    !/Chrome|Chromium/.test(navigator.userAgent);

  // Add bottom border to tabs when wrapping
  const borderColor = theme.getColor("tab.border");
  if (borderColor) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title > .tabs-and-actions-container.wrapping .tabs-container > .tab {
				border-bottom: 1px solid ${borderColor};
			}
		`);
  }

  // Styling with Outline color (e.g. high contrast theme)
  const activeContrastBorderColor = theme.getColor("contrastActiveBorder");
  if (activeContrastBorderColor) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab.active,
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab.active:hover  {
				outline: 1px solid;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.selected:not(.active):not(:hover)  {
				outline: 1px dotted;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab.active:focus {
				outline-style: dashed;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active {
				outline: 1px dashed;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				outline: 1px dashed;
				outline-offset: -5px;
			}

			.monaco-workbench:not(.modern-ui-tabs) .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active > .tab-actions .action-label,
			.monaco-workbench:not(.modern-ui-tabs) .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active:hover > .tab-actions .action-label,
			.monaco-workbench:not(.modern-ui-tabs) .part.editor > .content .editor-group-container > .title .tabs-container > .tab.dirty > .tab-actions .action-label,
			.monaco-workbench:not(.modern-ui-tabs) .part.editor > .content .editor-group-container > .title .tabs-container > .tab.sticky > .tab-actions .action-label,
			.monaco-workbench:not(.modern-ui-tabs) .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover > .tab-actions .action-label {
				opacity: 1 !important;
			}
		`);
  }

  // High Contrast Border Color for Editor Actions
  const contrastBorderColor = theme.getColor("contrastBorder");
  if (contrastBorderColor) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .editor-actions {
				outline: 1px solid ${contrastBorderColor}
			}
		`);
  }

  // Hover Background
  const tabHoverBackground = theme.getColor("tab.hoverBackground");
  if (tabHoverBackground) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:not(.selected):hover {
				background-color: ${tabHoverBackground} !important;
			}
		`);
  }

  const tabUnfocusedHoverBackground = theme.getColor(
    "tab.unfocusedHoverBackground",
  );
  if (tabUnfocusedHoverBackground) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:not(.selected):hover  {
				background-color: ${tabUnfocusedHoverBackground} !important;
			}
		`);
  }

  // Hover Foreground
  const tabHoverForeground = theme.getColor("tab.hoverForeground");
  if (tabHoverForeground) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:not(.selected):hover  {
				color: ${tabHoverForeground} !important;
			}
		`);
  }

  const tabUnfocusedHoverForeground = theme.getColor(
    "tab.unfocusedHoverForeground",
  );
  if (tabUnfocusedHoverForeground) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:not(.selected):hover  {
				color: ${tabUnfocusedHoverForeground} !important;
			}
		`);
  }

  // Hover Border
  //
  // Unfortunately we need to copy a lot of CSS over from the
  // the base tab rules because we want to reuse the same
  // styles we already have for the normal bottom-border.
  const tabHoverBorder = theme.getColor("tab.hoverBorder");
  if (tabHoverBorder) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover > .tab-border-bottom-container {
				display: var(--editor-tab-border-indicator-display, block);
				position: absolute;
				left: 0;
				pointer-events: none;
				width: 100%;
				z-index: 10;
				bottom: 0;
				height: 1px;
				background-color: ${tabHoverBorder};
			}
		`);
  }

  const tabUnfocusedHoverBorder = theme.getColor("tab.unfocusedHoverBorder");
  if (tabUnfocusedHoverBorder) {
    collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover > .tab-border-bottom-container  {
				display: var(--editor-tab-border-indicator-display, block);
				position: absolute;
				left: 0;
				pointer-events: none;
				width: 100%;
				z-index: 10;
				bottom: 0;
				height: 1px;
				background-color: ${tabUnfocusedHoverBorder};
			}
		`);
  }

  // Fade out styles via linear gradient (when tabs are set to shrink or fixed)
  // But not when:
  // - in high contrast theme
  // - if we have a contrast border (which draws an outline - https://github.com/microsoft/vscode/issues/109117)
  // - on Safari (https://github.com/microsoft/vscode/issues/108996)
  if (!highContrast && !isSafari && !activeContrastBorderColor) {
    const workbenchBackground = Color.fromHex(light ? "#f3f3f3" : "#252526");
    const editorBackgroundColor = theme.getColor("editor.background");
    const editorGroupHeaderTabsBackground = theme.getColor(
      "editorGroupHeader.tabsBackground",
    );
    const editorDragAndDropBackground = theme.getColor(
      "editorGroup.dropBackground",
    );

    let adjustedTabBackground: Color | undefined;
    if (editorGroupHeaderTabsBackground && editorBackgroundColor) {
      adjustedTabBackground = editorGroupHeaderTabsBackground.flatten(
        editorBackgroundColor,
        editorBackgroundColor,
        workbenchBackground,
      );
    }

    let adjustedTabDragBackground: Color | undefined;
    if (
      editorGroupHeaderTabsBackground &&
      editorBackgroundColor &&
      editorDragAndDropBackground &&
      editorBackgroundColor
    ) {
      adjustedTabDragBackground = editorGroupHeaderTabsBackground.flatten(
        editorBackgroundColor,
        editorDragAndDropBackground,
        editorBackgroundColor,
        workbenchBackground,
      );
    }

    // Adjust gradient for focused and unfocused hover background
    const makeTabHoverBackgroundRule = (
      color: Color,
      colorDrag: Color,
      hasFocus = false,
    ) => `
			.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${hasFocus ? ".active" : ""} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after,
			.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${hasFocus ? ".active" : ""} > .title .tabs-container > .tab.sizing-fixed:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after {
				background: linear-gradient(to left, ${color}, transparent) !important;
			}

			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${hasFocus ? ".active" : ""} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after,
			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${hasFocus ? ".active" : ""} > .title .tabs-container > .tab.sizing-fixed:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after {
				background: linear-gradient(to left, ${colorDrag}, transparent) !important;
			}
		`;

    // Adjust gradient for (focused) hover background
    if (
      tabHoverBackground &&
      adjustedTabBackground &&
      adjustedTabDragBackground
    ) {
      const adjustedColor = tabHoverBackground.flatten(adjustedTabBackground);
      const adjustedColorDrag = tabHoverBackground.flatten(
        adjustedTabDragBackground,
      );
      collector.addRule(
        makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag, true),
      );
    }

    // Adjust gradient for unfocused hover background
    if (
      tabUnfocusedHoverBackground &&
      adjustedTabBackground &&
      adjustedTabDragBackground
    ) {
      const adjustedColor = tabUnfocusedHoverBackground.flatten(
        adjustedTabBackground,
      );
      const adjustedColorDrag = tabUnfocusedHoverBackground.flatten(
        adjustedTabDragBackground,
      );
      collector.addRule(
        makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag),
      );
    }

    // Adjust gradient for drag and drop background
    if (editorDragAndDropBackground && adjustedTabDragBackground) {
      const adjustedColorDrag = editorDragAndDropBackground.flatten(
        adjustedTabDragBackground,
      );
      collector.addRule(`
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container.active > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.active):not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container:not(.active) > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container.active > .title .tabs-container > .tab.sizing-fixed.dragged-over:not(.active):not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container:not(.active) > .title .tabs-container > .tab.sizing-fixed.dragged-over:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${adjustedColorDrag}, transparent) !important;
				}
		`);
    }

    const makeTabBackgroundRule = (
      color: Color,
      colorDrag: Color,
      focused: boolean,
      active: boolean,
    ) => `
				.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${focused ? ".active" : ":not(.active)"} > .title .tabs-container > .tab.sizing-shrink${active ? ".active" : ""}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${focused ? ".active" : ":not(.active)"} > .title .tabs-container > .tab.sizing-fixed${active ? ".active" : ""}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${color}, transparent);
				}

				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${focused ? ".active" : ":not(.active)"} > .title .tabs-container > .tab.sizing-shrink${active ? ".active" : ""}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${focused ? ".active" : ":not(.active)"} > .title .tabs-container > .tab.sizing-fixed${active ? ".active" : ""}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${colorDrag}, transparent);
				}
		`;

    // Adjust gradient for focused active tab background
    const tabActiveBackground = theme.getColor("tab.activeBackground");
    if (
      tabActiveBackground &&
      adjustedTabBackground &&
      adjustedTabDragBackground
    ) {
      const adjustedColor = tabActiveBackground.flatten(adjustedTabBackground);
      const adjustedColorDrag = tabActiveBackground.flatten(
        adjustedTabDragBackground,
      );
      collector.addRule(
        makeTabBackgroundRule(adjustedColor, adjustedColorDrag, true, true),
      );
    }

    // Adjust gradient for unfocused active tab background
    const tabUnfocusedActiveBackground = theme.getColor(
      "tab.unfocusedActiveBackground",
    );
    if (
      tabUnfocusedActiveBackground &&
      adjustedTabBackground &&
      adjustedTabDragBackground
    ) {
      const adjustedColor = tabUnfocusedActiveBackground.flatten(
        adjustedTabBackground,
      );
      const adjustedColorDrag = tabUnfocusedActiveBackground.flatten(
        adjustedTabDragBackground,
      );
      collector.addRule(
        makeTabBackgroundRule(adjustedColor, adjustedColorDrag, false, true),
      );
    }

    // Adjust gradient for focused inactive tab background
    const tabInactiveBackground = theme.getColor("tab.inactiveBackground");
    if (
      tabInactiveBackground &&
      adjustedTabBackground &&
      adjustedTabDragBackground
    ) {
      const adjustedColor = tabInactiveBackground.flatten(
        adjustedTabBackground,
      );
      const adjustedColorDrag = tabInactiveBackground.flatten(
        adjustedTabDragBackground,
      );
      collector.addRule(
        makeTabBackgroundRule(adjustedColor, adjustedColorDrag, true, false),
      );
    }

    // Adjust gradient for unfocused inactive tab background
    const tabUnfocusedInactiveBackground = theme.getColor(
      "tab.unfocusedInactiveBackground",
    );
    if (
      tabUnfocusedInactiveBackground &&
      adjustedTabBackground &&
      adjustedTabDragBackground
    ) {
      const adjustedColor = tabUnfocusedInactiveBackground.flatten(
        adjustedTabBackground,
      );
      const adjustedColorDrag = tabUnfocusedInactiveBackground.flatten(
        adjustedTabDragBackground,
      );
      collector.addRule(
        makeTabBackgroundRule(adjustedColor, adjustedColorDrag, false, false),
      );
    }
  }
  return rules.join("\n").replaceAll(".monaco-workbench", scope);
}
