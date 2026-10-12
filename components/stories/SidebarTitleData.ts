import type { ActionBarEntry } from '../src/components/action-bar/types';
import type { MenuEntry } from '../src/components/menu/types';

export const sidebarTitlePrimary: ActionBarEntry[] = [
  { id: 'new-file', label: 'New File...', icon: 'new-file' },
  { id: 'new-folder', label: 'New Folder...', icon: 'new-folder' },
  { id: 'refresh', label: 'Refresh Explorer', icon: 'refresh' },
  { id: 'collapse', label: 'Collapse Folders in Explorer', icon: 'collapse-all' },
];
export const sidebarTitleSecondary: MenuEntry[] = [
  { id: 'open-editors', label: 'Open Editors', checked: true },
  { id: 'folders', label: 'Folders', checked: true },
  { separator: true },
  { id: 'outline', label: 'Outline' },
  { id: 'timeline', label: 'Timeline' },
];
export const sidebarTitleExamples = [
  { id: 'plain', title: 'Explorer', primary: [], secondary: [] },
  { id: 'actions', title: 'Explorer', keybinding: '⇧⌘E', primary: sidebarTitlePrimary, secondary: sidebarTitleSecondary },
  { id: 'long', title: 'Workspace files and folders with a long title', primary: sidebarTitlePrimary, secondary: sidebarTitleSecondary },
  { id: 'disabled', title: 'Source Control', primary: [{ id: 'commit', label: 'Commit', icon: 'check', disabled: true }], secondary: [] },
  { id: 'secondary', title: 'Extensions', primary: [], secondary: sidebarTitleSecondary },
  { id: 'dynamic', title: 'Search', primary: [{ id: 'refresh', label: 'Refresh', icon: 'refresh' }], secondary: [] },
];
