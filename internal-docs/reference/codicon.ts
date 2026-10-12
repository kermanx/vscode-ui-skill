import '../../vscode/src/vs/workbench/contrib/notebook/browser/notebookIcons.js';
// Live oracle: codicons from the pinned Classic workbench sources.
// Classes come from ThemeIcon.asClassNameArray, DOM from renderIcon / renderLabelWithIcons,
// accessible names from getCodiconAriaLabel. No replica code or styles are imported here.
// The workbench builds the icon font stylesheet at runtime (iconsStyleSheet.ts) and loads
// codicon.css + codicon-modifiers.css on top of it, so the modifiers must come last here too:
// the harness provides the font through @vscode/codicons, this file adds the pinned modifiers.
import '@vscode/codicons/dist/codicon.css';
// The coloured variant is painted by the symbolIcons editor contribution, not by codicon.css:
// `renderIcon(icon, true)` only adds the `codicon-colored` class and symbolIcons.css supplies the
// `symbolIcon.*` colour. Import it here so this page carries the same rule set no matter which
// fixture bundle it is loaded from (esbuild dedupes it if another fixture imports it too).
import '../../vscode/src/vs/editor/contrib/symbolIcons/browser/symbolIcons.css';
import '../../vscode/src/vs/base/browser/ui/codicons/codicon/codicon-modifiers.css';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import { getCodiconFontCharacters } from '../../vscode/src/vs/base/common/codiconsUtil.js';
import { ThemeIcon } from '../../vscode/src/vs/base/common/themables.js';
import { getCodiconAriaLabel } from '../../vscode/src/vs/base/common/iconLabels.js';
import { renderIcon, renderLabelWithIcons } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabels.js';
import { plainIcons, modifierIcons, disabledIcons, coloredIcons, labelTexts, sizeContexts, inlineSizeIcon, demoKey, demoStateId, type CodiconDemo } from '../../components/stories/CodiconData';

export function mountCodicon(_root: HTMLElement, surface: HTMLElement, state: any) {
  const iconStyle = document.createElement('style'); iconStyle.textContent = getIconsStyleSheet(undefined).getCSS(); document.head.append(iconStyle);
  (window as any).fixtureCodiconGlyphs = getCodiconFontCharacters();
	Object.assign(state, { icons: [] as string[], ariaLabels: [] as string[] });
	let index = 0;

	function icon(demo: CodiconDemo, colored = false) {
		const node = renderIcon(ThemeIcon.fromId(demo.id), colored);
		if (demo.disabled) {
			node.classList.add('codicon-modifier-disabled');
		}
		if (demo.style) {
			node.setAttribute('style', demo.style);
		}
		state.icons.push(demoStateId(demo));
		return node;
	}
	function cell(key: string, content: HTMLElement, cssText = 'display:flex;align-items:center;justify-content:center;width:22px;height:22px') {
		const box = document.createElement('span');
		box.dataset.key = key;
		box.dataset.index = String(index++);
		box.style.cssText = cssText;
		box.append(content);
		return box;
	}
	function row(name: string, children: HTMLElement[], cssText = 'display:flex;flex-wrap:wrap;gap:2px') {
		const element = document.createElement('div');
		element.dataset.row = name;
		element.style.cssText = cssText;
		element.append(...children);
		surface.append(element);
	}

	row('plain', plainIcons.map(demo => cell(demoKey('plain', demo), icon(demo))));
	row('modifiers', modifierIcons.map(demo => cell(demoKey('modifiers', demo), icon(demo))));
	row('disabled', disabledIcons.map(demo => cell(demoKey('disabled', demo), icon(demo))));
	row('colored', coloredIcons.map(demo => cell(demoKey('colored', demo), icon(demo, true))));

	// `$(...)` labels: icons sit inline in the text flow, the accessible name is the stripped text.
	row('labels', labelTexts.map((text, i) => {
		const line = document.createElement('span');
		line.dataset.key = `labels/${i}`;
		line.dataset.index = String(index++);
		line.style.cssText = 'display:flex;align-items:center;height:22px;line-height:22px;white-space:nowrap;overflow:hidden;width:100%';
		line.setAttribute('aria-label', getCodiconAriaLabel(text));
		line.append(...renderLabelWithIcons(text));
		state.ariaLabels.push(getCodiconAriaLabel(text));
		return line;
	}), 'display:flex;flex-direction:column;gap:2px');

	// font-size: the workbench pins codicons to 16px, an inline font-size still wins.
	row('sizes', sizeContexts.map(({ id, fontSize }) => {
		const wrapper = document.createElement('span');
		wrapper.dataset.fontSize = fontSize;
		wrapper.style.cssText = `display:flex;align-items:center;justify-content:center;width:36px;height:26px;font-size:${fontSize}`;
		wrapper.append(icon({ id }));
		return cell(`sizes/${id}`, wrapper, 'display:flex;align-items:center;justify-content:center;width:38px;height:26px');
	}).concat([cell('sizes/inline', icon(inlineSizeIcon), 'display:flex;align-items:center;justify-content:center;width:38px;height:26px')]));
}
