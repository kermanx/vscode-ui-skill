// Real workbench QuickInputService/Controller, with a minimal standalone service environment.
// The service computes its own default styles and constructs its real list/tree controls.
import { QuickInputService } from '../../vscode/src/vs/platform/quickinput/browser/quickInputService.js';
import { IQuickInputService } from '../../vscode/src/vs/platform/quickinput/common/quickInput.js';
import { InstantiationService } from '../../vscode/src/vs/platform/instantiation/common/instantiationService.js';
import { ServiceCollection } from '../../vscode/src/vs/platform/instantiation/common/serviceCollection.js';
import { IConfigurationService } from '../../vscode/src/vs/platform/configuration/common/configuration.js';
import { TestConfigurationService } from '../../vscode/src/vs/platform/configuration/test/common/testConfigurationService.js';
import { IContextKeyService } from '../../vscode/src/vs/platform/contextkey/common/contextkey.js';
import { ContextKeyService } from '../../vscode/src/vs/platform/contextkey/browser/contextKeyService.js';
import { IThemeService } from '../../vscode/src/vs/platform/theme/common/themeService.js';
import {
  TestThemeService,
  TestColorTheme,
} from '../../vscode/src/vs/platform/theme/test/common/testThemeService.js';
import { ColorScheme } from '../../vscode/src/vs/platform/theme/common/theme.js';
import { IAccessibilityService } from '../../vscode/src/vs/platform/accessibility/common/accessibility.js';
import { TestAccessibilityService } from '../../vscode/src/vs/platform/accessibility/test/common/testAccessibilityService.js';
import { ILayoutService } from '../../vscode/src/vs/platform/layout/browser/layoutService.js';
import {
  IListService,
  ListService,
} from '../../vscode/src/vs/platform/list/browser/listService.js';
import {
  IStorageService,
  InMemoryStorageService,
} from '../../vscode/src/vs/platform/storage/common/storage.js';
import {
  IContextViewService,
  IContextMenuService,
} from '../../vscode/src/vs/platform/contextview/browser/contextView.js';
import { ContextViewService } from '../../vscode/src/vs/platform/contextview/browser/contextViewService.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { IHoverService } from '../../vscode/src/vs/platform/hover/browser/hover.js';
import { getBaseLayerHoverDelegate } from '../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js';
import { IOpenerService } from '../../vscode/src/vs/platform/opener/common/opener.js';
import { IKeybindingService } from '../../vscode/src/vs/platform/keybinding/common/keybinding.js';
import { NoMatchingKb } from '../../vscode/src/vs/platform/keybinding/common/keybindingResolver.js';
import { KeybindingsRegistry } from '../../vscode/src/vs/platform/keybinding/common/keybindingsRegistry.js';
import { CommandsRegistry } from '../../vscode/src/vs/platform/commands/common/commands.js';
import { StandardKeyboardEvent } from '../../vscode/src/vs/base/browser/keyboardEvent.js';
import { Emitter, Event } from '../../vscode/src/vs/base/common/event.js';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';

export function createQuickInputHost(
  root: HTMLElement,
  onLink: (href: string) => void,
  options: {themeRoot?: HTMLElement;focus?:()=>void} = {},
) {
  const services = new ServiceCollection();
  const instantiation = new InstantiationService(services, true);
  const config = new TestConfigurationService({
    'workbench.hover.delay': navigator.platform.includes('Mac') ? 1500 : 500,
    'workbench.list.mouseWheelScrollSensitivity': 1,
    'workbench.list.fastScrollSensitivity': 5,
    'workbench.list.smoothScrolling': false,
    'window.controlsStyle': 'native',
  });
  services.set(IConfigurationService, config);
  const themeRoot = options.themeRoot || root;
  const type = themeRoot.classList.contains('hc-black')
    ? ColorScheme.HIGH_CONTRAST_DARK
    : themeRoot.classList.contains('hc-light')
      ? ColorScheme.HIGH_CONTRAST_LIGHT
      : themeRoot.classList.contains('vs')
        ? ColorScheme.LIGHT
        : ColorScheme.DARK;
  services.set(
    IThemeService,
    new TestThemeService(new TestColorTheme({}, type)),
  );
  services.set(IAccessibilityService, new TestAccessibilityService());
  services.set(IListService, new ListService());
  services.set(IStorageService, new InMemoryStorageService());
  services.set(IHoverService, getBaseLayerHoverDelegate() as any);
  const layoutEvent = new Emitter<any>();
  const activeLayoutEvent = new Emitter<any>();
  const dimensions = () => ({
    width: root.clientWidth,
    height: root.clientHeight,
  });
  const layout = {
    mainContainer: root,
    activeContainer: root,
    getContainer: () => root,
    get mainContainerDimension() {
      return dimensions();
    },
    get activeContainerDimension() {
      return dimensions();
    },
    mainContainerOffset: { quickPickTop: 0 },
    activeContainerOffset: { quickPickTop: 0 },
    onDidLayoutContainer: layoutEvent.event,
    onDidLayoutActiveContainer: activeLayoutEvent.event,
    onDidChangeActiveContainer: Event.None,
    focus: options.focus || (() => root.querySelector<HTMLElement>('[data-open]')?.focus()),
  };
  services.set(ILayoutService, layout as any);
  const keys = {
    lookupKeybinding: () => undefined,
    mightProducePrintableCharacter: () => false,
    softDispatch: () => NoMatchingKb,
    onDidUpdateKeybindings: Event.None,
  };
  services.set(IKeybindingService, keys as any);
  const contexts = instantiation.createInstance(ContextKeyService);
  services.set(IContextKeyService, contexts);
  const view = instantiation.createInstance(ContextViewService);
  services.set(IContextViewService, view);
  const menus = new ContextMenuHandler(
    view,
    { publicLog2() {} } as any,
    { error: console.error } as any,
    keys as any,
  );
  services.set(IContextMenuService, {
    showContextMenu: (delegate) => menus.showContextMenu(delegate),
    onDidShowContextMenu: Event.None,
    onDidHideContextMenu: Event.None,
  } as any);
  services.set(IOpenerService, {
    open: async (content: string) => {
      onLink(content);
      return true;
    },
  } as any);
  const service = instantiation.createInstance(QuickInputService);
  services.set(IQuickInputService, service);
  const iconStyle = document.createElement('style');
  iconStyle.textContent = getIconsStyleSheet(undefined).getCSS();
  document.head.append(iconStyle);
  const observer = new ResizeObserver(() => {
    const dimension = dimensions();
    layoutEvent.fire({ container: root, dimension });
    activeLayoutEvent.fire(dimension);
  });
  observer.observe(root);
  // Standalone keyboard adapter: match the actual registered rules and invoke their actual handlers.
  // UI controls still receive and can stop their own events before this workbench-level handler.
  window.addEventListener('keydown', (event) => {
    if (
      event.defaultPrevented ||
      !service.currentQuickInput ||
      !root.contains(event.target as Node)
    )
      return;
    const chord = new StandardKeyboardEvent(event).toKeyCodeChord();
    const context = contexts.getContext(event.target as HTMLElement);
    const rule = KeybindingsRegistry.getDefaultKeybindings()
      .reverse()
      .find(
        (rule) =>
          rule.command?.startsWith('quickInput.') &&
          rule.keybinding?.chords.length === 1 &&
          rule.keybinding.chords[0].equals(chord) &&
          (!rule.when || rule.when.evaluate(context)),
      );
    const command = rule?.command && CommandsRegistry.getCommand(rule.command);
    if (command) {
      event.preventDefault();
      event.stopPropagation();
      instantiation.invokeFunction(command.handler, rule?.commandArgs);
    }
  });
  return service;
}
