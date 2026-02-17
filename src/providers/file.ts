/**
 * File provider — handles direct audio/video URLs
 */

import type { FileResult } from '../types'

export const file = {
	fetch: async (id: string, kind?: string): Promise<FileResult> => ({
		provider: 'file',
		id,
		url: id,
		title: id,
		kind: (kind as 'audio' | 'video') || 'audio',
		payload: null,
	}),
}
