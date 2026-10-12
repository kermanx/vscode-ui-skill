export const hoverText = 'Inspect the current value.\nUse the action below for details.';
export const longHoverText = Array.from({ length: 36 }, (_, i) => `Line ${i + 1}: hover content can scroll.`).join('\n');
export const hoverActions = [{ id: 'inspect', label: 'Inspect', keybinding: '⌘I', icon: 'inspect' }, { id: 'copy', label: 'Copy' }];
export function hoverFixtureOptions() {
  const q = new URLSearchParams(location.search);
  return { sticky: q.get('sticky') === 'true', nested: q.get('nested') === 'true', tooltip: q.get('mode') === 'tooltip' || q.get('kind') === 'tooltip' || q.get('id')?.startsWith('components-tooltip--') === true, html: q.get('html') === 'true', content: q.get('long') === 'true' ? longHoverText : hoverText,
    position: (q.get('position') || 'below') as 'above' | 'below' | 'left' | 'right', alignment: (q.get('alignment') || 'left') as 'left' | 'right',
    placement: (q.get('placement') || 'element') as 'mouse' | 'element', compact: q.get('compact') === 'true', pointer: q.get('pointer') !== 'false',
    actions: q.get('actions') === 'true' ? hoverActions : [], force: q.get('force') === 'true', delay: q.has('delay') ? Number(q.get('delay')) : undefined,
    hideOnHover: q.has('hideOnHover') ? q.get('hideOnHover') === 'true' : undefined };
}
