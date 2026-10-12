// Oracle only: the real createPixelSpinner from the pinned clone. Never import this into src/.
// The workbench loads pixelSpinner.css with the component (`codiconStyles.ts`-style side effect
// import lives in pixelSpinner.ts), so the fixture loads it for main.ts as well; the standalone
// harness imports the same file, which esbuild de-duplicates.
import '../../vscode/src/vs/base/browser/ui/pixelSpinner/pixelSpinner.css';
import { createPixelSpinner } from '../../vscode/src/vs/base/browser/ui/pixelSpinner/pixelSpinner.js';
import {
  loadingIndicatorExamples, loadingIndicatorSnapshot, loadingSurfaceStyle, scrollRegionStyle, scrollSpacerStyle,
  spinnerCaptionStyle, spinnerCellStyle, type LoadingIndicatorProps,
} from '../../components/stories/LoadingIndicatorData';

/**
 * The specimen drives the real `createPixelSpinner`, so it carries the whole spinner contract:
 * DOM, class names, aria attributes, animation parameters and the offscreen pause.
 * Geometry, colors and the raw snapshot of the spinners are shared with the Vue page.
 */
export function mountLoadingIndicator(root: HTMLElement, surface: HTMLElement, state: any) {
  // Kept for `fixtureMount`, which re-runs the specimen on the same surface after a remount.
  (window as any).fixtureRoot = root;
  // The surface is (re-)inserted on every mount so `fixtureUnmount` can simply remove it again.
  // `prepend` keeps it as the page's first child: appending would move it after the fractional
  // height `.outside` helper button, shifting every glyph onto a different subpixel phase than
  // the replica page and producing +/-1 channel text antialiasing differences.
  root.prepend(surface);
  mountInto(surface, state);
}

function mountInto(surface: HTMLElement, state: any) {
  surface.className = 'specimen';
  surface.style.cssText = loadingSurfaceStyle;
  Object.assign(state, { spinners: [] as unknown[], disposables: [] as unknown[] });

  const roots: HTMLElement[] = [];
  const spinners = loadingIndicatorExamples.map(example => {
    const row = document.createElement('div');
    row.dataset.index = String(roots.length);
    row.dataset.id = example.id;
    row.style.cssText = spinnerCellStyle(example);
    if (example.presentation === 'lead') {
      // The leading slot of a text button (`buttonbar.ts`): a 16px box before the label.
      const label = document.createElement('span');
      label.className = 'monaco-button-label';
      label.textContent = 'Installing';
      row.append(label);
    } else {
      const caption = document.createElement('span');
      caption.textContent = example.title;
      caption.style.cssText = spinnerCaptionStyle;
      row.append(caption);
    }
    surface.append(row);
    return { example, row };
  });

  for (const { example, row } of spinners) {
    const spinner = createPixelSpinner(row, example.props);
    roots.push(spinner.element);
    state.disposables.push(spinner);
    if (example.presentation === 'lead') row.prepend(spinner.element);
  }

  // Offscreen-pause canvas: a clipping container whose spinner sits below its visible area.
  const region = document.createElement('div');
  region.dataset.testid = 'scroll-region';
  region.style.cssText = scrollRegionStyle;
  const spacer = document.createElement('div');
  spacer.style.cssText = scrollSpacerStyle;
  const scrollRow = document.createElement('div');
  scrollRow.dataset.id = 'scroll-spinner';
  scrollRow.style.cssText = 'height:16px;display:flex;align-items:center;padding-left:8px';
  const scrollSpinner = createPixelSpinner(scrollRow, { variant: 'grid', ariaLabel: 'Loading scrolled content' });
  spacer.append(scrollRow);
  region.append(spacer);
  surface.after(region);
  // The offscreen canvas is tracked but stays out of the specimen snapshot, exactly like the
  // replica keeps it outside its rows: both pages report it as `state.scrollSpinner`.
  state.disposables.push(scrollSpinner);
  (window as any).fixtureScrollSpinner = scrollSpinner.element;

  const snapshot = () => {
    state.spinners = loadingIndicatorSnapshot(roots);
    state.scrollSpinner = loadingIndicatorSnapshot([scrollSpinner.element])[0];
    return state.spinners;
  };

  (window as any).fixtureSnapshot = snapshot;
  /** Declarative update, mirroring the Vue props: only these two values can change. */
  (window as any).fixtureSet = (index: number, patch: LoadingIndicatorProps) => {
    const { example, row } = spinners[index];
    Object.assign(example.props, patch);
    const api = state.disposables[index];
    const next = createPixelSpinner(row, example.props);
    row.insertBefore(next.element, api.element);
    api.element.remove();
    api.dispose();
    state.disposables[index] = next;
    roots[index] = next.element;
  };
  (window as any).fixtureDispose = (index: number) => {
    state.disposables[index].dispose();
  };
  /** Scrolls the clipping container; the last index is the offscreen canvas spinner. */
  (window as any).fixtureSetScroll = (top: number) => { region.scrollTop = top; };
  // The canvas can be unmounted and mounted again like the specimen, so a remount can be
  // exercised without a page reload.
  (window as any).fixtureUnmount = () => {
    for (const disposable of [...state.disposables]) disposable.dispose();
    state.disposables.length = 0;
    surface.remove();
  };
  (window as any).fixtureMount = () => {
    (window as any).fixtureRoot.prepend(surface);
    mountInto(surface, state);
  };

  state.spinners = loadingIndicatorSnapshot(roots);
}
