import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import type { CharacterSummary } from '../types/character'

interface CharacterCardProps {
  character: CharacterSummary
  className?: string
}

export const CharacterCard = ({
  character,
  className = '',
}: CharacterCardProps) => {
  const href = `/characters/${character.slug}?generate=1`

  return (
    <article
      className={`flex h-[400px] w-full flex-col items-center justify-between gap-3 rounded-2xl border border-neutral bg-white p-2 pb-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <Link
        to={href}
        tabIndex={-1}
        aria-hidden='true'
        className='flex h-[254px] w-full max-w-[236px] items-center justify-center overflow-hidden rounded-xl bg-background'
      >
        {character.thumbnail ? (
          <img
            src={character.thumbnail}
            alt=''
            loading='lazy'
            className='h-full w-full object-contain'
          />
        ) : (
          <FontAwesomeIcon
            icon={character.role === 'villain' ? 'skull' : 'shield-halved'}
            className='h-10 w-10 text-muted'
          />
        )}
      </Link>

      <h3 className='text-secondary text-primary'>{character.name}</h3>

      <Link
        to={href}
        className='flex items-center gap-2 text-tags font-semibold text-primary transition-colors hover:text-success'
      >
        <FontAwesomeIcon icon='music' className='h-4 w-4 text-success' />
        Crear playlist
      </Link>
    </article>
  )
}
