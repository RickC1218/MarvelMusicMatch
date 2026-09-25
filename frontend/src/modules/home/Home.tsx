import FeaturedCharacters from './components/FeaturedCharacters'
import HeroBanner from './components/HeroBanner'
import HowItWorks from './components/HowItWorks'
import PopularPlaylists from './components/PopularPlaylists'

const Home = () => (
  <div className='flex flex-col gap-10 pb-4 pt-2'>
    <HeroBanner />
    <HowItWorks />
    <FeaturedCharacters />
    <PopularPlaylists />
  </div>
)

export default Home
