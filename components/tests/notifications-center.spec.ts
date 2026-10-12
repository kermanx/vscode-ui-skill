import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { menuPixels } from "./menu-fixture";
import { settleFixturePaint } from "./paint";
const state = (page: Page) => page.evaluate(() => (window as any).fixtureState);
async function equal(pages: Page[]) {
  await expect(async () => {
    expect(await state(pages[1])).toEqual(await state(pages[0]));
  }).toPass({ timeout: 5000 });
}
async function pair(context: BrowserContext, theme = "dark", options = "") {
  const pages = [await context.newPage(), await context.newPage()],
    errors: string[] = [];
  for (const page of pages) {
    await page.setViewportSize({ width: 800, height: 600 });
    page.on("pageerror", (error) => errors.push(error.message));
  }
  await pages[0].goto(
    `/reference/index.html?kind=notifications-center&theme=${theme}${options}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-notifications-center--specimen&viewMode=story&globals=theme:${theme}${options}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  await equal(pages);
  expect(errors).toEqual([]);
  return pages;
}
async function api(pages: Page[], action: string, value?: unknown) {
  for (const page of pages)
    await page.evaluate(
      ({ action, value }) => (window as any).fixtureApi[action](value),
      { action, value },
    );
  await equal(pages);
}
const toolbar = (page: Page) =>
  page.getByRole("toolbar", { name: "Notification Center Actions" });
async function menu(pages: Page[], name: string) {
  for (const page of pages)
    await toolbar(page).getByRole("button", { name, exact: true }).click();
}
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`NotificationsCenter actual header, rows, expansion and positioning / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await menuPixels(pages, info, "initial");
    for (const page of pages)
      await page
        .locator(".monaco-list-row")
        .filter({ hasText: "generated files" })
        .dblclick();
    await equal(pages);
    for (const page of pages) {
      await page.mouse.move(0, 0);
      await settleFixturePaint(page);
    }
    await menuPixels(pages, info, "expanded");
    await menu(pages, "Configure Notifications Position...");
    await menuPixels(pages, info, "positions", ".context-view");
    for (const page of pages)
      await page
        .getByRole("menuitemcheckbox", { name: "Top Right", exact: true })
        .click({ delay: 120 });
    for (const page of pages)
      await expect
        .poll(async () => (await state(page)).position)
        .toBe("top-right");
    await equal(pages);
    for (const page of pages) {
      await page.mouse.move(0, 0);
      await settleFixturePaint(page, "filter");
    }
    await menuPixels(pages, info, "top-right");
    await menu(pages, "Configure Notifications Position...");
    for (const page of pages)
      await page
        .getByRole("menuitemcheckbox", { name: "Bottom Left", exact: true })
        .click({ delay: 120 });
    for (const page of pages)
      await expect
        .poll(async () => (await state(page)).position)
        .toBe("bottom-left");
    await equal(pages);
    for (const page of pages) {
      await page.mouse.move(0, 0);
      await settleFixturePaint(page, "filter");
    }
    await menuPixels(pages, info, "bottom-left");
  });
test("NotificationsCenter source filters, global do-not-disturb and retained model", async ({
  context,
}, info) => {
  const pages = await pair(context);
  await menu(pages, "Configure Do Not Disturb...");
  await menuPixels(pages, info, "sources", ".context-view");
  for (const page of pages)
    await page
      .getByRole("menuitemcheckbox", { name: /Remote Tools$/ })
      .click({ delay: 120 });
  await equal(pages);
  expect((await state(pages[1])).filters).toEqual([
    { id: "extension", filtered: true },
  ]);
  await menu(pages, "Configure Do Not Disturb...");
  for (const page of pages) {
    await expect(
      page.getByRole("menuitemcheckbox", { name: /Remote Tools$/ }),
    ).toHaveAttribute("aria-checked", "false");
    await page
      .getByRole("menuitem", {
        name: "Enable Do Not Disturb Mode",
        exact: true,
      })
      .click({ delay: 120 });
  }
  await equal(pages);
  expect((await state(pages[1])).visible).toBe(false);
  expect((await state(pages[1])).items).toHaveLength(4);
  await api(pages, "show");
  await menu(pages, "Configure Do Not Disturb...");
  for (const page of pages)
    await page
      .getByRole("menuitem", {
        name: "Disable Do Not Disturb Mode",
        exact: true,
      })
      .click({ delay: 120 });
  await equal(pages);
  expect((await state(pages[1])).visible).toBe(true);
});
test("NotificationsCenter clear all retains active progress, hides, and empty state is accessible", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await toolbar(page)
      .getByRole("button", { name: "Clear All Notifications", exact: true })
      .click();
  await equal(pages);
  expect((await state(pages[1])).items).toEqual(["progress"]);
  expect((await state(pages[1])).visible).toBe(false);
  await api(pages, "show");
  for (const page of pages)
    await expect(
      toolbar(page).getByRole("button", {
        name: "Clear All Notifications",
        exact: true,
      }),
    ).toHaveAttribute("aria-disabled", "true");
  await menuPixels(pages, info, "only-progress");
  await api(pages, "progress");
  await api(pages, "clear");
  await api(pages, "show");
  await menuPixels(pages, info, "empty");
  for (const page of pages) {
    await expect(
      page.getByText("No new notifications", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Notifications Center" }),
    ).toBeFocused();
  }
});
test("NotificationsCenter keyboard dismissal, Escape and showing again restore focus", async ({
  context,
}, info) => {
  const pages = await pair(context);
  const mac = await pages[0].evaluate(() => navigator.platform.includes("Mac"));
  for (const page of pages) {
    await page.keyboard.press("End");
    await page.keyboard.press(mac ? "Meta+Backspace" : "Delete");
    expect((await state(page)).items).toContain("progress");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(mac ? "Meta+Backspace" : "Delete");
  }
  await equal(pages);
  expect((await state(pages[1])).items).not.toContain("warning");
  await menuPixels(pages, info, "dismissed-row");
  for (const page of pages) await page.keyboard.press("Escape");
  await equal(pages);
  expect((await state(pages[1])).restoreFocus).toBe(1);
  await api(pages, "show");
  expect((await state(pages[1])).focus).toEqual(["info"]);
  for (const page of pages)
    await toolbar(page)
      .getByRole("button", { name: "Hide Notifications", exact: true })
      .click();
  await equal(pages);
  expect((await state(pages[1])).items).toHaveLength(3);
});
test("NotificationsCenter constrained layout, virtual rows and source management continuation", async ({
  context,
}, info) => {
  const pages = await pair(
    context,
    "dark",
    "&large=true&sources=many&statusBar=false&titleBar=true&position=top-right",
  );
  await api(pages, "resize", 280);
  for (const page of pages) await page.keyboard.press("End");
  await equal(pages);
  for (const page of pages) await expect(page.locator('.monaco-list .scrollbar.vertical')).toHaveCSS('opacity', '0');
  await menuPixels(pages, info, "virtual-end");
  for (const page of pages)
    expect(await page.locator(".monaco-list-row").count()).toBeLessThan(15);
  await menu(pages, "Configure Do Not Disturb...");
  for (const page of pages) {
    expect(await page.getByRole("menuitemcheckbox").count()).toBe(10);
    await page
      .getByRole("menuitem", { name: "More…", exact: true })
      .click({ delay: 120 });
  }
  await equal(pages);
  expect((await state(pages[1])).manageSources).toBe(1);
});
test("NotificationsCenter adding to an open empty center and closing its last row restore the editor", async ({
  context,
}, info) => {
  const pages = await pair(context, "hcLight", "&empty=true");
  await menuPixels(pages, info, "empty-open");
  await api(pages, "add", { id: "single", message: "A new notification." });
  await api(pages, "focus");
  for (const page of pages)
    await page
      .getByRole("button", { name: "Clear Notification", exact: true })
      .click();
  await equal(pages);
  expect((await state(pages[1])).visible).toBe(false);
  expect((await state(pages[1])).items).toEqual([]);
  for (const page of pages)
    await expect(
      page.getByRole("button", { name: "Move focus outside" }),
    ).toBeFocused();
  await api(pages, "show");
  await menuPixels(pages, info, "empty-shown-again");
});
