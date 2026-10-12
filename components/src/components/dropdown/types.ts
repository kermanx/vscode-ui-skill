/** Viewport coordinates, using the same small anchor box as a context view. */
export interface DropdownPointAnchor { x: number; y: number; width?: number; height?: number }
export type DropdownAnchor = HTMLElement | DropdownPointAnchor;
