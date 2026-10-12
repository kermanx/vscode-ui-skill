import type { TreeDecoration } from '../tree/types';
import type { MenuEntry } from '../menu/types';
export interface ExplorerItem {
  id: string;
  name: string;
  /** Absolute resource path, used for file associations and accessible descriptions. */
  path: string;
  kind?: 'file' | 'folder';
  children?: readonly ExplorerItem[];
  language?: string;
  decoration?: TreeDecoration;
  cut?: boolean;
}
export interface ExplorerEditor {
  id: string;
  name: string;
  path: string;
  description?: string;
  language?: string;
  dirty?: boolean;
  saving?: boolean;
  preview?: boolean;
  sticky?: boolean;
  decoration?: TreeDecoration;
}
export interface ExplorerEditorGroup {
  id: string;
  label: string;
  editors: readonly ExplorerEditor[];
}
export interface ExplorerOpenEvent {
  id: string;
  source: 'files' | 'editors';
  groupId?: string;
  pinned: boolean;
  /** Keep focus in the originating view; otherwise the host focuses editor content. */
  preserveFocus: boolean;
  sideBySide: boolean;
}
export interface ExplorerProps {
  roots: readonly ExplorerItem[];
  editorGroups?: readonly ExplorerEditorGroup[];
  workspaceName?: string;
  height?: number;
  showOpenEditors?: boolean;
  visibleEditors?: number;
  contextActions?: readonly MenuEntry[];
}
