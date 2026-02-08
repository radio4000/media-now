# Types & Errors

> Define TypeScript interfaces and custom error classes.

**Requires:** 00-project-setup

## Requirements

- Create `src/types.ts` with `Provider`, `MediaResult`, and provider-specific result types
- Create `src/errors.ts` with `MediaNotFoundError`, `ProviderError`

## Types to Define

- `Provider` - union: `'youtube' | 'vimeo' | 'spotify' | 'discogs' | 'musicbrainz' | 'soundcloud'`
- `MediaResult` - base interface with: provider, id, url, title, payload (raw API response)
- `YouTubeResult` - extends MediaResult: thumbnail, author, duration?
- `VimeoResult` - extends MediaResult: thumbnail, author, duration
- `SpotifyResult` - extends MediaResult: thumbnail, artist, duration, album?, isrc?
- `DiscogsResult` - extends MediaResult: year?, genres[], styles[], artists[], labels[]
- `MusicBrainzResult` - extends MediaResult: artist, releases[]
- `MusicBrainzRelease` - id, title, url, relations[], payload
- `SoundCloudResult` - extends MediaResult: thumbnail?, author, description?
- `SearchResult` - provider, id, title, thumbnail?, url
- `ParsedTitle` - artist (nullable), title, original
- `ParsedUrl` - { provider: Provider, id: string, kind?: string }

## Error Classes

- `MediaNotFoundError(provider, id)` - thrown for 404 / not found
- `ProviderError(provider, message)` - thrown for rate limits, network errors

## Payload Shapes

The `payload` field contains raw API responses. Expected shapes:

### oEmbed Responses (YouTube, Vimeo, Spotify, SoundCloud)

```ts
{
  title: string
  author_name: string
  author_url: string
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
  html: string           // embed iframe
  width: number
  height: number
  version: string
  provider_name: string
  provider_url: string
  type: string
  // Vimeo adds: duration (seconds), video_id
  // SoundCloud adds: description?
}
```

### Discogs Release/Master

```ts
{
  id: number
  title: string
  year?: number
  genres?: string[]
  styles?: string[]
  artists?: { name: string }[]
  labels?: { name: string }[]
  uri: string
  // ... many additional fields in full API response
}
```

### MusicBrainz Recording

```ts
{
  id: string             // UUID
  title: string
  "artist-credit"?: { name: string; artist: { id: string; name: string } }[]
  releases?: { id: string; title: string }[]
}
```

### MusicBrainz Release

```ts
{
  id: string
  title: string
  relations?: { type: string; url?: { resource: string } }[]
}
```

## Implementation Notes

- All types should be exported
- `payload` must always contain the raw API response
- Error classes should include provider name for debugging

## Out of Scope

- Implementation of providers
- Validation logic
- Runtime type validation (Zod schemas)
