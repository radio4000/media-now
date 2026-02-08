/**
 * URL parsing - extract provider and ID from media URLs
 */

import type { Provider } from './types'

/** Result of parsing a media URL */
export interface ParsedUrl {
	provider: Provider
	id: string
	/** Resource kind within a provider (e.g. 'release' | 'master' for Discogs) */
	kind?: string
}

/**
 * Parse a media URL and extract provider and ID
 * @param url - The URL to parse
 * @returns ParsedUrl if recognized, null otherwise
 */
export const parseUrl = (url: string): ParsedUrl | null => {
	try {
		const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`
		const parsed = new URL(normalized)
		return (
			parseYouTube(parsed) ??
			parseVimeo(parsed) ??
			parseSpotify(parsed) ??
			parseDiscogs(parsed) ??
			parseSoundCloud(parsed)
		)
	} catch {
		return null
	}
}

/**
 * YouTube video ID: exactly 11 chars from [0-9A-Za-z_-]
 * Based on yt-dlp's well-tested regex pattern
 */
const YOUTUBE_ID_REGEX = /^[0-9A-Za-z_-]{11}$/
const extractYouTubeId = (raw: string): string | null => {
	const match = raw.match(/^([0-9A-Za-z_-]{11})/)
	return match?.[1] && YOUTUBE_ID_REGEX.test(match[1]) ? match[1] : null
}

/**
 * Parse YouTube URLs
 * Patterns: watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/, /e/
 * Hosts: youtube.com, m.youtube.com, music.youtube.com, etc.
 */
const parseYouTube = (url: URL): ParsedUrl | null => {
	const host = url.hostname.replace(/^www\./, '')

	// youtu.be/{id}
	if (host === 'youtu.be') {
		const raw = url.pathname.slice(1).split('/')[0]
		const id = extractYouTubeId(raw)
		return id ? { provider: 'youtube', id } : null
	}

	// youtube.com and subdomains (m.youtube.com, music.youtube.com, etc.)
	const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com')
	if (!isYouTube) return null

	// watch?v={id}
	const watchParam = url.searchParams.get('v')
	if (watchParam) {
		const id = extractYouTubeId(watchParam)
		return id ? { provider: 'youtube', id } : null
	}

	// /embed/{id}, /shorts/{id}, /live/{id}, /v/{id}, /e/{id}
	const match = url.pathname.match(/^\/(embed|shorts|live|v|e)\/([^/?]+)/)
	if (match?.[2]) {
		const id = extractYouTubeId(match[2])
		return id ? { provider: 'youtube', id } : null
	}

	return null
}

/**
 * Parse Vimeo URLs
 * Patterns: vimeo.com/{id}, /video/{id}, player embeds
 */
const parseVimeo = (url: URL): ParsedUrl | null => {
	const host = url.hostname.replace(/^www\./, '')

	// vimeo.com or player.vimeo.com
	if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null

	// /video/{id} (player embed)
	const videoMatch = url.pathname.match(/^\/video\/(\d+)/)
	if (videoMatch?.[1]) return { provider: 'vimeo', id: videoMatch[1] }

	// vimeo.com/{id} (direct)
	const directMatch = url.pathname.match(/^\/(\d+)/)
	if (directMatch?.[1]) return { provider: 'vimeo', id: directMatch[1] }

	return null
}

/**
 * Parse Spotify URLs
 * Pattern: open.spotify.com/track/{id} only (reject playlist/album)
 * Handles optional locale prefix: /intl-{code}/track/{id}
 */
const parseSpotify = (url: URL): ParsedUrl | null => {
	const host = url.hostname.replace(/^www\./, '')

	if (host !== 'open.spotify.com') return null

	// Only track URLs - reject playlist, album, artist, etc.
	// Optional intl-{locale} prefix (e.g., /intl-pt/track/{id})
	const match = url.pathname.match(/^(?:\/intl-[a-z]+)?\/track\/([a-zA-Z0-9]+)/)
	if (match?.[1]) return { provider: 'spotify', id: match[1] }

	return null
}

/**
 * Parse Discogs URLs
 * Patterns: discogs.com/release/{id}, discogs.com/master/{id}
 * With or without slug/locale prefix
 */
const parseDiscogs = (url: URL): ParsedUrl | null => {
	const host = url.hostname.replace(/^www\./, '')

	if (host !== 'discogs.com') return null

	// Patterns: /release/{id}, /master/{id}
	// Or with locale: /{locale}/release/{id}, /{locale}/master/{id}
	// ID may be followed by slug: /release/12345-Artist-Album
	const match = url.pathname.match(/(?:^|\/)(release|master)\/(\d+)/)
	if (match?.[2]) return { provider: 'discogs', id: match[2], kind: match[1] }

	return null
}

/**
 * Parse SoundCloud URLs
 * Pattern: soundcloud.com/{username}/{track-slug}
 * Rejects playlists/sets, profiles (no second segment), and other non-track URLs
 */
const parseSoundCloud = (url: URL): ParsedUrl | null => {
	const host = url.hostname.replace(/^www\./, '')
	const validHosts = ['soundcloud.com', 'm.soundcloud.com']

	if (!validHosts.includes(host)) return null

	// Split pathname: /{username}/{track-slug}
	const segments = url.pathname.slice(1).split('/').filter(Boolean)

	// Need exactly 2 segments: username and track-slug
	if (segments.length !== 2) return null

	const [username, trackSlug] = segments

	// Reject reserved paths and non-track resources
	const reserved = [
		'discover',
		'stream',
		'upload',
		'you',
		'search',
		'charts',
		'messages',
		'settings',
		'notifications',
		'people',
		'terms-of-use',
		'pages',
	]
	if (reserved.includes(username)) return null

	// Reject playlists/sets (username/sets/...)
	if (trackSlug === 'sets') return null

	// The ID is username/track-slug
	return { provider: 'soundcloud', id: `${username}/${trackSlug}` }
}
