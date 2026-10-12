import type { CountBadgeVariant } from '../src/components/count-badge/types';

/** One badge in the canvas: the leading label of its row plus the options of the original's `ICountBadgeOptions`. */
export interface CountBadgeRow {
	/** `data-row` of the row, and the key both pages publish in their state. */
	id: string;
	/** Text in front of the badge, the way a view labels its count. */
	label: string;
	count?: number;
	countFormat?: string;
	titleFormat?: string;
	variant?: CountBadgeVariant;
}

/** A block of rows. `header` rows put the label and the badge at the two edges of a 264px section header. */
export interface CountBadgeGroup {
	id: string;
	layout?: 'header';
	rows: readonly CountBadgeRow[];
}

/** Count, count format and hover template of one badge, i.e. the mutable part of the original's options. */
export interface CountBadgeState {
	count: number;
	countFormat: string;
	titleFormat: string;
}

/**
 * The canvas both pages render: plain counters, formatted labels, a hover title, text badges
 * (the original's `.long`) and a section header. Every entry is a common workbench use:
 * the counter of a result list, quick input's `{0} Results` / `{0} Selected`, the unsaved
 * editor count, the debug call-stack state label and the keybindings editor's recording badge.
 */
export const groups: readonly CountBadgeGroup[] = [
	{
		id: 'counts',
		rows: [0, 1, 5, 12, 99, 999, 9999].map(count => ({ id: `count-${count}`, label: 'Issues', count })),
	},
	{
		id: 'formats',
		rows: [
			{ id: 'format-results', label: 'Search Results', count: 12, countFormat: '{0} Results' },
			{ id: 'format-selected', label: 'Selected Items', count: 3, countFormat: '{0} Selected' },
            { id: 'format-empty', label: 'Empty initial format', count: 8, countFormat: '' },
			// `format` leaves a placeholder without a matching argument in the text as written.
			{ id: 'format-placeholder', label: 'Missing Argument', count: 7, countFormat: '{0} of {1}' },
		],
	},
	{
		id: 'tooltip',
		rows: [{ id: 'title-problems', label: 'Problems', count: 42, titleFormat: '{0} problems detected' }],
	},
	{
		id: 'text',
		rows: [
			{ id: 'text-dirty', label: 'Open Editors', count: 2, variant: 'text' },
			{ id: 'text-state', label: 'Debug Session', countFormat: 'Running', variant: 'text' },
			{ id: 'text-recording', label: 'Keybindings', countFormat: 'Recording Keys', variant: 'text' },
		],
	},
	{
		id: 'header',
		layout: 'header',
		rows: [
			{ id: 'header-extensions', label: 'Extensions', count: 3 },
			{ id: 'header-scm', label: 'Source Control', count: 12 },
		],
	},
];

/** Row driven at runtime: the harness applies `dynamicSteps` to it on both pages. */
export const dynamicRow: CountBadgeRow = { id: 'dynamic', label: 'Dynamic', count: 12, countFormat: '{0} Results' };

/** Row the harness disposes: the badge must leave its container on both pages. */
export const disposeRow: CountBadgeRow = { id: 'dispose', label: 'Disposed', count: 5 };

/**
 * Updates applied to `dynamicRow`, one per harness call: a plain count, a formatted label
 * with a hover title, and finally an empty `countFormat`, which the original's
 * `setCountFormat` stores as it is (the `{0}` default only applies to the constructor).
 */
export const dynamicSteps: readonly CountBadgeState[] = [
	{ count: 128, countFormat: '{0}', titleFormat: '' },
	{ count: 128, countFormat: '{0} Results', titleFormat: '{0} results' },
	{ count: 0, countFormat: '', titleFormat: '{0} results' },
];

/**
 * Geometry of the context around the badges (label rows and section headers). The fixture and
 * the replica specimen both inject it, so the two canvases line up. It is not component
 * styling: the badge itself is styled only by the pinned `countBadge.css`.
 */
export const layoutCss = `
.count-badge-group { display: flex; flex-direction: column; gap: 8px; }
.count-badge-row { display: flex; align-items: center; gap: 8px; min-height: 22px; }
.count-badge-row > .count-badge-label { flex: none; width: 132px; color: var(--vscode-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count-badge-row.count-badge-header-row { justify-content: space-between; width: 264px; }
.count-badge-row.count-badge-header-row > .count-badge-label { width: auto; }
`;

/** One row's observable badge state, published by both pages as `window.fixtureState`. */
export interface CountBadgeObservation {
	row: string;
	/** `monaco-count-badge`, plus `long` for the text variant. */
	className: string | null;
	/** `textContent`, i.e. the original's `format(countFormat, count)`. */
	text: string | null;
	/** Inline style written by the original's `render()`. */
	background: string;
	color: string;
	border: string;
	/** Hover-related DOM state: the delayed hover service adds no attribute, so both stay empty. */
	title: string | null;
	ariaLabel: string | null;
	/** Content a hover service would show; `null` when the badge has no hover. */
	hover: string | null;
}

export interface CountBadgeSurfaceState {
	groups: string[];
	rows: string[];
	badges: CountBadgeObservation[];
	dispose: { childCount: number; html: string };
}

/**
 * Reads the observable badge state of a canvas. `hoverOf` answers with the hover content a
 * hover service would show for a row, `null` when that badge has no hover: the original
 * formats `titleFormat` with the pinned `format`, the replica asks its own component.
 */
export function observeSurface(surface: HTMLElement, hoverOf: (rowId: string) => string | null): CountBadgeSurfaceState {
	const badges = [...surface.querySelectorAll<HTMLElement>('[data-row]')].map(row => {
		const id = row.dataset.row ?? '';
		const badge = row.querySelector<HTMLElement>('.monaco-count-badge');
		return {
			row: id,
			className: badge?.className ?? null,
			text: badge?.textContent ?? null,
			background: badge?.style.backgroundColor ?? '',
			color: badge?.style.color ?? '',
			border: badge?.style.border ?? '',
			title: badge?.getAttribute('title') ?? null,
			ariaLabel: badge?.getAttribute('aria-label') ?? null,
			hover: badge ? hoverOf(id) : null,
		};
	});
	const host = surface.querySelector<HTMLElement>('[data-testid="dispose-host"]');
	return {
		groups: [...surface.querySelectorAll<HTMLElement>('[data-group]')].map(group => group.dataset.group ?? ''),
		rows: badges.map(badge => badge.row),
		badges,
		dispose: { childCount: host?.childElementCount ?? -1, html: host?.innerHTML ?? '' },
	};
}
