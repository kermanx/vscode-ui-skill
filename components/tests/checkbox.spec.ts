import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=checkbox&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-checkbox--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const checkbox = (page: Page, index = 0) => page.locator(`[data-index="${index}"] [role="checkbox"]`);
// Compare the full initial form, then crop each interaction to the row whose state changed.
async function pixels(pages: Page[], info: TestInfo, name: string, index?: number) {
  const buffers = [];
  for (const page of pages) { await page.bringToFront(); buffers.push(await (index === undefined ? page.getByTestId('specimen') : page.locator(`[data-index="${index}"]`)).screenshot({ animations: 'disabled' })); }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
async function state(page: Page) { return page.evaluate(() => { const { values, changes, bubbled } = (window as any).fixtureState; return { values, changes, bubbled }; }); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Checkbox visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    for (const page of pages) await checkbox(page).hover();
    await pixels(pages, info, 'hover', 0);
    for (const page of pages) { await page.mouse.move(400, 400); await checkbox(page).focus(); }
    await pixels(pages, info, 'focus', 0);
    for (const page of pages) await page.keyboard.press('Space');
    await pixels(pages, info, 'checked-focus', 0);
    for (const page of pages) { await page.locator('.outside').click(); await page.locator('[data-index="4"] .checkbox-label').hover(); }
    for (const page of pages) await expect(page.locator('[data-index="4"] .checkbox-label')).toHaveCSS('cursor', 'pointer');
    await pixels(pages, info, 'label-hover', 4);
    for (const page of pages) { await page.locator('[data-index="4"] .checkbox-label').click(); await expect(checkbox(page, 4)).toBeFocused(); }
    await pixels(pages, info, 'label-checked', 4);
    for (const page of pages) {
      await page.locator('.outside').click();
      await page.locator('[data-index="6"] .checkbox-label').hover();
      await expect(page.locator('[data-index="6"] .checkbox-label')).toHaveCSS('cursor', 'default');
    }
    await pixels(pages, info, 'disabled-label-hover', 6);
  });
}
test('Checkbox mouse, keyboard timing, label focus, disabled state and form propagation match original', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await checkbox(page).click();
    await expect(checkbox(page)).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.down('Space');
    await expect(checkbox(page)).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.up('Space');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+Space');
    await page.keyboard.press('Escape');
    await expect(checkbox(page)).toBeFocused();
    await checkbox(page, 2).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await expect(checkbox(page, 2)).toHaveAttribute('aria-checked', 'false');
    await expect(checkbox(page, 2)).toHaveAttribute('tabindex', '-1');
    await page.locator('[data-index="4"] .checkbox-label').click();
    await expect(checkbox(page, 4)).toBeFocused();
    await page.keyboard.press('Space');
    await page.locator('[data-index="6"] .checkbox-label').click();
    await expect(checkbox(page, 6)).toHaveAttribute('aria-checked', 'false');
    await expect(checkbox(page, 6)).not.toBeFocused();
    await page.locator('[data-index="7"] .checkbox-label').click();
    await expect(checkbox(page, 7)).toHaveAttribute('aria-checked', 'true');
    await checkbox(page, 0).focus();
    await page.keyboard.press('Tab');
    await expect(checkbox(page, 1)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(checkbox(page, 4)).toBeFocused();
  }
  const expected = { values: [false, true, false, true, false, true, false, true], changes: [
    { index: 0, checked: true, viaKeyboard: false }, { index: 0, checked: false, viaKeyboard: true },
    { index: 0, checked: true, viaKeyboard: true }, { index: 0, checked: false, viaKeyboard: true },
    { index: 4, checked: true, viaKeyboard: false }, { index: 4, checked: false, viaKeyboard: true },
  ], bubbled: 0 };
  expect(await state(pages[0])).toEqual(expected);
  expect(await state(pages[1])).toEqual(expected);
});
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`Checkbox real delayed Pointer tooltip / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, theme);
  for (const index of [0, 4]) {
    for (const page of pages) { await checkbox(page, index).hover(); await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 2500 }); await expect(page.getByRole('tooltip')).toHaveText(['Unchecked','','Disabled unchecked','','Enable auto save'][index]); }
    const { menuPixels } = await import('./menu-fixture');
    await menuPixels(pages, info, `checkbox-${index}-tooltip-${theme}`, '.workbench-hover-container');
    for (const page of pages) { await page.mouse.move(400,450); await expect(page.getByRole('tooltip')).toHaveCount(0); }
  }
});
test('Checkbox delayed tooltip cancels on leave, stays closed on keyboard focus and closes on click', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await checkbox(page).hover(); await page.waitForTimeout(100); await page.mouse.move(400,450); await page.waitForTimeout(1550); await expect(page.getByRole('tooltip')).toHaveCount(0);
    const disabled = await checkbox(page, 2).boundingBox(); await page.mouse.move(disabled!.x + 9, disabled!.y + 9); await page.waitForTimeout(1550); await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.mouse.move(400,450); await page.locator('.outside').focus(); await checkbox(page).focus(); await page.waitForTimeout(1550); await expect(page.getByRole('tooltip')).toHaveCount(0);
    await checkbox(page).hover(); await expect(page.getByRole('tooltip')).toBeVisible({ timeout:2500 }); await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toBeVisible(); await checkbox(page).click(); await expect(page.getByRole('tooltip')).toHaveCount(0);
  }
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});

test('Checkbox forwards class and data attributes to its standalone control', async ({ context }) => {
  const pages = await pair(context);
  await expect(checkbox(pages[1], 0)).toHaveClass(/fixture-checkbox/);
  await expect(checkbox(pages[1], 0)).toHaveAttribute('data-control-index', '0');
});
