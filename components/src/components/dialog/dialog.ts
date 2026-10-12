// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import type { DialogButton } from './types';
export function arrangeDialogButtons(
  buttons: readonly (string | DialogButton)[],
  cancelId: number | undefined,
  vertical: boolean,
) {
  const map = buttons.map((button, index) => ({
    ...(typeof button === 'string' ? { label: button } : button),
    index,
  }));
  if (map.length < 2 || vertical) return map;
  const agent = navigator.userAgent;
  if (agent.includes('Macintosh') || agent.includes('Linux')) {
    if (typeof cancelId === 'number' && map[cancelId])
      map.splice(1, 0, map.splice(cancelId, 1)[0]);
    map.reverse();
  } else if (agent.includes('Windows')) {
    if (typeof cancelId === 'number' && map[cancelId])
      map.push(map.splice(cancelId, 1)[0]);
  }
  return map;
}
export function dialogButtonLabel(label: string) {
  return label.replace(/\(&&\w\)|&&/g, '');
}
