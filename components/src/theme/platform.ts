/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */
// A shared platform default keeps scoped themes consistent without adding a
// platform setting to every component that displays code or keyboard text.
if (typeof document !== 'undefined' && typeof navigator !== 'undefined') {
  const agent = navigator.userAgent;
  const font = agent.includes('Macintosh')
    ? '"SF Mono", Monaco, Menlo, Courier, monospace'
    : agent.includes('Windows')
      ? 'Consolas, "Courier New", monospace'
      : '"Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace';
  document.documentElement.style.setProperty(
    '--vc-platform-monospace-font',
    font,
  );
}
