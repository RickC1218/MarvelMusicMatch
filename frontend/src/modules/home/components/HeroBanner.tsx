import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { SearchBar } from '../../../components/SearchBar'
import { Container } from '../../../components/Section'
import { useRoleMode } from '../../../context/RoleModeContext'
import { ROLE_CTAS } from '../../../lib/roleCtas'

const HeroBanner = () => {
  const navigate = useNavigate()
  const { role } = useRoleMode()
  const cta = ROLE_CTAS[role]

  const handleSearch = (value: string) => {
    if (!value) {
      navigate('/characters')
      return
    }
    navigate(`/characters?q=${encodeURIComponent(value)}`)
  }

  return (
    <section>
      <Container>
        <article
          className='flex min-h-[354px] flex-col items-end justify-end gap-3 rounded-2xl bg-cover bg-center p-8 lg:min-h-[520px] xl:px-24'
          style={{ backgroundImage: "url('/assets/resources/image.png')" }}
        >
          <h1 className='max-w-[720px] text-right text-title2 text-background lg:text-display'>
            Encuentra la playlist de tu personaje favorito
          </h1>
          <Button
            label={cta.label}
            variant='background'
            icon={cta.icon}
            iconColor={role === 'villain' ? 'text-accent' : 'text-success'}
            to={cta.to}
            className='text-tags font-semibold'
          />
        </article>
      </Container>

      <Container className='py-8'>
        <SearchBar onSubmit={handleSearch} />
      </Container>
    </section>
  )
}

export default HeroBanner
