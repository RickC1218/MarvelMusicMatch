import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '../../../components/Button'
import { formatArtists, formatDuration } from '../../../lib/format'
import { spotifySearchUrl } from '../../../lib/spotify'
import type { GeneratedPlaylist } from '../../../types/playlist'

interface PlaylistResultCardProps {
  playlist: GeneratedPlaylist
  saving: boolean
  saved: boolean
  saveError: string | null
  onSave: () => void
}

const PlaylistResultCard = ({
  playlist,
  saving,
  saved,
  saveError,
  onSave,
}: PlaylistResultCardProps) => {
  const spotifyUrl = spotifySearchUrl(playlist.mood || playlist.character.name)

  return (
    <section className='flex flex-col gap-5 rounded-2xl bg-primary p-6 text-neutral shadow-md'>
      <header className='flex flex-col gap-1'>
        <h3 className='text-title2'>{playlist.character.name} – Playlist</h3>
        <p className='text-tags text-neutral'>
          Playlist creada para {playlist.character.name}.
          {playlist.mood ? ` Vibras: ${playlist.mood}.` : ''}
        </p>
      </header>

      <h4 className='text-body font-semibold'>Lista de canciones</h4>

      <ol className='flex flex-col gap-3'>
        {playlist.songs.map((song, index) => (
          <li
            key={song.spotifyId || `${song.name}-${index}`}
            className='flex items-center gap-4'
          >
            <span className='w-5 text-tags font-semibold'>{index + 1}.</span>

            <div className='h-12 w-12 shrink-0 overflow-hidden rounded-md bg-dark'>
              {song.albumArt && (
                <img
                  src={song.albumArt}
                  alt=''
                  loading='lazy'
                  className='h-full w-full object-cover'
                />
              )}
            </div>

            <div className='min-w-0 flex-1'>
              <p className='truncate text-secondary'>{song.name}</p>
              <p className='truncate text-tags text-neutral'>
                {formatArtists(song.artist)}
              </p>
            </div>

            <span className='hidden text-tags text-neutral sm:block'>
              {formatDuration(song.durationMs)}
            </span>

            <a
              href={song.spotifyUrl}
              target='_blank'
              rel='noreferrer'
              aria-label={`Escuchar ${song.name} en Spotify`}
              className='flex h-8 w-8 items-center justify-center rounded-full text-success transition-opacity hover:opacity-80'
            >
              <FontAwesomeIcon icon={['fab', 'spotify']} className='h-5 w-5' />
            </a>
          </li>
        ))}
      </ol>

      <div className='flex flex-wrap items-center gap-3'>
        <Button
          label='Escuchar en Spotify'
          variant='success'
          icon={['fab', 'spotify']}
          href={spotifyUrl}
          className='text-tags font-semibold'
        />

        <Button
          label={saved ? 'Playlist guardada' : 'Guardar playlist'}
          variant='background'
          icon={saved ? 'check-circle' : 'bookmark'}
          onClick={onSave}
          loading={saving}
          disabled={saved}
          className='text-tags font-semibold'
        />

        {saveError && (
          <p role='alert' className='text-tags text-danger'>
            {saveError}
          </p>
        )}
      </div>
    </section>
  )
}

export default PlaylistResultCard
