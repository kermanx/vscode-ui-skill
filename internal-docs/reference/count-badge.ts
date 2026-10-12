// Live oracle: CountBadge from the pinned source, using defaultCountBadgeStyles.
// Canvas, data and published state mirror the replica specimen, so both pages render the same list.
import { CountBadge } from '../../vscode/src/vs/base/browser/ui/countBadge/countBadge.js';
import { defaultCountBadgeStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { format } from '../../vscode/src/vs/base/common/strings.js';
import { disposeRow, dynamicRow, groups, layoutCss, observeSurface, type CountBadgeRow, type CountBadgeState } from '../../components/stories/countBadgeData';

export function mountCountBadge(_root: HTMLElement, surface: HTMLElement, state: any) {
	// The replica specimen injects the same geometry; this page only loads the pinned CSS.
	if (!document.querySelector('#fixture-count-badge-layout')) {
		const layout = document.createElement('style');
		layout.id = 'fixture-count-badge-layout';
		layout.textContent = layoutCss;
		document.head.append(layout);
	}

	/** Effective `count` / `countFormat` / `titleFormat` of every row, i.e. what the setters last wrote. */
	const current = new Map<string, CountBadgeState>();

	function createRow(row: CountBadgeRow, header = false): HTMLElement {
		const element = document.createElement('div');
		element.className = header ? 'count-badge-row count-badge-header-row' : 'count-badge-row';
		element.dataset.row = row.id;
		const label = document.createElement('span');
		label.className = 'count-badge-label';
		label.textContent = row.label;
		element.append(label);
		return element;
	}
	/**
	 * `new CountBadge(container, options, defaultCountBadgeStyles)`, then the caller's `.long`
	 * class. The element is read back from the container because `CountBadge#element` is private.
	 */
	function createBadge(row: CountBadgeRow, container: HTMLElement): CountBadge {
		current.set(row.id, {
			count: row.count || 0,
			countFormat: row.countFormat || '{0}',
			titleFormat: row.titleFormat || '',
		});
		const options = current.get(row.id)!;
		const badge = new CountBadge(container, options, defaultCountBadgeStyles);
		const element = container.querySelector<HTMLElement>('.monaco-count-badge')!;
		if (row.variant === 'text') {
			element.classList.add('long');
		}
		return badge;
	}
	function createGroup(id: string): HTMLElement {
		const element = document.createElement('div');
		element.className = 'count-badge-group';
		element.dataset.group = id;
		surface.append(element);
		return element;
	}

	for (const group of groups) {
		const element = createGroup(group.id);
		for (const definition of group.rows) {
			const line = createRow(definition, group.layout === 'header');
			element.append(line);
			createBadge(definition, line);
		}
	}

	const dynamicGroup = createGroup('dynamic');
	const dynamicLine = createRow(dynamicRow);
	dynamicGroup.append(dynamicLine);
	const dynamicBadge = createBadge(dynamicRow, dynamicLine);

	const disposeGroup = createGroup('dispose');
	const disposeLine = createRow(disposeRow);
	const disposeHost = document.createElement('div');
	disposeHost.className = 'count-badge-host';
	disposeHost.dataset.testid = 'dispose-host';
	disposeLine.append(disposeHost);
	disposeGroup.append(disposeLine);
	const disposeBadge = createBadge(disposeRow, disposeHost);

	/** `format(titleFormat, count)`, and `null` when the original never sets a hover up. */
	function hoverOf(id: string): string | null {
		const value = current.get(id);
		return value && value.titleFormat !== '' ? format(value.titleFormat, value.count) : null;
	}
	function publish() {
		Object.assign(state, observeSurface(surface, hoverOf));
	}
	publish();

	/** Test seam: the parity test drives this page and the replica page with the same calls. */
	(window as any).countBadgeFixture = {
		apply(step: CountBadgeState) {
			dynamicBadge.setCount(step.count);
			dynamicBadge.setCountFormat(step.countFormat);
			dynamicBadge.setTitleFormat(step.titleFormat);
			current.set(dynamicRow.id, { ...step });
			publish();
		},
		dispose() {
			disposeBadge.dispose();
			publish();
		},
	};
}
