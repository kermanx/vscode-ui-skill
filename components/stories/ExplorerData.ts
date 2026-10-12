import type { ExplorerProps } from '../src/components/explorer/types';
export const workspaceFiles = [
  {
    id: 'workspace',
    name: 'sample-project',
    path: '/workspace/sample-project',
    kind: 'folder' as const,
    children: [
      {
        id: 'src',
        name: 'src',
        path: '/workspace/sample-project/src',
        kind: 'folder' as const,
        children: [
          {
            id: 'app',
            name: 'App.tsx',
            path: '/workspace/sample-project/src/App.tsx',
            language: 'typescriptreact',
            decoration: {
              badge: 'M',
              color: 'gitDecoration.modifiedResourceForeground',
              tooltip: 'Modified',
            },
          },
          {
            id: 'index',
            name: 'index.ts',
            path: '/workspace/sample-project/src/index.ts',
            language: 'typescript',
          },
          {
            id: 'styles',
            name: 'styles.css',
            path: '/workspace/sample-project/src/styles.css',
            language: 'css',
          },
          {
            id: 'components',
            name: 'components',
            path: '/workspace/sample-project/src/components',
            kind: 'folder' as const,
            children: [
              {
                id: 'button',
                name: 'Button.tsx',
                path: '/workspace/sample-project/src/components/Button.tsx',
                language: 'typescriptreact',
              },
            ],
          },
        ],
      },
      {
        id: 'public',
        name: 'public',
        path: '/workspace/sample-project/public',
        kind: 'folder' as const,
        children: [
          {
            id: 'logo',
            name: 'logo.svg',
            path: '/workspace/sample-project/public/logo.svg',
          },
        ],
      },
      {
        id: 'gitignore',
        name: '.gitignore',
        path: '/workspace/sample-project/.gitignore',
      },
      {
        id: 'package',
        name: 'package.json',
        path: '/workspace/sample-project/package.json',
        language: 'json',
      },
      {
        id: 'readme',
        name: 'README.md',
        path: '/workspace/sample-project/README.md',
        language: 'markdown',
      },
      {
        id: 'old',
        name: 'old-config.json',
        path: '/workspace/sample-project/old-config.json',
        decoration: {
          badge: 'D',
          color: 'gitDecoration.deletedResourceForeground',
          tooltip: 'Deleted',
          strikethrough: true,
        },
      },
    ],
  },
];
export const openedEditors = [
  {
    id: 'main',
    label: 'Group 1',
    editors: [
      {
        id: 'editor-app',
        name: 'App.tsx',
        path: '/workspace/sample-project/src/App.tsx',
        description: 'src',
        language: 'typescriptreact',
        dirty: true,
        decoration: {
          badge: 'M',
          color: 'gitDecoration.modifiedResourceForeground',
          tooltip: 'Modified',
        },
      },
      {
        id: 'editor-readme',
        name: 'README.md',
        path: '/workspace/sample-project/README.md',
        language: 'markdown',
        preview: true,
      },
      {
        id: 'editor-package',
        name: 'package.json',
        path: '/workspace/sample-project/package.json',
        language: 'json',
        sticky: true,
      },
    ],
  },
];
export interface ExplorerExample extends ExplorerProps {
  name: string;
  expandedIds?: string[];
  selectedIds?: string[];
  activeEditorId?: string;
  openEditorsExpanded?: boolean;
  foldersExpanded?: boolean;
}
export const explorerExamples: ExplorerExample[] = [
  {
    name: 'Workspace',
    contextActions: [
      { id: 'explorer.openToSide', label: 'Open to the Side' },
      { separator: true },
      { id: 'copyFilePath', label: 'Copy Path' },
      { id: 'copyRelativeFilePath', label: 'Copy Relative Path' },
    ],
    roots: workspaceFiles,
    editorGroups: openedEditors,
    expandedIds: ['src'],
    height: 500,
  },
  {
    name: 'Multiple groups',
    roots: workspaceFiles,
    editorGroups: [
      ...openedEditors,
      {
        id: 'secondary',
        label: 'Group 2',
        editors: [
          {
            id: 'editor-css',
            name: 'styles.css',
            path: '/workspace/sample-project/src/styles.css',
            description: 'src',
            language: 'css',
            sticky: true,
            dirty: true,
          },
          {
            id: 'editor-index',
            name: 'index.ts',
            path: '/workspace/sample-project/src/index.ts',
            description: 'src',
            language: 'typescript',
            saving: true,
            dirty: true,
          },
        ],
      },
    ],
    expandedIds: ['src'],
    activeEditorId: 'editor-css',
    height: 500,
  },
  {
    name: 'Multiple roots',
    workspaceName: 'Documentation',
    roots: [
      ...workspaceFiles,
      {
        id: 'docs',
        name: 'docs',
        path: '/workspace/docs',
        kind: 'folder',
        children: [
          {
            id: 'guide',
            name: 'guide.md',
            path: '/workspace/docs/guide.md',
            language: 'markdown',
          },
        ],
      },
    ],
    editorGroups: openedEditors,
    expandedIds: ['workspace', 'src', 'docs'],
    height: 500,
  },
  {
    name: 'Collapsed sections',
    roots: workspaceFiles,
    editorGroups: openedEditors,
    openEditorsExpanded: false,
    foldersExpanded: false,
    height: 300,
  },
  {
    name: 'Files only',
    roots: workspaceFiles,
    showOpenEditors: false,
    expandedIds: ['src', 'components'],
    selectedIds: ['app'],
    height: 420,
  },
  {
    name: 'Long workspace',
    roots: [
      {
        id: 'long',
        name: 'long-workspace',
        path: '/workspace/long',
        kind: 'folder',
        children: Array.from({ length: 70 }, (_, i) => ({
          id: `file-${i}`,
          name: `module-${i}.ts`,
          path: `/workspace/long/module-${i}.ts`,
          language: 'typescript',
        })),
      },
    ],
    editorGroups: openedEditors,
    height: 400,
  },
];
