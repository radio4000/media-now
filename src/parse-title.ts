/**
 * Pure functions to parse and clean track titles for search queries.
 */

import type { ParsedTitle } from './types.js'

/**
 * Primary separator pattern: spaces + dash-like chars + spaces
 * Matches: " - ", "  -  ", " – ", " — ", " -- ", etc.
 */
const PRIMARY_SEP = /\s+[-–—]+\s+/

/**
 * Secondary separators (non-dash)
 * Includes middle dot (·) used by YouTube as artist · title separator
 */
const SECONDARY_SEPARATORS = [' · ', ': ', ' | ']

/**
 * Lenient separator: dash with space on at least one side
 * For typo tolerance: "Artist- Title" or "Artist -Title"
 */
const LENIENT_SEP = /(?<=\S)[-–—]+\s+|\s+[-–—]+(?=\S)/

/**
 * No-space dash separator: for "Artist–Title" or "Artist—Title"
 * Only en-dash/em-dash (not hyphen - that's used in compound words like "X-Ray")
 */
const NOSPACE_DASH_SEP = /[–—]/

/** Case-insensitive separator pattern for " by " */
const BY_SEPARATOR = / by /i

/**
 * Try to split a string on the first regex match.
 * Returns [artist, title] if found, null otherwise.
 */
const trySplitRegex = (
	str: string,
	pattern: RegExp,
): [string, string] | null => {
	const match = str.match(pattern)
	if (match && match.index !== undefined) {
		return [
			str.slice(0, match.index).trim(),
			str.slice(match.index + match[0].length).trim(),
		]
	}
	return null
}

/**
 * Try to split a string on the first matching separator from a list.
 * Returns [artist, title] if found, null otherwise.
 */
const trySplit = (
	str: string,
	separators: string[],
): [string, string] | null => {
	for (const sep of separators) {
		const idx = str.indexOf(sep)
		if (idx !== -1) {
			return [str.slice(0, idx).trim(), str.slice(idx + sep.length).trim()]
		}
	}
	return null
}

/**
 * Parse a title string into artist and title components.
 * Splits on separators in order of precedence.
 *
 * Order: primary (dash+spaces) → secondary (: |) → " by " → lenient (one-sided space)
 */
export const parseTitle = (input: string): ParsedTitle => {
	const original = input

	// Try primary separator: any dash with spaces on both sides
	const primaryResult = trySplitRegex(input, PRIMARY_SEP)
	if (primaryResult) {
		return {
			artist: primaryResult[0],
			title: cleanTitle(primaryResult[1]),
			original,
		}
	}

	// Try secondary separators (colon, pipe)
	const secondaryResult = trySplit(input, SECONDARY_SEPARATORS)
	if (secondaryResult) {
		return {
			artist: secondaryResult[0],
			title: cleanTitle(secondaryResult[1]),
			original,
		}
	}

	// Try " by " (case insensitive, reversed order)
	const byMatch = input.match(BY_SEPARATOR)
	if (byMatch && byMatch.index !== undefined) {
		return {
			artist: input.slice(byMatch.index + byMatch[0].length).trim(),
			title: cleanTitle(input.slice(0, byMatch.index).trim()),
			original,
		}
	}

	// Try lenient separator: dash with space on one side only
	const lenientResult = trySplitRegex(input, LENIENT_SEP)
	if (lenientResult) {
		return {
			artist: lenientResult[0],
			title: cleanTitle(lenientResult[1]),
			original,
		}
	}

	// Try no-space en/em-dash (last resort for "Artist–Title")
	const nospaceResult = trySplitRegex(input, NOSPACE_DASH_SEP)
	if (nospaceResult) {
		return {
			artist: nospaceResult[0],
			title: cleanTitle(nospaceResult[1]),
			original,
		}
	}

	// No separator found
	return {
		artist: null,
		title: cleanTitle(input),
		original,
	}
}

/**
 * Pattern to match content after //, \\, || (album info, etc.)
 * Note: -- is handled separately to preserve ` -- ` as a separator
 */
const TRUNCATION_PATTERN = /\s*(?:\/\/|\\\\|\|\|).*/

/** Pattern to match trailing parentheticals */
const PARENTHETICAL_PATTERN = /\s*\([^)]*\)\s*$/

/** Pattern to match trailing brackets */
const BRACKET_PATTERN = /\s*\[[^\]]*\]\s*$/

/** Pattern to match feat/featuring info - requires word boundary before keyword */
const FEATURING_PATTERN = /\s+(?:feat\.?|ft\.?|featuring|with)\s+.+$/gi

/** Pattern to match remix/edit suffixes at end (as standalone words) */
const REMIX_PATTERN = /\s+(?:remix|edit|version|mix|dub)\s*$/gi

/**
 * Truncate at `--` (double-dash).
 * Used after splitting to clean metadata from title.
 */
const truncateAtDoubleDash = (str: string): string => {
	const idx = str.indexOf('--')
	return idx !== -1 ? str.slice(0, idx).trim() : str
}

/**
 * Clean a title for search purposes.
 * Aggressively removes noise like feat info, remix tags, etc.
 */
export const cleanTitle = (title: string): string => {
	let result = title

	// 1. Remove everything after //, \\, ||
	result = result.replace(TRUNCATION_PATTERN, '')

	// 2. Truncate at -- (metadata marker)
	result = truncateAtDoubleDash(result)

	// 3 & 4. Remove trailing parentheticals and brackets (repeat until none left)
	// Need to loop over both since they can be interleaved: "Title (foo) [bar]"
	let changed = true
	while (changed) {
		changed = false
		if (PARENTHETICAL_PATTERN.test(result)) {
			result = result.replace(PARENTHETICAL_PATTERN, '')
			changed = true
		}
		if (BRACKET_PATTERN.test(result)) {
			result = result.replace(BRACKET_PATTERN, '')
			changed = true
		}
	}

	// 5. Remove feat/featuring info
	result = result.replace(FEATURING_PATTERN, '')

	// 6. Remove remix/edit suffixes
	result = result.replace(REMIX_PATTERN, '')

	// 7. Trim whitespace and collapse multiple spaces
	result = result.trim().replace(/\s+/g, ' ')

	return result
}
