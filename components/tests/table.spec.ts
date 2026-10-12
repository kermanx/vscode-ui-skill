import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { isDeepStrictEqual } from "node:util";
import { menuPixels } from "./menu-fixture";
async function pair(context: BrowserContext, theme = "dark", options = "") {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on("pageerror", (e) => errors.push(e.message));
  await pages[0].goto(
    `/reference/index.html?kind=table&theme=${theme}${options}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-table--specimen&viewMode=story&globals=theme:${theme}${options}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(errors).toEqual([]);
  return pages;
}
const row = (page: Page, index: number) =>
  page.locator(`.monaco-list-row[data-index="${index}"]`);
const list = (page: Page) => page.locator(".monaco-list");
const sash = (page: Page, index: number) =>
  page
    .locator(
      ".monaco-table > .monaco-split-view2 > .sash-container > .monaco-sash",
    )
    .nth(index);
const state = (page: Page) => page.evaluate(() => (window as any).fixtureState);
async function equal(pages: Page[]) {
  await expect
    .poll(async () =>
      isDeepStrictEqual(await state(pages[0]), await state(pages[1])),
    )
    .toBe(true);
}
async function api(pages: Page[], name: string) {
  for (const page of pages)
    await page.evaluate((name) => (window as any).fixtureApi[name](), name);
  await equal(pages);
}
async function drag(pages: Page[], index: number, delta: number, body = false) {
  for (const page of pages) {
    const box = (await sash(page, index).boundingBox())!;
    const x = box.x + 2,
      y = box.y + (body ? 100 : 12);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + delta, y);
    await page.mouse.up();
  }
  await equal(pages);
}
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`Table original cells and full-height column dividers / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await equal(pages);
    await menuPixels(pages, info, "initial");
    for (const page of pages) {
      await row(page, 0).click();
      await row(page, 2).click({ modifiers: ["Shift"] });
    }
    await equal(pages);
    await menuPixels(pages, info, "selected");
    for (const page of pages) {
      await sash(page, 1).hover({ position: { x: 2, y: 100 } });
      await expect(sash(page, 1)).toHaveClass(/hover/);
    }
    await menuPixels(pages, info, "full-height-hover");
    await drag(pages, 1, -20, true);
    await menuPixels(pages, info, "column-drag");
    for (const page of pages)
      await sash(page, 1).dblclick({ position: { x: 2, y: 12 } });
    await equal(pages);
    await menuPixels(pages, info, "weighted-reset");
  });
test("Table column percentage resize, min/max constraints and proportional container resize", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) await expect(sash(page, 0)).toHaveClass(/disabled/);
  await api(pages, "resize");
  await api(pages, "constraints");
  for (const page of pages) await expect(page.locator(".monaco-list .scrollbar.vertical, .vc-list-scrollbar")).toHaveCSS("opacity", "0");
  await menuPixels(pages, info, "constraints");
  for (const page of pages)
    await page.setViewportSize({ width: 700, height: 540 });
  await equal(pages);
  await drag(pages, 2, 160, true);
  await menuPixels(pages, info, "max-column");
  for (const page of pages)
    await sash(page, 2).dblclick({ position: { x: 2, y: 12 } });
  await equal(pages);
  await api(pages, "height");
  await menuPixels(pages, info, "height-and-reset");
});
test("Table focus and selection, range/control selection, type navigation and keyboard context menu", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await row(page, 0).click();
    await list(page).press("ArrowDown");
  }
  await equal(pages);
  expect((await state(pages[1])).focus).toEqual(["2"]);
  expect((await state(pages[1])).selection).toEqual(["1"]);
  for (const key of [
    "Enter",
    "Shift+ArrowDown",
    "PageDown",
    "PageDown",
    "PageUp",
    "Home",
    "End",
    "Home",
  ]) {
    for (const page of pages) await list(page).press(key);
    await equal(pages);
  }
  for (const page of pages) await list(page).press("b");
  await equal(pages);
  expect((await state(pages[1])).focus).toEqual(["2"]);
  for (const page of pages) {
    await row(page, 4).click({ modifiers: ["ControlOrMeta"] });
    await row(page, 6).click({ modifiers: ["Shift"] });
  }
  await equal(pages);
  await menuPixels(pages, info, "range");
  for (const page of pages) await list(page).press("Shift+F10");
  await equal(pages);
  for (const page of pages) await row(page, 1).click({ button: "right" });
  await equal(pages);
  for (const page of pages) await list(page).press("ControlOrMeta+a");
  await equal(pages);
  expect((await state(pages[1])).selection).toHaveLength(18);
  for (const page of pages) await list(page).press("Escape");
  await equal(pages);
});
test("Table row identity across replacement, empty data and single selection", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "&multiple=false");
  for (const page of pages) {
    await row(page, 2).click();
    await row(page, 4).click({ modifiers: ["Shift"] });
  }
  await equal(pages);
  expect((await state(pages[1])).selection).toEqual(["5"]);
  await api(pages, "update");
  await menuPixels(pages, info, "replaced");
  await api(pages, "clear");
  expect((await state(pages[1])).selection).toEqual([]);
  await menuPixels(pages, info, "empty");
  await api(pages, "update");
  await menuPixels(pages, info, "restored");
});
test("Table 10000 rows virtualize and keep columns aligned through wheel, end and data updates", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "&large=true");
  for (const page of pages)
    expect(await page.locator(".monaco-list-row").count()).toBeLessThan(15);
  await api(pages, "scroll");
  await menuPixels(pages, info, "scroll-1000");
  for (const page of pages) {
    await list(page).hover();
    await page.mouse.wheel(0, 80);
  }
  await expect
    .poll(async () =>
      isDeepStrictEqual(await state(pages[0]), await state(pages[1])),
    )
    .toBe(true);
  await menuPixels(pages, info, "wheel");
  for (const page of pages) {
    await list(page).focus();
    await list(page).press("End");
  }
  await equal(pages);
  expect((await state(pages[1])).focus).toEqual(["row-9999"]);
  await menuPixels(pages, info, "end");
  await api(pages, "update");
  for (const page of pages)
    expect(await page.locator(".monaco-list-row").count()).toBeLessThan(15);
  await menuPixels(pages, info, "large-update");
});

test("Table source motion mode reveals the column borders on hover", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.evaluate(() =>
      (document.querySelector(".vc-theme") ||
        document.querySelector("#fixture"))!.classList.add(
        "monaco-enable-motion",
      ),
    );
    await page.mouse.move(410, 400);
  }
  // The two pages mount at different times. Let both initial 500 ms scrollbar
  // reveals and their 800 ms fades finish before comparing column transitions.
  for (const page of pages) {
    const scrollbar = page.locator(
      ".monaco-list .scrollbar.vertical, .vc-list-scrollbar",
    );
    await expect(scrollbar).not.toHaveClass(/(?:^| )visible(?: |$)/);
    await expect(scrollbar).toHaveCSS("opacity", "0");
  }
  await menuPixels(pages, info, "motion-rest");
  for (const page of pages)
    await page.locator(".monaco-table").hover({ position: { x: 370, y: 12 } });
  await menuPixels(pages, info, "motion-hover");
});
