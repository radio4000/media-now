/**
 * Custom error classes for media-now
 */

import type { Provider } from './types.js'

/** Thrown when media is not found (404) */
export class MediaNotFoundError extends Error {
	readonly provider: Provider
	readonly id: string

	constructor(provider: Provider, id: string) {
		super(`Media not found: ${provider}/${id}`)
		this.name = 'MediaNotFoundError'
		this.provider = provider
		this.id = id
	}
}

/** Thrown for provider errors (rate limits, network issues, etc.) */
export class ProviderError extends Error {
	readonly provider: Provider

	constructor(provider: Provider, message: string) {
		super(`${provider}: ${message}`)
		this.name = 'ProviderError'
		this.provider = provider
	}
}
