import { getColorRegistry, registerColor } from '../../vscode/src/vs/platform/theme/common/colorRegistry.js';
import { getSizeRegistry, sizeValueToCss } from '../../vscode/src/vs/platform/theme/common/sizeRegistry.js';
import '../../vscode/src/vs/workbench/common/theme.js';
import { Color } from '../../vscode/src/vs/base/common/color.js';
import { parse } from '../../vscode/src/vs/base/common/json.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

function readTheme(file: string): Record<string, string> {
  const theme = parse(readFileSync(file, 'utf8'));
  return { ...(theme.include ? readTheme(resolve(dirname(file), theme.include)) : {}), ...theme.colors };
}

export function generateThemes(root: string) {
  const gitColors = JSON.parse(readFileSync(resolve(root, 'extensions/git/package.json'), 'utf8')).contributes.colors;
  for (const { id, defaults, description } of gitColors) {
    registerColor(id, Object.fromEntries(Object.entries({ dark: 'dark', light: 'light', hcDark: 'highContrast', hcLight: 'highContrastLight' })
      .map(([type, key]) => [type, Color.fromHex(defaults[key] || defaults.dark)])), description);
  }
  const registry = getColorRegistry();
  const themes = {};
  for (const [type, file] of Object.entries({ dark: 'dark_plus', light: 'light_plus', hcDark: 'hc_black', hcLight: 'hc_light' })) {
    const colors = readTheme(resolve(root, `extensions/theme-defaults/themes/${file}.json`));
    const cache = new Map();
    const theme = {
      type,
      defines: (id: string) => id in colors,
      getColor(id: string): Color | undefined {
        if (cache.has(id)) return cache.get(id);
        const color = colors[id] ? Color.fromHex(colors[id]) : registry.resolveDefaultColor(id, theme);
        cache.set(id, color);
        return color;
      },
    };
    themes[type] = {
      ...Object.fromEntries(registry.getColors().map(({ id }) => [id, theme.getColor(id)?.toString()]).filter(([, color]) => color)),
      ...Object.fromEntries(getSizeRegistry().getSizes()
        .filter(({ id }) => ['cornerRadius.medium', 'cornerRadius.large', 'strokeThickness'].includes(id))
        .map(({ id }) => [id, sizeValueToCss(getSizeRegistry().resolveDefaultSize(id, theme)!)])),
    };
  }
  return themes;
}
