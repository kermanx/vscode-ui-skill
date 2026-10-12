// Resolve notification icon aliases from the browser's real VS Code icon registry.
// Usage: node internal-docs/reference/generate-notification-icons.mjs <oracle-base-url>
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
const require = createRequire(
  new URL("../../components/package.json", import.meta.url),
);
const { chromium } = require("@playwright/test");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(
    `${process.argv[2] || "http://localhost:6172"}/reference/index.html?kind=notifications-list&theme=dark`,
  );
  await page.waitForFunction(() => window.fixtureReady);
  const glyphs = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter(
        (rule) =>
          rule.selectorText?.startsWith(".codicon-notifications-") &&
          rule.style?.content,
      )
      .map((rule) => [
        rule.selectorText,
        rule.style.content.slice(1, -1).codePointAt(0),
      ]),
  );
  if (!glyphs.length)
    throw new Error("The notification icon registry was not loaded.");
  await writeFile(
    new URL(
      "../../components/src/components/notifications/notificationIcons.css",
      import.meta.url,
    ),
    "/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */\n/* Precomputed notification icon registrations. */\n" +
      glyphs
        .map(
          ([selector, code]) =>
            `${selector} { content: "\\${code.toString(16)}"; }`,
        )
        .join("\n") +
      "\n",
  );
  console.log(
    `Resolved ${glyphs.length} notification icon aliases from the real registry.`,
  );
} finally {
  await browser.close();
}
