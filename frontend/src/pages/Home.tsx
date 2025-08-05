import { Button } from "../components/Button"
import { Input } from "../components/Input"

const Home = () => {
  return (
    <div className="flex flex-col justify-center items-start gap-2 w-full">
      <h1 className="text-display font-semibold">¡Hola, MarvelMusicMatch!</h1>
      <h2 className="text-title1 font-medium">Welcome to the Marvel Music Match App</h2>
      <h3 className="text-title2 font-regular">Hello world</h3>
      <p className="text-base font-regular">This is a simple example of a button component in
        React with TypeScript and Tailwind CSS.</p>
      <p className="text-secondary font-light">You can use these buttons to trigger actions or navigate through the app.</p>
      <p className="text-tags font-regular">This is tags</p>
      <div className="flex gap-3 px-1">
        <Button label="Start discover" type="success" icon={"play-circle"} iconColor="text-neutral" />
        <Button label="Start discover" type="background" icon={"music"} iconColor="text-success" />
        <Button label="Start discover" type="primary" icon={['fab', 'spotify']} iconColor="text-success" />
        <Button label="Start discover" type="danger" icon={"heart"} iconColor="text-neutral" />
      </div>
      <div className="flex gap-3 px-1">
        <Button type="success" icon={"shield-halved"} iconColor="text-primary" />
        <Button type="background" icon={"skull"} iconColor="text-primary" />
      </div>
      <div className="flex gap-3 px-1">
        <img src="./assets/logos/MarvelMusicMatch.svg" alt="MarvelMusicMatch" />
        <img src="./assets/logos/MarvelMusicMatch2.svg" alt="MarvelMusicMatch2" />
      </div>
      <div className="flex gap-3 px-1 w-full">
        <Input placeholder="Busca qué escuchan tus héroes o villanos" type="primary" icon={"magnifying-glass"} iconColor="text-neutral" />
      </div>
    </div>
  )
}

export default Home