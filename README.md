![The Burning of the Library at Alexandria in 391 AD. Ambrose Dudley](http://i.imgur.com/2fvkbVem.jpg)

# Media Now

Parse URLs to extract provider and identifier. Fetch metadata from YouTube, Vimeo, Spotify, Discogs, MusicBrainz, and SoundCloud. No API keys.

Meant to be useful for people dealing with music tracks in one shape or another (hello https://radio4000.com).

All functions return at least `provider`, `id` and `payload` (the original response).

```js
import { getMedia, parseUrl, parseTitle, cleanTitle, discoverDiscogsUrl } from 'media-now'

cleanTitle('Bohemian Rhapsody (Official Video) [HD]')
// 'Bohemian Rhapsody'

parseTitle('Nikolaj Nørlund - Hvid røg og tekno')
// { artist: 'Nikolaj Nørlund', title: 'Hvid røg og tekno', original: '...' }

parseUrl('https://vimeo.com/123456789')
// { provider: 'vimeo', id: '123456789' }

await getMedia('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// { provider, id, url, title, thumbnail, author, payload }

await discoverDiscogsUrl('Massive Attack - Teardrop')
// 'https://www.discogs.com/release/...'
```

## Providers

Note, the `getMedia()` methods automatically detects provider and calls these internally. But you can of course use them directly as well.

```js
import { youtube } from 'media-now/providers/youtube'
import { vimeo } from 'media-now/providers/vimeo'
import { spotify } from 'media-now/providers/spotify'
import { discogs } from 'media-now/providers/discogs'
import { musicbrainz } from 'media-now/providers/musicbrainz'
import { soundcloud } from 'media-now/providers/soundcloud'

youtube.fetch(id)
youtube.search(query)
vimeo.fetch(id)
spotify.fetch(id)
soundcloud.fetch(id) // id is 'user/track'
discogs.fetch(id)
discogs.fetchMaster(id)
musicbrainz.search(query)
musicbrainz.fetchRecording(id)
musicbrainz.fetchRelease(id)
```

## Development

To validate the project

```sh
bun run check
bun test
bun run build
```

## Releasing

Pushing a tag prefixed with `v` triggers the GitHub Actions workflow that publishes to npm.

```sh
# bump version in package.json
git commit -am "2.1.0"
git tag v2.1.0
git push origin main v2.1.0
```

## History

We wrote this kind of package several times in the past: 
[media-now](https://github.com/internet4000/media-now), 
[media-now-deno](https://github.com/radio4000/media-now-deno/) & 
[media-url-parser](https://github.com/internet4000/media-url-parser).

## Links

- https://console.developers.google.com/apis/api/youtube/overview
- https://developer.vimeo.com/apps
- https://developer.spotify.com/my-applications/

