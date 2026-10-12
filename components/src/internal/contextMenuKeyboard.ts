/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */
/** The List context-menu shortcut after StandardKeyboardEvent platform normalization. */
export function isContextMenuKey(event: KeyboardEvent): boolean {
  if (event.isComposing) return false;
  const agent = navigator.userAgent;
  // WebKit uses 93 for the right Command key on macOS.
  const macMeta = agent.includes('Macintosh') && agent.includes('AppleWebKit') && !agent.includes('Firefox');
  return (event.keyCode === 93 && !macMeta) || (event.shiftKey && event.keyCode === 121);
}
