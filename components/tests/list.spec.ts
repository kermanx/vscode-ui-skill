import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context: BrowserContext, theme = 'dark', options = '') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = []; for (const page of pages) page.on('pageerror', e => errors.push(e.message));
  await pages[0].goto(`/reference/index.html?kind=list&theme=${theme}${options}`);
  await pages[1].goto(`/iframe.html?id=components-list--specimen&viewMode=story&globals=theme:${theme}${options}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]); return pages;
}
async function state(page: Page) { return page.evaluate(() => { const s = (window as any).fixtureState; return { focus: s.focus, selection: s.selection, actions: s.actions, contexts: s.contexts }; }); }
async function equalState(pages: Page[]) { await expect.poll(async () => JSON.stringify(await state(pages[1])) === JSON.stringify(await state(pages[0]))).toBe(true); }
async function keys(pages: Page[], keys: string[]) { for (const key of keys) { for (const page of pages) await page.keyboard.press(key); await equalState(pages); } }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`List rows, decoration, actions and selection / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, theme);
  await menuPixels(pages, info, 'initial');
  for (const page of pages) await page.locator('[data-id="button"]').hover();
  await menuPixels(pages, info, 'hover-actions');
  for (const page of pages) await page.locator('[data-id="button"] .label-name').click();
  await equalState(pages); await menuPixels(pages, info, 'selected-decoration');
  await keys(pages, ['ArrowDown']); await menuPixels(pages, info, 'focus-separate-from-selection');
  for (const page of pages) await page.locator('.outside').click();
  await menuPixels(pages, info, 'inactive');
  for (const page of pages) await page.locator('[data-id="package"] .label-name').click({ modifiers: ['Shift'] });
  await equalState(pages); await menuPixels(pages, info, 'range');
  for (const page of pages) { await page.locator('[data-id="package"] .label-name').click(); await page.keyboard.press('Tab'); }
  await menuPixels(pages, info, 'action-focus');
  await keys(pages, ['Enter', 'ArrowRight', 'Enter']);
  expect((await state(pages[1])).actions).toEqual(['package:pin']);
});
test('List navigation, typeahead, modifiers, context and blank space', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) await page.getByRole('list', { name: 'Open files', exact: true }).focus();
  await keys(pages, ['ArrowDown', 'Enter', 'Shift+ArrowDown', 'Shift+ArrowDown', 'Shift+ArrowUp', 'End', 'Home', 'Shift+End', 'Control+End', 'Meta+End', 'Alt+End', 'Alt+Home', 'p', 'a']);
  for (const page of pages) await page.locator('[data-id="deleted"] .label-name').click({ modifiers: ['ControlOrMeta'] });
  await equalState(pages);
  for (const page of pages) await page.locator('[data-id="button"] .label-name').click({ modifiers: ['Shift'] });
  await equalState(pages);
  await keys(pages, ['ControlOrMeta+a', 'Escape']);
  for (const page of pages) await page.locator('[data-id="readme"] .label-name').click({ button: 'right' });
  await equalState(pages);
  expect((await state(pages[1])).selection).toEqual([]);
  for (const page of pages) await page.getByRole('list', { name: 'Open files', exact: true }).click({ position: { x: 250, y: 240 } });
  await equalState(pages); expect((await state(pages[1])).focus).toEqual([]);
});
test('List single selection, mouse actions and dynamic items', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&multiple=false');
  for (const page of pages) await page.locator('[data-id="app"] .label-name').click();
  for (const page of pages) await page.locator('[data-id="button"] .label-name').click({ modifiers: ['Shift'] });
  await equalState(pages); expect((await state(pages[1])).selection).toEqual(['button']);
  await keys(pages, ['ControlOrMeta+a']);
  for (const page of pages) await page.locator('[data-id="button"] .action-label').click();
  await equalState(pages); expect((await state(pages[1])).actions).toEqual(['button:close']);
  for (const page of pages) await page.locator('.fixture-update').click();
  await equalState(pages); await menuPixels(pages, info, 'updated');
  expect((await state(pages[1])).selection).toEqual(['button']);
  for (const page of pages) await page.locator('.fixture-clear').click();
  await equalState(pages); await menuPixels(pages, info, 'empty');
  for (const page of pages) { await page.getByRole('list', { name: 'Open files', exact: true }).focus(); await page.keyboard.press('ArrowDown'); }
  await equalState(pages);
});
test('List 10k virtualization, pages, wheel and scrollbar', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&large=true');
  for (const page of pages) await page.getByRole('list', { name: 'Open files', exact: true }).focus();
  await keys(pages, ['ArrowDown', 'PageDown', 'PageDown', 'PageUp', 'End', 'Home']);
  for (const page of pages) { await page.mouse.move(180, 120); await page.mouse.wheel(0, 240); }
  for (const page of pages) await expect(page.locator('[data-id="item-10"]')).toBeVisible();
  await menuPixels(pages, info, 'wheel');
  for (const page of pages) {
    const box = await page.getByRole('list', { name: 'Open files', exact: true }).boundingBox();
    await page.mouse.move(box!.x + box!.width - 5, box!.y + 8); await page.mouse.down(); await page.mouse.move(box!.x + box!.width - 5, box!.y + 65); await page.mouse.up();
  }
  await menuPixels(pages, info, 'thumb-drag');
  expect(await pages[1].getByRole('listitem').count()).toBeLessThan(20);
  for (const page of pages) { await page.getByRole('list', { name: 'Open files', exact: true }).focus(); await page.keyboard.press('End'); }
  await equalState(pages); await menuPixels(pages, info, 'last-row');
});
