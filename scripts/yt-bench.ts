/**
 * Benchmark: oEmbed-only vs oEmbed + watch page enrichment
 * Run: bun run scripts/yt-bench.ts
 */

import tracks from './yt-test-tracks.json'

const OEMBED_URL = 'https://www.youtube.com/oembed'
const ids = tracks.map((t) => t.media_id)

// --- oEmbed only ---

async function fetchOembedOnly(id: string) {
	const url = `${OEMBED_URL}?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`
	const res = await fetch(url)
	return res.json()
}

// --- Full fetchExtended (oEmbed + watch page in parallel) ---

const { youtube } = await import('../src/providers/youtube')

console.log(`Benchmarking ${ids.length} videos...\n`)

// 1. oEmbed only (sequential to avoid rate limits)
const oembedStart = performance.now()
for (const id of ids) {
	await fetchOembedOnly(id)
}
const oembedTime = performance.now() - oembedStart

// 2. fetchExtended (oEmbed + watch page, parallel internally)
const fullStart = performance.now()
for (const id of ids) {
	await youtube.fetchExtended(id)
}
const fullTime = performance.now() - fullStart

// Results
const overhead = fullTime - oembedTime
const ratio = fullTime / oembedTime

console.log('--- Results ---')
console.log(`oEmbed only:    ${(oembedTime / 1000).toFixed(2)}s  (${(oembedTime / ids.length).toFixed(0)}ms avg)`)
console.log(`oEmbed + watch: ${(fullTime / 1000).toFixed(2)}s  (${(fullTime / ids.length).toFixed(0)}ms avg)`)
console.log(`Overhead:       ${(overhead / 1000).toFixed(2)}s  (${ratio.toFixed(2)}x)`)
