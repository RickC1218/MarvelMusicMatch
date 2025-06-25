# Marvel Music Match

Marvel Music Match es una aplicación web donde los fans de Marvel pueden descubrir playlists personalizadas inspiradas en sus héroes favoritos. Solo tienes que ingresar el nombre de tu héroe de Marvel y la app generará una playlist única que capture la esencia del personaje, utilizando las APIs de Marvel, ChatGPT y Spotify.

## Backend

Marvel Music Match contará con un backend desarrollado con **Node.js**, **Express** y **Mongoose** para gestionar la lógica de negocio, la integración con las APIs externas y el almacenamiento de datos de usuarios y playlists en una base de datos MongoDB.

## Características

- **Búsqueda de héroes:** Ingresa el nombre de cualquier héroe del universo Marvel.
- **Generación de descripciones:** ChatGPT analiza el perfil del héroe y genera una breve descripción de su personalidad y estilo.
- **Playlist personalizada:** Usando la API de Spotify, se crea una playlist que refleja la personalidad y energía del héroe seleccionado.
- **Interfaz intuitiva:** Diseño simple y atractivo para una experiencia de usuario fluida.

## ¿Cómo funciona?

1. **El usuario ingresa el nombre de su héroe favorito de Marvel.**
2. **La app consulta la API de Marvel** para obtener información relevante sobre el personaje.
3. **ChatGPT analiza la información** y genera una descripción creativa del héroe.
4. **La app utiliza la API de Spotify** para buscar canciones y crear una playlist que combine con la descripción generada.
5. **El usuario recibe una playlist única** junto con la descripción del héroe.

## Tecnologías utilizadas

- **React** para la interfaz de usuario.
- **API de Marvel** para obtener datos de los personajes.
- **OpenAI ChatGPT API** para generar descripciones creativas.
- **Spotify Web API** para crear y mostrar playlists.
- **Node.js** y **Express** para el desarrollo del backend y la gestión de rutas.
- **Mongoose** para la modelación y acceso a la base de datos MongoDB.
- **MongoDB** como base de datos principal para usuarios y playlists.
- **dotenv** para la gestión de variables de entorno.
- **Axios** para realizar peticiones HTTP a las APIs externas.
- **CORS** para permitir la comunicación entre frontend y backend.

## Instalación

1. Clona este repositorio:
  ```bash
  git clone https://github.com/RickC1218/MarvelMusicMatch.git
  ```
2. Instala las dependencias del frontend:
  ```bash
  cd MarvelMusicMatch
  npm install
  ```
3. Configura tus claves de API en un archivo `.env` en la raíz del proyecto:
  ```
  REACT_APP_MARVEL_API_KEY=tu_clave_marvel
  REACT_APP_OPENAI_API_KEY=tu_clave_openai
  REACT_APP_SPOTIFY_CLIENT_ID=tu_client_id_spotify
  REACT_APP_SPOTIFY_CLIENT_SECRET=tu_client_secret_spotify
  ```
4. Instala las dependencias y configura el backend:
  ```bash
  cd backend
  npm install
  ```
  Crea un archivo `.env` en la carpeta `backend` con tus variables de entorno necesarias para el backend (por ejemplo, claves de MongoDB, Spotify, OpenAI, etc.).
5. Levanta el backend:
  ```bash
  npm run dev
  ```
6. Vuelve a la carpeta principal y levanta el frontend:
  ```bash
  cd ..
  npm start
  ```

## Uso

1. Ingresa el nombre de tu héroe favorito en el buscador.
2. Espera unos segundos mientras se genera la playlist.
3. Disfruta de la música inspirada en tu héroe de Marvel.

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, abre un issue o haz un pull request para sugerir mejoras.

## Licencia

Este proyecto está bajo la licencia MIT.
