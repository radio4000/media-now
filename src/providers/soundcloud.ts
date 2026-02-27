/**
 * SoundCloud provider - fetch track metadata without API key via oEmbed
 */

import { MediaNotFoundError, ProviderError } from '../errors.js'
import type { SoundCloudResult } from '../types.js'

/** SoundCloud oEmbed API response */
interface OEmbedResponse {
	title: string
	author_name: string
	author_url: string
	thumbnail_url?: string
	description?: string
	html: string
	width: string | number
	height: string | number
	version: string
	provider_name: string
	provider_url: string
	type: string
}

const OEMBED_URL = 'https://soundcloud.com/oembed'

/** Build SoundCloud track URL from ID (username/track-slug) */
const buildTrackUrl = (id: string): string => `https://soundcloud.com/${id}`

/** Fetch SoundCloud track metadata via oEmbed */
export const fetch = async (id: string): Promise<SoundCloudResult> => {
	const trackUrl = buildTrackUrl(id)
	const url = `${OEMBED_URL}?url=${encodeURIComponent(trackUrl)}&format=json`

	const response = await globalThis.fetch(url).catch((error) => {
		throw new ProviderError('soundcloud', `Network error: ${error.message}`)
	})

	if (response.status === 404) {
		throw new MediaNotFoundError('soundcloud', id)
	}

	if (!response.ok) {
		throw new ProviderError(
			'soundcloud',
			`HTTP ${response.status}: ${response.statusText}`,
		)
	}

	const payload = (await response.json()) as OEmbedResponse

	return {
		provider: 'soundcloud',
		id,
		url: trackUrl,
		title: payload.title,
		thumbnail: payload.thumbnail_url,
		author: payload.author_name,
		description: payload.description,
		payload,
	}
}

export const soundcloud = { fetch }
