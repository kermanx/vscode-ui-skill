/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Self-contained port of the workbench animation helpers used by the pixel spinner:
 * `synchronizeCSSAnimations` and `pauseCSSAnimationsWhenHidden` from
 * `vs/base/browser/animationSync.ts`. Only the workbench dependencies were removed —
 * the per-window IntersectionObserver, the `visibilitychange` listener, the toggle of the
 * `pausedClass`, the `startTime = 0` re-seek on resume and the cleanup rules are the same:
 * the observer and its listener are dropped as soon as the last tracked element is gone.
 */

export interface ISynchronizeAnimationsOptions {
	/**
	 * Also synchronize animations running on descendant elements (e.g. the dots
	 * of a spinner whose animations live on child nodes). Defaults to `false`.
	 */
	readonly subtree?: boolean;

	/**
	 * When provided, further narrows synchronization to CSS animations whose
	 * `animation-name` is in this set. Non-keyframe animations (e.g. transitions)
	 * are always skipped regardless of this option.
	 */
	readonly animationNames?: ReadonlySet<string>;
}

/**
 * Phase-aligns looping CSS animations so that every animation of the same
 * duration displays the same frame at the same time, regardless of when each
 * one started.
 *
 * All CSS animations share the document's timeline, so anchoring each
 * animation's `startTime` to the same origin (`0`) forces their `currentTime`
 * to equal the timeline time — making identical animations run in lock-step.
 * Per-element `animation-delay` offsets are preserved (they are part of each
 * animation's own timing), so intentional cascades (e.g. spinner dots) still
 * work while the group as a whole stays globally in phase.
 *
 * Unlike adjusting `animation-delay`, this re-seeks animations that are already
 * running (Chromium does not reliably re-seek a running animation when its
 * `animation-delay` changes). Call it whenever an animation (re)starts or
 * resumes after being paused offscreen.
 *
 * @param element The element whose (and optionally whose descendants') CSS
 * animations should be synchronized.
 * @param options See {@link ISynchronizeAnimationsOptions}.
 */
export function synchronizeCSSAnimations(element: HTMLElement, options?: ISynchronizeAnimationsOptions): void {
	if (typeof element.getAnimations !== 'function') {
		return; // Web Animations API not available; leave animations as-is.
	}
	for (const animation of element.getAnimations({ subtree: options?.subtree })) {
		// Only CSS keyframe animations carry an `animationName`; skip transitions
		// and other Web Animations so this helper strictly aligns CSS animations.
		const animationName = (animation as CSSAnimation).animationName;
		if (animationName === undefined) {
			continue;
		}
		if (options?.animationNames && !options.animationNames.has(animationName)) {
			continue;
		}
		// Anchor to a shared origin so all animations of the same duration display
		// the same frame. Guard against the rare state where startTime is not yet
		// settable (e.g. an animation still in its pending/ready phase).
		try {
			animation.startTime = 0;
		} catch {
			// ignore
		}
	}
}

export interface IPauseCSSAnimationsWhenHiddenOptions extends ISynchronizeAnimationsOptions {
	readonly pausedClass: string;

	/**
	 * Called whenever the `pausedClass` is toggled on the tracked element, with the state that
	 * was written. The observer still owns the class — this only lets a caller that renders the
	 * element (e.g. a component) mirror the same value, so a later re-render cannot disagree
	 * with the DOM.
	 */
	readonly onPausedChange?: (paused: boolean) => void;
}

interface ITrackedAnimation {
	readonly options: IPauseCSSAnimationsWhenHiddenOptions;
}

interface IAnimationVisibilityObserver {
	readonly observer: IntersectionObserver;
	readonly trackedAnimations: Map<HTMLElement, ITrackedAnimation>;
	readonly intersectingElements: Set<HTMLElement>;
	readonly visibilityListener: () => void;
}

function disposeVisibilityObserverIfEmpty(targetWindow: Window, state: IAnimationVisibilityObserver | undefined): void {
	if (!state || state.trackedAnimations.size !== 0 || animationVisibilityObservers.get(targetWindow) !== state) {
		return;
	}
	state.observer.disconnect();
	state.visibilityListener();
	animationVisibilityObservers.delete(targetWindow);
}

/** One observer and one `visibilitychange` listener per window, shared by every tracked element. */
const animationVisibilityObservers = new Map<Window, IAnimationVisibilityObserver>();

/**
 * Pauses CSS animations while their element is outside the viewport or its document is hidden.
 * Tracking survives temporary DOM detachment; dispose it when the element is no longer reusable.
 */
export function pauseCSSAnimationsWhenHidden(element: HTMLElement, options: IPauseCSSAnimationsWhenHiddenOptions): () => void {
	const targetWindow = element.ownerDocument.defaultView;
	if (!targetWindow || typeof targetWindow.IntersectionObserver !== 'function') {
		return () => { /* IntersectionObserver is unavailable; nothing was observed. */ };
	}

	let state: IAnimationVisibilityObserver | undefined = animationVisibilityObservers.get(targetWindow);
	if (!state) {
		const trackedAnimations = new Map<HTMLElement, ITrackedAnimation>();
		const intersectingElements = new Set<HTMLElement>();
		const observer = new targetWindow.IntersectionObserver(entries => {
			const toResync: Array<[HTMLElement, IPauseCSSAnimationsWhenHiddenOptions]> = [];
			for (const entry of entries) {
				const target = entry.target as HTMLElement;
				const trackedAnimation = trackedAnimations.get(target);
				if (!trackedAnimation) {
					continue;
				}
				if (entry.isIntersecting) {
					intersectingElements.add(target);
				} else {
					intersectingElements.delete(target);
				}
				const paused = targetWindow.document.hidden || !entry.isIntersecting;
				target.classList.toggle(trackedAnimation.options.pausedClass, paused);
				trackedAnimation.options.onPausedChange?.(paused);
				if (!paused) {
					toResync.push([target, trackedAnimation.options]);
				}
			}

			for (const [target, trackedOptions] of toResync) {
				synchronizeCSSAnimations(target, trackedOptions);
			}
			disposeVisibilityObserverIfEmpty(targetWindow, animationVisibilityObservers.get(targetWindow));
		});
		const onVisibilityChange = () => {
			const documentHidden = targetWindow.document.hidden;
			const toResync: Array<[HTMLElement, IPauseCSSAnimationsWhenHiddenOptions]> = [];
			for (const [target, trackedAnimation] of trackedAnimations) {
				const paused = documentHidden || !intersectingElements.has(target);
				target.classList.toggle(trackedAnimation.options.pausedClass, paused);
				trackedAnimation.options.onPausedChange?.(paused);
				if (!paused) {
					toResync.push([target, trackedAnimation.options]);
				}
			}
			for (const [target, trackedOptions] of toResync) {
				synchronizeCSSAnimations(target, trackedOptions);
			}
			disposeVisibilityObserverIfEmpty(targetWindow, animationVisibilityObservers.get(targetWindow));
		};
		const visibilityListener = () => targetWindow.document.removeEventListener('visibilitychange', onVisibilityChange);
		targetWindow.document.addEventListener('visibilitychange', onVisibilityChange);
		state = { observer, trackedAnimations, intersectingElements, visibilityListener };
		animationVisibilityObservers.set(targetWindow, state);
	}
	// The block above either found the shared observer or created it; `state` is set either way.
	const tracker = state!;

	element.classList.add(options.pausedClass);
	tracker.trackedAnimations.set(element, { options });
	tracker.observer.observe(element);

	return () => {
		tracker.observer.unobserve(element);
		tracker.trackedAnimations.delete(element);
		tracker.intersectingElements.delete(element);
		element.classList.remove(options.pausedClass);
		disposeVisibilityObserverIfEmpty(targetWindow, tracker);
	};
}
