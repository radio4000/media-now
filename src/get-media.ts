/**
 * Main entry point - route URLs to appropriate providers
 */

import { ProviderError } from './errors'
import { type ParsedUrl, parseUrl } from './parse-url'
import { discogs } from './providers/discogs'
import { file } from './providers/file'
import { soundcloud } from './providers/soundcloud'
import { spotify } from './providers/spotify'
import { vimeo } from './providers/vimeo'
import { youtube } from './providers/youtube'
import type { MediaResult, Provider } from './types'

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
