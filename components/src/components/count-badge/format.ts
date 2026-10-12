/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Copy of `strings.ts`'s `_formatRegexp`. */
const formatRegexp = /{(\d+)}/g;

/**
 * Copy of `strings.ts`'s `format`: every `{n}` is replaced by the n-th argument, a
 * placeholder without a matching argument is left in the text as it was written.
 */
export function format(value: string, ...args: unknown[]): string {
	if (args.length === 0) {
		return value;
	}
	return value.replace(formatRegexp, function (match, group: string) {
		const index = parseInt(group, 10);
		return isNaN(index) || index < 0 || index >= args.length ? match : String(args[index]);
	});
}
