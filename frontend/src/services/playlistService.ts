import type { Paginated } from '../types/api'
import type { CharacterRole } from '../types/character'
import type {
  GeneratedPlaylist,
  SavePlaylistInput,
  SavedPlaylist,
} from '../types/playlist'
import { apiRequest } from './apiClient'

export interface ReuseProfileInput {
  profile: GeneratedPlaylist['profile']
  vibes: { id: string }[]
}

export interface GenerateOptions {
  trackCount?: number
  /** Si viene, el backend reutiliza el perfil y solo vuelve a buscar canciones. */
  reuse?: ReuseProfileInput
}

export const generatePlaylist = (
  character: string,
  options: GenerateOptions = {},
  signal?: AbortSignal
): Promise<GeneratedPlaylist> =>
  apiRequest('/api/playlists/generate', {
    method: 'POST',
    body: {
      character,
      trackCount: options.trackCount,
      ...(options.reuse
        ? {
            profile: options.reuse.profile,
            vibes: options.reuse.vibes.map((vibe) => vibe.id),
          }
        : {}),
    },
    signal,
  })

export const savePlaylist = (
  input: SavePlaylistInput,
  signal?: AbortSignal
): Promise<SavedPlaylist> =>
  apiRequest('/api/playlists', { method: 'POST', body: input, signal })

export const listPlaylists = (
  page = 1,
  pageSize = 12,
  role?: CharacterRole,
  signal?: AbortSignal
): Promise<Paginated<SavedPlaylist>> => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (role) params.set('role', role)
  return apiRequest(`/api/playlists?${params.toString()}`, { signal })
}
