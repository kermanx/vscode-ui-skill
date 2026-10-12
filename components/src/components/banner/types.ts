export interface BannerAction {
  label: string;
  href: string;
  title?: string;
}

export interface BannerItem {
  id: string;
  message: string;
  /** A codicon name, a custom image, or the default application icon. */
  icon?: string | { url: string };
  actions?: readonly BannerAction[];
  ariaLabel?: string;
  closeLabel?: string;
  /** Higher priorities take precedence; equal priorities show the newest item. */
  priority?: number;
  neutral?: boolean;
}

export interface BannerHandle {
  show(item: BannerItem): void;
  hide(id: string): void;
  focus(): void;
  focusNextAction(): void;
  focusPreviousAction(): void;
  getActiveItem(): BannerItem | undefined;
}
