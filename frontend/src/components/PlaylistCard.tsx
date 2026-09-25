import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { SavedPlaylist } from '../types/playlist'
import { Button } from './Button'

interface PlaylistCardProps {
  playlist: SavedPlaylist
  className?: string
}

export const PlaylistCard = ({
  playlist,
  className = '',
}: PlaylistCardProps) => {
  const cover = playlist.songs[0]?.albumArt

  return (
    <article
      className={`relative h-[240px] w-full overflow-hidden rounded-2xl bg-primary text-neutral shadow-md ${className}`}
    >
      <div className='absolute left-1/2 top-1/2 flex h-[198px] w-[178px] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center'>
        {cover ? (
          <img
            src={cover}
            alt=''
            loading='lazy'
            className='h-full w-full object-contain'
          />
        ) : (
          <FontAwesomeIcon icon='music' className='h-10 w-10 text-muted' />
        )}
      </div>

      <div className='absolute inset-x-0 bottom-0 top-1/2 flex flex-col items-center justify-end gap-2 bg-primary px-4 pb-4'>
        <h3 className='text-secondary'>{playlist.heroName}</h3>

        <Button
          label='Ver playlist'
          variant='success'
          icon='play'
          to={`/characters/${playlist.heroId}`}
          className='w-full text-tags'
        />
      </div>
    </article>
  )
}
