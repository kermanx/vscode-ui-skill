import '../../vscode/src/vs/platform/theme/common/colors/searchColors.js';
import '../../vscode/src/vs/platform/theme/common/colors/editorColors.js';
import '../../vscode/src/vs/workbench/contrib/preferences/browser/preferencesIcons.js';
import '../../vscode/src/vs/workbench/contrib/preferences/common/settingsEditorColorRegistry.js';
import '../../vscode/src/vs/editor/contrib/symbolIcons/browser/symbolIcons.js';
import '../../vscode/src/vs/workbench/contrib/notebook/browser/notebookIcons.js';
import { getIconRegistry, IconContribution } from '../../vscode/src/vs/platform/theme/common/iconRegistry.js';
import '../../vscode/src/vs/base/common/codicons.js';
import { getCodiconFontCharacters } from '../../vscode/src/vs/base/common/codiconsUtil.js';
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
        .map(({ id }) => [id, sizeValueToCss(getSizeRegistry().resolveDefaultSize(id, theme)!)])),
    };
  }
  return themes;
}

export function generateIconGlyphs() {
  const glyphs = { ...getCodiconFontCharacters() };
  const registry = getIconRegistry();
  for (const icon of registry.getIcons()) {
    const definition = IconContribution.getDefinition(icon, registry);
    if (definition && !definition.font && /^\\[a-f0-9]+$/i.test(definition.fontCharacter)) glyphs[icon.id] = parseInt(definition.fontCharacter.slice(1), 16);
  }
  return glyphs;
}
