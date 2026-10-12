import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { settleFixturePaint } from "./paint";
import { menuPixels } from "./menu-fixture";
test.use({ viewport: { width: 500, height: 500 } });
const errors = new WeakMap<Page, string[]>();
async function pair(context: BrowserContext, theme = "dark", query = "") {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages) {
    const list: string[] = [];
    errors.set(page, list);
    page.on("pageerror", (error) => list.push(error.message));
  }
  await pages[0]!.goto(
    `/reference/index.html?kind=activity-bar&theme=${theme}${query}`,
  );
  await pages[1]!.goto(
    `/iframe.html?id=components-activity-bar--specimen&viewMode=story&globals=theme:${theme}${query}`,
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
  test(`ActivityBar icons, active view, badges, hover and keyboard focus / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await equal(pages);
    await menuPixels(pages, info, `${theme}-initial`);
    for (const page of pages) {
      await page
        .locator(".action-item")
        .filter({ has: page.locator(".codicon-source-control") })
        .hover();
      await expect(page.getByRole("tooltip")).toBeVisible({ timeout: 4000 });
    }
    for (const page of pages) await settleFixturePaint(page);
    await menuPixels(pages, info, `${theme}-hover`);
    for (const page of pages) {
      await page.mouse.move(490, 490);
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await page.evaluate(() => (window as any).fixtureApi.focus());
    }
    await equal(pages);
    await menuPixels(pages, info, `${theme}-focus`);
    for (const page of pages) await page.keyboard.press("ArrowDown");
    await equal(pages);
    await menuPixels(pages, info, `${theme}-focus-next`);
  });
test("ActivityBar click toggles visibility outside the double-click guard", async ({ context }) => {
  const pages = await pair(context);
  const time = new Date('2026-01-01T00:00:00Z').getTime();
  for (const [step, visible] of [[0, true], [350, false], [700, true]] as const) {
    for (const page of pages) {
      await page.clock.setFixedTime(time + step);
      await page.locator('.codicon-search').click();
    }
    await equal(pages);
    expect((await state(pages[0]!)).state.visible).toBe(visible);
  }
});
test("ActivityBar suppresses repeated clicks strictly inside the 300ms guard", async ({ context }) => {
  const pages = await pair(context);
  const time = new Date('2026-01-01T00:00:00Z').getTime();
  for (const step of [0, 100, 299]) {
    for (const page of pages) {
      await page.clock.setFixedTime(time + step);
      await page.locator('.codicon-search').click();
    }
    await equal(pages);
    expect((await state(pages[0]!)).state.opens).toHaveLength(1);
    expect((await state(pages[0]!)).state.visibility).toEqual([]);
  }
});
test("ActivityBar preserves active view through responsive overflow", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "&active=testing");
  for (const height of [240, 180, 96, 48, 20, 360]) {
    for (const page of pages) {
      await page
        .locator(".specimen")
        .evaluate(
          (element, height) =>
            ((element as HTMLElement).style.height = `${height}px`),
          height,
        );
      await page.waitForTimeout(40);
    }
    await equal(pages);
    await menuPixels(pages, info, `overflow-${height}`);
  }
});
test("ActivityBar keyboard triggers on keydown and focus does not wrap", async ({
  context,
}) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus());
    await page.keyboard.press("ArrowUp");
  }
  await equal(pages);
  for (const page of pages) {
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowDown");
  }
  await equal(pages);
  for (const page of pages) await page.keyboard.down("Enter");
  await equal(pages);
  expect((await state(pages[0]!)).state.opens).toHaveLength(1);
  for (const page of pages) await page.keyboard.up("Enter");
  await equal(pages);
});

for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`ActivityBar real pointer hover and overflow context menu / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    for (const page of pages) {
      await page
        .locator(".action-item")
        .filter({ has: page.locator(".codicon-search") })
        .hover();
      await expect(page.getByRole("tooltip")).toBeVisible({ timeout: 4000 });
    }
    await menuPixels(
      pages,
      info,
      `${theme}-tooltip`,
      ".workbench-hover-container",
    );
    for (const page of pages) {
      await page.mouse.move(490, 490);
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await page
        .locator(".specimen")
        .evaluate((el) => ((el as HTMLElement).style.height = "180px"));
      await page
        .locator(".action-item")
        .filter({ has: page.locator(".codicon-more") })
        .click();
      await expect(page.getByRole("menu")).toBeVisible();
    }
    await menuPixels(
      pages,
      info,
      `${theme}-overflow-menu`,
      ".monaco-menu-container",
    );
    for (const page of pages) {
      await page.waitForTimeout(120);
      await page
        .getByRole("menuitemcheckbox", { name: /Source Control$/ })
        .click();
      await expect(page.getByRole("menu")).toHaveCount(0);
    }
    for (const page of pages) await expect(page.locator(".composite-bar .clicked")).toHaveCount(0);
    await equal(pages);
    expect((await state(pages[0]!)).state.activeId).toBe("source-control");
    await menuPixels(pages, info, `${theme}-overflow-activated`);
  });
test("ActivityBar native item context menu hides badges and views, and keeps unpinned views", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page
      .locator(".action-item")
      .filter({ has: page.locator(".codicon-source-control") })
      .click({ button: "right" });
  await menuPixels(pages, info, "item-menu", ".monaco-menu-container");
  for (const page of pages) {
    await page.waitForTimeout(120);
    await page.getByRole("menuitemcheckbox", { name: /Hide Badge$/ }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  await equal(pages);
  await menuPixels(pages, info, "badge-hidden");
  for (const page of pages) {
    await page
      .locator(".action-item")
      .filter({ has: page.locator(".codicon-source-control") })
      .click({ button: "right" });
    await page.waitForTimeout(120);
    await page
      .getByRole("menuitemcheckbox", { name: /Hide 'Source Control'$/ })
      .click();
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  await equal(pages);
  for (const page of pages) {
    await page
      .locator(".specimen")
      .click({ button: "right", position: { x: 24, y: 345 } });
    await page.waitForTimeout(120);
    await page.getByRole("menuitemcheckbox", { name: /Ports$/ }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  await equal(pages);
  expect((await state(pages[0]!)).state.activeId).toBe("ports");
});
test("ActivityBar updates and prioritizes badges, including disabled badges", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const badges of [
    [{ type: "number", value: 999, description: "999 changes" }],
    [{ type: "number", value: 2000, description: "2000 changes" }],
    [
      { type: "number", value: 15, description: "15 changes" },
      { type: "number", value: 5, description: "5 changes" },
    ],
    [
      { type: "number", value: 15 },
      { type: "icon", icon: "error", description: "Failed" },
    ],
    [
      { type: "number", value: 15 },
      { type: "icon", icon: "error" },
      { type: "progress", description: "Working" },
    ],
    [],
  ]) {
    for (const page of pages)
      await page.evaluate(
        (badges) => (window as any).fixtureApi.badge("source-control", badges),
        badges,
      );
    await equal(pages);
    for (const page of pages) await settleFixturePaint(page);
    await menuPixels(pages, info, `badges-${badges.length}-${badges[0]?.type}`);
  }
});
test("ActivityBar focus click behavior and right-side rail match native options", async ({
  context,
}, info) => {
  const pages = await pair(context, "light", "&side=right&clickBehavior=focus");
  for (const page of pages) {
    await page.locator(".codicon-files").click();
    await page.waitForTimeout(330);
    await page.locator(".codicon-files").click();
  }
  await equal(pages);
  expect((await state(pages[0]!)).state.opens).toHaveLength(2);
  for (const page of pages) { await expect(page.locator(".composite-bar .clicked")).toHaveCount(0); await settleFixturePaint(page); }
  await menuPixels(pages, info, "right-side-focus");
});
