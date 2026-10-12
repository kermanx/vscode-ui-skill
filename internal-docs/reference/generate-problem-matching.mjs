// Precompute the unchanged fuzzy/glob implementation and its required dependencies.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
const root = fileURLToPath(new URL("../../", import.meta.url));
const { build } = createRequire(
  new URL("../../components/package.json", import.meta.url)
)("esbuild");
const outfile = root + "components/src/components/problems/matching.js";
await build({
  stdin: {
    contents: `export { matchesFuzzy, matchesFuzzy2 } from './vscode/src/vs/base/common/filters.ts'; export { parse, splitGlobAware } from './vscode/src/vs/base/common/glob.ts';`,
    resolveDir: root,
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  outfile,
  banner: {
    js: "/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */",
  },
  legalComments: "none",
});
await writeFile(
  outfile,
  (await readFile(outfile, "utf8")).replace(/^\/\/ vscode\/.*\n/gm, "")
);
