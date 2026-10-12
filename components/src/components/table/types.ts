import type { Highlight } from '../highlighted-label/HighlightedLabel.vue';
import type { Chord, OperatingSystem } from '../keybinding-label/types';
export interface TableColumn {
  id: string;
  label: string;
  /** Relative initial width and the target proportion used by divider double click. */
  weight: number;
  minimumWidth?: number;
  maximumWidth?: number;
}
export interface TableCell {
  text?: string;
  icon?: string;
  highlights?: readonly Highlight[];
  keybinding?: readonly Chord[];
  keybindingOS?: OperatingSystem;
}
export interface TableRow {
  id: string;
  /** Accessible name and keyboard navigation text; defaults to the cell text. */
  label?: string;
  cells: Readonly<Record<string, string | TableCell>>;
}
export interface TableHandle {
  focus(): void;
  setFocus(id?: string): void;
  reveal(id: string): void;
  resizeColumn(id: string, percentage: number): void;
  getColumnWidths(): number[];
  setScrollTop(top: number): void;
  getScrollTop(): number;
}
