export type CompositeBadge =
  | { type: "number"; value: number; description?: string }
  | { type: "icon"; icon: string; description?: string }
  | { type: "progress"; description?: string };
export interface CompositeItem {
  id: string;
  label: string;
  icon?: string;
  keybinding?: string;
  pinned?: boolean;
  visible?: boolean;
  badges?: readonly CompositeBadge[];
  badgesEnabled?: boolean;
}
