import type { InjectionKey } from "vue";
/** Owning toast/center commands take precedence over ordinary list navigation. */
export const notificationKeyboard: InjectionKey<
  (event: KeyboardEvent) => boolean
> = Symbol("notification-keyboard");
