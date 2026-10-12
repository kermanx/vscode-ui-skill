// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import type {
  ExplorerItem,
  ExplorerEditor,
  ExplorerEditorGroup,
} from './types';
import type { TreeNode } from '../tree/types';
import type { ActionBarEntry } from '../action-bar/types';
export const folderActions: readonly ActionBarEntry[] = [
  { id: 'newFile', label: 'New File...', icon: 'new-file' },
  { id: 'newFolder', label: 'New Folder...', icon: 'new-folder' },
  { id: 'refresh', label: 'Refresh Explorer', icon: 'refresh' },
  {
    id: 'collapseAll',
    label: 'Collapse Folders in Explorer',
    icon: 'collapse-all',
  },
];
export function editorActions(multiple: boolean): readonly ActionBarEntry[] {
  return [
    ...(multiple
      ? [
          {
            id: 'toggleLayout',
            label: 'Toggle Vertical/Horizontal Editor Layout',
            icon: 'editor-layout',
          },
        ]
      : []),
    { id: 'saveAll', label: 'Save All', icon: 'save-all' },
    { id: 'closeAll', label: 'Close All Editors', icon: 'close-all' },
  ];
}
const collator = new Intl.Collator(undefined, { numeric: true });
export function compareNames(a: string, b: string) {
  return collator.compare(a, b) || a.length - b.length;
}
export interface ExplorerTreeNode extends TreeNode {
  resource: ExplorerItem;
  root: boolean;
}
export function explorerNodes(
  roots: readonly ExplorerItem[],
): ExplorerTreeNode[] {
  function visit(
    items: readonly ExplorerItem[],
    root = false,
  ): ExplorerTreeNode[] {
    return (
      root
        ? items.slice()
        : items
            .slice()
            .sort(
              (a, b) =>
                +(b.kind === 'folder' || !!b.children) -
                  +(a.kind === 'folder' || !!a.children) ||
                compareNames(a.name, b.name),
            )
    ).map((item) => ({
      id: item.id,
      label: item.name,
      resource: item,
      root,
      children: item.children
        ? visit(item.children)
        : item.kind === 'folder'
          ? []
          : undefined,
    }));
  }
  return roots.length === 1
    ? visit(roots[0].children || [])
    : visit(roots, true);
}
export interface ExplorerEditorRow {
  id: string;
  label: string;
  group: ExplorerEditorGroup;
  editor?: ExplorerEditor;
}
export function editorRows(
  groups: readonly ExplorerEditorGroup[],
): ExplorerEditorRow[] {
  return groups.flatMap((group) => [
    ...(groups.length > 1
      ? [{ id: `group:${group.id}`, label: group.label, group }]
      : []),
    ...group.editors.map((editor) => ({
      id: editor.id,
      label: editor.name,
      editor,
      group,
    })),
  ]);
}
// File associations are encoded in class names; the bundled Seti theme owns their appearance.
export function fileIconClasses(
  path: string,
  kind: 'file' | 'folder' | 'root',
  language?: string,
): string[] {
  const escape = (text: string) => text.replace(/\s/g, '/');
  const classes = [kind === 'root' ? 'rootfolder-icon' : `${kind}-icon`];
  const match = path.match(/(?:\/|^)(?:([^\/]+)\/)?([^\/]+)$/);
  const name = escape((match?.[2] || '').toLowerCase());
  if (match?.[1])
    classes.push(`${escape(match[1].toLowerCase())}-name-dir-icon`);
  if (kind === 'root') classes.push(`${name}-root-name-folder-icon`);
  else if (kind === 'folder') classes.push(`${name}-name-folder-icon`);
  else {
    if (name) {
      classes.push(`${name}-name-file-icon`, 'name-file-icon');
      if (name.length <= 255) {
        const parts = name.split('.');
        for (let i = 1; i < parts.length; i++)
          classes.push(`${parts.slice(i).join('.')}-ext-file-icon`);
      }
      classes.push('ext-file-icon');
    }
    if (language) classes.push(`${escape(language)}-lang-file-icon`);
  }
  return classes;
}
