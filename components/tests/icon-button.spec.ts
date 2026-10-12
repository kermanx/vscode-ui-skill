import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=icon-button&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-icon-button--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]);
  return pages;
}
const control = (page: Page, index = 0) => page.locator(`[data-index="${index}"] .action-label`);
async function state(page: Page) { return page.evaluate(() => { const { clicks, bubbled } = (window as any).fixtureState; return { clicks, bubbled }; }); }
async function semantics(page: Page) {
  return page.getByTestId('specimen').locator('.action-label').evaluateAll(elements => elements.map(element => ({
    role: element.getAttribute('role'), label: element.getAttribute('aria-label'), title: element.getAttribute('title'), disabled: element.getAttribute('aria-disabled'),
    pressed: element.getAttribute('aria-pressed'), tabindex: element.getAttribute('tabindex'), classes: [...element.classList].sort(), text: element.textContent, focused: document.activeElement === element,
  })));
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`IconButton visual parity / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, theme);
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
  await menuPixels(pages, info, 'initial');
  for (const page of pages) await control(page).hover();
  await menuPixels(pages, info, 'hover');
  for (const page of pages) { await page.mouse.move(400, 450); await control(page).focus(); }
  await menuPixels(pages, info, 'focus');
  for (const page of pages) await control(page, 1).focus();
  await menuPixels(pages, info, 'disabled-focus');
  for (const page of pages) { await control(page, 2).focus(); await control(page, 2).hover(); }
  await menuPixels(pages, info, 'checked-focus-hover');
  for (const page of pages) { await control(page, 6).focus(); await page.mouse.move(400, 450); }
  await menuPixels(pages, info, 'header-composition');
});
test('IconButton preserves ActionBar mouse focus, keyup activation, disabled state and controlled checked state', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.locator('.outside').focus();
    await control(page).click();
    await expect(page.locator('.outside')).toBeFocused();
    await control(page, 1).click({ force: true });
    await expect(page.locator('.outside')).toBeFocused();
    await control(page, 2).click();
    await expect(control(page, 2)).toHaveAttribute('aria-pressed', 'true');
    await expect(control(page, 4)).toHaveAttribute('aria-label', 'Close editor');
    await expect(control(page, 4)).not.toHaveAttribute('title');
    await control(page).focus();
    await page.keyboard.down('Enter');
    expect((await state(page)).clicks).toHaveLength(2);
    await page.keyboard.up('Enter');
    await page.keyboard.down('Space');
    expect((await state(page)).clicks).toHaveLength(3);
    await page.keyboard.up('Space');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('Escape');
    await expect(control(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(control(page, 1)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(control(page, 2)).toBeFocused();
  }
  const expected = { clicks: [{ index: 0, type: 'click' }, { index: 2, type: 'click' }, { index: 0, type: 'keyup' }, { index: 0, type: 'keyup' }], bubbled: 0 };
  expect(await state(pages[0])).toEqual(expected);
  expect(await state(pages[1])).toEqual(expected);
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
});
test('IconButton clears held activation after blur and reflects dynamic icon, label, tooltip, checked and disabled props', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await control(page).focus();
    await page.keyboard.down('Space');
    await page.locator('.outside').focus();
    await page.waitForTimeout(20); // Both bars defer blur to distinguish focus moving inside the bar.
    await page.keyboard.up('Space');
    await control(page).focus();
    await page.keyboard.up('Space');
    expect((await state(page)).clicks).toHaveLength(0);
    await page.locator('.fixture-update').click();
    await expect(control(page)).toHaveClass(/codicon-new-folder/);
    await expect(control(page)).toHaveAttribute('aria-label', 'Create a folder');
    await expect(control(page, 1)).not.toHaveAttribute('aria-disabled');
    await expect(control(page, 2)).toHaveAttribute('aria-pressed', 'false');
    await control(page, 1).click();
    await page.mouse.move(400, 450);
  }
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
  expect(await state(pages[0])).toEqual({ clicks: [{ index: 1, type: 'click' }], bubbled: 0 });
  expect(await state(pages[1])).toEqual(await state(pages[0]));
  await menuPixels(pages, info, 'dynamic-props');
});
