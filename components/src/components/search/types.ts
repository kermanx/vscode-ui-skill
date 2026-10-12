import type { MenuEntry } from '../menu/types';

export interface SearchMatch {
  id: string;
  line: number;
  endLine?: number;
  before: string;
  text: string;
  after: string;
  /** Replacement preview supplied by the search provider. */
  replacement?: string;
  readonly?: boolean;
}

export interface SearchFileResult {
  id: string;
  name: string;
  path: string;
  description?: string;
  language?: string;
  matches: readonly SearchMatch[];
}

export interface SearchSubmitEvent {
  query: string;
  replacement: string;
  matchCase: boolean;
  wholeWord: boolean;
  regex: boolean;
  preserveCase: boolean;
  include: string;
  exclude: string;
  onlyOpenEditors: boolean;
  onlyChangedFiles: boolean;
  useIgnoreFiles: boolean;
  triggeredOnType: boolean;
  delay: number;
}

export interface SearchViewProps {
  results: readonly SearchFileResult[];
  height?: number;
  /** True after the search provider has returned results, including no matches. */
  searched?: boolean;
  searching?: boolean;
  showLineNumbers?: boolean;
  searchOnType?: boolean;
  searchDelay?: number;
  changedFilesAvailable?: boolean;
  searchHistory?: readonly string[];
  replaceHistory?: readonly string[];
  includeHistory?: readonly string[];
  excludeHistory?: readonly string[];
  contextActions?: readonly MenuEntry[];
}
