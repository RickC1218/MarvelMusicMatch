import { findVibe, isVibeId, type Vibe, type VibeId } from '../data/vibes';
import { AppError } from '../errors/AppError';
import { generateCharacterProfile, type CharacterProfile } from '../integrations/ai';
import { searchTracks, type SpotifyTrack } from '../integrations/spotify';
import type { CharacterDetail, CharacterRole } from '../types/character';
import type { GeneratedPlaylist, Song } from '../types/playlist';
import { resolveCharacter } from './characterService';

const MIN_TRACKS = 5;
const MAX_TRACKS = 20;
const DEFAULT_TRACKS = 10;
const MAX_SEED_SEARCHES = 8;
const TRACKS_PER_SEED = 10;
const MAX_VIBES_PER_PLAYLIST = 3;

const clampTrackCount = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_TRACKS;
  return Math.min(Math.max(Math.floor(value), MIN_TRACKS), MAX_TRACKS);
};

const fallbackVibes = (role: CharacterRole | null): VibeId[] =>
  role === 'villain' ? ['oscuro', 'caotico'] : ['heroico', 'divertido'];

const uniqueSeeds = (vibes: Vibe[]): string[] => {
  const seen = new Set<string>();
  const seeds: string[] = [];

  for (const vibe of vibes) {
    for (const seed of vibe.seeds) {
      if (!seen.has(seed)) {
        seen.add(seed);
        seeds.push(seed);
      }
    }
  }

  return seeds.slice(0, MAX_SEED_SEARCHES);
};

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const toSong = (track: SpotifyTrack): Song => ({
  spotifyId: track.id,
  name: track.name,
  artist: track.artist,
  albumName: track.albumName,
  albumArt: track.albumArt,
  durationMs: track.durationMs,
  spotifyUrl: track.spotifyUrl,
});

/** Busca candidatos por cada semilla y arma la lista final sin repetir canciones. */
const collectTracks = async (vibes: Vibe[], count: number): Promise<Song[]> => {
  const seeds = uniqueSeeds(vibes);
  if (seeds.length === 0) {
    throw AppError.unavailable('No hay semillas de búsqueda configuradas para estas vibras');
  }

  const settled = await Promise.allSettled(
    seeds.map((seed) => searchTracks(seed, TRACKS_PER_SEED)),
  );

  const byId = new Map<string, SpotifyTrack>();
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    for (const track of result.value) {
      if (!byId.has(track.id)) byId.set(track.id, track);
    }
  }

  if (byId.size === 0) {
    // Si el fallo real fue de configuración, propagamos ese mensaje claro.
    const rejected = settled.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (rejected?.reason instanceof AppError && rejected.reason.code === 'CONFIG_ERROR') {
      throw rejected.reason;
    }
    throw AppError.unavailable('No se pudieron obtener canciones de Spotify en este momento');
  }

  // El shuffle aporta variedad: cada generación ofrece una selección distinta.
  return shuffle([...byId.values()]).slice(0, count).map(toSong);
};

/**
 * Perfil del personaje (personalidad, poderes, resumen y vibras).
 *
 * Si la IA falla se propaga el error: es preferible avisar que mostrar un texto
 * repetido o vacío que parezca un bug. La única degradación permitida es la de
 * la taxonomía musical (vibras), que tiene su propio respaldo determinístico.
 */
const buildProfile = (
  character: CharacterDetail,
  curatedVibes: VibeId[],
): Promise<CharacterProfile> =>
  generateCharacterProfile({
    name: character.name,
    description: character.description,
    comicsAvailable: character.comicsAvailable,
    role: character.role,
    vibeHint: curatedVibes,
  });

/** Perfil ya generado que se reutiliza al regenerar (sin volver a llamar a la IA). */
export interface ReusedProfile {
  personality: string;
  powers: string;
  summary: string;
  vibes: string[];
}

/**
 * Genera un borrador de playlist SIN persistirlo.
 *
 * Pipeline determinístico:
 * 1. Resolver el personaje (catálogo local).
 * 2. Clasificar vibras + redactar texto (IA, taxonomía cerrada).
 * 3. Resolver vibras a semillas y buscar canciones reales (Spotify).
 *
 * Si se pasa `reuse`, se omite el paso 2: el perfil (personalidad, poderes y
 * resumen) ya existe y solo se buscan canciones nuevas para las mismas vibras.
 */
export const generatePlaylist = async (options: {
  identifier: string;
  trackCount?: number;
  reuse?: ReusedProfile;
}): Promise<GeneratedPlaylist> => {
  const count = clampTrackCount(options.trackCount);
  const character = await resolveCharacter(options.identifier);

  const curatedVibes: VibeId[] = character.vibes.filter(isVibeId);

  const profile: CharacterProfile = options.reuse
    ? {
        vibes: options.reuse.vibes.filter(isVibeId),
        personality: options.reuse.personality,
        powers: options.reuse.powers,
        summary: options.reuse.summary,
        source: 'reused',
      }
    : await buildProfile(character, curatedVibes);

  const aiVibes: VibeId[] = profile.vibes.filter(isVibeId);

  const selectedVibeIds = (
    curatedVibes.length > 0
      ? curatedVibes
      : aiVibes.length > 0
        ? aiVibes
        : fallbackVibes(character.role)
  ).slice(0, MAX_VIBES_PER_PLAYLIST);

  const vibeDefinitions = selectedVibeIds
    .map((id) => findVibe(id))
    .filter((vibe): vibe is Vibe => vibe !== undefined);

  const songs = await collectTracks(vibeDefinitions, count);

  return {
    character: {
      id: character.id,
      slug: character.slug,
      name: character.name,
      role: character.role,
      thumbnail: character.thumbnail,
      description: character.description,
    },
    vibes: vibeDefinitions.map((vibe) => ({ id: vibe.id, label: vibe.label })),
    mood: vibeDefinitions.map((vibe) => vibe.label).join(' · '),
    profile: {
      personality: profile.personality,
      powers: profile.powers,
      summary: profile.summary,
    },
    songs,
    trackCount: songs.length,
    generatedAt: new Date().toISOString(),
  };
};
