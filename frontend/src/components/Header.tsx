import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { Link, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import { useRoleMode } from '../context/RoleModeContext'
import type { CharacterRole } from '../types/character'
import { Container } from './Section'

interface NavItem {
  label: string
  role: CharacterRole
  icon: IconProp
  activeClasses: string
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Heroe',
    role: 'hero',
    icon: 'shield-halved',
    activeClasses: 'bg-success text-primary',
  },
  {
    label: 'Villano',
    role: 'villain',
    icon: 'skull',
    activeClasses: 'bg-accent text-white',
  },
]

export const Header = () => {
  const { role, setRole } = useRoleMode()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isCharactersList = Boolean(useMatch('/characters'))
  const isCharacterDetail = Boolean(useMatch('/characters/:slug'))

  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const COLLAPSE_AT = 120
    const EXPAND_AT = 24

    const onScroll = () => {
      const y = window.scrollY
      setCompact((wasCompact) =>
        wasCompact ? y > EXPAND_AT : y >= COLLAPSE_AT
      )
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSelectRole = (nextRole: CharacterRole) => {
    setRole(nextRole)

    if (isCharactersList) {
      const next = new URLSearchParams(searchParams)
      next.set('role', nextRole)
      next.delete('page')
      setSearchParams(next, { replace: true })
      return
    }

    if (isCharacterDetail) {
      navigate(`/characters?role=${nextRole}`)
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-background transition-shadow ${
        compact ? 'shadow-sm' : ''
      }`}
    >
      <Container
        className={`flex items-center justify-between transition-[height] duration-200 ease-out ${
          compact ? 'h-20' : 'h-24 lg:h-[150px]'
        }`}
      >
        <Link
          to='/'
          aria-label='MarvelMusicMatch, ir al inicio'
          className='flex items-center'
        >
          <img
            src='/assets/logos/M.svg'
            alt='MarvelMusicMatch'
            className={`transition-all sm:hidden ${compact ? 'h-8' : 'h-12'}`}
          />
          <img
            src='/assets/logos/MarvelMusicMatch.svg'
            alt='MarvelMusicMatch'
            className={`hidden transition-all sm:block ${
              compact ? 'h-[40px] lg:h-12' : 'h-[64px] lg:h-[80px]'
            }`}
          />
        </Link>

        <nav
          aria-label='Cambiar entre modo héroes y villanos'
          className='flex gap-6 lg:gap-10'
        >
          {NAV_ITEMS.map((item) => {
            const isActive = role === item.role

            return (
              <button
                key={item.role}
                type='button'
                onClick={() => handleSelectRole(item.role)}
                className='flex flex-col items-center gap-1'
                aria-pressed={isActive}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-sm transition-colors lg:h-11 lg:w-11 ${
                    isActive ? item.activeClasses : 'bg-background text-primary'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className='h-4 w-4 lg:h-5 lg:w-5'
                  />
                </span>
                <span className='text-tags font-semibold text-primary'>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </Container>
    </header>
  )
}
