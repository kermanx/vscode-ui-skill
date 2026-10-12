import type { TreeNode } from '../src/components/tree/types';
const fileActions = [
  { id: 'open', label: 'Open to the Side', icon: 'split-horizontal' },
  { id: 'discard', label: 'Discard Changes', icon: 'discard' },
];

export const treeNodes: TreeNode[] = [
  { id: 'src', label: 'src', actions: [{ id: 'new-file', label: 'New File', icon: 'new-file' }, { id: 'new-folder', label: 'New Folder', icon: 'new-folder' }], children: [
    { id: 'components', label: 'components', children: [
      { id: 'button', label: 'Button.vue', icon: 'symbol-method', actions: fileActions, decoration: { badge: 'M', color: 'gitDecoration.modifiedResourceForeground', tooltip: 'Modified' } },
      { id: 'tree', label: 'TreeView.vue', icon: 'symbol-method', actions: [fileActions[0], { ...fileActions[1], disabled: true }], decoration: { badge: 'U', color: 'gitDecoration.untrackedResourceForeground', tooltip: 'Untracked' } },
    ] },
    { id: 'theme', label: 'theme', children: [
      { id: 'tokens', label: 'tokens.css', description: 'generated' },
      { id: 'styles', label: 'theme.css' },
    ] },
    { id: 'app', label: 'App.vue', icon: 'symbol-method', decoration: { badge: 'D', color: 'gitDecoration.deletedResourceForeground', tooltip: 'Deleted', strikethrough: true } },
  ] },
  { id: 'stories', label: 'stories', children: [{ id: 'story', label: 'Button.stories.ts' }] },
  { id: 'package', label: 'package.json', icon: 'json' },
  { id: 'readme', label: 'README.md', icon: 'markdown', decoration: { badge: 'R', color: 'gitDecoration.renamedResourceForeground', tooltip: 'Renamed' } },
  { id: 'long', label: 'a-very-long-filename-to-check-horizontal-clipping-and-label-overflow.ts' },
];
export const expandedNodes = ['src', 'components'];
export const largeNodes: TreeNode[] = Array.from({ length: 100 }, (_, group) => ({
  id: `folder-${group}`, label: `module-${String(group).padStart(3, '0')}`, children: Array.from({ length: 100 }, (_, file) => ({
    id: `file-${group}-${file}`, label: `component-${String(file).padStart(3, '0')}.vue`,
    ...(file % 3 === 0 ? { actions: fileActions, decoration: { badge: 'M', color: 'gitDecoration.modifiedResourceForeground', tooltip: 'Modified' } } : {}),
  })),
}));
export const buttons = [
  { label: 'Primary Button', title: true }, { label: 'Secondary Button', secondary: true, title: 'Additional actions' },
  { label: 'Add Item', icon: 'add' }, { label: 'Small Button', small: true },
  { label: 'Disabled', disabled: true }, { label: 'Disabled Secondary', secondary: true, disabled: true },
];
