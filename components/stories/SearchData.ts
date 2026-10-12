import type {
  SearchFileResult,
  SearchViewProps,
} from '../src/components/search/types';

export const searchFiles: SearchFileResult[] = [
  {
    id: 'app',
    name: 'App.tsx',
    path: '/workspace/sample-project/src/App.tsx',
    description: 'src',
    language: 'typescriptreact',
    matches: [
      {
        id: 'app-12',
        line: 12,
        before: 'import { ',
        text: 'Button',
        after: " } from './components/Button';",
        replacement: 'ActionButton',
      },
      {
        id: 'app-29',
        line: 29,
        before: '      <',
        text: 'Button',
        after: ' onClick={save}>Save</Button>',
        replacement: 'ActionButton',
      },
    ],
  },
  {
    id: 'button',
    name: 'Button.tsx',
    path: '/workspace/sample-project/src/components/Button.tsx',
    description: 'src/components',
    language: 'typescriptreact',
    matches: [
      {
        id: 'button-4',
        line: 4,
        before: 'export function ',
        text: 'Button',
        after: '(props: ButtonProps) {',
        replacement: 'ActionButton',
      },
      {
        id: 'button-18',
        line: 18,
        before: '  // ',
        text: 'Button',
        after: ' handles keyboard activation',
        readonly: true,
      },
    ],
  },
  {
    id: 'readme',
    name: 'README.md',
    path: '/workspace/sample-project/README.md',
    language: 'markdown',
    matches: [
      {
        id: 'readme-43',
        line: 43,
        endLine: 45,
        before: 'The ',
        text: 'Button',
        after: ' component supports labels and icons.',
        replacement: 'ActionButton',
      },
    ],
  },
];

export interface SearchExample extends SearchViewProps {
  name: string;
  query?: string;
  replacement?: string;
  matchCase?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  preserveCase?: boolean;
  replaceShown?: boolean;
  detailsShown?: boolean;
  include?: string;
  exclude?: string;
  onlyOpenEditors?: boolean;
  onlyChangedFiles?: boolean;
  useIgnoreFiles?: boolean;
  expandedIds?: string[];
  selectedIds?: string[];
}

export const searchExamples: SearchExample[] = [
  {
    name: 'Search results',
    contextActions: [
      { id: 'search.action.copyMatch', label: 'Copy' },
      { id: 'search.action.copyPath', label: 'Copy Path' },
      { id: 'search.action.copyAll', label: 'Copy All' },
    ],
    results: searchFiles,
    query: 'Button',
    searched: true,
    replaceShown: false,
    expandedIds: ['app', 'button', 'readme'],
    height: 500,
  },
  {
    name: 'Replace preview',
    results: searchFiles,
    query: 'Button',
    replacement: 'ActionButton',
    searched: true,
    replaceShown: true,
    expandedIds: ['app', 'button'],
    height: 500,
  },
  {
    name: 'Search details',
    results: searchFiles,
    query: 'Button',
    searched: true,
    detailsShown: true,
    include: 'src/**',
    exclude: '**/*.test.ts',
    onlyChangedFiles: true,
    changedFilesAvailable: true,
    expandedIds: ['app'],
    showLineNumbers: true,
    height: 500,
  },
  { name: 'Empty', results: [], height: 400 },
  {
    name: 'No matches',
    results: [],
    query: 'notFound',
    searched: true,
    replaceShown: false,
    height: 400,
  },
  {
    name: 'Many matches',
    results: [
      {
        id: 'long',
        name: 'index.ts',
        path: '/workspace/sample-project/src/index.ts',
        description: 'src',
        language: 'typescript',
        matches: Array.from({ length: 70 }, (_, i) => ({
          id: `match-${i}`,
          line: i * 3 + 1,
          before: 'const ',
          text: 'Button',
          after: `_${i} = createButton();`,
        })),
      },
    ],
    query: 'Button',
    searched: true,
    expandedIds: ['long'],
    height: 400,
  },
  {
    name: 'Filtered empty search',
    results: [],
    query: 'Button',
    searched: true,
    include: 'src/**',
    exclude: '**/*.test.ts',
    onlyOpenEditors: true,
    detailsShown: true,
    height: 500,
  },
  {
    name: 'Result summary filters',
    results: searchFiles,
    query: 'Button',
    searched: true,
    replaceShown: false,
    useIgnoreFiles: false,
    onlyOpenEditors: true,
    expandedIds: ['app', 'button', 'readme'],
    height: 500,
  },
];
