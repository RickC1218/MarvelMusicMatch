import { useCallback, useState } from 'react'
import {
  generatePlaylist,
  savePlaylist,
  type GenerateOptions,
} from '../services/playlistService'
import type {
  GeneratedPlaylist,
  SavePlaylistInput,
  SavedPlaylist,
} from '../types/playlist'

interface GenerationState {
  playlist: GeneratedPlaylist | null
  loading: boolean
  error: string | null
}

export const usePlaylistGeneration = () => {
  const [state, setState] = useState<GenerationState>({
    playlist: null,
    loading: false,
    error: null,
  })

  const generate = useCallback(
    async (character: string, options?: GenerateOptions) => {
      // Se conserva la playlist anterior mientras carga: al regenerar no debe
      // desaparecer el perfil (personalidad, poderes, resumen) de la pantalla.
      setState((previous) => ({ ...previous, loading: true, error: null }))

      try {
        const playlist = await generatePlaylist(character, options)
        setState({ playlist, loading: false, error: null })
        return playlist
      } catch (cause) {
        setState((previous) => ({
          playlist: previous.playlist,
          loading: false,
          error:
            cause instanceof Error
              ? cause.message
              : 'No se pudo generar la playlist',
        }))
        return null
      }
    },
    []
  )

  const reset = useCallback(
    () => setState({ playlist: null, loading: false, error: null }),
    []
  )

  return { ...state, generate, reset }
}

interface SaveState {
  saving: boolean
  saved: boolean
  error: string | null
}

export const useSavePlaylist = () => {
  const [state, setState] = useState<SaveState>({
    saving: false,
    saved: false,
    error: null,
  })

  const save = useCallback(async (input: SavePlaylistInput) => {
    setState({ saving: true, saved: false, error: null })

    try {
      const saved: SavedPlaylist = await savePlaylist(input)
      setState({ saving: false, saved: true, error: null })
      return saved
    } catch (cause) {
      setState({
        saving: false,
        saved: false,
        error:
          cause instanceof Error
            ? cause.message
            : 'No se pudo guardar la playlist',
      })
      return null
    }
  }, [])

  const reset = useCallback(
    () => setState({ saving: false, saved: false, error: null }),
    []
  )

  return { ...state, save, reset }
}
