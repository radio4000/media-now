/**
 * Vimeo provider - fetch video metadata without API key
 */

import { MediaNotFoundError, ProviderError } from '../errors.js'
import type { VimeoResult } from '../types.js'

/** Vimeo oEmbed API response */
interface OEmbedResponse {
	title: string
	author_name: string
	author_url: string
	thumbnail_url: string
	thumbnail_width: number
	thumbnail_height: number
	duration: number
	html: string
	width: number
	height: number
	version: string
	provider_name: string
	provider_url: string
	type: string
	video_id: number
}

const OEMBED_URL = 'https://vimeo.com/api/oembed.json'

/** Build Vimeo video URL from ID */
const buildVideoUrl = (id: string): string => `https://vimeo.com/${id}`

/** Fetch Vimeo video metadata via oEmbed */
export const fetch = async (id: string): Promise<VimeoResult> => {
	const url = `${OEMBED_URL}?url=${encodeURIComponent(buildVideoUrl(id))}`

	const response = await globalThis.fetch(url).catch((error) => {
		throw new ProviderError('vimeo', `Network error: ${error.message}`)
	})

	if (response.status === 404) {
		throw new MediaNotFoundError('vimeo', id)
	}

	if (!response.ok) {
		throw new ProviderError(
			'vimeo',
			`HTTP ${response.status}: ${response.statusText}`,
		)
	}

	const payload = (await response.json()) as OEmbedResponse

	return {
		provider: 'vimeo',
		id,
		url: buildVideoUrl(id),
		title: payload.title,
		thumbnail: payload.thumbnail_url,
		author: payload.author_name,
		duration: payload.duration,
		payload,
	}
}

export const vimeo = { fetch }
