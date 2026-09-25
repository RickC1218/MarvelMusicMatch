import crypto from 'node:crypto';
import { TtlCache } from '../cache/ttlCache';
import { env, isMarvelConfigured } from '../config/env';
import { AppError } from '../errors/AppError';
import { fetchJson } from './http';

/**
 * Cliente de la Marvel Comics API.
 *
 * Contrato usado (documentado por Marvel, verificar con tus claves):
 * - Base: https://gateway.marvel.com/v1/public
 * - Autenticación por query: `apikey`, `ts` y `hash = md5(ts + privateKey + publicKey)`
 * - Envoltura: { code, status, data: { offset, limit, total, count, results } }
 * - /characters admite `name` (exacto), `nameStartsWith`, `limit` (máx. 100) y `offset`.
 */

const CHARACTERS_TTL_MS = 1000 * 60 * 60; // 1 hora: los personajes cambian poco.
const SEARCH_TTL_MS = 1000 * 60 * 10; // 10 minutos.

export interface MarvelCharacter {
  id: number;
  name: string;
  description: string;
  thumbnail: string | null;
  comicsAvailable: number;
  seriesAvailable: number;
  urls: { type: string; url: string }[];
  modified: string;
}

export interface MarvelListResult {
  items: MarvelCharacter[];
  total: number;
  offset: number;
  limit: number;
}

interface MarvelApiCharacter {
  id: number;
  name: string;
  description?: string;
  modified: string;
  thumbnail?: { path?: string; extension?: string } | null;
  comics?: { available?: number };
  series?: { available?: number };
  urls?: { type: string; url: string }[];
}

interface MarvelEnvelope<T> {
  code: number;
  status: string;
  data: {
    offset: number;
    limit: number;
    total: number;
    count: number;
    results: T[];
  };
}

const characterCache = new TtlCache<MarvelCharacter>(CHARACTERS_TTL_MS, 500);
const listCache = new TtlCache<MarvelListResult>(SEARCH_TTL_MS, 200);

const requireKeys = (): { publicKey: string; privateKey: string } => {
  if (!isMarvelConfigured()) {
    throw AppError.config(
      'Marvel API no está configurada. Define MARVEL_PUBLIC_KEY y MARVEL_PRIVATE_KEY en el backend.',
    );
  }
  return { publicKey: env.marvel.publicKey, privateKey: env.marvel.privateKey };
};

const buildAuthParams = (): URLSearchParams => {
  const { publicKey, privateKey } = requireKeys();
  const ts = Date.now().toString();
  const hash = crypto.createHash('md5').update(ts + privateKey + publicKey).digest('hex');
  return new URLSearchParams({ ts, apikey: publicKey, hash });
};

const buildThumbnail = (thumbnail: MarvelApiCharacter['thumbnail']): string | null => {
  if (!thumbnail?.path || !thumbnail.extension) return null;
  // Marvel devuelve un placeholder cuando no hay imagen real.
  if (thumbnail.path.includes('image_not_available')) return null;
  return `${thumbnail.path}/portrait_xlarge.${thumbnail.extension}`;
};

const mapCharacter = (raw: MarvelApiCharacter): MarvelCharacter => ({
  id: raw.id,
  name: raw.name,
  description: (raw.description ?? '').trim(),
  thumbnail: buildThumbnail(raw.thumbnail),
  comicsAvailable: raw.comics?.available ?? 0,
  seriesAvailable: raw.series?.available ?? 0,
  urls: raw.urls ?? [],
  modified: raw.modified,
});

const requestCharacters = async (
  params: Record<string, string | number>,
): Promise<MarvelListResult> => {
  const query = buildAuthParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value));
  }

  const url = `${env.marvel.baseUrl}/characters?${query.toString()}`;
  const { data } = await fetchJson<MarvelEnvelope<MarvelApiCharacter>>(url, {
    provider: 'Marvel API',
  });

  return {
    items: data.data.results.map(mapCharacter),
    total: data.data.total,
    offset: data.data.offset,
    limit: data.data.limit,
  };
};

/** Lista personajes por nombre exacto o por prefijo, con caché y paginación. */
export const searchCharacters = async (options: {
  name?: string;
  nameStartsWith?: string;
  limit?: number;
  offset?: number;
}): Promise<MarvelListResult> => {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const key = `list:${options.name ?? ''}|${options.nameStartsWith ?? ''}|${limit}|${offset}`;

  return listCache.getOrSet(key, () =>
    requestCharacters({
      ...(options.name ? { name: options.name } : {}),
      ...(options.nameStartsWith ? { nameStartsWith: options.nameStartsWith } : {}),
      limit,
      offset,
    }),
  );
};

/** Obtiene un personaje por su id de Marvel. Devuelve null si no existe. */
export const getCharacterById = async (id: number): Promise<MarvelCharacter | null> => {
  if (!Number.isInteger(id) || id <= 0) return null;

  const cached = characterCache.get(String(id));
  if (cached) return cached;

  const query = buildAuthParams();
  const url = `${env.marvel.baseUrl}/characters/${id}?${query.toString()}`;
  const { data } = await fetchJson<MarvelEnvelope<MarvelApiCharacter>>(url, {
    provider: 'Marvel API',
  });

  const raw = data.data.results[0];
  if (!raw) return null;

  const character = mapCharacter(raw);
  characterCache.set(String(id), character);
  return character;
};
