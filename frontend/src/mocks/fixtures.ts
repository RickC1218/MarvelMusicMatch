import type { CharacterDetail, CharacterRole, CharacterSummary } from '../types/character';
import type { GeneratedPlaylist, SavedPlaylist, Song } from '../types/playlist';

/**
 * Datos de ejemplo SOLO para desarrollo.
 *
 * Permiten revisar el diseño sin claves de API ni gastar créditos. Se activan
 * con VITE_USE_MOCKS=true en frontend/.env.local y no afectan a producción.
 */

const VIBE_LABELS: Record<string, string> = {
  heroico: 'Heroico',
  oscuro: 'Oscuro',
  caotico: 'Caótico',
  elegante: 'Elegante',
  melancolico: 'Melancólico',
  cosmico: 'Cósmico',
  callejero: 'Callejero',
  retro: 'Retro',
  tecnologico: 'Tecnológico',
  salvaje: 'Salvaje',
  mistico: 'Místico',
  divertido: 'Divertido',
};

const HERO_NAMES = [
  'Spider-Man',
  'Iron Man',
  'Captain America',
  'Thor',
  'Hulk',
  'Black Widow',
  'Wolverine',
  'Doctor Strange',
  'Black Panther',
  'Storm',
  'Daredevil',
  'Captain Marvel',
];

const VILLAIN_NAMES = [
  'Loki',
  'Thanos',
  'Venom',
  'Magneto',
  'Green Goblin',
  'Doctor Doom',
  'Ultron',
  'Kingpin',
  'Red Skull',
  'Mysterio',
  'Rhino',
  'Electro',
];

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const hash = (value: string): number =>
  [...value].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000, 7);

/** Avatar SVG embebido: evita depender de imágenes externas en el mock. */
const avatar = (name: string, role: CharacterRole): string => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const background = role === 'villain' ? '#2C3E50' : '#1DB954';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" rx="24" fill="${background}"/><text x="150" y="185" font-family="Poppins, sans-serif" font-size="110" font-weight="600" fill="#F0F0F0" text-anchor="middle">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const PALETTE = ['#2C3E50', '#1DB954', '#ED1D24', '#222222', '#727272'];

const albumArt = (index: number): string => {
  const background = PALETTE[index % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="${background}"/><circle cx="150" cy="150" r="58" fill="none" stroke="#F0F0F0" stroke-width="6"/><circle cx="150" cy="150" r="14" fill="#F0F0F0"/></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const descriptionFor = (name: string, role: CharacterRole): string =>
  `${name} es uno de los personajes del universo Marvel. Esta descripción es de ejemplo y se usa para revisar el diseño sin claves de API. ${
    role === 'hero'
      ? 'Defiende la ciudad y a quienes no pueden defenderse.'
      : 'Representa una amenaza constante para los héroes.'
  }`;

const makeSummary = (name: string, role: CharacterRole): CharacterSummary => ({
  id: 1009000 + hash(name),
  slug: slugify(name),
  name,
  role,
  curated: true,
  thumbnail: avatar(name, role),
  description: descriptionFor(name, role),
  comicsAvailable: 50 + (hash(name) % 950),
});

export const MOCK_CHARACTERS: CharacterSummary[] = [
  ...HERO_NAMES.map((name) => makeSummary(name, 'hero')),
  ...VILLAIN_NAMES.map((name) => makeSummary(name, 'villain')),
];

const vibesFor = (role: CharacterRole): string[] =>
  role === 'villain' ? ['oscuro', 'caotico'] : ['heroico', 'divertido'];

export const buildMockDetail = (identifier: string): CharacterDetail | null => {
  const summary = MOCK_CHARACTERS.find(
    (character) => character.slug === identifier || String(character.id) === identifier,
  );
  if (!summary) return null;

  const role = summary.role ?? 'hero';

  return {
    ...summary,
    seriesAvailable: 10 + (hash(summary.name) % 40),
    urls: [{ type: 'comiclink', url: 'https://www.marvel.com/characters' }],
    vibes: vibesFor(role),
  };
};

const SONG_NAMES = [
  'Neon Skyline',
  'Concrete Kingdom',
  'Electric Pulse',
  'Midnight Run',
  'Iron Heartbeat',
  'Chaos Theory',
  'Velvet Shadows',
  'Gravity Well',
  'Street Symphony',
  'Crimson Hour',
  'Static Dreams',
  'Wildfire',
  'Obsidian Waves',
  'Solar Flare',
];

const ARTISTS = ['The Demo Band', 'Mock Ensemble', 'Placeholder Sound', 'Sample Collective'];

const SONG_POOL: Song[] = SONG_NAMES.map((name, index) => ({
  spotifyId: `mock-track-${index + 1}`,
  name,
  artist: [ARTISTS[index % ARTISTS.length]],
  albumName: `Demo Album ${Math.floor(index / 5) + 1}`,
  albumArt: albumArt(index),
  durationMs: (3 * 60 + 5 + index * 11) * 1000,
  spotifyUrl: 'https://open.spotify.com',
}));

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const buildMockGeneratedPlaylist = (
  detail: CharacterDetail,
  trackCount: number,
): GeneratedPlaylist => {
  const vibeIds = (detail.vibes.length > 0 ? detail.vibes : vibesFor(detail.role ?? 'hero')).slice(0, 3);
  const vibes = vibeIds.map((id) => ({ id, label: VIBE_LABELS[id] ?? id }));
  const songs = shuffle(SONG_POOL).slice(0, trackCount);

  return {
    character: {
      id: detail.id,
      slug: detail.slug,
      name: detail.name,
      role: detail.role,
      thumbnail: detail.thumbnail,
      description: detail.description,
    },
    vibes,
    mood: vibes.map((vibe) => vibe.label).join(' · '),
    profile: {
      personality:
        detail.role === 'villain'
          ? `${detail.name} es imponente, calculador y no se detiene ante nada.`
          : `${detail.name} es valiente, decidido y siempre dispuesto a ayudar.`,
      powers:
        detail.role === 'villain'
          ? `${detail.name} domina habilidades extraordinarias que lo hacen una amenaza difícil de enfrentar.`
          : `${detail.name} cuenta con habilidades extraordinarias que usa para proteger a los demás.`,
      summary: `${detail.name} vive aventuras que ponen a prueba su carácter. Estas líneas son de ejemplo: con la API de OpenAI configurada, aquí aparecerá un resumen generado a partir de la descripción real del personaje y de sus vibras musicales.`,
    },
    songs,
    trackCount: songs.length,
    generatedAt: new Date().toISOString(),
  };
};

const makeSavedPlaylist = (character: CharacterSummary, offset: number): SavedPlaylist => {
  const detail = buildMockDetail(character.slug) as CharacterDetail;
  const songs = SONG_POOL.slice(offset, offset + 6);
  const now = new Date(Date.now() - offset * 3600_000).toISOString();

  return {
    _id: `mock-saved-${character.slug}`,
    heroId: character.slug,
    heroName: character.name,
    mood: detail.vibes.map((id) => VIBE_LABELS[id] ?? id).join(' · '),
    description: `Playlist de ejemplo para ${character.name}.`,
    songs,
    createdAt: now,
    updatedAt: now,
  };
};

/** Se muta al guardar desde la UI para que aparezca en el listado. */
export const MOCK_SAVED_PLAYLISTS: SavedPlaylist[] = [
  makeSavedPlaylist(MOCK_CHARACTERS[11], 0), // Captain Marvel
  makeSavedPlaylist(MOCK_CHARACTERS[0], 3), // Spider-Man
  makeSavedPlaylist(MOCK_CHARACTERS[22], 6), // Rhino
  makeSavedPlaylist(MOCK_CHARACTERS[16], 2), // Thanos
  makeSavedPlaylist(MOCK_CHARACTERS[14], 5), // Venom
];
