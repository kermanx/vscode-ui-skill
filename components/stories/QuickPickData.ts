import type {
  QuickPickEntry,
  QuickPickProps,
} from '../src/components/quick-input/quickPickTypes';
export interface QuickPickExample extends QuickPickProps {
  name: string;
  value?: string;
  activeIds?: string[];
  selectedIds?: string[];
  keepOpenOnAccept?: boolean;
  vetoAccept?: boolean;
}
export const basicPicks: QuickPickEntry[] = [
  {
    id: 'file',
    label: 'New File',
    description: 'Create an untitled file',
    icon: 'new-file',
  },
  {
    id: 'folder',
    label: 'Open Folder',
    description: 'Choose a workspace',
    icon: 'folder-opened',
  },
  {
    id: 'save',
    label: 'Save All',
    description: 'Write all changed files',
    icon: 'save-all',
  },
  {
    id: 'terminal',
    label: 'New Terminal',
    description: 'Start a shell',
    icon: 'terminal',
  },
  {
    id: 'settings',
    label: 'Open Settings',
    description: 'Configure the editor',
    icon: 'gear',
  },
];
export const richPicks: QuickPickEntry[] = [
  { id: 'recent', type: 'separator', label: 'recently opened' },
  {
    id: 'workspace',
    label: '$(folder) vscode-ui',
    description: '~/workspace',
    detail: 'A collection of workbench interface components',
    buttons: [
      { id: 'remove', icon: 'close', tooltip: 'Remove from recently opened' },
    ],
  },
  {
    id: 'notes',
    label: 'Notes.md',
    description: 'personal',
    detail: 'Research notes and implementation decisions',
    icon: 'file-text',
    iconColor: 'symbolIcon.stringForeground',
    italic: true,
  },
  { id: 'actions', type: 'separator', label: 'commands' },
  {
    id: 'palette',
    label: 'Show All Commands',
    keybinding: [{ metaKey: true, shiftKey: true, key: 'P' }],
    buttons: [
      {
        id: 'configure',
        icon: 'gear',
        tooltip: 'Configure keybinding',
        alwaysVisible: true,
      },
    ],
  },
  {
    id: 'old',
    label: 'Old command',
    description: 'deprecated',
    strikethrough: true,
  },
];
export const groupedPicks: QuickPickEntry[] = [
  {
    id: 'languages',
    type: 'separator',
    label: 'Languages',
    description: 'Installed',
    buttons: [{ id: 'refresh', icon: 'refresh', tooltip: 'Refresh languages' }],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    description: 'JavaScript with types',
    icon: 'symbol-class',
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    description: 'Web applications',
    icon: 'symbol-method',
  },
  {
    id: 'tools',
    type: 'separator',
    label: 'Tools',
    description: 'Recommended',
    buttons: [{ id: 'manage', icon: 'gear', tooltip: 'Manage tools' }],
  },
  {
    id: 'formatter',
    label: 'Formatter',
    detail: 'Consistent whitespace and code layout',
    icon: 'symbol-operator',
  },
  {
    id: 'linter',
    label: 'Linter',
    detail: 'Find problems before running the code',
    icon: 'warning',
  },
];
export const filterPicks: QuickPickEntry[] = [
  {
    id: 'foo-bar',
    label: 'FooBar',
    description: 'alpha',
    detail: 'first result',
  },
  {
    id: 'foobar',
    label: 'foobar',
    description: 'beta',
    detail: 'second result',
  },
  {
    id: 'file-browser',
    label: 'FileBrowser',
    description: 'gamma',
    detail: 'third result',
  },
  {
    id: 'spaces',
    label: 'foo bar',
    description: 'delta',
    detail: 'fourth result',
  },
  {
    id: 'icon',
    label: '$(folder) file-browser',
    description: 'epsilon',
    detail: 'fifth result',
  },
  { id: 'always', label: 'Create a new item…', alwaysShow: true },
];
const longPicks: QuickPickEntry[] = Array.from({ length: 100 }, (_, index) => ({
  id: `item-${index}`,
  label: `Item ${String(index + 1).padStart(3, '0')}`,
  description: `Description ${index + 1}`,
  detail:
    index % 7 === 0
      ? `Additional information about item ${index + 1}`
      : undefined,
  icon: index % 2 ? 'file' : 'folder',
}));
const darkIcon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="#cccccc"/></svg>')}`;
const lightIcon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="#424242"/></svg>')}`;
export const quickPickExamples: QuickPickExample[] = [
  {
    name: 'Single selection',
    placeholder: 'Select a command',
    items: basicPicks,
  },
  {
    name: 'Details, separators and actions',
    title: 'Open Recent',
    placeholder: 'Search recent items',
    items: richPicks,
    keepOpenOnAccept: true,
  },
  {
    name: 'Multiple selection',
    title: 'Choose features',
    canSelectMany: true,
    placeholder: 'Filter features',
    items: [
      ...basicPicks,
      { id: 'required', label: 'Required feature', disabled: true },
      { id: 'manage', label: 'Manage features…', pickable: false },
    ],
    selectedIds: ['file', 'save', 'required'],
    keepOpenOnAccept: true,
  },
  {
    name: 'Fuzzy matching',
    title: 'Fuzzy results',
    value: 'fb',
    items: filterPicks,
  },
  {
    name: 'Contiguous matching',
    value: 'bar',
    matchOnLabelMode: 'contiguous',
    items: filterPicks,
  },
  {
    name: 'Groups with buttons',
    title: 'Install extensions',
    items: groupedPicks,
    sortByLabel: false,
    keepOpenOnAccept: true,
  },
  {
    name: 'Empty results',
    placeholder: 'Search commands',
    value: 'unmatched query',
    items: basicPicks,
    prompt: 'No matching command is available.',
  },
  {
    name: 'Busy picker',
    title: 'Loading workspaces',
    items: basicPicks,
    busy: true,
  },
  {
    name: 'Input hidden',
    title: 'Choose a language',
    description: 'Select the languages you use.',
    canSelectMany: true,
    hideInput: true,
    items: groupedPicks,
    selectedIds: ['javascript'],
    keepOpenOnAccept: true,
  },
  {
    name: 'Disabled picker',
    title: 'Preparing changes',
    enabled: false,
    items: basicPicks,
    canSelectMany: true,
    selectedIds: ['file'],
  },
  {
    name: 'Virtualized list',
    title: 'Browse items',
    items: longPicks,
    keepOpenOnAccept: true,
  },
  {
    name: 'Validation and steps',
    title: 'Configure workspace',
    step: 2,
    totalSteps: 3,
    description: 'Choose the settings to apply.',
    backButton: true,
    items: basicPicks,
    validationMessage:
      '$(warning) Review the [workspace settings](https://example.com/settings) before continuing.',
    severity: 'warning',
    canSelectMany: true,
    selectedIds: ['settings'],
    okLabel: 'Apply',
  },
  {
    name: 'Description and detail filtering',
    title: 'Search all fields',
    items: filterPicks,
    matchOnDescription: true,
    matchOnDetail: true,
    value: 'third',
  },
  {
    name: 'No initial active item',
    items: basicPicks,
    itemActivation: 'none',
    canAcceptInBackground: true,
    keepOpenOnAccept: true,
  },
  {
    name: 'Images and tooltips',
    title: 'Open a workspace',
    items: [
      {
        id: 'image',
        label: 'Sample workspace',
        description: 'Local folder',
        iconPath: { dark: darkIcon, light: lightIcon },
        tooltip: 'Open the selected workspace.',
      },
      {
        id: 'fallback',
        label: 'Shared workspace',
        iconPath: { dark: darkIcon },
        tooltip: 'Shared with the development team.',
      },
    ],
    keepOpenOnAccept: true,
  },
  {
    name: 'Explicit highlights',
    title: 'Provider-ranked results',
    matchOnLabel: false,
    sortByLabel: false,
    items: [
      {
        id: 'highlight',
        label: '$(folder) Project Workspace',
        description: 'Pinned folder',
        detail: 'Open this project',
        highlights: {
          label: [{ start: 10, end: 17 }],
          description: [{ start: 0, end: 6 }],
          detail: [{ start: 0, end: 4 }],
        },
      },
      {
        id: 'newline',
        label: 'Multi\nline label',
        description: 'A\r\nB',
        alwaysShow: true,
      },
    ],
  },

  {
    name: 'Acceptance veto',
    title: 'Choose with validation',
    items: basicPicks,
    vetoAccept: true,
    keepOpenOnAccept: true,
  },
];
export function quickPickProps(example: QuickPickExample) {
  const {
    name,
    value,
    activeIds,
    selectedIds,
    keepOpenOnAccept,
    vetoAccept,
    ...props
  } = example;
  return props;
}
