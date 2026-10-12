/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import type { ScrollbarVisibility } from './types';

export function useScrollbarVisibility(mode: () => ScrollbarVisibility, needed: () => boolean, rawShouldBeVisible: Ref<boolean>) {
  const className = ref('invisible');
  let visible = false;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  watch([mode, needed, rawShouldBeVisible], () => {
    const isNeeded = needed();
    const shouldBeVisible = mode() === 'visible' || (mode() === 'auto' && rawShouldBeVisible.value);
    if (isNeeded && shouldBeVisible) {
      if (visible) return;
      visible = true;
      revealTimer ??= setTimeout(() => { revealTimer = undefined; className.value = 'visible'; }, 0);
    } else {
      clearTimeout(revealTimer); revealTimer = undefined;
      if (!visible) return;
      visible = false;
      className.value = `invisible${isNeeded ? ' fade' : ''}`;
    }
  }, { immediate: true, flush: 'sync' });
  onBeforeUnmount(() => clearTimeout(revealTimer));
  return className;
}
