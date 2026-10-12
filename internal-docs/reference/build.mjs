import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../components/', import.meta.url));
const at = path => resolve(root, path);
const { build } = createRequire(at('package.json'))('esbuild');

await mkdir(at('.cache'), { recursive: true });
await mkdir(at('public/reference'), { recursive: true });
await build({ absWorkingDir: root, entryPoints: ['../internal-docs/reference/theme-entry.ts'], outfile: '.cache/themes.mjs', bundle: true, platform: 'node', format: 'esm' });
const { generateThemes, generateIconGlyphs } = await import(pathToFileURL(at('.cache/themes.mjs')));
const themes = generateThemes(at('../vscode'));
await writeFile(at('src/components/codicon/glyphs.css'), '/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */\n/* Precomputed icon glyph mappings. */\n' + Object.entries(generateIconGlyphs()).map(([id, code]) => `.codicon-${id}:before { content: \"\\${code.toString(16)}\"; }`).join('\n') + '\n');
await writeFile(at('src/components/codicon/variables.css'), '/* Precomputed icon variables. */\n.vc-theme {\n' + Object.entries(generateIconGlyphs()).map(([id, code]) => `  --vscode-icon-${id}-content: \"\\${code.toString(16)}\";\n  --vscode-icon-${id}-font-family: codicon;`).join('\n') + '\n}\n');
const used = /^(foreground$|errorForeground$|editorInfo\.foreground$|descriptionForeground$|disabledForeground$|textLink\.|textCodeBlock\.|focusBorder$|contrast|button\.|keybindingLabel\.|progressBar\.|badge\.|notification|settings\.|search\.|diffEditor\.|statusBar\.|statusBarItem\.|activityBar\.|activityBarBadge\.|panelTitleBadge\.|tab\.|editorGroupHeader\.|editorGroup\.|editor\.(background|foreground|findMatchHighlightBackground|findMatchHighlightBorder|findMatchBackground|findMatchBorder)$|banner\.|breadcrumb\.|symbolIcon\.|sash\.|input\.|inputValidation\.|inputOption\.|checkbox\.|radio\.|dropdown\.|quickInput\.|quickInputTitle\.|quickInputList\.|pickerGroup\.|list\.|tree\.|scrollbar|sideBar\.|sideBarTitle\.|sideBarSectionHeader\.|panelSectionHeader\.|panelSection\.|panelTitle\.|panel\.|icon\.|menu\.|toolbar\.|gitDecoration\.|widget\.|editorWidget\.|editorLightBulb|editorHoverWidget\.|problemsErrorIcon\.|problemsWarningIcon\.|problemsInfoIcon\.|cornerRadius\.|spacing\.|fontSize\.|fontWeight\.|codiconFontSize|bodyFontSize|strokeThickness$)/;
const ids = [...new Set(Object.values(themes).flatMap(colors => Object.keys(colors)))].filter(id => used.test(id));
await writeFile(at('src/theme/tokens.css'), '/* Precomputed theme variables. Initial values isolate nested theme scopes. */\n' + Object.entries(themes).map(([name, colors]) => `.vc-theme[data-theme="${name}"] {\n${ids.map(id => `  --vscode-${id.replaceAll('.', '-')}: ${colors[id] ?? 'initial'};`).join('\n')}\n}`).join('\n'));
await writeFile(at('public/reference/themes.json'), JSON.stringify(themes));
await build({
  absWorkingDir: root, entryPoints: ['../internal-docs/reference/main.ts'], outfile: 'public/reference/main.js', bundle: true,
  platform: 'browser', format: 'esm', nodePaths: [at('node_modules')], sourcemap: true, target: 'es2022',
  tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } },
  loader: { '.ttf': 'file', '.woff': 'file', '.svg': 'file' },
  plugins: [{ name: 'clone-codicon-font', setup(build) {
    build.onLoad({ filter: /[\\/]searchView\.ts$/ }, async args => ({ contents: (await readFile(args.path, 'utf8')) + '\nexport { SearchLinkButton };\n', loader: 'ts' }));
    build.onLoad({ filter: /[\\/]markersView\.ts$/ }, async args => ({ contents: (await readFile(args.path, 'utf8')) + '\nexport { MarkersTree };\n', loader: 'ts' }));
    build.onLoad({ filter: /[\\/]listService\.ts$/ }, async args => ({ contents: (await readFile(args.path, 'utf8')) + '\nexport { ListResourceNavigator, TreeResourceNavigator };\n', loader: 'ts' }));
    build.onLoad({ filter: /[\\/]openEditorsView\.ts$/ }, async args => ({ contents: (await readFile(args.path, 'utf8')) + '\nexport { OpenEditorsDelegate, EditorGroupRenderer, OpenEditorRenderer };\n', loader: 'ts' }));
    build.onResolve({ filter: /\.css\?inline$/ }, args => ({ path: resolve(args.resolveDir, args.path.slice(0, -7)), namespace: 'inline-css' }));
    build.onLoad({ filter: /.*/, namespace: 'inline-css' }, async args => ({ contents: `export default ${JSON.stringify(await readFile(args.path, 'utf8'))}`, loader: 'js' }));
    build.onResolve({ filter: /codicon\.ttf$/ }, () => ({ path: at('node_modules/@vscode/codicons/dist/codicon.ttf') }));
  } }],
});
await writeFile(at('public/reference/index.html'), '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="./main.css"></head><body><div id="fixture"></div><script type="module" src="./main.js"></script></body></html>');
console.log('Original component fixtures bundled; theme tokens regenerated.');
