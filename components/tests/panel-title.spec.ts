import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { settleFixturePaint } from "./paint";
import { menuPixels } from "./menu-fixture";
test.use({ viewport: { width: 700, height: 500 } });
const errors = new WeakMap<Page, string[]>();
async function pair(context: BrowserContext, theme = "dark", query = "") {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages) {
    const list: string[] = [];
    errors.set(page, list);
    page.on("pageerror", (error) => list.push(error.message));
  }
  await pages[0]!.goto(
    `/reference/index.html?kind=panel-title&theme=${theme}${query}`,
  );
  await pages[1]!.goto(
    `/iframe.html?id=components-panel-title--specimen&viewMode=story&globals=theme:${theme}${query}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  return pages;
}
async function state(page: Page) {
  return page.evaluate(() => ({
    state: (window as any).fixtureState,
    items: [
      ...document.querySelectorAll(
        ".composite-bar > .monaco-action-bar > .actions-container > .action-item",
      ),
    ].map((el) => ({
      classes: [...el.classList].sort(),
      role: el.getAttribute("role"),
      expanded: el.getAttribute("aria-expanded"),
      selected: el.getAttribute("aria-selected"),
      tab: el.getAttribute("tabindex"),
      label: el.querySelector("a")?.getAttribute("aria-label"),
      badge: el.querySelector(".badge-content")?.textContent,
      hidden: el.querySelector(".badge")?.getAttribute("aria-hidden"),
      focused: el === document.activeElement,
    })),
  }));
}
async function equal(pages: Page[]) {
  for (const page of pages) expect(errors.get(page)).toEqual([]);
  expect(await state(pages[1]!)).toEqual(await state(pages[0]!));
}
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`PanelTitle text tabs, badges, toolbar and keyboard focus / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await equal(pages);
    await menuPixels(pages, info, `${theme}-initial`);
    for (const page of pages) await page.evaluate(() => (window as any).fixtureApi.focus());
    await equal(pages);
    await menuPixels(pages, info, `${theme}-focus`);
    for (const page of pages) await page.keyboard.press('ArrowRight');
    await equal(pages);
    await menuPixels(pages, info, `${theme}-focus-next`);
  });

for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`PanelTitle compact icon tabs and toolbar menu / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme, '&icons=true');
    await equal(pages);
    for (const page of pages) await settleFixturePaint(page);
    await menuPixels(pages, info, `${theme}-icons`);
    for (const page of pages) await page.getByRole('button', { name: 'Views and More Actions...' }).click();
    await menuPixels(pages, info, `${theme}-toolbar-menu`, '.monaco-menu-container');
    for (const page of pages) { await page.waitForTimeout(120); await page.getByRole('menuitem', { name: /Clear Output$/ }).click(); await expect(page.getByRole('menu')).toHaveCount(0); }
    await equal(pages);
    expect((await state(pages[0]!)).state.actions).toEqual(['clear']);
  });
test('PanelTitle keeps the active tab when resizing and opens overflow views', async ({ context }, info) => {
  const pages = await pair(context, 'dark', '&active=terminal');
  for (const width of [700, 500, 380, 280, 200, 150, 700]) {
    for (const page of pages) { await page.setViewportSize({width, height:500}); await page.waitForTimeout(50); }
    await equal(pages);
    await menuPixels(pages, info, `width-${width}`);
  }
  for (const page of pages) { await page.setViewportSize({width:380,height:500}); await page.locator('.codicon-more').click(); }
  await menuPixels(pages, info, 'overflow-menu', '.monaco-menu-container');
  for (const page of pages) { await page.waitForTimeout(120); await page.getByRole('menuitemcheckbox', {name:/Debug Console$/}).click(); await expect(page.getByRole('menu')).toHaveCount(0); }
  await equal(pages);
  await menuPixels(pages, info, 'overflow-selected');
});
test('PanelTitle keyboard wraps and opens views on keydown', async ({context}) => {
  const pages = await pair(context);
  for (const page of pages) { await page.evaluate(() => (window as any).fixtureApi.focus()); await page.keyboard.press('ArrowLeft'); }
  await equal(pages);
  for (const page of pages) await page.keyboard.down('Enter');
  await equal(pages);
  expect((await state(pages[0]!)).state.opens).toEqual([{id:'terminal',focus:true}]);
  for (const page of pages) await page.keyboard.up('Enter');
  await equal(pages);
});
test('PanelTitle pointer hover, item badge menu and title pin menu', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.getByRole('tab').filter({has:page.locator('a', {hasText:'Output'})}).hover();
    await expect(page.getByRole('tooltip')).toBeVisible({timeout:4000});
  }
  await menuPixels(pages, info, 'title-tooltip', '.workbench-hover-container');
  for (const page of pages) {
    await page.mouse.move(690,490);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.getByRole('tab').filter({has:page.locator('a', {hasText:'Problems'})}).click({button:'right'});
  }
  await menuPixels(pages, info, 'title-item-menu', '.monaco-menu-container');
  for (const page of pages) {
    await page.waitForTimeout(120);
    await page.getByRole('menuitemcheckbox', {name:/Hide Badge$/}).click();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await page.waitForTimeout(850);
  }
  await equal(pages);
  await menuPixels(pages, info, 'title-badge-hidden');
  for (const page of pages) await page.locator('.composite.title').click({button:'right',position:{x:450,y:15}});
  await menuPixels(pages, info, 'title-context-menu', '.monaco-menu-container');
  for (const page of pages) {
    await page.waitForTimeout(120);
    await page.getByRole('menuitemcheckbox', {name:/Ports$/}).click();
    await expect(page.getByRole('menu')).toHaveCount(0);
  }
  await equal(pages);
  expect((await state(pages[0]!)).state.activeId).toBe('ports');
});
test('PanelTitle dynamic compact badge types and primary toolbar actions', async ({context}, info) => {
  const pages = await pair(context, 'hcDark', '&icons=true');
  for (const badges of [[{type:'number',value:1000}], [{type:'icon',icon:'warning'}], [{type:'progress'}], []]) {
    for (const page of pages) await page.evaluate(badges => (window as any).fixtureApi.badge('problems',badges),badges);
    await equal(pages);
    await menuPixels(pages,info,`compact-${badges[0]?.type}`);
  }
  for (const page of pages) await page.getByRole('button',{name:'Split Terminal'}).click();
  await equal(pages);
  expect((await state(pages[0]!)).state.actions).toEqual(['split']);
});
