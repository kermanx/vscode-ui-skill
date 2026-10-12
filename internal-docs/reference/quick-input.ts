// Independent oracle: actual QuickInputService -> QuickInputController -> InputBox.
import { createQuickInputHost } from './quick-input-host';
import {
  quickInputExamples,
  quickInputProps,
} from '../../components/stories/QuickInputData';
import {
  IInputBox,
  QuickInputHideReason,
} from '../../vscode/src/vs/platform/quickinput/common/quickInput.js';
import Severity from '../../vscode/src/vs/base/common/severity.js';
export function mountQuickInput(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
) {
  root.style.position = 'relative';
  surface.className = 'specimen';
  surface.style.cssText =
    'display:grid;grid-template-columns:repeat(2,230px);gap:8px;padding:4px;box-sizing:border-box';
  Object.assign(state, {
    accepts: [],
    hides: [],
    buttons: [],
    changes: [],
    links: [],
  });
  const service = createQuickInputHost(root, (href) => state.links.push(href));
  let current: IInputBox | undefined;
  let index = 0;
  let settings: any;
  function apply(input: IInputBox, example: any) {
    const props = quickInputProps(example);
    if (example.value !== undefined) input.value = example.value;
    Object.assign(input, props, {
      severity: {
        ignore: Severity.Ignore,
        info: Severity.Info,
        warning: Severity.Warning,
        error: Severity.Error,
      }[props.severity || 'ignore'],
      buttons: [
        ...(props.backButton ? [service.backButton] : []),
        ...(props.buttons || []).map((button) => ({
          iconClass: `codicon codicon-${button.icon}`,
          tooltip: button.tooltip,
          id: button.id,
        })),
      ],
    });
  }
  function show(next: number) {
    current?.dispose();
    index = next;
    root.querySelector<HTMLButtonElement>(`[data-open="${index}"]`)?.focus();
    const input = (current = service.createInputBox());
    const example = quickInputExamples[index];
    settings = { ...example };
    apply(input, example);
    input.onDidAccept(() => {
      state.accepts.push({ index, value: input.value });
      if (!example.keepOpenOnAccept) input.hide();
    });
    input.onDidHide((event) =>
      state.hides.push({
        index,
        reason:
          event.reason === QuickInputHideReason.Blur
            ? 'blur'
            : event.reason === QuickInputHideReason.Gesture
              ? 'gesture'
              : 'other',
      }),
    );
    input.onDidChangeValue((value) => state.changes.push(value));
    input.onDidTriggerButton((button) =>
      state.buttons.push(
        button === service.backButton ? 'back' : (button as any).id,
      ),
    );
    input.show();
    (window as any).fixtureQuickInput = {
      hide: () => input.hide(),
      accept: () => input.accept(),
      focus: () =>
        root.querySelector<HTMLInputElement>('.quick-input-box input')?.focus(),
    };
  }
  (window as any).fixtureOpenQuickInput = show;
  (window as any).fixtureUpdateQuickInput = (props: any) => {
    if (current) {
      settings = {
        ...settings,
        ...props,
        value: props.value === undefined ? current.value : props.value,
      };
      apply(current, settings);
    }
  };
  quickInputExamples.forEach((example, index) => {
    const button = document.createElement('button');
    button.className = 'outside';
    button.dataset.open = String(index);
    button.style.cssText = 'margin:0;text-align:left';
    button.textContent = example.name;
    button.addEventListener('click', () => show(index));
    surface.append(button);
  });
  show(Number(new URLSearchParams(location.search).get('case') || 0));
}
