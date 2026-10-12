import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { items } from '../stories/keybindingLabelData';

const reference = (theme: string) => `${process.env.REFERENCE_URL ?? '/reference/index.html'}?kind=keybinding-label&theme=${theme}`;
const replica = (theme: string) => `/iframe.html?id=components-keybinding-label--specimen&viewMode=story&globals=theme:${theme}`;
const keybinding = (page: Page, index: number) => page.locator(`[data-index="${index}"] .monaco-keybinding`);
const rows = items.length;

async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(reference(theme));
  await pages[1].goto(replica(theme));
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
async function pixels(pages: Page[], info: TestInfo, name: string) {
  const buffers = [];
  for (const page of pages) { await page.bringToFront(); buffers.push(await page.getByTestId('specimen').screenshot({ animations: 'disabled' })); }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
/** Node sequence of every label: tag + classes + text, so separators and highlights are both covered. */
async function dump(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-testid="keybinding-list"] > *')].map(row => {
    const element = row.querySelector('.monaco-keybinding')!;
    return {
      ariaLabel: element.getAttribute('aria-label'),
      text: element.textContent,
      nodes: [...element.children].map(child => ({ className: child.className, text: child.textContent })),
      highlights: [...element.children].map((child, index) => child.classList.contains('highlight') ? index : -1).filter(index => index >= 0),
      styles: (() => {
        const style = getComputedStyle(element), key = getComputedStyle(element.children[0] as HTMLElement);
        return {
          display: style.display, lineHeight: style.lineHeight, color: style.color,
          key: ['border-radius', 'border-width', 'border-style', 'min-width', 'padding', 'margin', 'font-size', 'line-height'].map(property => `${property}=${key.getPropertyValue(property)}`),
        };
      })(),
    };
  }));
}
type LabelState = Awaited<ReturnType<typeof dump>>;

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Keybinding Label visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    const [original, copy] = await Promise.all(pages.map(page => dump(page)));
    expect(copy, 'DOM, classes, highlights and key styles').toEqual(original);
  });
}

test('Keybinding labels render the original chords, separators, highlights and aria labels', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await expect(page.locator('[data-testid="keybinding-list"] > *')).toHaveCount(rows);
    const state = await dump(page);
    // Single chord, multiple modifiers, two chords, unbound and disableTitle.
    expect(state[0].nodes).toEqual([{ className: 'monaco-keybinding-key', text: '⌘' }, { className: 'monaco-keybinding-key', text: 'S' }]);
    expect(state[2].nodes.map(node => node.className)).toEqual(['monaco-keybinding-key', 'monaco-keybinding-key', 'monaco-keybinding-key-chord-separator', 'monaco-keybinding-key', 'monaco-keybinding-key']);
    expect(state[3].nodes).toEqual([
      { className: 'monaco-keybinding-key', text: 'Ctrl' }, { className: 'monaco-keybinding-key-separator', text: '+' },
      { className: 'monaco-keybinding-key', text: 'Shift' }, { className: 'monaco-keybinding-key-separator', text: '+' },
      { className: 'monaco-keybinding-key', text: 'S' },
    ]);
    expect(state[4].nodes.map(node => node.text)).toEqual(['Shift', '+', 'Alt', '+', 'F']);
    // macOS uses ⌃⇧⌥⌘ without a separator, windows/linux spell the names out with `+`.
    expect(state[1].nodes.map(node => node.text)).toEqual(['⇧', '⌘', 'P']);
    expect(state[5].nodes.map(node => node.text)).toEqual(['Ctrl', '+', '\\']);
    expect(state[6].nodes).toEqual([{ className: 'monaco-keybinding-key', text: 'Unbound' }]);
    // Matches highlight the modifier and/or the key element, in both chords.
    expect([state[7].highlights, state[8].highlights]).toEqual([[0, 4], [0, 2, 4]]);
    // getAriaLabel() output, empty when disableTitle is set.
    expect(state.map(entry => entry.ariaLabel)).toEqual([
      'Command+S', 'Shift+Command+P', 'Command+K Command+S', 'Control+Shift+S', 'Shift+Alt+F', 'Control+\\',
      null, 'Control+K Control+S', 'Control+K Control+S', '',
    ]);
    expect(state[0].text).toBe('⌘S');
    expect(state[9].text).toBe('Ctrl+F2');
    // Key geometry comes from the upstream CSS, not from the calling context.
    expect(state[0].styles).toEqual({
      display: 'flex', lineHeight: '10px', color: 'rgb(204, 204, 204)',
      key: ['border-radius=3px', 'border-width=1px', 'border-style=solid', 'min-width=12px', 'padding=3px 5px', 'margin=0px 2px 0px 0px', 'font-size=11px', 'line-height=10px'],
    });
  }
});

test('Keybinding Label state readout matches the original', async ({ context }) => {
  const pages = await pair(context);
  const states = await Promise.all(pages.map(page => page.evaluate(() => (window as any).fixtureState)));
  for (const state of states) {
    expect(state.labels.slice(0, 6)).toEqual(['Command+S', 'Shift+Command+P', 'Command+K Command+S', 'Control+Shift+S', 'Shift+Alt+F', 'Control+\\']);
    expect(state.highlights).toEqual([0, 0, 0, 0, 0, 0, 0, 2, 3, 0]);
    expect(state.unbound[6]).toBe(true);
    expect(state.classes[2]).toEqual(['monaco-keybinding-key', 'monaco-keybinding-key', 'monaco-keybinding-key-chord-separator', 'monaco-keybinding-key', 'monaco-keybinding-key']);
  }
  expect(states[1].text).toEqual(states[0].text);
  expect(states[0].text.slice(0, 4)).toEqual(['⌘S', '⇧⌘P', '⌘K ⌘S', 'Ctrl+Shift+S']);
  expect(states[0].classes).toEqual(states[1].classes);
  expect(states[0].unbound).toEqual(states[1].unbound);
});
