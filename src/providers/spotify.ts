/**
 * Spotify provider - fetch track metadata without API key
 */

import { MediaNotFoundError, ProviderError } from '../errors.js'
import type { SpotifyResult } from '../types.js'

/** Spotify oEmbed API response */
interface OEmbedResponse {
	title: string
	thumbnail_url: string
	thumbnail_width: number
	thumbnail_height: number
	html: string
	width: number
	height: number
	version: string
	provider_name: string
	provider_url: string
	type: string
}

const OEMBED_URL = 'https://open.spotify.com/oembed'

/** Build Spotify track URL from ID */
const buildTrackUrl = (id: string): string =>
	`https://open.spotify.com/track/${id}`

/** Parse "Artist - Title" from oEmbed title */
const parseTitle = (
	title: string,
): { artist: string | undefined; title: string } => {
	const match = title.match(/^(.+?)\s*[-–—]\s*(.+)$/)
	return match
		? { artist: match[1].trim(), title: match[2].trim() }
		: { artist: undefined, title: title.trim() }
}

/** Fetch Spotify track metadata via oEmbed */
export const fetch = async (id: string): Promise<SpotifyResult> => {
	const trackUrl = buildTrackUrl(id)
	const url = `${OEMBED_URL}?url=${encodeURIComponent(trackUrl)}`

	const response = await globalThis.fetch(url).catch((error) => {
		throw new ProviderError('spotify', `Network error: ${error.message}`)
	})

	if (response.status === 404 || response.status === 400) {
		throw new MediaNotFoundError('spotify', id)
	}

	if (!response.ok) {
		throw new ProviderError(
			'spotify',
			`HTTP ${response.status}: ${response.statusText}`,
		)
	}

	const payload = (await response.json()) as OEmbedResponse

	const parsed = parseTitle(payload.title)

	return {
		provider: 'spotify',
		id,
		url: trackUrl,
		title: parsed.title,
		thumbnail: payload.thumbnail_url,
		artist: parsed.artist,
		// duration not available via oEmbed
		payload,
	}
}

export const spotify = { fetch }
