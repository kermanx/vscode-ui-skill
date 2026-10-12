import type { InjectionKey, Ref } from 'vue';
/** Internal composition hook for modal owners whose transformed content clips popups. */
export interface DropdownPopupHost {
  container: Ref<HTMLElement | undefined>;
  layer: number;
}
export const dropdownPopupHost: InjectionKey<DropdownPopupHost> = Symbol(
  'dropdown-popup-host',
);
