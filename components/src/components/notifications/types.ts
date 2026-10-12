export type NotificationSeverity = "info" | "warning" | "error";
export type NotificationPosition = "bottom-right" | "bottom-left" | "top-right";
export type NotificationTextPart =
  string | { label: string; href: string; title?: string };
export interface NotificationAction {
  id: string;
  label: string;
  keepOpen?: boolean;
  menu?: readonly NotificationAction[];
}
export interface NotificationProgress {
  infinite?: boolean;
  total?: number;
  worked?: number;
  done?: boolean;
}
export interface NotificationItem {
  id: string;
  message: string | readonly NotificationTextPart[];
  severity?: NotificationSeverity;
  source?: string | { id: string; label: string };
  actions?: {
    primary?: readonly NotificationAction[];
    secondary?: readonly NotificationAction[];
  };
  progress?: NotificationProgress;
  sticky?: boolean;
  priority?: "default" | "optional" | "silent" | "urgent";
}
export interface NotificationsListHandle {
  focusFirst(): void;
  focus(id?: string): void;
  hasFocus(): boolean;
  getFocus(): string | undefined;
  reveal(id: string): void;
  getHeight(): number;
}
export interface NotificationToastsHandle {
  hide(): void;
  focus(): boolean;
  focusFirst(): boolean;
  focusLast(): boolean;
  focusNext(): boolean;
  focusPrevious(): boolean;
}
export interface NotificationSource {
  id: string;
  label: string;
}
export interface NotificationsCenterHandle {
  show(): Promise<void>;
  hide(): void;
  clearAll(): void;
  focus(): void;
}
