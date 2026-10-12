// Generate the pinned default Seti stylesheet with the original theme loader.
import { createRequire } from 'node:module';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const { build } = createRequire(resolve(root, 'components/package.json'))(
  'esbuild',
);
const bundled = await build({
  stdin: {
    contents: `export { FileIconThemeLoader, FileIconThemeData } from './vscode/src/vs/workbench/services/themes/browser/fileIconThemeData.ts'; export { URI } from './vscode/src/vs/base/common/uri.ts';`,
    resolveDir: root,
  },
  write: false,
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'themeLoader',
});
const { chromium } = createRequire(resolve(root, 'components/package.json'))(
  'playwright',
);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.addScriptTag({ content: bundled.outputFiles[0].text });
const json = await readFile(
  resolve(root, 'vscode/extensions/theme-seti/icons/vs-seti-icon-theme.json'),
  'utf8',
);
const theme = await page.evaluate(async (json) => {
  const { FileIconThemeLoader, FileIconThemeData, URI } = themeLoader;
  const theme = FileIconThemeData.createUnloadedTheme('vs-seti');
  theme.location = URI.parse('https://fixture.invalid/vs-seti-icon-theme.json');
  const loader = new FileIconThemeLoader(
    { readExtensionResource: async () => json },
    { getRegisteredLanguageIds: () => [] },
  );
  await loader.load(theme);
  return theme;
}, json);
await browser.close();
const css = theme.styleSheetContent.replace(
  /url\('[^']+'\)/,
  "url('./seti.woff')",
);
const copyright =
  '/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. Seti font: Copyright (c) 2014 Jesse Weed. */\n';
for (const directory of [
  'components/src/components/explorer',
  'internal-docs/reference/explorer-assets',
]) {
  await mkdir(resolve(root, directory), { recursive: true });
  await writeFile(
    resolve(root, directory, 'seti.css'),
    copyright +
      (directory.startsWith('components/')
        ? css
            .replaceAll('.vs ', '.vc-theme[data-theme="light"] ')
            .replaceAll('.hc-black ', '.vc-theme[data-theme="hcDark"] ')
            .replaceAll('.hc-light ', '.vc-theme[data-theme="hcLight"] ')
        : css) +
      '\n',
  );
  await copyFile(
    resolve(root, 'vscode/extensions/theme-seti/icons/seti.woff'),
    resolve(root, directory, 'seti.woff'),
  );
}
await copyFile(
  resolve(root, 'vscode/extensions/theme-seti/ThirdPartyNotices.txt'),
  resolve(root, 'components/src/components/explorer/ThirdPartyNotices.txt'),
);
for (const [source, destination] of [
  [
    'vscode/src/vs/workbench/contrib/files/browser/media/explorerviewlet.css',
    'explorerviewlet.css',
  ],
  [
    'vscode/src/vs/workbench/contrib/files/browser/views/media/openeditors.css',
    'openeditors.css',
  ],
])
  await copyFile(
    resolve(root, source),
    resolve(root, 'components/src/components/explorer', destination),
  );
console.log({
  hasFileIcons: theme.hasFileIcons,
  hasFolderIcons: theme.hasFolderIcons,
  hidesExplorerArrows: theme.hidesExplorerArrows,
});
