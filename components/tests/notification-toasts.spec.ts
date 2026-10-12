import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { isDeepStrictEqual } from "node:util";
import { menuPixels } from "./menu-fixture";
import { settleFixturePaint } from "./paint";
import type { NotificationItem } from "../src/components/notifications/types";
const extraContexts: BrowserContext[] = [];
test.afterEach(async () => {
  for (const context of extraContexts.splice(0)) await context.close();
});
async function pair(
  context: BrowserContext,
  theme = "dark",
  options = "",
  clock = false,
) {
  const secondContext = clock ? await context.browser()!.newContext() : context;
  if (clock) extraContexts.push(secondContext);
  const pages = [await context.newPage(), await secondContext.newPage()],
    errors: string[] = [];
  for (const page of pages) {
    await page.setViewportSize({ width: 800, height: 600 });
    page.on("pageerror", (error) => errors.push(error.message));
    if (clock) {
      await page.clock.install({ time: new Date("2026-10-10T00:00:00Z") });
      await page.clock.pauseAt(new Date("2026-10-10T00:00:01Z"));
      await page.addInitScript(() => {
        Object.defineProperty(document, "hasFocus", {
          configurable: true,
          value: () => true,
        });
      });
    }
  }
  await pages[0].goto(
    `/reference/index.html?kind=notification-toasts&theme=${theme}${options}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-notification-toasts--specimen&viewMode=story&globals=theme:${theme}${options}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
    if (clock) await page.clock.runFor(400);
  }
  await equal(pages);
  if (!options.includes("empty=true"))
    for (const page of pages)
      await expect.poll(async () => (await state(page)).visible.length).toBe(3);
  expect(errors).toEqual([]);
  return pages;
}
const state = (page: Page) => page.evaluate(() => (window as any).fixtureState);
async function equal(pages: Page[]) {
  await expect
    .poll(async () =>
      isDeepStrictEqual(await state(pages[0]), await state(pages[1])),
    )
    .toBe(true);
}
async function api(pages: Page[], action: string, value?: unknown) {
  for (const page of pages)
    await page.evaluate(
      ({ action, value }) => (window as any).fixtureApi[action](value),
      { action, value },
    );
  await equal(pages);
}
const toast = (page: Page, text: string) =>
  page.locator(".notification-toast-container").filter({ hasText: text });
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`NotificationToasts real surfaces, positioning and expanded content / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await menuPixels(pages, info, "initial");
    for (const page of pages) await toast(page, "generated files").dblclick();
    await equal(pages);
    for (const page of pages) {
      await page.mouse.move(0, 0);
      await settleFixturePaint(page);
    }
    await menuPixels(pages, info, "expanded");
    for (const position of ["bottom-left", "top-right", "bottom-right"]) {
      await api(pages, "position", position);
      for (const page of pages) await page.mouse.move(0, 0);
      await menuPixels(pages, info, position);
    }
    await api(pages, "resize", 240);
    await menuPixels(pages, info, "height-budget");
    await api(pages, "resize", 480);
    await menuPixels(pages, info, "restored-height");
  });
test("NotificationToasts focus navigation, Escape hides without closing and center suppresses new toasts", async ({
  context,
}, info) => {
  const pages = await pair(context);
  await api(pages, "focus");
  for (const key of [
    "ArrowDown",
    "ArrowDown",
    "ArrowUp",
    "Home",
    "End",
    "PageUp",
    "PageDown",
  ]) {
    for (const page of pages) await page.keyboard.press(key);
    await equal(pages);
  }
  await menuPixels(pages, info, "focused");
  for (const page of pages) await page.keyboard.press("Escape");
  await equal(pages);
  expect((await state(pages[1])).items).toHaveLength(4);
  expect((await state(pages[1])).visible).toEqual([]);
  expect((await state(pages[1])).restoreFocus).toBe(1);
  await api(pages, "center");
  await api(pages, "add", {
    id: "hidden-in-center",
    message: "Available in the notification center.",
  });
  expect((await state(pages[1])).visible).toEqual([]);
});
test("NotificationToasts severity timers, sticky and progress guards retain the notification model", async ({
  context,
}) => {
  const pages = await pair(context, "dark", "&empty=true", true);
  const items: NotificationItem[] = [
    { id: "info", message: "Information" },
    { id: "warning", message: "Warning", severity: "warning" },
    { id: "error", message: "Error", severity: "error" },
  ];
  for (const item of items)
    for (const page of pages)
      await page.evaluate((item) => (window as any).fixtureApi.add(item), item);
  for (const page of pages) await page.clock.runFor(400);
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual(["error", "warning", "info"]);
  for (const page of pages) await page.clock.runFor(10000);
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual(["error", "warning"]);
  for (const page of pages) await page.clock.runFor(2000);
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual(["error"]);
  for (const page of pages) await page.clock.runFor(3000);
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual([]);
  expect((await state(pages[1])).items).toEqual(["error", "warning", "info"]);
  for (const item of [
    { id: "sticky", message: "Sticky", sticky: true },
    { id: "progress", message: "Downloading", progress: { infinite: true } },
  ])
    for (const page of pages)
      await page.evaluate((item) => (window as any).fixtureApi.add(item), item);
  for (const page of pages) await page.clock.runFor(10400);
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual(["progress", "sticky"]);
});
test("NotificationToasts hover, focus and unfocused window restart complete purge intervals", async ({
  context,
}) => {
  const pages = await pair(context, "dark", "&empty=true", true);
  for (const page of pages) {
    await page.evaluate(() =>
      (window as any).fixtureApi.add({
        id: "hover",
        message: "Hover to keep this notification.",
      }),
    );
    await page.clock.runFor(400);
    await page
      .locator(".notification-toast-container")
      .dispatchEvent("mouseover");
    await page.clock.runFor(10000);
    expect((await state(page)).visible).toEqual(["hover"]);
    await page
      .locator(".notification-toast-container")
      .dispatchEvent("mouseout");
    await page.clock.runFor(9000);
    expect((await state(page)).visible).toEqual(["hover"]);
    await page.clock.runFor(1000);
  }
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual([]);
  for (const page of pages) {
    await page.evaluate(() =>
      (window as any).fixtureApi.add({
        id: "focused",
        message: "Focused notification.",
      }),
    );
    await page.clock.runFor(400);
    await page.evaluate(() => (window as any).fixtureApi.focus());
    await page.clock.runFor(10000);
    expect((await state(page)).visible).toEqual(["focused"]);
    await page.locator(".outside").focus();
    await page.evaluate(() =>
      Object.defineProperty(document, "hasFocus", {
        configurable: true,
        value: () => false,
      }),
    );
    await page.clock.runFor(10000);
    expect((await state(page)).visible).toEqual(["focused"]);
    await page.evaluate(() => {
      Object.defineProperty(document, "hasFocus", {
        configurable: true,
        value: () => true,
      });
      window.dispatchEvent(new Event("focus"));
    });
    await page.clock.runFor(9000);
    expect((await state(page)).visible).toEqual(["focused"]);
    await page.clock.runFor(1000);
  }
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual([]);
});
test("NotificationToasts spam window, silent priority, dismissal and no-statusbar top offset", async ({
  context,
}, info) => {
  const pages = await pair(
    context,
    "dark",
    "&empty=true&statusBar=false&titleBar=true&position=top-right",
    true,
  );
  for (const page of pages) {
    for (let index = 0; index < 4; index++)
      await page.evaluate(
        (index) =>
          (window as any).fixtureApi.add({
            id: `burst-${index}`,
            message: `Burst notification ${index}`,
          }),
        index,
      );
    await page.clock.runFor(400);
  }
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual([
    "burst-2",
    "burst-1",
    "burst-0",
  ]);
  await menuPixels(pages, info, "top-titlebar");
  for (const page of pages) {
    await page.clock.runFor(900);
    await page.evaluate(() =>
      (window as any).fixtureApi.add({
        id: "silent",
        message: "Silent notification",
        priority: "silent",
      }),
    );
    await page.clock.runFor(400);
  }
  await equal(pages);
  expect((await state(pages[1])).visible).not.toContain("silent");
  await api(pages, "focus");
  for (const page of pages)
    await page.keyboard.press(
      (await page.evaluate(() => navigator.platform.includes("Mac")))
        ? "Meta+Backspace"
        : "Delete",
    );
  await equal(pages);
  expect((await state(pages[1])).items).not.toContain("burst-2");
  expect((await state(pages[1])).focus).toEqual(["burst-1"]);
});
test("NotificationToasts optional input avoidance and shared source filtering preserve urgent and error toasts", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "&empty=true", true);
  for (const page of pages) {
    await page.evaluate(() => {
      const input = document.createElement("input");
      input.id = "notification-editor";
      input.style.cssText = "position:absolute;left:600px;top:400px;width:50px";
      document.querySelector('[data-testid="specimen"]')!.append(input);
      input.focus();
      (window as any).fixtureApi.add({
        id: "optional",
        message: "Avoid the editor",
        priority: "optional",
      });
    });
    await page.clock.runFor(400);
    expect((await state(page)).visible).toEqual([]);
    await page.evaluate(() =>
      document.getElementById("notification-editor")!.remove(),
    );
    await page.evaluate(() =>
      (window as any).fixtureApi.add({
        id: "regular",
        message: "Regular source info",
        source: { id: "tools", label: "Tools" },
        actions: { secondary: [{ id: "logs", label: "Open logs" }] },
      }),
    );
    await page.evaluate(() =>
      (window as any).fixtureApi.add({
        id: "urgent",
        message: "Urgent source warning",
        severity: "warning",
        priority: "urgent",
        source: { id: "tools", label: "Tools" },
        actions: { secondary: [{ id: "logs", label: "Open logs" }] },
      }),
    );
    await page.evaluate(() =>
      (window as any).fixtureApi.add({
        id: "error",
        message: "Source error",
        severity: "error",
        source: { id: "tools", label: "Tools" },
        actions: { secondary: [{ id: "logs", label: "Open logs" }] },
      }),
    );
    await page.clock.runFor(400);
    await page
      .locator(".notification-toast-container")
      .filter({ hasText: "Source error" })
      .hover();
    await page
      .locator(".notification-toast-container")
      .filter({ hasText: "Source error" })
      .getByRole("button", { name: "More Actions...", exact: true })
      .click();
    await page.getByRole("menu").focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await page.clock.runFor(400);
  }
  await equal(pages);
  expect((await state(pages[1])).visible).toEqual(["error", "urgent"]);
  expect((await state(pages[1])).items).toContain("regular");
  for (const page of pages) {
    await page
      .locator(".notification-toast-container")
      .filter({ hasText: "Urgent source warning" })
      .hover();
    await page
      .locator(".notification-toast-container")
      .filter({ hasText: "Urgent source warning" })
      .getByRole("button", { name: "More Actions...", exact: true })
      .click();
    await expect(
      page.getByRole("menuitem", {
        name: "Turn On All Notifications from 'Tools'",
        exact: true,
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
test("NotificationToasts primary action menu escapes the toast and closing a choice updates the model", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    // Playwright scrolls the trigger into view before clicking. Let the toast's
    // entrance transition finish so that does not scroll an in-flight ancestor.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getComputedTiming().iterations !== Infinity,
          )
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    await toast(page, "could not connect")
      .locator(".monaco-dropdown-button")
      .click();
  }
  await menuPixels(pages, info, "toast-primary-menu", ".context-view");
  for (const page of pages)
    await page
      .getByRole("menuitem", { name: "Work offline", exact: true })
      .click();
  await equal(pages);
  expect((await state(pages[1])).items).not.toContain("error");
  await menuPixels(pages, info, "toast-choice-closed");
});
