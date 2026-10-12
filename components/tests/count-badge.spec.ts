import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { disposeRow, dynamicRow, dynamicSteps, groups } from '../stories/countBadgeData';

// The canvas is ~590px tall; the default 480px viewport would make Chromium capture it beyond the
// fold. Both pages get a viewport tall enough for the whole canvas, so no stitching is involved.
test.use({ viewport: { width: 420, height: 760 }, deviceScaleFactor: 1 });

const original = (theme: string) => `${process.env.REFERENCE_URL ?? '/reference/index.html'}?kind=count-badge&theme=${theme}`;
const replica = (theme: string) => `/iframe.html?id=components-count-badge--specimen&viewMode=story&globals=theme:${theme}`;
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()); });
  }
  await pages[0].goto(original(theme));
  await pages[1].goto(replica(theme));
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const badge = (page: Page, row: string) => page.locator(`[data-row="${row}"] .monaco-count-badge`);
async function pixels(pages: Page[], info: TestInfo, name: string) {
  const buffers: Buffer[] = [];
  for (const page of pages) { await page.bringToFront(); buffers.push(await page.getByTestId('specimen').screenshot({ animations: 'disabled' })); }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
/** The state both pages publish, without the harness fields only the original page defines. */
async function state(page: Page) {
  return page.evaluate(() => { const { groups, rows, badges, dispose } = (window as any).fixtureState; return { groups, rows, badges, dispose }; });
}
async function equalState(pages: Page[]) {
  await expect.poll(async () => state(pages[1]), { message: 'published state' }).toEqual(await state(pages[0]));
}
async function drive(pages: Page[], step: { count: number; countFormat: string; titleFormat: string }) {
  for (const page of pages) await page.evaluate(value => (window as any).countBadgeFixture.apply(value), step);
}
async function dispose(pages: Page[]) {
  for (const page of pages) await page.evaluate(() => (window as any).countBadgeFixture.dispose());
}
const properties = ['display', 'boxSizing', 'padding', 'borderRadius', 'minWidth', 'minHeight', 'lineHeight', 'fontSize',
  'fontWeight', 'textAlign', 'verticalAlign', 'backgroundColor', 'color', 'borderTopWidth', 'borderTopStyle', 'borderTopColor'];
type Measurements = Record<string, Record<string, string | number>>;
/** Every row's computed style plus its border box, read from the rendered canvas. */
async function computed(page: Page) {
  return page.evaluate(names => Object.fromEntries([...document.querySelectorAll<HTMLElement>('[data-row]')].map(row => {
    const element = row.querySelector<HTMLElement>('.monaco-count-badge')!;
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    return [row.dataset.row!, {
      ...Object.fromEntries(names.map(name => [name, style.getPropertyValue(name.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`))])),
      width: Math.round(rect.width * 100) / 100, height: Math.round(rect.height * 100) / 100,
    }];
  })), properties) as Promise<Measurements>;
}
const pick = (measurements: Measurements, row: string, names: string[]) => Object.fromEntries(names.map(name => [name, measurements[row][name]]));
const rgb = (value: string) => {
  const hex = value.replace('#', '');
  const full = hex.length === 3 ? [...hex].map(character => character + character).join('') : hex;
  return `rgb(${parseInt(full.slice(0, 2), 16)}, ${parseInt(full.slice(2, 4), 16)}, ${parseInt(full.slice(4, 6), 16)})`;
};

/** Texts of the whole canvas, written out instead of recomputed, so the format rules are really checked. */
const expectedTexts: Record<string, string> = {
  'count-0': '0', 'count-1': '1', 'count-5': '5', 'count-12': '12', 'count-99': '99', 'count-999': '999', 'count-9999': '9999',
  'format-results': '12 Results', 'format-selected': '3 Selected', 'format-placeholder': '7 of {1}', 'format-empty': '8',
  'title-problems': '42',
  'text-dirty': '2', 'text-state': 'Running', 'text-recording': 'Recording Keys',
  'header-extensions': '3', 'header-scm': '12',
  dynamic: '12 Results', dispose: '5',
};
const allRows = [...groups.flatMap(group => group.rows), dynamicRow, disposeRow];
const countMetrics = {
  display: 'block', boxSizing: 'border-box', padding: '3px 5px', borderRadius: '11px', minWidth: '18px', minHeight: '18px',
  lineHeight: '11px', fontSize: '11px', fontWeight: '400', textAlign: 'center', verticalAlign: 'baseline',
};
// `.long`: squared off, tighter padding, no minimum height, natural line height. Minimum width and
// font size still come from the base rule.
const textMetrics = { ...countMetrics, padding: '2px 3px', borderRadius: '2px', minHeight: 'auto', lineHeight: 'normal' };
const metricNames = Object.keys(countMetrics);

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Count Badge visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    await equalState(pages);
    // Computed styles of every row, including the border colours the theme decides.
    const styles = [await computed(pages[0]), await computed(pages[1])];
    expect(styles[1]).toEqual(styles[0]);
    const colors = (await (await pages[0].request.get('/reference/themes.json')).json())[theme];
    for (const row of Object.keys(expectedTexts)) {
      expect(styles[0][row].backgroundColor, `${row} background`).toBe(rgb(colors['badge.background']));
      expect(styles[0][row].color, `${row} foreground`).toBe(rgb(colors['badge.foreground']));
      expect(styles[0][row].borderTopStyle, `${row} border style`).toBe(colors['contrastBorder'] ? 'solid' : 'none');
      if (colors['contrastBorder']) expect(styles[0][row].borderTopColor, `${row} border colour`).toBe(rgb(colors['contrastBorder']));
    }
    // Dynamic updates run on both pages through the same calls.
    for (const step of dynamicSteps) { await drive(pages, step); await equalState(pages); }
    await pixels(pages, info, 'updated');
    await dispose(pages);
    await equalState(pages);
    await pixels(pages, info, 'disposed');
  });
}

test('Count Badge text, DOM, inline styles and metrics match the original', async ({ context }) => {
  const pages = await pair(context);
  for (const [index, page] of pages.entries()) {
    const where = index ? 'replica' : 'original';
    expect(await page.locator('[data-group]').evaluateAll(elements => elements.map(element => (element as HTMLElement).dataset.group)), `${where} groups`)
      .toEqual(['counts', 'formats', 'tooltip', 'text', 'header', 'dynamic', 'dispose']);
    const dom = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-row]')].map(row => {
      const element = row.querySelector<HTMLElement>('.monaco-count-badge')!;
      return {
        row: row.dataset.row, text: element.textContent, className: element.className, styleAttribute: element.getAttribute('style'),
        background: element.style.backgroundColor, color: element.style.color, border: element.style.border,
        title: element.getAttribute('title'), ariaLabel: element.getAttribute('aria-label'),
        role: element.getAttribute('role'), tabIndex: element.getAttribute('tabindex'), childNodes: element.childNodes.length,
      };
    }));
    expect(dom, `${where} DOM`).toEqual(allRows.map(row => ({
      row: row.id, text: expectedTexts[row.id], className: row.variant === 'text' ? 'monaco-count-badge long' : 'monaco-count-badge',
      styleAttribute: 'background-color: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border: 1px solid var(--vscode-contrastBorder);',
      background: 'var(--vscode-badge-background)', color: 'var(--vscode-badge-foreground)', border: '1px solid var(--vscode-contrastBorder)',
      // The original's delayed hover service writes no attribute; the badge is a plain decoration.
      title: null, ariaLabel: null, role: null, tabIndex: null, childNodes: expectedTexts[row.id] === '' ? 0 : 1,
    })));
    // Both variants in the geometry of their row, plus the box the `.long` rules produce.
    const measurements = await computed(page);
    expect(pick(measurements, 'count-1', [...metricNames, 'width', 'height']), `${where} count badge`)
      .toEqual({ ...countMetrics, width: 18, height: 18 });
    expect(pick(measurements, 'count-9999', metricNames), `${where} four digit count`).toEqual(countMetrics);
    expect(pick(measurements, 'text-state', [...metricNames, 'height']), `${where} text badge`)
      .toEqual({ ...textMetrics, height: 17 });
    // The badge inside a plain block container keeps the declared `inline-block`; as a direct flex
    // child it is blockified by the row, exactly like the original.
    expect(pick(measurements, 'dispose', ['display']), `${where} hosted badge`).toEqual({ display: 'inline-block' });
  }
  expect(await computed(pages[1])).toEqual(await computed(pages[0]));
  // Hover content: only the row with a title format has one, and it is `format(titleFormat, count)`.
  for (const [index, published] of [await state(pages[0]), await state(pages[1])].entries()) {
    const hovers = Object.fromEntries(published.badges.map(observation => [observation.row, observation.hover]));
    expect(Object.values(hovers).filter(hover => hover !== null), `${index ? 'replica' : 'original'} hovers`).toEqual(['42 problems detected']);
  }
  // Clicking the decorative badge cancels its pending delayed hover and takes no focus.
  const before = await state(pages[0]);
  for (const page of pages) {
    await badge(page, 'title-problems').hover();
    await badge(page, 'title-problems').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.monaco-hover')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.tagName), 'badge takes no focus').toBe('BODY');
  }
  await equalState(pages);
  expect(await state(pages[0])).toEqual(before);
});

test('Count Badge updates count, format and hover through the original setters', async ({ context }) => {
  const pages = await pair(context);
  // The shared driving data is the canvas contract, so it is pinned here as literals.
  expect(dynamicSteps).toEqual([
    { count: 128, countFormat: '{0}', titleFormat: '' },
    { count: 128, countFormat: '{0} Results', titleFormat: '{0} results' },
    { count: 0, countFormat: '', titleFormat: '{0} results' },
  ]);
  const expected = [
    { text: '128', hover: null },
    { text: '128 Results', hover: '128 results' },
    // `setCountFormat('')` stores the empty format; the `{0}` default only applies to the constructor.
    { text: '', hover: '0 results' },
  ];
  for (const page of pages) await expect(badge(page, 'dynamic')).toHaveText('12 Results');
  for (const [index, step] of dynamicSteps.entries()) {
    await drive(pages, step);
    await equalState(pages);
    for (const page of pages) {
      const element = badge(page, 'dynamic');
      await expect(element).toHaveText(expected[index].text);
      expect(await element.evaluate(node => node.childNodes.length)).toBe(expected[index].text === '' ? 0 : 1);
      const observation = (await state(page)).badges.find(entry => entry.row === 'dynamic')!;
      expect(observation.hover).toBe(expected[index].hover);
      expect(observation.text).toBe(expected[index].text);
      expect(observation.className).toBe('monaco-count-badge');
    }
  }
});

test('Count Badge leaves its container when disposed', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await expect(page.locator('[data-testid="dispose-host"] .monaco-count-badge')).toHaveCount(1);
    expect((await state(page)).dispose.childCount).toBe(1);
  }
  await dispose(pages);
  await equalState(pages);
  for (const page of pages) {
    await expect(badge(page, disposeRow.id)).toHaveCount(0);
    await expect(page.locator('[data-testid="dispose-host"]')).toHaveJSProperty('innerHTML', '');
    expect((await state(page)).dispose).toEqual({ childCount: 0, html: '' });
    // Only the badge is removed: its row and label stay where they were.
    await expect(page.locator('[data-row="dispose"] .count-badge-label')).toHaveText('Disposed');
    // The badge instance is gone from the document, not hidden.
    expect(await page.locator('.monaco-count-badge').count()).toBe(allRows.length - 1);
  }
});
