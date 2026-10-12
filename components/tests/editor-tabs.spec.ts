import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { menuPixels } from "./menu-fixture";
test.use({ viewport: { width: 640, height: 420 } });
const errors = new WeakMap<Page, string[]>();
async function pair(
  context: BrowserContext,
  theme = "dark",
  variant = "default",
) {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages) {
    const list: string[] = [];
    errors.set(page, list);
    page.on("pageerror", (e) => list.push(e.message));
  }
  await pages[0].goto(
    `/reference/index.html?kind=editor-tabs&theme=${theme}&variant=${variant}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-editor-tabs--specimen&viewMode=story&globals=theme:${theme}&variant=${variant}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator('.scrollbar').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '0')), { timeout: 3000 }).toBe(true);
  }
  await equal(pages);
  return pages;
}
async function equal(pages: Page[]) {
  for (const page of pages) expect(errors.get(page)).toEqual([]);
  expect(await pages[1].evaluate(() => (window as any).fixtureState)).toEqual(
    await pages[0].evaluate(() => (window as any).fixtureState),
  );
}
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`EditorTabs states, sizing and classic layout / ${theme}`, async ({
    context,
  }, info) => {
    for (const variant of [
      "default",
      "inactive",
      "compact",
      "modified",
      "no-icons",
      "index",
      "left",
      "no-actions",
      "cannot-close",
      "sticky-compact",
      "sticky-shrink",
      "many",
      "shrink",
      "fixed",
      "long",
      "duplicate",
    ]) {
      const pages = await pair(context, theme, variant);
      await menuPixels(pages, info, `${theme}-${variant}`);
      for (const page of pages) await page.close();
    }
  });
test("EditorTabs keyboard activation, focus, preview pinning and close", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page.evaluate(() => (window as any).fixtureApi.focus());
  for (const key of [
    "ArrowRight",
    "End",
    "ArrowLeft",
    "Home",
    "ArrowLeft",
    "End",
  ]) {
    for (const page of pages) await page.keyboard.press(key);
    await equal(pages);
    expect(
      await pages[1].locator(".tab:focus").getAttribute("data-resource-name"),
    ).toEqual(
      await pages[0].locator(".tab:focus").getAttribute("data-resource-name"),
    );
  }
  await menuPixels(pages, info, "keyboard-focus");
  for (const page of pages) await page.locator(".tab").last().dblclick();
  await equal(pages);
  for (const page of pages)
    await page.locator(".tab.active .action-label").click();
  await equal(pages);
  await menuPixels(pages, info, "closed-preview");
});
test("EditorTabs click selection, range selection, middle-click guard and unpin", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page
      .locator(".tab")
      .nth(2)
      .click({ modifiers: ["Meta"] });
  await equal(pages);
  for (const page of pages)
    await page
      .locator(".tab")
      .nth(3)
      .click({ modifiers: ["Shift"] });
  await equal(pages);
  await menuPixels(pages, info, "multi-select");
  for (const page of pages)
    await page.locator(".tab").first().click({ button: "middle" });
  await equal(pages);
  for (const page of pages)
    await page.locator(".tab").first().locator(".action-label").click();
  await equal(pages);
  await menuPixels(pages, info, "unpinned");
});
test("EditorTabs wheel, resize, end reveal and Alt close others", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "many");
  for (const page of pages) {
    await page.locator(".tabs-container").hover();
    await page.mouse.wheel(0, 200);
  }
  for (const page of pages) await page.waitForTimeout(100);
  expect(
    await pages[1].locator(".tabs-container").evaluate((e) => e.scrollLeft),
  ).toBe(
    await pages[0].locator(".tabs-container").evaluate((e) => e.scrollLeft),
  );
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus());
    await page.keyboard.press("End");
  }
  await equal(pages);
  await menuPixels(pages, info, "end-reveal");
  for (const page of pages) {
    await page.setViewportSize({ width: 380, height: 420 });
    await page.locator(".tab.active").hover();
    await page.keyboard.down("Alt");
  }
  await menuPixels(pages, info, "alt-action");
  for (const page of pages) {
    await page
      .locator(".tab.active .action-label")
      .click({ modifiers: ["Alt"] });
    await page.keyboard.up("Alt");
  }
  await equal(pages);
});

test("EditorTabs disjoint ranges and recent active selection", async ({
  context,
}) => {
  const pages = await pair(context, "dark", "many");
  for (const [index, modifier] of [
    [6, "Meta"],
    [3, "Meta"],
    [4, "Shift"],
    [2, "Shift"],
    [2, "Meta"],
    [6, "Meta"],
  ] as const) {
    for (const page of pages)
      await page
        .locator(".tab")
        .nth(index)
        .click({ modifiers: [modifier] });
    await equal(pages);
  }
});
test("EditorTabs live options, context request and description shortening", async ({
  context,
}, info) => {
  const pages = await pair(context, "light", "duplicate");
  for (const page of pages)
    await page.locator(".tab").nth(2).click({ button: "right" });
  await equal(pages);
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus());
    await page.keyboard.press("Shift+F10");
  }
  await equal(pages);
  for (const options of [
    { compact: true, showIndex: true },
    { active: false, actionLocation: "left", showIcons: false },
    { sizing: "fixed", fixedMinWidth: 100, fixedMaxWidth: 180 },
  ]) {
    for (const page of pages)
      await page.evaluate(
        (value) => (window as any).fixtureApi.options(value),
        options,
      );
    await menuPixels(pages, info, "dynamic-" + JSON.stringify(options));
  }
});
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`EditorTabs real delayed title and preview hover / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    for (const index of [1, 3]) {
      for (const page of pages) {
        await page.bringToFront();
        await page.locator(".tab").nth(index).hover();
        await expect(page.locator(".monaco-hover")).toBeVisible({
          timeout: 3000,
        });
      }
      await menuPixels(pages, info, `hover-${index}`, ".monaco-hover");
      if (index === 3) {
        for (const page of pages) await page.locator(".monaco-hover a").click();
        await equal(pages);
      }
      for (const page of pages) {
        await page.mouse.move(620, 300);
        await page.waitForTimeout(250);
      }
    }
  });
test("EditorTabs fixed widths remain stable while closing then release on leave", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "fixed");
  for (const page of pages)
    await page.locator(".tab").nth(2).locator(".action-label").click();
  await equal(pages);
  await menuPixels(pages, info, "fixed-closed-under-pointer");
  for (const page of pages) await page.mouse.move(620, 300);
  await menuPixels(pages, info, "fixed-released");
});
