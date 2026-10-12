import type { MenuEntry } from '../src/components/menu/types';
export const contextMenuActions: MenuEntry[] = [
  { id: 'open', label: 'Open', keybinding: '↩' },
  { id: 'pin', label: 'Pin', checked: true },
  { separator: true },
  { id: 'rename', label: 'Rename', disabled: true },
  { id: 'move', label: 'Move', children: [
    { id: 'left', label: 'Move Left' },
    { id: 'more', label: 'More', children: [{ id: 'window', label: 'New Window' }, { id: 'group', label: 'New Group' }] },
  ] },
];
export const contextMenuItems = [
  { id: 'alpha', label: 'alpha.ts', icon: 'file-code' },
  { id: 'beta', label: 'beta.ts', icon: 'file-code' },
  { id: 'readme', label: 'README.md', icon: 'markdown' },
];

export const longContextMenuActions: MenuEntry[] = Array.from({ length: 30 }, (_, index) => ({ id: `command-${index}`, label: `Command ${String(index + 1).padStart(2, '0')}` }));

export const contextMenuVariants: Record<'empty' | 'first' | 'second', MenuEntry[]> = {
  empty: [], first: [{ id: 'open-alpha', label: 'Open alpha.ts' }],
  second: [{ id: 'open-beta', label: 'Open beta.ts' }, { id: 'pin-beta', label: 'Pin beta.ts', checked: true }],
};
