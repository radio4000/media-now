/**
 * Discogs provider - fetch release metadata without API key
 */

import { MediaNotFoundError, ProviderError } from '../errors'
import type { DiscogsResult } from '../types'

/** Discogs release API response */
interface DiscogsReleaseResponse {
	id: number
	title: string
	year?: number
	genres?: string[]
	styles?: string[]
	artists?: { name: string }[]
	labels?: { name: string }[]
	uri: string
}

/** Discogs master API response */
interface DiscogsMasterResponse {
	id: number
	title: string
	year?: number
	genres?: string[]
	styles?: string[]
	artists?: { name: string }[]
	uri: string
}

/** Parsed Discogs URL information */
interface ParsedDiscogsUrl {
	type: 'release' | 'master'
	id: string
}

const API_BASE = 'https://api.discogs.com'
const USER_AGENT = 'media-now/1.0'

/** Build Discogs release URL from ID */
const buildReleaseUrl = (id: string): string =>
	`https://www.discogs.com/release/${id}`

/** Build Discogs master URL from ID */
const buildMasterUrl = (id: string): string =>
	`https://www.discogs.com/master/${id}`

/**
 * Parse a Discogs URL to extract type and ID
 * Handles:
 * - discogs.com/release/123
 * - discogs.com/release/123-Artist-Title
 * - discogs.com/Artist/release/123
 * - discogs.com/master/456
 * - discogs.com/master/456-Artist-Title
 */
export const parseUrl = (url: string): ParsedDiscogsUrl | null => {
	try {
		const parsed = new URL(url)
		if (!parsed.hostname.includes('discogs.com')) return null

		const path = parsed.pathname

		// Match /release/{id} or /release/{id}-slug
		const releaseMatch = path.match(/\/release\/(\d+)/)
		if (releaseMatch) {
			return { type: 'release', id: releaseMatch[1] }
		}

		// Match /master/{id} or /master/{id}-slug
		const masterMatch = path.match(/\/master\/(\d+)/)
		if (masterMatch) {
			return { type: 'master', id: masterMatch[1] }
		}

		return null
	} catch {
		return null
	}
}

/** Make request to Discogs API with required headers */
const fetchDiscogs = async (endpoint: string): Promise<Response> => {
	const response = await globalThis
		.fetch(`${API_BASE}${endpoint}`, {
			headers: {
				'User-Agent': USER_AGENT,
			},
		})
		.catch((error) => {
			throw new ProviderError('discogs', `Network error: ${error.message}`)
		})

	if (response.status === 404) {
		// Extract ID from endpoint for error
		const idMatch = endpoint.match(/\d+/)
		throw new MediaNotFoundError('discogs', idMatch?.[0] ?? 'unknown')
	}

	if (response.status === 429) {
		throw new ProviderError('discogs', 'Rate limit exceeded')
	}

	if (!response.ok) {
		throw new ProviderError(
			'discogs',
			`HTTP ${response.status}: ${response.statusText}`,
		)
	}

	return response
}

/** Extract artist names from response */
const extractArtists = (artists?: { name: string }[]): string[] =>
	artists?.map((a) => a.name) ?? []

/** Extract label names from response */
const extractLabels = (labels?: { name: string }[]): string[] =>
	labels?.map((l) => l.name) ?? []

/** Fetch Discogs release or master metadata */
export const fetch = async (
	id: string,
	kind: string = 'release',
): Promise<DiscogsResult> => {
	const isMaster = kind === 'master'
	const endpoint = isMaster ? `/masters/${id}` : `/releases/${id}`
	const response = await fetchDiscogs(endpoint)
	const payload = (await response.json()) as
		| DiscogsReleaseResponse
		| DiscogsMasterResponse

	return {
		provider: 'discogs',
		id,
		url: isMaster ? buildMasterUrl(id) : buildReleaseUrl(id),
		title: payload.title,
		year: payload.year,
		genres: payload.genres ?? [],
		styles: payload.styles ?? [],
		artists: extractArtists(payload.artists),
		labels: extractLabels('labels' in payload ? payload.labels : undefined),
		payload,
	}
}

export const discogs = { parseUrl, fetch }
