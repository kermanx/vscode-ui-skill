/**
 * How a count badge is used.
 *
 * - `count`: the round counter badge (default), e.g. the number of results next to a label.
 * - `text`: the wide, squared-off badge whose content is a word or a status
 *   (`Running`, `Recording Keys`); the original asks callers for it with the `.long` class.
 */
export type CountBadgeVariant = 'count' | 'text';
