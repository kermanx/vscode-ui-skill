export type HoverPosition = 'above' | 'below' | 'left' | 'right';
export interface HoverTarget { targetElements: readonly HTMLElement[]; x?: number; y?: number }
export interface HoverAction { id: string; label: string; keybinding?: string; icon?: string }
