import { MarkdownRendererService } from '../../vscode/src/vs/platform/markdown/browser/markdownRenderer.js';
// Minimal host services for the actual platform HoverService and HoverWidget.
import { HoverService } from '../../vscode/src/vs/platform/hover/browser/hoverService.js';
import { WorkbenchHoverDelegate } from '../../vscode/src/vs/platform/hover/browser/hover.js';
import { setHoverDelegateFactory } from '../../vscode/src/vs/base/browser/ui/hover/hoverDelegateFactory.js';
import { HoverWidget } from '../../vscode/src/vs/platform/hover/browser/hoverWidget.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import { KeyCode } from '../../vscode/src/vs/base/common/keyCodes.js';
import { Color } from '../../vscode/src/vs/base/common/color.js';
import { Extensions } from '../../vscode/src/vs/platform/theme/common/themeService.js';
import { ColorScheme } from '../../vscode/src/vs/platform/theme/common/theme.js';
import { Registry } from '../../vscode/src/vs/platform/registry/common/platform.js';
import { setBaseLayerHoverDelegate } from '../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js';
export function createFixtureHoverService(root: HTMLElement, delay?: number) {
  const config = { getValue: (key: string) => key === 'workbench.hover.delay' ? delay ?? (navigator.platform.includes('Mac') ? 1500 : 500) : false, onDidChangeConfiguration: Event.None };
  const accessibility = { isScreenReaderOptimized: () => false };
  const keys = { lookupKeybinding: (id: string) => id === 'inspect' ? { getLabel: () => '⌘I' } : undefined,
    resolveKeyboardEvent: (event: { keyCode: number }) => ({ getSingleModifierDispatchChords: () => [KeyCode.Alt, KeyCode.Shift, KeyCode.Meta, KeyCode.Ctrl].includes(event.keyCode) ? ['modifier'] : [] }), softDispatch: () => ({ kind: 0 }) };
  const service = new HoverService({ createInstance: (Ctor: typeof HoverWidget, args: any) => new Ctor(args, keys as any, config as any, new MarkdownRendererService({ open: async (link: string) => { window.dispatchEvent(new CustomEvent('fixture-markdown-link', {detail:link})); return true; } } as any), accessibility as any) } as any, config as any, { onDidShowContextMenu: Event.None } as any, keys as any, { getContainer: () => root } as any, accessibility as any);
  // Apply actual registered participants, including the semi-transparent row divider.
  const rules: string[] = [], colors = getComputedStyle(root);
  const type = root.classList.contains('hc-black') ? ColorScheme.HIGH_CONTRAST_DARK : root.classList.contains('hc-light') ? ColorScheme.HIGH_CONTRAST_LIGHT : root.classList.contains('vs') ? ColorScheme.LIGHT : ColorScheme.DARK;
  for (const participant of Registry.as<any>(Extensions.ThemingContribution).getThemingParticipants()) participant({ getColor: (id: string) => { const value = colors.getPropertyValue(`--vscode-${id.replaceAll('.', '-')}`).trim(); return value ? Color.Format.CSS.parse(value) : undefined; }, defines: () => false, type } as any, { addRule: (rule: string) => rules.push(rule) }, {} as any);
  const style = document.createElement('style'); style.textContent = rules.join('\n'); root.append(style);
  return { service, config };
}
export function installFixtureHoverService(root: HTMLElement, delay?: number) {
  const result = createFixtureHoverService(root, delay);
  setBaseLayerHoverDelegate(result.service);
  setHoverDelegateFactory((placement, instantHover) => new WorkbenchHoverDelegate(placement, { instantHover }, {}, result.config as any, result.service));
  return result;
}
