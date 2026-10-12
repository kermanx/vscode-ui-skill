import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { isDeepStrictEqual } from "node:util";
import { menuPixels } from "./menu-fixture";

async function pair(
  context: BrowserContext,
  theme = "dark",
  variant = "welcome",
) {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on("pageerror", (e) => errors.push(e.message));
  await pages[0].goto(
    `/reference/index.html?kind=banner&theme=${theme}&variant=${variant}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-banner--specimen&viewMode=story&globals=theme:${theme}&variant=${variant}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(errors).toEqual([]);
  return pages;
}
const banner = (page: Page) => page.locator(".part.banner");
const close = (page: Page) => banner(page).locator(".action-label");
const links = (page: Page) =>
  banner(page).locator(".message-actions-container > a");
const state = (page: Page) => page.evaluate(() => (window as any).fixtureState);
async function equal(pages: Page[]) {
  await expect
    .poll(async () =>
      isDeepStrictEqual(await state(pages[0]), await state(pages[1])),
    )
    .toBe(true);
}
async function api(pages: Page[], method: string, value?: string) {
  for (const page of pages)
    await page.evaluate(
      ({ method, value }) => (window as any).fixtureApi[method](value),
      { method, value },
    );
  await equal(pages);
}
async function active(pages: Page[], selector: string) {
  for (const page of pages) await expect(page.locator(selector)).toBeFocused();
}

for (const theme of ["dark", "light", "hcDark", "hcLight"]) {
  test(`Banner original icons, neutral style, custom image and narrow layout / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await equal(pages);
    await menuPixels(pages, info, "initial");
    for (const name of ["neutral", "application", "custom", "warning"]) {
      await api(pages, "show", name);
      await menuPixels(pages, info, name);
    }
    for (const page of pages)
      await page.setViewportSize({ width: 310, height: 480 });
    await menuPixels(pages, info, "narrow");
    await api(pages, "focus");
    await menuPixels(pages, info, "focused");
    for (const page of pages) await close(page).click();
    await equal(pages);
    await menuPixels(pages, info, "restored-after-close");
  });
}

test("Banner priority queue, newest equal priority, replacement and close restoration", async ({
  context,
}, info) => {
  const pages = await pair(context);
  await api(pages, "show", "warning");
  await api(pages, "show", "latest");
  expect((await state(pages[1])).active).toBe("warning");
  for (const page of pages) await close(page).click();
  await equal(pages);
  expect((await state(pages[1])).active).toBe("latest");
  await api(pages, "show", "welcome");
  expect((await state(pages[1])).items).toEqual(["latest", "welcome"]);
  await api(pages, "update");
  for (const page of pages)
    await expect(banner(page)).toHaveAttribute(
      "aria-label",
      "Workspace information has changed.",
    );
  await menuPixels(pages, info, "updated");
  await api(pages, "hide", "welcome");
  expect((await state(pages[1])).closes).toEqual(["warning"]);
  await api(pages, "clear");
  for (const page of pages) await expect(banner(page)).toBeHidden();
  await menuPixels(pages, info, "empty");
  await api(pages, "replace");
  await menuPixels(pages, info, "replaced");
  for (const page of pages) await close(page).click();
  await equal(pages);
  expect((await state(pages[1])).active).toBe("neutral");
});

test("Banner registered arrow commands loop links and close, Escape restores root, and links activate on keydown", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await expect(links(page).nth(0)).toHaveAttribute("tabindex", "0");
    await expect(close(page)).toHaveAttribute("tabindex", "-1");
  }
  await api(pages, "focus");
  for (const key of [
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowRight",
    "ArrowLeft",
    "ArrowUp",
    "ArrowDown",
  ]) {
    for (const page of pages) await page.keyboard.press(key);
    const focused = await Promise.all(
      pages.map((page) =>
        page.evaluate(
          () =>
            document.activeElement?.getAttribute("aria-label") ||
            document.activeElement?.textContent,
        ),
      ),
    );
    expect(focused[1]).toBe(focused[0]);
    await menuPixels(pages, info, `focus-${key}-${focused[0]}`);
  }
  for (const page of pages) await page.keyboard.press("Escape");
  await active(pages, ".part.banner");
  await api(pages, "next");
  for (const page of pages) {
    await page.keyboard.down("Enter");
    expect((await state(page)).actions).toEqual([
      { id: "welcome", href: "#learn" },
    ]);
    await page.keyboard.up("Enter");
    await page.keyboard.press("Space");
  }
  await equal(pages);
  expect((await state(pages[1])).actions).toHaveLength(2);
  await api(pages, "show", "warning");
  await active(pages, ".part.banner");
  await api(pages, "previous");
  await active(pages, ".part.banner .action-label");
  for (const page of pages) await page.keyboard.press("Enter");
  await equal(pages);
  await active(pages, ".part.banner");
  await menuPixels(pages, info, "keyboard-close-restores");
});

test("Banner native tab order, no-action commands and focus restoration", async ({
  context,
}, info) => {
  const pages = await pair(context);
  await api(pages, "focus");
  for (const page of pages) {
    await page.keyboard.press("Tab");
    await expect(links(page).nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links(page).nth(1)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(".outside")).toBeFocused();
  }
  await api(pages, "show", "plain");
  await api(pages, "focus");
  await api(pages, "next");
  await active(pages, ".part.banner .action-label");
  await api(pages, "previous");
  await active(pages, ".part.banner .action-label");
  for (const page of pages) await page.locator(".outside").click();
  for (const page of pages) await banner(page).focus();
  await active(pages, ".part.banner .action-label");
  await menuPixels(pages, info, "restored-action-focus");
});

test("Banner custom message slot matches actual Markdown renderer and has explicit aria label", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "rich");
  for (const page of pages)
    await expect(banner(page)).toHaveAttribute(
      "aria-label",
      "Workspace ready. Read the guide.",
    );
  await menuPixels(pages, info, "rich-message");
  for (const page of pages)
    await banner(page).locator(".message-container a").click();
  await equal(pages);
  expect((await state(pages[1])).actions).toEqual([
    { id: "rich", href: "#guide" },
  ]);
});

test("Banner actual Link and ActionBar managed hover titles", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await links(page).nth(0).hover();
    await expect(page.getByRole("tooltip")).toHaveText(
      "Read the workspace guide",
      { timeout: 2500 },
    );
  }
  await menuPixels(pages, info, "link-title", ".workbench-hover-container");
  for (const page of pages) {
    await page.keyboard.press("Escape");
    await page.mouse.move(410, 400);
    await close(page).hover();
    await expect(page.getByRole("tooltip")).toHaveText("Close Banner", {
      timeout: 2500,
    });
  }
  await menuPixels(pages, info, "close-title", ".workbench-hover-container");
});

test("Banner commands run at window bubble after ActionBar handling", async ({
  context,
}) => {
  const pages = await pair(context);
  for (const page of pages)
    await page.evaluate(() => {
      (window as any).keyEvents = [];
      for (const [target, phase] of [
        [document, "document"],
        [window, "window"],
      ] as const) {
        target.addEventListener("keydown", (event: Event) => {
          const key = event as KeyboardEvent;
          (window as any).keyEvents.push({
            phase,
            key: key.key,
            prevented: key.defaultPrevented,
          });
        });
      }
    });
  await api(pages, "focus");
  for (const key of ["ArrowRight", "ArrowDown"]) {
    if (key === "ArrowDown") {
      await api(pages, "previous");
      await active(pages, ".part.banner .action-label");
    }
    for (const page of pages) {
      await page.evaluate(() => {
        (window as any).keyEvents = [];
      });
      await page.keyboard.press(key);
      expect(await page.evaluate(() => (window as any).keyEvents)).toEqual([
        { phase: "document", key, prevented: false },
        { phase: "window", key, prevented: true },
      ]);
      await expect(links(page).nth(0)).toBeFocused();
    }
  }
  await api(pages, "previous");
  for (const page of pages) {
    await page.evaluate(() => {
      (window as any).keyEvents = [];
    });
    await page.keyboard.down("Enter");
    expect(await page.evaluate(() => (window as any).keyEvents)).toEqual([]);
    expect((await state(page)).closes).toEqual([]);
    await page.keyboard.up("Enter");
    await page.locator(".outside").focus();
    await page.keyboard.press("ArrowRight");
    expect(await page.evaluate(() => (window as any).keyEvents)).toEqual([
      { phase: "document", key: "ArrowRight", prevented: false },
      { phase: "window", key: "ArrowRight", prevented: false },
    ]);
  }
  await equal(pages);
});
