/**
 * MusicBrainz provider - search recordings and fetch release data
 */

import { MediaNotFoundError, ProviderError } from '../errors.js'
import { parseTitle } from '../parse-title.js'
import type { MusicBrainzRelease, MusicBrainzResult } from '../types.js'

/** MusicBrainz recording search result */
interface MBRecordingSearchResult {
	id: string
	title: string
	'artist-credit'?: { name: string; artist: { id: string; name: string } }[]
	releases?: { id: string; title: string }[]
}

/** MusicBrainz recording API response */
interface MBRecordingResponse {
	id: string
	title: string
	'artist-credit'?: { name: string; artist: { id: string; name: string } }[]
	releases?: { id: string; title: string }[]
}

/** MusicBrainz release API response */
interface MBReleaseResponse {
	id: string
	title: string
	relations?: { type: string; url?: { resource: string } }[]
}

/** MusicBrainz search response */
interface MBSearchResponse {
	recordings: MBRecordingSearchResult[]
}

const API_BASE = 'https://musicbrainz.org/ws/2'
const USER_AGENT = 'media-now/1.0.0 (https://github.com/radio4000/media-now)'

/** Track last request time for rate limiting */
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

/** Build MusicBrainz recording URL from ID */
const buildRecordingUrl = (id: string): string =>
	`https://musicbrainz.org/recording/${id}`

/** Build MusicBrainz release URL from ID */
const buildReleaseUrl = (id: string): string =>
	`https://musicbrainz.org/release/${id}`

/** Wait for rate limit if needed */
const waitForRateLimit = async (): Promise<void> => {
	const now = Date.now()
	const elapsed = now - lastRequestTime
	if (elapsed < MIN_REQUEST_INTERVAL && lastRequestTime > 0) {
		await new Promise((resolve) =>
			setTimeout(resolve, MIN_REQUEST_INTERVAL - elapsed),
		)
	}
	lastRequestTime = Date.now()
}

/** Make request to MusicBrainz API with required headers and rate limiting */
const fetchMusicBrainz = async (endpoint: string): Promise<Response> => {
	await waitForRateLimit()

	const response = await globalThis
		.fetch(`${API_BASE}${endpoint}`, {
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'application/json',
			},
		})
		.catch((error) => {
			throw new ProviderError('musicbrainz', `Network error: ${error.message}`)
		})

	if (response.status === 404) {
		const idMatch = endpoint.match(/[a-f0-9-]{36}/i)
		throw new MediaNotFoundError('musicbrainz', idMatch?.[0] ?? 'unknown')
	}

	if (response.status === 503) {
		throw new ProviderError('musicbrainz', 'Rate limit exceeded')
	}

	if (!response.ok) {
		throw new ProviderError(
			'musicbrainz',
			`HTTP ${response.status}: ${response.statusText}`,
		)
	}

	return response
}

/** Extract primary artist name from artist-credit */
const extractArtist = (artistCredit?: { name: string }[]): string =>
	artistCredit?.[0]?.name ?? ''

/** Extract release titles from releases array */
const extractReleases = (releases?: { title: string }[]): string[] =>
	releases?.map((r) => r.title) ?? []

/** Build search query from parsed title */
const buildSearchQueries = (input: string): string[] => {
	const parsed = parseTitle(input)
	const queries: string[] = []

	if (parsed.artist) {
		// 1. Exact artist and recording
		queries.push(`artist:"${parsed.artist}" AND recording:"${parsed.title}"`)
		// 2. Fuzzy artist and recording
		queries.push(`artist:${parsed.artist} AND recording:${parsed.title}`)
	}

	// 3. Title only, exact
	queries.push(`recording:"${parsed.title}"`)
	// 4. Title only, fuzzy
	queries.push(`recording:${parsed.title}`)

	return queries
}

/**
 * Search MusicBrainz recordings
 * Tries queries in order of specificity, returns first non-empty result
 */
export const search = async (title: string): Promise<MusicBrainzResult[]> => {
	const queries = buildSearchQueries(title)

	for (const query of queries) {
		const encoded = encodeURIComponent(query)
		const response = await fetchMusicBrainz(
			`/recording?query=${encoded}&fmt=json&limit=10`,
		)
		const data = (await response.json()) as MBSearchResponse

		if (data.recordings && data.recordings.length > 0) {
			return data.recordings.map((rec) => ({
				provider: 'musicbrainz' as const,
				id: rec.id,
				url: buildRecordingUrl(rec.id),
				title: rec.title,
				artist: extractArtist(rec['artist-credit']),
				releases: extractReleases(rec.releases),
				payload: rec,
			}))
		}
	}

	return []
}

/**
 * Fetch a specific MusicBrainz recording by ID
 * Includes release data with release-groups and artist-credits for filtering
 */
export const fetchRecording = async (
	id: string,
): Promise<MusicBrainzResult> => {
	const response = await fetchMusicBrainz(
		`/recording/${id}?inc=releases+release-groups+artist-credits&fmt=json`,
	)
	const payload = (await response.json()) as MBRecordingResponse

	return {
		provider: 'musicbrainz',
		id,
		url: buildRecordingUrl(id),
		title: payload.title,
		artist: extractArtist(payload['artist-credit']),
		releases: extractReleases(payload.releases),
		payload,
	}
}

/**
 * Fetch a specific MusicBrainz release by ID
 * Includes URL relationships, artist credits, and release group info
 */
export const fetchRelease = async (id: string): Promise<MusicBrainzRelease> => {
	const response = await fetchMusicBrainz(
		`/release/${id}?inc=url-rels+artist-credits+release-groups&fmt=json`,
	)
	const payload = (await response.json()) as MBReleaseResponse

	const relations =
		payload.relations
			?.filter((r) => r.url?.resource)
			.map((r) => ({
				type: r.type,
				url: r.url?.resource ?? '',
			})) ?? []

	return {
		id,
		title: payload.title,
		url: buildReleaseUrl(id),
		relations,
		payload,
	}
}

export const musicbrainz = { search, fetchRecording, fetchRelease }
