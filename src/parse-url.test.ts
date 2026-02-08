import { describe, expect, it } from 'vitest'
import tracks from '../test-data/tracks.json'
import { parseUrl } from './parse-url'

describe('parseUrl', () => {
	describe('YouTube', () => {
		it('parses watch?v= URLs', () => {
			expect(parseUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
				provider: 'youtube',
				id: 'dQw4w9WgXcQ',
			})
		})

		it('parses watch URLs with extra params', () => {
			expect(
				parseUrl('https://youtube.com/watch?v=9bZkp7q19f0&t=42s&list=PL1234'),
			).toEqual({
				provider: 'youtube',
				id: '9bZkp7q19f0',
			})
		})

		it('parses youtu.be short URLs', () => {
			expect(parseUrl('https://youtu.be/dQw4w9WgXcQ')).toEqual({
				provider: 'youtube',
				id: 'dQw4w9WgXcQ',
			})
		})

		it('parses youtu.be with query params', () => {
			expect(parseUrl('https://youtu.be/kJQP7kiw5Fk?t=42')).toEqual({
				provider: 'youtube',
				id: 'kJQP7kiw5Fk',
			})
		})

		it('parses /embed/ URLs', () => {
			expect(parseUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual({
				provider: 'youtube',
				id: 'dQw4w9WgXcQ',
			})
		})

		it('parses /shorts/ URLs', () => {
			expect(parseUrl('https://youtube.com/shorts/ZbZSe6N_BXs')).toEqual({
				provider: 'youtube',
				id: 'ZbZSe6N_BXs',
			})
		})

		it('parses /live/ URLs', () => {
			expect(parseUrl('https://youtube.com/live/jfKfPfyJRdk')).toEqual({
				provider: 'youtube',
				id: 'jfKfPfyJRdk',
			})
		})

		it('parses legacy /v/ URLs', () => {
			expect(parseUrl('https://youtube.com/v/dQw4w9WgXcQ')).toEqual({
				provider: 'youtube',
				id: 'dQw4w9WgXcQ',
			})
		})

		it('handles http URLs', () => {
			expect(parseUrl('http://youtube.com/watch?v=LXb3EKWsInQ')).toEqual({
				provider: 'youtube',
				id: 'LXb3EKWsInQ',
			})
		})

		it('parses m.youtube.com (mobile) URLs', () => {
			expect(parseUrl('https://m.youtube.com/watch?v=fJ9rUzIMcZQ')).toEqual({
				provider: 'youtube',
				id: 'fJ9rUzIMcZQ',
			})
		})

		it('parses music.youtube.com URLs', () => {
			expect(
				parseUrl('https://music.youtube.com/watch?v=CevxZvSJLk8&feature=share'),
			).toEqual({
				provider: 'youtube',
				id: 'CevxZvSJLk8',
			})
		})

		it('parses URLs without protocol', () => {
			expect(parseUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
				provider: 'youtube',
				id: 'dQw4w9WgXcQ',
			})
			expect(parseUrl('www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
				provider: 'youtube',
				id: 'dQw4w9WgXcQ',
			})
		})

		it('extracts ID from URLs with fragment timestamps', () => {
			expect(
				parseUrl('https://www.youtube.com/watch?v=9klnhyVe0ns#t=216'),
			).toEqual({
				provider: 'youtube',
				id: '9klnhyVe0ns',
			})
		})

		it('rejects IDs that are too short', () => {
			expect(parseUrl('https://youtube.com/watch?v=abc123')).toBeNull()
			expect(parseUrl('https://youtube.com/watch?v=short')).toBeNull()
		})

		it('extracts first 11 chars from overly long IDs', () => {
			// Handles malformed URLs by taking first 11 valid chars
			expect(parseUrl('https://youtube.com/watch?v=toolongid12345')).toEqual({
				provider: 'youtube',
				id: 'toolongid12',
			})
		})

		it('rejects invalid IDs (bad characters)', () => {
			expect(parseUrl('https://youtube.com/watch?v=abc123!@#$%')).toBeNull()
		})
	})

	describe('Vimeo', () => {
		it('parses vimeo.com/{id} URLs', () => {
			expect(parseUrl('https://vimeo.com/123456789')).toEqual({
				provider: 'vimeo',
				id: '123456789',
			})
		})

		it('parses vimeo.com/{id} with trailing slash', () => {
			expect(parseUrl('https://vimeo.com/123456789/')).toEqual({
				provider: 'vimeo',
				id: '123456789',
			})
		})

		it('parses player embed URLs', () => {
			expect(parseUrl('https://player.vimeo.com/video/123456789')).toEqual({
				provider: 'vimeo',
				id: '123456789',
			})
		})

		it('parses /video/ URLs with query params', () => {
			expect(parseUrl('https://vimeo.com/video/123456789?h=abc')).toEqual({
				provider: 'vimeo',
				id: '123456789',
			})
		})

		it('handles www prefix', () => {
			expect(parseUrl('https://www.vimeo.com/123456789')).toEqual({
				provider: 'vimeo',
				id: '123456789',
			})
		})
	})

	describe('Spotify', () => {
		it('parses track URLs', () => {
			expect(
				parseUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'),
			).toEqual({
				provider: 'spotify',
				id: '4cOdK2wGLETKBW3PvgPWqT',
			})
		})

		it('parses track URLs with query params', () => {
			expect(parseUrl('https://open.spotify.com/track/abc123?si=xyz')).toEqual({
				provider: 'spotify',
				id: 'abc123',
			})
		})

		it('parses internationalized track URLs', () => {
			expect(
				parseUrl(
					'https://open.spotify.com/intl-pt/track/0hHDMvLvoJh8gYbJIi182A?si=592e44e1c4fa40e6',
				),
			).toEqual({
				provider: 'spotify',
				id: '0hHDMvLvoJh8gYbJIi182A',
			})
		})

		it('rejects playlist URLs', () => {
			expect(parseUrl('https://open.spotify.com/playlist/abc123')).toBeNull()
		})

		it('rejects album URLs', () => {
			expect(parseUrl('https://open.spotify.com/album/abc123')).toBeNull()
		})

		it('rejects artist URLs', () => {
			expect(parseUrl('https://open.spotify.com/artist/abc123')).toBeNull()
		})
	})

	describe('Discogs', () => {
		it('parses release URLs', () => {
			expect(parseUrl('https://www.discogs.com/release/12345')).toEqual({
				provider: 'discogs',
				id: '12345',
			})
		})

		it('parses release URLs with slug', () => {
			expect(
				parseUrl('https://discogs.com/release/12345-Artist-Album-Name'),
			).toEqual({
				provider: 'discogs',
				id: '12345',
			})
		})

		it('parses master URLs', () => {
			expect(parseUrl('https://discogs.com/master/67890')).toEqual({
				provider: 'discogs',
				id: '67890',
			})
		})

		it('parses URLs with locale prefix', () => {
			expect(
				parseUrl('https://www.discogs.com/de/release/12345-Artist-Album'),
			).toEqual({
				provider: 'discogs',
				id: '12345',
			})
		})

		it('parses master URLs with locale', () => {
			expect(
				parseUrl('https://discogs.com/fr/master/67890-Artist-Album'),
			).toEqual({
				provider: 'discogs',
				id: '67890',
			})
		})
	})

	describe('SoundCloud', () => {
		it('parses track URLs', () => {
			expect(parseUrl('https://soundcloud.com/ghostculture/lucky')).toEqual({
				provider: 'soundcloud',
				id: 'ghostculture/lucky',
			})
		})

		it('strips query params', () => {
			expect(parseUrl('https://soundcloud.com/artist/track?si=abc')).toEqual({
				provider: 'soundcloud',
				id: 'artist/track',
			})
		})

		it('handles www prefix', () => {
			expect(parseUrl('https://www.soundcloud.com/artist/track')).toEqual({
				provider: 'soundcloud',
				id: 'artist/track',
			})
		})

		it('parses m.soundcloud.com (mobile) URLs', () => {
			expect(
				parseUrl(
					'https://m.soundcloud.com/yayoland/yayoland-la-guerre-economique',
				),
			).toEqual({
				provider: 'soundcloud',
				id: 'yayoland/yayoland-la-guerre-economique',
			})
		})

		it('rejects profile-only URLs', () => {
			expect(parseUrl('https://soundcloud.com/artist')).toBeNull()
		})

		it('rejects playlist URLs', () => {
			expect(parseUrl('https://soundcloud.com/artist/sets/playlist')).toBeNull()
		})

		it('rejects reserved paths', () => {
			expect(parseUrl('https://soundcloud.com/discover/trending')).toBeNull()
		})
	})

	describe('Edge cases', () => {
		it('returns null for invalid URLs', () => {
			expect(parseUrl('not a url')).toBeNull()
		})

		it('returns null for unrecognized domains', () => {
			expect(parseUrl('https://example.com/watch?v=abc123')).toBeNull()
		})

		it('returns null for empty string', () => {
			expect(parseUrl('')).toBeNull()
		})

		it('returns null for YouTube URLs with invalid IDs', () => {
			// URL-encoded space creates invalid ID
			expect(parseUrl('https://youtube.com/watch?v=abc%20123456')).toBeNull()
		})
	})

	describe('bulk validation', () => {
		it('parses 97% of track URLs to valid media IDs', () => {
			const results = tracks.map((track) => {
				const parsed = parseUrl(track.url)
				return {
					url: track.url,
					parsed,
					valid: parsed !== null && parsed.id.length > 0,
				}
			})

			const valid = results.filter((r) => r.valid)
			const invalid = results.filter((r) => !r.valid)
			const percentage = (valid.length / results.length) * 100

			console.log(
				`Valid: ${valid.length}/${results.length} (${percentage.toFixed(2)}%)`,
			)
			if (invalid.length > 0) {
				console.log(
					'Sample invalid URLs:',
					invalid.slice(0, 10).map((r) => r.url),
				)
			}

			expect(percentage).toBeGreaterThanOrEqual(97)
		})
	})
})
