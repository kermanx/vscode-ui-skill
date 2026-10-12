import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { menuPixels } from "./menu-fixture";
import { settleFixturePaint } from "./paint";
test.setTimeout(60_000);
const state = (page: Page) => page.evaluate(() => (window as any).fixtureState);
async function same(pages: Page[]) {
  await expect(async () =>
    expect(await state(pages[1])).toEqual(await state(pages[0]))
  ).toPass({ timeout: 4000 });
}
async function pair(context: BrowserContext, theme = "dark", options = "") {
  const pages = [await context.newPage(), await context.newPage()],
    errors: string[] = [];
  for (const page of pages) {
    await page.setViewportSize({ width: 800, height: 480 });
    page.on("pageerror", (e) => errors.push(e.message));
  }
  await pages[0].goto(
    `/reference/index.html?kind=problems&theme=${theme}${options}`
  );
  await pages[1].goto(
    `/iframe.html?id=components-problems--specimen&viewMode=story&globals=theme:${theme}${options}`
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(errors).toEqual([]);
  await same(pages);
  return pages;
}
async function pixels(
  pages: Page[],
  info: TestInfo,
  name: string,
  selector = ".specimen"
) {
  for (const page of pages) {
    await page.mouse.move(790, 470);
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".scrollbar")].every(
        (el) => getComputedStyle(el).opacity === "0"
      )
    );
    // These transitions reproduce stale antialiasing on the unchanged CountBadge corners.
    // The helper restores the filter and asserts focus, state, geometry and all computed styles.
    const badgeRepaint = ["related", "types-ts", "narrow-filter", "clear"].includes(name);
    await settleFixturePaint(page, badgeRepaint ? "filter" : "transform");
  }
  await menuPixels(pages, info, name, selector);
}
async function input(pages: Page[], text: string) {
  for (const page of pages)
    await page.getByRole("textbox", { name: "Filter Problems" }).fill(text);
  for (const page of pages) await page.waitForTimeout(350);
  await same(pages);
}
const marker = (page: Page, text: string) =>
  page.locator(".monaco-list-row").filter({ hasText: text }).first();
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`Problems actual renderers, multiline and related rows / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, "initial");
    for (const page of pages) await marker(page, "Type 'string'").click();
    await same(pages);
    await pixels(pages, info, "selection");
    for (const page of pages)
      await page
        .getByRole("button", {
          name: "Show message in single line",
          exact: true,
        })
        .first()
        .click();
    await same(pages);
    await pixels(pages, info, "single-line");
    for (const page of pages)
      await marker(page, "Type 'string'").locator(".monaco-tl-twistie").click();
    await same(pages);
    await pixels(pages, info, "related");
  });
test("Problems source, glob, negation, text highlights and clear filters", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const value of [
    "@source:ts",
    '@source:"Workspace Notes"',
    "!@source:ts",
    "**/*.css",
    "app.ts",
    "!**/*.ts",
    "options",
    "2322",
    "types.ts",
    "no-such-diagnostic",
  ]) {
    await input(pages, value);
    await pixels(pages, info, value.replace(/[^a-z0-9]/gi, "-"));
  }
  for (const page of pages)
    await page.getByText("Clear Filters", { exact: true }).click();
  await same(pages);
  await pixels(pages, info, "clear");
});
test("Problems severity menu and quick-fix requests", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page
      .getByRole("button", { name: "More Filters...", exact: true })
      .click();
  await pixels(pages, info, "filter-menu", ".context-view");
  for (const page of pages)
    await page
      .getByRole("menuitemcheckbox", { name: /Show Warnings$/ })
      .click({ delay: 120 });
  await same(pages);
  await pixels(pages, info, "warnings-off");
  for (const page of pages) {
    await marker(page, "Type 'string'").hover();
    await page
      .getByRole("button", { name: "Show fixes", exact: true })
      .first()
      .click();
  }
  await pixels(pages, info, "fix-menu", ".context-view");
  for (const page of pages)
    await page
      .getByRole("menuitem", { name: "Convert to number", exact: true })
      .click();
  await same(pages);
});
test("Problems links, opening related position, keyboard and collapse", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) await page.locator("a.monaco-link").click();
  await same(pages);
  for (const page of pages)
    await marker(page, "Type 'string'").locator(".monaco-tl-twistie").click();
  for (const page of pages)
    await marker(page, "'count' is declared here.").click();
  await same(pages);
  for (const page of pages) await page.keyboard.press("Enter");
  await same(pages);
  for (const page of pages)
    await page.evaluate(() => (window as any).fixtureApi.collapseAll());
  await same(pages);
  await pixels(pages, info, "collapse");
});
test("Problems narrow filter, empty state and virtual variable rows", async ({
  context,
}, info) => {
  const narrow = await pair(context, "light", "&width=360");
  await pixels(narrow, info, "narrow");
  await input(narrow, "ts");
  await pixels(narrow, info, "narrow-filter");
  const empty = await pair(context, "dark", "&empty=true");
  await pixels(empty, info, "empty");
  const pages = await pair(context, "dark", "&large=true");
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus());
    await page.keyboard.press("End");
  }
  await same(pages);
  await pixels(pages, info, "last");
  for (const page of pages) await page.keyboard.press("PageUp");
  await same(pages);
  await pixels(pages, info, "page-up");
});

test("Problems preserves hidden traits and navigates selection", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) await marker(page, "Type 'string'").click();
  await same(pages);
  await input(pages, "@source:css");
  await same(pages);
  await pixels(pages, info, "hidden-selection");
  await input(pages, "");
  await same(pages);
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus());
    await page.keyboard.press("ArrowDown");
  }
  await same(pages);
  await pixels(pages, info, "keyboard-selection");
  for (const page of pages)
    await marker(page, "Consider documenting").click({ modifiers: ["Meta"] });
  await same(pages);
  for (const page of pages) await page.keyboard.press("Escape");
  await same(pages);
  for (const page of pages) await page.keyboard.press("Escape");
  await same(pages);
  await pixels(pages, info, "clear-selection");
});
test("Problems pointer open modes and filter history", async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages)
    await marker(page, "Unknown property").click({ button: "middle" });
  await same(pages);
  for (const page of pages) await marker(page, "Type 'string'").dblclick();
  await same(pages);
  await input(pages, "@source:ts");
  await input(pages, "@source:css");
  for (const page of pages)
    await page
      .getByRole("textbox", { name: "Filter Problems" })
      .press("ArrowUp");
  for (const page of pages)
    await expect
      .poll(async () => (await state(page)).filter)
      .toBe("@source:ts");
  await same(pages);
});
