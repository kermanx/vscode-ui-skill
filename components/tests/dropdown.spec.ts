import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=dropdown&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-dropdown-button--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const arrow = (page: Page, index = 0) => page.locator(`[data-index="${index}"] .monaco-dropdown-button`);
async function pixels(pages: Page[], info: TestInfo, name: string, menu = false) {
  if (menu) {
    const geometry = [];
    for (const page of pages) geometry.push(await page.locator('.context-view.monaco-menu-container').evaluate(el => ({ rect: el.getBoundingClientRect().toJSON(), shadow: getComputedStyle(el).boxShadow })));
    expect(geometry[1]).toEqual(geometry[0]);
  }
  const buffers = [];
  for (const page of pages) {
    await page.bringToFront();
    buffers.push(await (menu ? page.locator('.context-view.monaco-menu-container') : page.getByTestId('specimen')).screenshot({ animations: 'disabled' }));
  }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ w: a.width, h: a.height }).toEqual({ w: b.width, h: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
async function state(page: Page) { return page.evaluate(() => { const s = (window as any).fixtureState; return { clicks: s.clicks, actions: s.actions }; }); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Dropdown button + menu visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'closed');
    for (const page of pages) await arrow(page).hover();
    await pixels(pages, info, 'arrow-hover');
    for (const page of pages) { await arrow(page).click(); await expect(page.getByRole('menu')).toBeFocused(); }
    await pixels(pages, info, 'open', true);
    for (const page of pages) await page.keyboard.press('ArrowDown');
    await pixels(pages, info, 'focused', true);
    for (const page of pages) { await page.keyboard.press('End'); await expect(page.getByRole('menuitemcheckbox')).toBeFocused(); }
    await pixels(pages, info, 'checked-focus', true);
    for (const page of pages) { await page.keyboard.press('Escape'); await expect(arrow(page)).toBeFocused(); await expect(arrow(page)).toHaveAttribute('aria-expanded', 'false'); }
  });
}
test('Dropdown actions, disabled states, keyboard navigation, dismissal and focus restoration', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.locator('[data-index="0"] .monaco-text-button').click();
    await arrow(page).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Open in New Window' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemcheckbox')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('menuitemcheckbox')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(arrow(page)).toBeFocused();
    await arrow(page).click();
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(arrow(page)).toBeFocused();
    await arrow(page).click();
    await page.getByRole('menuitem', { name: 'Open in New Window' }).hover();
    await page.waitForTimeout(120); // upstream menu protects against the opening mouse-up for 100ms
    await page.getByRole('menuitem', { name: 'Open in New Window' }).click();
    await expect(page.getByRole('menu')).not.toBeVisible();
    await arrow(page).click();
    await page.mouse.click(390, 300);
    await expect(page.getByRole('menu')).not.toBeVisible();
    await arrow(page, 2).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await arrow(page, 2).click({ force: true });
    await expect(page.getByRole('menu')).not.toBeVisible();
  }
  expect(await state(pages[0])).toEqual({ clicks: 2, actions: ['auto-save', 'new-window'] });
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});

test('Secondary dropdown fits a narrow viewport and skips disabled mouse actions', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.setViewportSize({ width: 250, height: 300 });
    await arrow(page, 1).click();
    await page.getByRole('menuitem', { name: 'Add Folder to Workspace' }).click({ force: true });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Home');
  }
  await pixels(pages, info, 'secondary-narrow-menu', true);
  for (const page of pages) {
    await page.keyboard.press('Enter');
    await expect(arrow(page, 1)).toBeFocused();
    expect(await state(page)).toEqual({ clicks: 1, actions: [] });
  }
});
