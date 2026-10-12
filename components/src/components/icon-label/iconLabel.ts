/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Pieces of the classic `IconLabel` that are not DOM building: the `objects.equals` short-circuit
// of `Label`/`LabelWithHighlights`, `splitMatches`, the new-line escaping of the plain description
// node, and the two icon-path branches.

import type { ThemeIconLike } from '../codicon/icons';

export type { ThemeIconLike };

/** One range to highlight, mirroring the original `IMatch` (and `HighlightedLabel`'s `Highlight`). */
export interface Match {
  readonly start: number;
  readonly end: number;
}

/** A URI whose browser form becomes the leading slot's `background-image`. */
export interface UriIconPath {
  readonly uri: string;
}

/**
 * Leading icon of a label. The original accepts a `ThemeIcon` or a `URI` and picks the branch with
 * `ThemeIcon.isThemeIcon`; the two object shapes below keep that decision in the data.
 */
export type IconPath = ThemeIconLike | UriIconPath;

/**
 * `objects.equals` (vs/base/common/objects.ts): deep comparison that ignores key order and walks
 * inherited enumerable properties, exactly like the original's option short-circuit.
 */
export function equals(one: unknown, other: unknown): boolean {
  if (one === other) {
    return true;
  }
  if (
    one === null ||
    one === undefined ||
    other === null ||
    other === undefined
  ) {
    return false;
  }
  if (typeof one !== typeof other) {
    return false;
  }
  if (typeof one !== 'object') {
    return false;
  }
  if (Array.isArray(one) !== Array.isArray(other)) {
    return false;
  }

  if (Array.isArray(one) && Array.isArray(other)) {
    if (one.length !== other.length) {
      return false;
    }
    return one.every((value, index) => equals(value, other[index]));
  }

  const oneKeys: string[] = [];
  for (const key in one) {
    oneKeys.push(key);
  }
  oneKeys.sort();
  const otherKeys: string[] = [];
  for (const key in other) {
    otherKeys.push(key);
  }
  otherKeys.sort();
  if (!equals(oneKeys, otherKeys)) {
    return false;
  }
  return oneKeys.every((key) =>
    equals(
      (one as Record<string, unknown>)[key],
      (other as Record<string, unknown>)[key],
    ),
  );
}

/**
 * `ThemeIcon.isThemeIcon`, restricted to the shapes {@link IconPath} accepts: an object with a
 * string `id` is a ThemeIcon, anything else (a URI) takes the background-image branch.
 */
export function isThemeIcon(iconPath: IconPath): iconPath is ThemeIconLike {
  return (
    !!iconPath &&
    typeof iconPath === 'object' &&
    typeof (iconPath as ThemeIconLike).id === 'string'
  );
}

/**
 * `cssValue.asCSSUrl`. The original escapes the *browser* URI (`FileAccess.uriToBrowserUri`, the
 * identity for the schemes a page can load) with the CSSOM `CSS.escape` and wraps it in `url('')`;
 * the same call on the caller's URI string keeps the two inline styles identical.
 */
export function asCssUrl(uri: string): string {
  return `url('${CSS.escape(uri)}')`;
}

/** `HighlightedLabel.escapeNewLines(text, [])`: CRLF/CR/LF become `⏎`; no range has to shift. */
export function escapeNewLines(text: string): string {
  return text.replace(/\r\n|\r|\n/g, '\u23CE');
}

/**
 * `splitMatches` (iconLabel.ts): cuts `IMatch[]`, which callers give for the joined
 * `<label><separator><label>` text, into one range list per label. Ranges are clipped to the label
 * they overlap and rebased onto it; the separator's own length advances the running offset.
 */
export function splitMatches(
  labels: readonly string[],
  separator: string,
  matches: readonly Match[] | undefined,
): Match[][] | undefined {
  if (!matches) {
    return undefined;
  }

  let labelStart = 0;

  return labels.map((label) => {
    const labelRange = { start: labelStart, end: labelStart + label.length };

    const result = matches
      .map((match) => intersect(labelRange, match))
      .filter((range) => !isEmpty(range))
      .map(({ start, end }) => ({
        start: start - labelStart,
        end: end - labelStart,
      }));

    labelStart = labelRange.end + separator.length;
    return result;
  });
}

/** `Range.intersect`: the overlap of two ranges, `{0, 0}` when they do not overlap. */
function intersect(one: Match, other: Match): Match {
  if (one.start >= other.end || other.start >= one.end) {
    return { start: 0, end: 0 };
  }
  const start = Math.max(one.start, other.start);
  const end = Math.min(one.end, other.end);
  if (end - start <= 0) {
    return { start: 0, end: 0 };
  }
  return { start, end };
}

/** `Range.isEmpty`. */
function isEmpty(range: Match): boolean {
  return range.end - range.start <= 0;
}
