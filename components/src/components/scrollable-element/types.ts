/** Visibility controls the scrollbar, not whether that axis can scroll. */
export type ScrollbarVisibility = 'auto' | 'hidden' | 'visible';
export interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
}
export interface ScrollDimensions {
  width: number;
  height: number;
  scrollWidth: number;
  scrollHeight: number;
}
export interface ScrollableEvent extends ScrollPosition, ScrollDimensions {}
