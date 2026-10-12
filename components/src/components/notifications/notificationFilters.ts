import type { InjectionKey, Ref } from 'vue';
/** Notification surfaces share source filtering across their rendered lists. */
export const notificationFilters: InjectionKey<Ref<Set<string>>> = Symbol(
  'notification-filters',
);
