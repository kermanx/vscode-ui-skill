import type { ActionBarEntry } from '../src/components/action-bar/types';
import type { MenuEntry } from '../src/components/menu/types';
export const toolbarPrimary: readonly ActionBarEntry[] = [
  { id: 'new-file', label: 'New File', icon: 'new-file', keybinding: '⌘N' },
  { id: 'refresh', label: 'Refresh', icon: 'refresh', disabled: true },
  { id: 'pin', label: 'Pin', icon: 'pin', checked: true },
  { separator: true },
  { id: 'collapse', label: 'Collapse All', icon: 'collapse-all' },
];
export const toolbarSecondary: readonly MenuEntry[] = [
  { id: 'save-all', label: 'Save All', keybinding: '⌥⌘S' },
  { id: 'auto-save', label: 'Auto Save', checked: true },
  { separator: true },
  { id: 'archive', label: 'Archive', disabled: true },
  { id: 'layout', label: 'Layout', children: [{ id: 'left', label: 'Move Left' }, { id: 'right', label: 'Move Right' }] },
];
export const toolbarExamples = [
  { id: 'primary', primary: toolbarPrimary, secondary: [] as readonly MenuEntry[], ariaLabel: 'Primary actions' },
  { id: 'secondary', primary: toolbarPrimary, secondary: toolbarSecondary, ariaLabel: 'File actions' },
  { id: 'overflow', primary: toolbarPrimary, secondary: toolbarSecondary, maxItems: 3, ariaLabel: 'Limited actions' },
  { id: 'title', primary: toolbarPrimary.slice(0, 3), secondary: toolbarSecondary, ariaLabel: 'Explorer actions', alignment: 'right' as const },
  { id: 'panel', primary: toolbarPrimary.slice(0, 3), secondary: toolbarSecondary, ariaLabel: 'Project files actions', alignment: 'right' as const },
];
export const toolbarTreeNodes = [{ id: 'index', label: 'index.ts', icon: 'file-code' }, { id: 'package', label: 'package.json', icon: 'json' }, { id: 'readme', label: 'README.md', icon: 'markdown' }];
