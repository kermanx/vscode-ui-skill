// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import { provide, type Ref, type InjectionKey } from 'vue';
export interface HoverDelegate {
  lastHideTime: number;
}
export const instantHoverKey: InjectionKey<Ref<boolean>> =
  Symbol('instantHover');
export const hoverDelegateKey: InjectionKey<HoverDelegate> =
  Symbol('hoverDelegate');
export function provideInstantHoverDelegate() {
  provide(hoverDelegateKey, { lastHideTime: 0 });
}
