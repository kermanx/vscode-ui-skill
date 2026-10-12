import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = []; for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=toolbar&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-toolbar--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]); return pages;
}
const toolbar = (page: Page, name = 'secondary') => page.locator(`[data-case="${name}"] .monaco-toolbar`);
const more = (page: Page, name = 'secondary') => toolbar(page, name).locator('[aria-haspopup="true"]');
async function state(page: Page) { return page.evaluate(() => { const s = (window as any).fixtureState; return { actions: s.actions, visibility: s.visibility, selection: s.selection }; }); }
async function semantics(page: Page) { return page.locator('.monaco-toolbar').evaluateAll(bars => bars.map(bar => ({ overflow: bar.querySelector('.monaco-action-bar')?.classList.contains('has-overflow'), role: bar.querySelector('.actions-container')?.getAttribute('role'), label: bar.querySelector('.actions-container')?.getAttribute('aria-label'), items: [...bar.querySelectorAll('.action-label')].map(el => ({ role: el.getAttribute('role'), label: el.getAttribute('aria-label'), disabled: el.getAttribute('aria-disabled'), checked: el.getAttribute('aria-pressed'), popup: el.getAttribute('aria-haspopup'), expanded: el.getAttribute('aria-expanded'), tabindex: el.getAttribute('tabindex'), classes: [...el.classList].sort(), text: el.textContent, focus: document.activeElement === el })) }))); }
async function equalState(pages: Page[]) { await expect.poll(async () => JSON.stringify(await state(pages[1])) === JSON.stringify(await state(pages[0]))).toBe(true); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`Toolbar primary, overflow and title/pane compositions / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, theme);
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
  await menuPixels(pages, info, `${theme}-initial`);
  for (const page of pages) await toolbar(page, 'primary').locator('.action-label').first().hover();
  await menuPixels(pages, info, `${theme}-primary-hover`, '[data-case="primary"]');
  for (const page of pages) { await page.mouse.move(410, 470); await more(page).focus(); await page.keyboard.press('End'); }
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
  await menuPixels(pages, info, `${theme}-more-focus`, '[data-case="secondary"]');
  for (const page of pages) { await page.keyboard.press('Enter'); await expect(page.getByRole('menu')).toBeFocused(); }
  await menuPixels(pages, info, `${theme}-menu`, '.context-view:not(.monaco-submenu)');
  await menuPixels(pages, info, `${theme}-open-trigger`, '[data-case="secondary"]');
  for (const page of pages) { await page.keyboard.press('End'); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('menuitem', { name: 'Move Left' })).toBeFocused(); }
  await menuPixels(pages, info, `${theme}-submenu`, '.monaco-submenu');
  for (const page of pages) { await page.keyboard.press('Enter'); await expect(more(page)).toBeFocused(); }
  await equalState(pages);
});
test('Toolbar More opens on mousedown/keydown while primary actions preserve focus and run on click/keyup', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.bringToFront();
    await page.locator('.outside').focus();
    await toolbar(page).locator('.action-label').first().click(); await expect(page.locator('.outside')).toBeFocused();
    await toolbar(page).locator('.action-label').nth(1).click({ force: true });
    await toolbar(page).locator('.action-label').first().focus();
    await page.keyboard.down('Enter'); expect((await state(page)).actions).toEqual(['secondary:new-file']);
    await page.keyboard.up('Enter'); expect((await state(page)).actions).toEqual(['secondary:new-file', 'secondary:new-file']);
    for (const key of ['ArrowRight', 'Enter', 'ArrowRight', 'ArrowRight', 'ArrowRight']) await page.keyboard.press(key);
    await expect(more(page)).toBeFocused();
    await page.keyboard.down('Space'); await expect(page.getByRole('menu')).toBeFocused();
    await page.keyboard.up('Space'); await page.keyboard.press('Escape'); await expect(more(page)).toBeFocused();
    await page.keyboard.press('ArrowRight'); await expect(toolbar(page).locator('.action-label').first()).toBeFocused();
    await page.locator('.outside').focus();
    await more(page).hover(); await page.mouse.down(); await expect(page.getByRole('menu')).toBeVisible(); await page.mouse.up();
    await page.keyboard.press('Escape'); await expect(page.locator('.outside')).toBeFocused();
  }
  expect(await semantics(pages[1])).toEqual(await semantics(pages[0]));
  await equalState(pages);
});
test('Workbench maxItems preserves overflow ordering, checked state, separators and disabled menu items', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await expect(toolbar(page, 'overflow').locator('.action-item')).toHaveCount(3);
    await more(page, 'overflow').focus(); await page.keyboard.press('Enter');
    await expect(page.locator('.action-menu-item[role^=menuitem]')).toHaveText(['Pin', 'Collapse All', 'Save All⌥⌘S', 'Auto Save', 'Archive', 'Layout']);
    await page.keyboard.press('Home'); await expect(page.getByRole('menuitemcheckbox', { name: 'Pin' })).toBeFocused();
  }
  await menuPixels(pages, info, 'overflow-menu', '.context-view:not(.monaco-submenu)');
  for (const page of pages) {
    await page.keyboard.press('End'); await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('menuitemcheckbox', { name: 'Auto Save' })).toBeFocused();
    await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    await expect(more(page, 'overflow')).toBeFocused();
  }
  await equalState(pages);
  expect((await state(pages[1])).actions).toEqual(['overflow:pin']);
});
test('Toolbar sidebar/pane menus preserve tree selection and restore keyboard or mouse origin focus', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.locator('[data-case="panel"] [data-id="index"]').click();
    await more(page, 'panel').click(); await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('tree')).toBeFocused();
    await more(page, 'title').focus(); await page.keyboard.press('Enter');
  }
  await menuPixels(pages, info, 'right-aligned-title-menu', '.context-view:not(.monaco-submenu)');
  for (const page of pages) {
    await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    await expect(more(page, 'title')).toBeFocused();
    await more(page, 'panel').focus(); await page.keyboard.press('Enter');
    await page.mouse.click(400, 450); await expect(page.getByRole('menu')).not.toBeVisible();
  }
  await equalState(pages);
  expect((await state(pages[1])).selection).toEqual(['index']);
});
