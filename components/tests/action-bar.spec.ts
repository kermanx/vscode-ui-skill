import { settleFixturePaint } from './paint';
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = []; for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=action-bar&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-action-bar--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]); return pages;
}
const row = (page: Page, name = 'horizontal') => page.locator(`[data-case="${name}"]`);
async function state(page: Page) { return page.evaluate(() => { const s = (window as any).fixtureState; return { actions: s.actions, cancels: s.cancels }; }); }
async function semantics(page: Page) { return page.locator('[data-testid="specimen"] .action-label').evaluateAll(els => els.map(el => ({ role: el.getAttribute('role'), label: el.getAttribute('aria-label'), title: el.getAttribute('title'), disabled: el.getAttribute('aria-disabled'), checked: el.getAttribute('aria-pressed'), tabIndex: (el as HTMLElement).tabIndex, text: el.textContent, classes: [...el.classList].sort(), focused: document.activeElement === el }))); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`${theme}: action bars match original icons, text, separators, focus, hover and active`, async ({ context }, info) => {
  const pages = await pair(context, theme);
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
  await menuPixels(pages, info, `${theme}-initial`);
  for (const page of pages) await row(page).locator('.action-label').first().hover();
  await menuPixels(pages, info, `${theme}-hover`);
  for (const page of pages) { await row(page).locator('.action-label').first().focus(); await page.mouse.down(); }
  await menuPixels(pages, info, `${theme}-active`);
  for (const page of pages) { await page.mouse.up(); await page.mouse.move(410, 470); }
  await menuPixels(pages, info, `${theme}-focus`);
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});
test('action bar keyboard loops, visits disabled items, skips separators, activates on keyup and cancels', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) await row(page).locator('.action-label').first().focus();
  for (const key of ['ArrowRight', 'Enter', 'ArrowRight', ' ', 'ArrowRight', 'End', 'ArrowRight', 'ArrowLeft', 'Home', 'Escape']) {
    for (const page of pages) await page.keyboard.press(key);
    expect(await semantics(pages[1]), key).toEqual(await semantics(pages[0]));
    expect(await state(pages[1]), key).toEqual(await state(pages[0]));
  }
  expect(await state(pages[1])).toEqual({ actions: ['horizontal:pin'], cancels: 1 });
  for (const page of pages) {
    await page.bringToFront();
    await page.keyboard.down('Enter');
    expect((await state(page)).actions).toHaveLength(1);
    await page.keyboard.up('Enter');
  }
  expect(await state(pages[1])).toEqual(await state(pages[0]));
});
test('vertical arrows and enabled-only non-loop navigation match original', async ({ context }, info) => {
  const pages = await pair(context);
  for (const name of ['vertical', 'enabled-only']) {
    for (const page of pages) await row(page, name).locator('.action-label').first().focus();
    const next = name === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const prev = name === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    for (const key of [prev, next, next, next, 'End', next, next, 'Home', prev, 'Enter']) {
      for (const page of pages) await page.keyboard.press(key);
      expect(await semantics(pages[1]), `${name}:${key}`).toEqual(await semantics(pages[0]));
      expect(await state(pages[1])).toEqual(await state(pages[0]));
    }
    for (const page of pages) await settleFixturePaint(page);
    await menuPixels(pages, info, `${name}-keyboard`, `[data-case="${name}"]`);
  }
});
test('mouse preserves focus, disabled actions do not run, blur clears held trigger', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.locator('.outside').focus();
    await row(page).locator('.action-label').nth(1).click({ force: true });
    await expect(page.locator('.outside')).toBeFocused();
    await row(page).locator('.action-label').nth(4).click();
    await expect(page.locator('.outside')).toBeFocused();
    await row(page).locator('.action-label').first().focus();
    await page.keyboard.down(' '); await page.locator('.outside').focus(); await page.waitForTimeout(20); await page.keyboard.up(' ');
    await row(page).locator('.action-label').first().focus(); await page.keyboard.up(' ');
  }
  expect(await state(pages[1])).toEqual(await state(pages[0]));
  expect((await state(pages[1])).actions).toEqual(['horizontal:run']);
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
});
