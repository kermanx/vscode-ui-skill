import { test, expect } from '@playwright/test';
import { menuPair, menuPixels, menuState } from './menu-fixture';
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Menu separators, checks, shortcuts and submenu parity / ${theme}`, async ({ context }, info) => {
    const pages = await menuPair(context, 'menu', theme);
    await menuPixels(pages, info, 'menu-default');
    for (const page of pages) { await page.getByRole('menu').focus(); await page.keyboard.press('ArrowDown'); }
    await menuPixels(pages, info, 'menu-focus', '.action-item.focused > .action-menu-item');
    const indicators = [];
    for (const page of pages) indicators.push(await page.locator('.submenu-indicator').evaluateAll(els => els.map(el => ({ rect: el.getBoundingClientRect().toJSON(), color: getComputedStyle(el).color, font: getComputedStyle(el).font }))));
    expect(indicators[1]).toEqual(indicators[0]);
    for (const page of pages) {
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('menuitemcheckbox', { name: 'Auto Save' })).toBeFocused();
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('menuitem', { name: 'Open Recent' })).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('menuitem', { name: 'Workspace' })).toBeFocused();
    }
    await menuPixels(pages, info, 'submenu-keyboard', '.monaco-submenu');
    for (const page of pages) { await page.keyboard.press('End'); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('menuitem', { name: 'Archive' })).toBeFocused(); }
    await menuPixels(pages, info, 'nested-submenu', '.monaco-submenu');
    for (const page of pages) {
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menuitem', { name: 'More', exact: true })).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(page.getByRole('menuitem', { name: 'Open Recent' })).toBeFocused();
    }
  });
}
test('Standalone Menu actions, disabled items, cancellation and hover submenus', async ({ context }, info) => {
  const pages = await menuPair(context, 'menu');
  for (const page of pages) {
    await page.getByRole('menu').focus(); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: /^Save/ }).click({ force: true });
    await page.getByRole('menuitem', { name: 'Open Recent' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Workspace' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'README.md' }).hover();
    await page.waitForTimeout(120); // original guards the first 100ms against opening mouseup
    await page.getByRole('menuitem', { name: 'README.md' }).click();
    await expect.poll(async () => (await menuState(page)).actions).toContain('readme');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  }
  expect(await menuState(pages[1])).toEqual(await menuState(pages[0]));
  expect((await menuState(pages[1])).actions).toEqual(['new', 'readme']);
  expect((await menuState(pages[1])).cancels).toBe(1);
});
test('Menu empty submenu and narrow viewport positioning', async ({ context }, info) => {
  const pages = await menuPair(context, 'menu');
  for (const page of pages) {
    await page.setViewportSize({ width: 280, height: 320 });
    await page.getByRole('menu').focus(); await page.keyboard.press('End'); await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('menuitem', { name: '(empty)' })).toBeVisible();
  }
  await menuPixels(pages, info, 'empty-submenu', '.monaco-submenu');
});

test('Long Menu scrolling, keyboard reveal and scrollbar parity', async ({ context }, info) => {
  const pages = await menuPair(context, 'menu', 'dark', '&long=true');
  await menuPixels(pages, info, 'long-menu');
  for (const page of pages) { await page.getByRole('menu').focus(); await page.keyboard.press('End'); }
  await menuPixels(pages, info, 'long-menu-end');
  for (const page of pages) { await page.mouse.move(100, 120); await page.mouse.wheel(0, -120); }
  await expect.poll(() => pages[1].locator('.monaco-menu').evaluate(el => el.scrollTop)).toBe(await pages[0].locator('.monaco-menu').evaluate(el => el.scrollTop));
  await menuPixels(pages, info, 'long-menu-wheel-thumb', '.scrollbar.vertical .slider');
  await menuPixels(pages, info, 'long-menu-wheel-row', '.action-menu-item:has-text("Command 25")');
  for (const page of pages) {
    const thumb = await page.locator('.scrollbar.vertical .slider').boundingBox();
    await page.mouse.move(thumb!.x + 3, thumb!.y + 10); await page.mouse.down();
    await page.mouse.move(thumb!.x + 3, thumb!.y - 35); await page.mouse.up();
  }
  await expect.poll(() => pages[1].locator('.monaco-menu').evaluate(el => el.scrollTop)).toBe(await pages[0].locator('.monaco-menu').evaluate(el => el.scrollTop));
  await menuPixels(pages, info, 'long-menu-drag-thumb', '.scrollbar.vertical .slider');
});
