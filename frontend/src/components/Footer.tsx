import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { Container } from './Section'

const FOOTER_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Heroes', to: '/characters?role=hero' },
  { label: 'Villanos', to: '/characters?role=villain' },
  { label: 'Crear playlist', to: '/characters' },
]

export const Footer = () => (
  <footer className='mt-16 bg-primary text-neutral'>
    <Container className='grid items-center gap-10 py-12 md:grid-cols-4'>
      <img
        src='/assets/logos/MarvelMusicMatch2.svg'
        alt='MarvelMusicMatch'
        className='h-[56px] w-auto'
      />

      <nav aria-label='Enlaces del sitio' className='flex flex-col gap-2'>
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className='text-tags text-neutral transition-opacity hover:opacity-70'
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className='flex flex-col items-center gap-3 text-center md:col-span-2'>
        <div className='flex items-center gap-1 text-success'>
          {[0, 1, 2].map((star) => (
            <FontAwesomeIcon key={star} icon='star' className='h-4 w-4' />
          ))}
        </div>

        <p className='text-tags text-neutral'>
          Este sitio es un proyecto educativo / sin fines de lucro
        </p>
      </div>
    </Container>

    <div className='border-t border-white/10'>
      <article className='bg-dark py-2'>
        <p className='text-center text-secondary text-neutral'>
          Proyecto creado con APIs de Marvel, Spotify y ChatGPT — Desarrollado
          por RickC1218
        </p>
      </article>
    </div>
  </footer>
)
