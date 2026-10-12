/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */
// Shared specimen data: the pinned fixture (internal-docs/reference/codicon.ts) and the Vue
// specimen build the same cells from these entries, so the two pages can be compared one by one.
export interface CodiconDemo {
  /** ThemeIcon id. A single `~modifier` suffix (spin / disabled) is allowed, exactly as in the workbench. */
  id: string;
  /** Adds codicon-modifier-disabled on top of whatever modifier the id already carries. */
  disabled?: boolean;
  /** Inline style, used for the font-size override case. */
  style?: string;
}

const ids = (list: string[]): CodiconDemo[] => list.map(id => ({ id }));

export const plainIcons = ids(['add', 'chevron-down', 'chevron-right', 'close', 'file-code', 'file-text', 'folder-opened', 'lightbulb',
  'search', 'settings-gear', 'source-control', 'terminal', 'git-branch', 'debug-alt', 'error', 'warning', 'info',
  'symbol-class', 'symbol-method', 'symbol-enum', 'wrench', 'folder', 'check',
  'dialog-error', 'dialog-warning', 'dialog-info', 'dialog-close', 'toolbar-more', 'quick-input-back', 'drop-down-button',
  'tree-item-expanded', 'tree-filter-on-type-on', 'tree-filter-on-type-off', 'tree-filter-clear', 'menu-selection', 'menu-submenu',
  'menubar-more', 'scrollbar-button-left', 'scrollbar-button-right', 'scrollbar-button-up', 'scrollbar-button-down',
  'symbol-customcolor', 'workspace-unspecified', 'lightbulb-sparkle-autofix', 'debug-breakpoint-pending']);
// `sync` and `gear` only spin with codicon-modifier-spin, `loading` spins on its own.
export const modifierIcons = ids(['sync', 'sync~spin', 'gear~spin', 'loading', 'loading~spin', 'notebook-state-executing~spin', 'tree-item-loading', 'wrench-subaction']);
export const disabledIcons: CodiconDemo[] = [{ id: 'check', disabled: true }, { id: 'folder', disabled: true }, { id: 'sync~spin', disabled: true }];
export const coloredIcons = ids(['symbol-class', 'symbol-method', 'symbol-enum']);
// Icons inside a label: `$(iconId) text` loses its markers for screen readers, `\$(iconId)` stays literal.
export const labelTexts = ['$(sync~spin) Syncing $(check) 2 changes', '$(warning) Problems $(error) 1', 'Escaped \\$(icon) stays literal'];
export const sizeContexts: { id: string; fontSize: string }[] = [{ id: 'add', fontSize: '12px' }, { id: 'gear', fontSize: '20px' }, { id: 'check', fontSize: '2em' }];
export const inlineSizeIcon: CodiconDemo = { id: 'error', style: 'font-size:24px' };

export const demoKey = (row: string, demo: CodiconDemo) => `${row}/${demo.id}${demo.disabled ? '~disabled' : ''}`;

/** `sync~spin` -> `{ name: 'sync', spin: true }`, the ThemeIcon modifier syntax the workbench uses. */
export function splitDemoId(id: string): { name: string; spin: boolean } {
  const index = id.lastIndexOf('~');
  return index === -1 ? { name: id, spin: false } : { name: id.substring(0, index), spin: id.substring(index + 1) === 'spin' };
}

export const demoStateId = (demo: CodiconDemo) => `${demo.id}${demo.disabled ? '~disabled' : ''}`;
