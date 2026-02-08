# YouTube Provider

> Fetch YouTube video metadata without API key.

**Requires:** 01-types

## Requirements

- Create `src/providers/youtube.ts`
- `fetch(id)` → `YouTubeResult` - fetch video metadata via oEmbed
- `search(query)` → `YouTubeResult[]` - search videos via youtubei endpoint

## API Endpoints

**fetch(id):** `GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={id}&format=json`

**search(query):** `POST https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`
- Body: `{ query, context: { client: { clientName: 'WEB', clientVersion: '2.20230101' } } }`

> **Note:** This API key is a public/unofficial key. It may be revoked by YouTube at any time. If search breaks, this is the likely cause.

## Error Handling

- `MediaNotFoundError` for 404
- `ProviderError` for network/rate limit errors
- Empty array for no search results

## Out of Scope

- Video duration (requires scraping)
- Comments, likes, channel info
- Age-restricted content
