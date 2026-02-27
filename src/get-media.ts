/**
 * Main entry point - route URLs to appropriate providers
 */

import { ProviderError } from './errors.js'
import { type ParsedUrl, parseUrl } from './parse-url.js'
import { discogs } from './providers/discogs.js'
import { file } from './providers/file.js'
import { soundcloud } from './providers/soundcloud.js'
import { spotify } from './providers/spotify.js'
import { vimeo } from './providers/vimeo.js'
import { youtube } from './providers/youtube.js'
import type { MediaResult, Provider } from './types.js'

/** Provider handlers mapped by name */
const providers: Record<
	Provider,
	((id: string, kind?: string) => Promise<MediaResult>) | null
> = {
	youtube: youtube.fetch,
	vimeo: vimeo.fetch,
	spotify: spotify.fetch,
	discogs: discogs.fetch,
	musicbrainz: null, // MusicBrainz is lookup-only, not URL-based
	soundcloud: soundcloud.fetch,
	file: file.fetch,
}

/**
 * Fetch media metadata from a URL or parsed reference
 * @param input - Media URL string or ParsedUrl object
 * @returns Promise resolving to provider-specific MediaResult
 * @throws ProviderError if URL is not recognized
 * @throws MediaNotFoundError if media doesn't exist
 */
export const getMedia = async (
	input: string | ParsedUrl,
): Promise<MediaResult> => {
	const parsed = typeof input === 'string' ? parseUrl(input) : input

	if (!parsed) {
		throw new ProviderError('unknown' as Provider, 'Unrecognized URL')
	}

	const handler = providers[parsed.provider]

	if (!handler) {
		throw new ProviderError(
			parsed.provider,
			'Provider does not support URL fetching',
		)
	}

	return handler(parsed.id, parsed.kind)
}
