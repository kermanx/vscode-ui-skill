/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * `objects.equals` (vs/base/common/objects.ts) for `IHighlight[]`, used by the original's
 * `didEverRender` short-circuit. Key order is irrelevant and `extraClasses` is compared
 * element-wise, exactly like the original's sorted-key walk.
 */
export function equalsHighlights(
  one: readonly unknown[] | undefined,
  other: readonly unknown[] | undefined,
): boolean {
  if (one === other) {
    return true;
  }
  if (!one || !other || one.length !== other.length) {
    return false;
  }
  return one.every((value, index) => equalsValue(value, other[index]));
}

function equalsValue(one: unknown, other: unknown): boolean {
  if (one === other) {
    return true;
  }
  if (
    one === null ||
    one === undefined ||
    other === null ||
    other === undefined ||
    typeof one !== typeof other ||
    typeof one !== 'object'
  ) {
    return false;
  }
  if (Array.isArray(one) !== Array.isArray(other)) {
    return false;
  }
  if (Array.isArray(one) && Array.isArray(other)) {
    return equalsHighlights(one, other);
  }
  const oneKeys = Object.keys(one as object).sort();
  const otherKeys = Object.keys(other as object).sort();
  return (
    equalsHighlights(oneKeys, otherKeys) &&
    oneKeys.every((key) =>
      equalsValue(
        (one as Record<string, unknown>)[key],
        (other as Record<string, unknown>)[key],
      ),
    )
  );
}
