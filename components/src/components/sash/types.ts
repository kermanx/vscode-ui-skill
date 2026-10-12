export type SashOrientation = 'vertical' | 'horizontal';
/** Minimum/maximum change the cursor; the layout owner applies actual size constraints. */
export type SashState = 'disabled' | 'minimum' | 'maximum' | 'enabled';
export type SashOrthogonalEdge = 'north' | 'south' | 'east' | 'west';
export interface SashEvent {
  startX: number;
  currentX: number;
  startY: number;
  currentY: number;
  /** Captured at drag start; touch gestures do not provide a keyboard modifier. */
  altKey: boolean | undefined;
}
/** A component ref used to link adjacent or perpendicular sashes. */
export interface SashHandle {
  readonly element: HTMLElement | undefined;
  readonly state: SashState;
  clearHoverState(): void;
}
