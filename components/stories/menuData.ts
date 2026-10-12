import type { MenuEntry } from '../src/components/menu/types';
export const menuActions: MenuEntry[] = [
  { id: 'new', label: 'New File', keybinding: '⌘N' },
  { id: 'save', label: 'Save', keybinding: '⌘S', disabled: true },
  { separator: true },
  { id: 'auto-save', label: 'Auto Save', checked: true },
  { id: 'word-wrap', label: 'Word Wrap', checked: false },
  { separator: true },
  { id: 'recent', label: 'Open Recent', children: [
    { id: 'workspace', label: 'Workspace', keybinding: '⌃R' },
    { id: 'readme', label: 'README.md' },
    { separator: true },
    { id: 'more', label: 'More', children: [{ id: 'archive', label: 'Archive' }, { id: 'templates', label: 'Templates' }] },
  ] },
  { id: 'empty', label: 'Empty Group', children: [] },
];
export const longMenuActions: MenuEntry[] = Array.from({ length: 40 }, (_, index) => ({ id: `command-${index}`, label: `Command ${index + 1}` }));
