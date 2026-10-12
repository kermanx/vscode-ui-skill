import type { ListItem } from '../src/components/list/types';
const close = [{ id: 'close', label: 'Close', icon: 'close' }];
export const listItems: ListItem[] = [
  { id: 'app', label: 'App.vue', description: 'src', icon: 'file-code', actions: close },
  { id: 'button', label: 'Button.vue', description: 'src/components', icon: 'file-code', actions: close, decoration: { badge: 'M', color: 'gitDecoration.modifiedResourceForeground', tooltip: 'Modified' } },
  { id: 'readme', label: 'README.md', icon: 'markdown', actions: close, italic: true },
  { id: 'package', label: 'package.json', icon: 'json', actions: [{ id: 'pin', label: 'Pin', icon: 'pin' }, { id: 'close', label: 'Close', icon: 'close', disabled: true }] },
  { id: 'deleted', label: 'legacy.ts', description: 'src', icon: 'file-code', actions: close, decoration: { badge: 'D', color: 'gitDecoration.deletedResourceForeground', tooltip: 'Deleted', strikethrough: true } },
  { id: 'settings', label: 'settings.json', description: '.vscode', icon: 'settings-gear', actions: close },
  { id: 'empty', label: 'Empty actions', description: 'A plain row without an icon' },
];
export const manyListItems: ListItem[] = Array.from({ length: 10000 }, (_, i) => ({ id: `item-${i}`, label: `File ${String(i).padStart(5, '0')}.ts`, description: 'src', icon: 'file-code', actions: close }));
export function changedListItems(items: readonly ListItem[]): ListItem[] { return [{ id: 'new', label: 'Added.ts', icon: 'new-file', actions: close }, ...items.filter(item => item.id !== 'app').map(item => item.id === 'button' ? { ...item, label: 'Button updated.vue', description: 'updated', actions: [{ id: 'pin', label: 'Pin', icon: 'pinned' }] } : item).reverse()]; }
