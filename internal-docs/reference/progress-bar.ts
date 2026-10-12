// Oracle only: the real ProgressBar from the pinned clone with defaultProgressBarStyles.
// Never import this into src/.
import { ProgressBar } from '../../vscode/src/vs/base/browser/ui/progressbar/progressbar.js';
import { defaultProgressBarStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import {
  applyProgressOverlayStyle, applyProgressProps, applyProgressSteps, progressBarExamples, progressHeaderStyle,
  progressRowStyle, progressSurfaceStyle, snapshotProgressBars,
  type ProgressBarApi, type ProgressBarProps, type ProgressBarStep,
} from '../../components/stories/ProgressBarData';

export function mountProgressBar(_root: HTMLElement, surface: HTMLElement, state: any) {
  surface.className = 'specimen';
  surface.style.cssText = progressSurfaceStyle;
  Object.assign(state, { calls: [] as string[], bars: [] as unknown[] });

  const bars: ProgressBar[] = [];
  const apis: ProgressBarApi[] = [];
  // One declarative state per row, exactly like the reactive props of the Vue specimen.
  const props: ProgressBarProps[] = progressBarExamples.map(example => ({ ...example.props }));

  progressBarExamples.forEach((example, index) => {
    const row = document.createElement('div');
    row.dataset.index = String(index);
    row.dataset.id = example.id;
    row.style.cssText = progressRowStyle(example.presentation);
    const header = document.createElement('div');
    header.textContent = example.title;
    header.style.cssText = progressHeaderStyle(example.presentation);
    row.append(header);
    surface.append(row);

    const bar = new ProgressBar(row, { ...defaultProgressBarStyles, ariaLabel: example.label });
    applyProgressOverlayStyle(bar.getContainer(), example.presentation);
    applyProgressProps(bar, props[index]);
    // Mount-time commands are part of the recorded call log on both pages; the declarative
    // state is applied silently because the Vue component applies its props internally too.
    applyProgressSteps(bar, example.steps ?? [], state.calls);

    bars.push(bar);
    apis.push(bar as unknown as ProgressBarApi);
  });

  const snapshot = () => {
    state.bars = snapshotProgressBars(apis);
    return { bars: state.bars, calls: state.calls };
  };

  (window as any).fixtureProgressBars = bars;
  (window as any).fixtureBars = apis;
  /** Same declarative application rule as the Vue watcher, including the infinite -> stop() end. */
  (window as any).fixtureSet = (index: number, patch: ProgressBarProps) => {
    const wasInfinite = !!props[index].infinite;
    Object.assign(props[index], patch);
    if (wasInfinite && !props[index].infinite && props[index].total === undefined && props[index].worked === undefined) {
      bars[index].stop();
    }
    applyProgressProps(bars[index], props[index]);
  };
  (window as any).fixtureRun = (index: number, steps: ProgressBarStep[]) => applyProgressSteps(bars[index], steps, state.calls);
  (window as any).fixtureSnapshot = snapshot;

  state.bars = snapshotProgressBars(apis);
}
