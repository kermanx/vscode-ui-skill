export interface PaneViewItem {
  id: string;
  /** Initial total height, including the header; later sizes come from PaneView. */
  size: number;
  /** Body-only constraints; PaneView adds the visible header height. */
  minimumBodySize?: number;
  maximumBodySize?: number;
  headerVisible?: boolean;
}
