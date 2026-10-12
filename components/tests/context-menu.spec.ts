import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
async function pair(context: BrowserContext, theme = 'dark', query = '') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = []; for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(`/reference/index.html?kind=context-menu&theme=${theme}${query}`);
  await pages[1].goto(`/iframe.html?id=components-context-menu--specimen&viewMode=story&globals=theme:${theme}${query}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  expect(errors).toEqual([]); return pages;
}
const state = (page: Page) => page.evaluate(() => { const s = (window as any).fixtureState; return { selection: s.selection, treeSelection: s.treeSelection, focus: s.focus, treeFocus: s.treeFocus, actions: s.actions, visibility: s.visibility, contexts: s.contexts }; });
async function equal(pages: Page[]) { expect(await state(pages[1])).toEqual(await state(pages[0])); }
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) test(`ContextMenu mouse, nested menus and List/Tree composition / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, theme);
  await menuPixels(pages, info, `${theme}-initial`);
  for (const page of pages) {
    await page.getByRole('list', { name: 'Context files', exact: true }).locator('[data-id="alpha"]').click();
    await page.getByRole('list', { name: 'Context files', exact: true }).locator('[data-id="beta"]').click({ button: 'right', position: { x: 100, y: 10 } });
    await expect(page.getByRole('menu')).toBeFocused();
  }
  await equal(pages);
  expect((await state(pages[1])).selection).toEqual(['alpha']);
  await menuPixels(pages, info, `${theme}-menu`, '.context-view:not(.monaco-submenu)');
  for (const page of pages) { await page.keyboard.press('End'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('End'); await page.keyboard.press('ArrowRight'); await expect(page.getByRole('menuitem', { name: 'New Window' })).toBeFocused(); }
  await menuPixels(pages, info, `${theme}-nested`, '.monaco-submenu');
  for (const page of pages) { await page.keyboard.press('Enter'); await expect(page.getByRole('list', { name: 'Context files', exact: true })).toBeFocused(); }
  await equal(pages);
  expect((await state(pages[1])).actions).toEqual(['list:beta:window']);
  for (const page of pages) { await page.getByRole('tree').locator('[data-id="readme"]').click({ button: 'right', position: { x: 100, y: 10 } }); await page.keyboard.press('Home'); }
  await menuPixels(pages, info, `${theme}-tree-menu`, '.context-view:not(.monaco-submenu)');
  for (const page of pages) { await page.keyboard.press('Escape'); await expect(page.getByRole('tree')).toBeFocused(); }
  await equal(pages);
  expect((await state(pages[1])).treeSelection).toEqual([]);
});
test('ContextMenu keyboard opens only on keyup and uses focused unselected List/Tree row anchors', async ({ context }, info) => {
  const pages = await pair(context);
  for (const role of ['list', 'tree'] as const) {
    for (const key of ['Shift+F10']) {
      for (const page of pages) {
        await page.bringToFront();
        await page.getByRole(role, { name: role === 'list' ? 'Context files' : 'Context tree', exact: true }).locator('[data-id="alpha"]').click();
        await page.keyboard.press('ArrowDown');
        if (key === 'Shift+F10') await page.keyboard.down('Shift');
        await page.keyboard.down(key === 'Shift+F10' ? 'F10' : key);
        await expect(page.getByRole('menu')).toHaveCount(0);
        await page.getByRole(role, { name: role === 'list' ? 'Context files' : 'Context tree', exact: true }).dispatchEvent('contextmenu', { button: 2, clientX: 0, clientY: 0 });
        await expect(page.getByRole('menu')).toHaveCount(0);
        await page.keyboard.up(key === 'Shift+F10' ? 'F10' : key);
        if (key === 'Shift+F10') await page.keyboard.up('Shift');
        await expect(page.getByRole('menu')).toBeFocused();
      }
      await equal(pages);
      await menuPixels(pages, info, `${role}-${key}-anchor`, '.context-view:not(.monaco-submenu)');
      for (const page of pages) { await page.keyboard.press('Home'); await page.keyboard.press('Enter'); await expect(page.getByRole(role, { name: role === 'list' ? 'Context files' : 'Context tree', exact: true })).toBeFocused(); }
      await equal(pages);
      expect((await state(pages[1]))[role === 'list' ? 'selection' : 'treeSelection']).toEqual(['alpha']);
    }
  }
});
for (const query of ['', '&empty=true']) test(`ContextMenu keyboard with no focused row${query ? ' and empty widgets' : ''}`, async ({ context }, info) => {
  const pages = await pair(context, 'dark', query);
  for (const role of ['list', 'tree'] as const) {
    for (const page of pages) { await page.getByRole(role, { name: role === 'list' ? 'Context files' : 'Context tree', exact: true }).focus(); await page.keyboard.press('Shift+F10'); await expect(page.getByRole('menu')).toBeFocused(); }
    await equal(pages);
    await menuPixels(pages, info, `${role}-empty-anchor`, '.context-view:not(.monaco-submenu)');
    for (const page of pages) { await page.keyboard.press('Escape'); await expect(page.getByRole(role, { name: role === 'list' ? 'Context files' : 'Context tree', exact: true })).toBeFocused(); }
  }
  await equal(pages);
});
test('ContextMenu point anchors flip at viewport edges and restore previous focus', async ({ context }, info) => {
  const pages = await pair(context);
  for (const [x, y] of [[415, 475], [10, 10], [210, 475], [415, 50], [415, 475]]) {
    for (const page of pages) { await page.locator('.outside').focus(); await page.evaluate(([x, y]) => (window as any).showPointMenu(x, y), [x, y]); await expect(page.getByRole('menu')).toBeFocused(); }
    await menuPixels(pages, info, `point-${x}-${y}`, '.context-view:not(.monaco-submenu)');
    for (const page of pages) { await page.keyboard.press('Escape'); await expect(page.locator('.outside')).toBeFocused(); }
  }
  await equal(pages);
});
test('ContextMenu first item option, outside click, disabled action and empty actions', async ({ context }) => {
  const pages = await pair(context, 'dark', '&first=true');
  for (const page of pages) {
    await page.locator('.context-target').click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: /^Open/ })).toBeFocused();
    await page.getByRole('menuitem', { name: 'Rename' }).click({ force: true });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.mouse.click(405, 450); await expect(page.getByRole('menu')).toHaveCount(0);
    await page.locator('.context-target').click({ button: 'right' });
    await page.setViewportSize({ width: 400, height: 460 }); await expect(page.getByRole('menu')).toHaveCount(0);
  }
  await equal(pages);
  const emptyPages = await pair(context, 'dark', '&emptyMenu=true');
  for (const page of emptyPages) { await page.locator('.context-target').click({ button: 'right' }); await expect(page.getByRole('menu')).toHaveCount(0); }
  await equal(emptyPages);
});

test('ContextMenu key follows native Mac mouse routing and Windows keyup routing', async ({ context, browser }) => {
  const windows = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6006', viewport: { width: 420, height: 480 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' });
  // A separate context keeps the real StandardKeyboardEvent platform detection intact.
  try {
    for (const [source, isWindows] of [[context, false], [windows, true]] as const) {
      const pages = await pair(source);
      for (const page of pages) {
        for (const role of ['list', 'tree'] as const) {
          const widget = page.getByRole(role, { name: role === 'list' ? 'Context files' : 'Context tree', exact: true });
          await widget.locator('[data-id="alpha"]').click(); await page.keyboard.press('ArrowDown');
          await page.keyboard.down('ContextMenu');
          if (isWindows) await expect(page.getByRole('menu')).toHaveCount(0);
          else await expect(page.getByRole('menu')).toBeVisible();
          await page.keyboard.up('ContextMenu'); await expect(page.getByRole('menu')).toBeFocused();
          await page.keyboard.press('Escape'); await expect(widget).toBeFocused();
        }
      }
      await equal(pages);
    }
  } finally { await windows.close(); }
});

test('ContextMenu recreates long menu height and scroll position across bottom, top and bottom openings', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&long=true');
  for (const [index, [x, y]] of [[415, 475], [10, 10], [415, 475]].entries()) {
    for (const page of pages) {
      await page.locator('.outside').focus();
      await page.evaluate(([x, y]) => (window as any).showPointMenu(x, y), [x, y]);
      await expect(page.getByRole('menu')).toBeFocused();
      expect(await page.locator('.monaco-menu').evaluate(el => el.scrollTop)).toBe(0);
    }
    await menuPixels(pages, info, `long-${index}`, '.context-view:not(.monaco-submenu)');
    for (const page of pages) {
      await page.keyboard.press('End'); await expect(page.getByRole('menuitem', { name: 'Command 30' })).toBeFocused();
      expect(await page.locator('.monaco-menu').evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      await page.keyboard.press('Escape'); await expect(page.locator('.outside')).toBeFocused();
    }
  }
  await equal(pages);
});

test('ContextMenu reads actions changed in the same callback and preserves an open menu for empty replacements', async ({ context }) => {
  const pages = await pair(context, 'dark', '&dynamic=true');
  for (const page of pages) {
    const list = page.getByRole('list', { name: 'Context files', exact: true });
    await list.locator('[data-id="alpha"]').click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Open alpha.ts' })).toBeVisible();
    await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    await list.locator('[data-id="beta"]').click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: 'Open beta.ts' })).toBeVisible();
    for (const variant of ['first', 'second'] as const) {
      await page.evaluate(variant => (window as any).showDynamicMenu(variant), variant);
      await expect(page.getByRole('menuitem', { name: variant === 'first' ? 'Open alpha.ts' : 'Open beta.ts' })).toBeVisible();
    }
    expect((await state(page)).visibility).toEqual([true, false, true, false, true, false, true]);
    await page.evaluate(() => (window as any).showDynamicMenu('empty'));
    await expect(page.getByRole('menuitem', { name: 'Open beta.ts' })).toBeVisible();
    expect((await state(page)).visibility).toEqual([true, false, true, false, true, false, true]);
    await page.keyboard.press('Home'); await page.keyboard.press('Enter');
    await page.evaluate(() => (window as any).showDynamicMenu('empty'));
    await expect(page.getByRole('menu')).toHaveCount(0);
    expect((await state(page)).visibility).toEqual([true, false, true, false, true, false, true, false]);
  }
  await equal(pages);
  expect((await state(pages[1])).actions).toEqual(['list:alpha:open-alpha', 'dynamic:second:open-beta']);
});
