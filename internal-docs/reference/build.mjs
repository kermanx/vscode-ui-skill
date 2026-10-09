import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../components/', import.meta.url));
const at = path => resolve(root, path);
const { build } = createRequire(at('package.json'))('esbuild');

await mkdir(at('.cache'), { recursive: true });
await mkdir(at('public/reference'), { recursive: true });
await build({ absWorkingDir: root, entryPoints: ['../internal-docs/reference/theme-entry.ts'], outfile: '.cache/themes.mjs', bundle: true, platform: 'node', format: 'esm' });
const { generateThemes } = await import(pathToFileURL(at('.cache/themes.mjs')));
const themes = generateThemes(at('../vscode'));
const used = /^(foreground$|disabledForeground$|focusBorder$|contrast|button\.|list\.|tree\.|scrollbar|sideBar\.|icon\.|menu\.|toolbar\.|gitDecoration\.|widget\.shadow$|editorWidget\.border$|cornerRadius\.|strokeThickness$)/;
const ids = [...new Set(Object.values(themes).flatMap(colors => Object.keys(colors)))].filter(id => used.test(id));
await writeFile(at('src/theme/tokens.css'), '/* Precomputed theme variables. Initial values isolate nested theme scopes. */\n' + Object.entries(themes).map(([name, colors]) => `.vc-theme[data-theme="${name}"] {\n${ids.map(id => `  --vscode-${id.replaceAll('.', '-')}: ${colors[id] ?? 'initial'};`).join('\n')}\n}`).join('\n'));
await writeFile(at('public/reference/themes.json'), JSON.stringify(themes));
await build({
  absWorkingDir: root, entryPoints: ['../internal-docs/reference/main.ts'], outfile: 'public/reference/main.js', bundle: true,
  platform: 'browser', format: 'esm', nodePaths: [at('node_modules')], sourcemap: true, target: 'es2022',
  tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } },
  loader: { '.ttf': 'file' },
  plugins: [{ name: 'clone-codicon-font', setup(build) {
    build.onResolve({ filter: /codicon\.ttf$/ }, () => ({ path: at('node_modules/@vscode/codicons/dist/codicon.ttf') }));
  } }],
});
await writeFile(at('public/reference/index.html'), '<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="./main.css"></head><body><div id="fixture"></div><script type="module" src="./main.js"></script></body></html>');
console.log('Original Button / ObjectTree bundled directly from ../vscode; theme tokens regenerated.');
