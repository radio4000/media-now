/**
 * Discovery chain - discover Discogs URL for a track via MusicBrainz
 */

import { parseTitle } from './parse-title.js'
import {
	fetchRecording,
	fetchRelease,
	search,
} from './providers/musicbrainz.js'

/** Candidate Discogs URL with scoring metadata */
interface DiscogsCandidate {
	url: string
	score: number
}

/** Release info from recording payload for pre-filtering and scoring */
interface RecordingRelease {
	id: string
	title: string
	date?: string
	'artist-credit'?: { name: string }[]
	'release-group'?: {
		'primary-type'?: string
		'secondary-types'?: string[]
	}
}

/**
 * Check if a release is by "Various Artists" or similar.
 */
const isVariousArtists = (artist: string): boolean => {
	const lower = artist.toLowerCase()
	return lower === 'various artists' || lower === 'various'
}

/**
 * Score a release to prioritize original albums over compilations.
 * Higher score = better match.
 */
const scoreRelease = (
	release: RecordingRelease,
	expectedArtist: string | null,
): number => {
	let score = 0

	// Check artist - penalize "Various Artists" or artist mismatch
	const artist = release['artist-credit']?.[0]?.name ?? ''

	if (isVariousArtists(artist)) {
		score -= 200 // Strong penalty for compilations
	} else if (
		expectedArtist &&
		artist.toLowerCase().includes(expectedArtist.toLowerCase())
	) {
		score += 100 // Strong bonus for correct artist
	}

	// Check release group type
	const primaryType = release['release-group']?.['primary-type'] ?? ''
	const secondaryTypes = release['release-group']?.['secondary-types'] ?? []

	// Prefer albums and singles over other types
	if (primaryType === 'Album') score += 30
	else if (primaryType === 'Single' || primaryType === 'EP') score += 40 // Singles often better for finding original

	// Penalize compilations, DJ-mixes, etc.
	if (secondaryTypes.includes('Compilation')) score -= 100
	if (secondaryTypes.includes('DJ-mix')) score -= 80
	if (secondaryTypes.includes('Remix')) score -= 50

	// Prefer earlier releases (originals come first)
	const year = parseInt(release.date?.substring(0, 4) ?? '9999', 10)
	if (year < 9999) {
		// Bonus for older releases, max 50 points for pre-1980
		score += Math.max(0, Math.min(50, (2000 - year) / 2))
	}

	return score
}

/**
 * Score a Discogs URL - prefer master releases over specific releases.
 */
const scoreDiscogsUrl = (url: string): number => {
	if (url.includes('/master/')) return 10
	return 0
}

/**
 * Discover a Discogs URL for a track title via MusicBrainz.
 *
 * Data flow:
 * 1. Search MusicBrainz for recordings matching the title
 * 2. Get full recording data including releases with metadata
 * 3. Pre-filter and score releases to prioritize originals over compilations
 * 4. Fetch only the best candidates to get Discogs URLs
 *
 * @param title - Track title (e.g., "Artist - Song Name")
 * @returns Discogs URL if found, null otherwise
 * @throws ProviderError on network/API errors
 */
export const discoverDiscogsUrl = async (
	title: string,
): Promise<string | null> => {
	// Parse title to extract expected artist for scoring
	const parsed = parseTitle(title)

	// 1. Search MusicBrainz for recordings
	const recordings = await search(title)
	if (recordings.length === 0) return null

	// Collect all releases from all recordings with pre-scores
	const allReleases: { release: RecordingRelease; preScore: number }[] = []

	// 2. Iterate through recordings to collect releases
	for (const recording of recordings) {
		const fullRecording = await fetchRecording(recording.id)
		const recPayload = fullRecording.payload as {
			releases?: RecordingRelease[]
		}
		const releases = recPayload.releases ?? []

		for (const release of releases) {
			const preScore = scoreRelease(release, parsed.artist)
			allReleases.push({ release, preScore })
		}
	}

	if (allReleases.length === 0) return null

	// 3. Sort by pre-score and take top candidates
	allReleases.sort((a, b) => b.preScore - a.preScore)

	// Only fetch releases with positive scores (likely good matches)
	// or top 5 if none have positive scores
	const candidates = allReleases.filter((r) => r.preScore > 0).slice(0, 10)
	const toFetch = candidates.length > 0 ? candidates : allReleases.slice(0, 5)

	// 4. Fetch releases to get Discogs URLs
	const discogsCandidates: DiscogsCandidate[] = []

	for (const { release, preScore } of toFetch) {
		const fullRelease = await fetchRelease(release.id)

		const discogsRelations = fullRelease.relations.filter((rel) =>
			rel.url.includes('discogs.com'),
		)

		for (const relation of discogsRelations) {
			const score = preScore + scoreDiscogsUrl(relation.url)
			discogsCandidates.push({ url: relation.url, score })
		}
	}

	if (discogsCandidates.length === 0) return null

	// Return the highest-scoring candidate
	discogsCandidates.sort((a, b) => b.score - a.score)
	return discogsCandidates[0].url
}
