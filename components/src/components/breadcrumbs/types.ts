export interface BreadcrumbItem {
  id: string;
  label: string;
  kind?: 'folder' | 'file' | 'symbol' | 'text';
  icon?: string;
  description?: string;
  deprecated?: boolean;
}
export interface BreadcrumbItemEvent {
  type: 'select' | 'focus';
  item: BreadcrumbItem | undefined;
  node: HTMLElement | undefined;
  /** A click event, keyboard intent ('pick' / 'reveal'), or caller-provided payload. */
  payload: unknown;
}
