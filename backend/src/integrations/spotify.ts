import { TtlCache } from '../cache/ttlCache';
import { env, isSpotifyConfigured } from '../config/env';
import { AppError } from '../errors/AppError';
import { fetchJson } from './http';

/**
 * Cliente de la Spotify Web API usando el flujo "client credentials".
 *
 * Permite buscar canciones del catálogo (datos reales y verificables) pero NO
 * crear playlists en la cuenta del usuario: para eso hace falta el flujo de
 * autorización con login (etapa B, pendiente).
 */

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';
const SEARCH_TTL_MS = 1000 * 60 * 30;
const MAX_TRACK_LIMIT = 50;

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string[];
  albumName: string;
  albumArt: string;
  durationMs: number;
  spotifyUrl: string;
  previewUrl: string | null;
}

interface SpotifyApiTrack {
  id?: string;
  name?: string;
  artists?: { name?: string }[];
  album?: { name?: string; images?: { url?: string; width?: number }[] };
  external_urls?: { spotify?: string };
  duration_ms?: number;
  preview_url?: string | null;
  is_local?: boolean;
}

interface SpotifySearchResponse {
  tracks?: { items?: SpotifyApiTrack[] };
}

interface SpotifyTokenResponse {
  access_token?: string;
  expires_in?: number;
}

const searchCache = new TtlCache<SpotifyTrack[]>(SEARCH_TTL_MS, 300);

let cachedToken: { value: string; expiresAt: number } | null = null;
let tokenInFlight: Promise<string> | null = null;

const requireCredentials = (): { clientId: string; clientSecret: string } => {
  if (!isSpotifyConfigured()) {
    throw AppError.config(
      'Spotify no está configurado. Define SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET.',
    );
  }
  return { clientId: env.spotify.clientId, clientSecret: env.spotify.clientSecret };
};

const requestAccessToken = async (): Promise<string> => {
  const { clientId, clientSecret } = requireCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const { data } = await fetchJson<SpotifyTokenResponse>(TOKEN_URL, {
    provider: 'Spotify Auth',
    method: 'POST',
    headers: { Authorization: `Basic ${basic}` },
    form: { grant_type: 'client_credentials' },
  });

  if (!data.access_token || !data.expires_in) {
    throw AppError.upstream('Spotify Auth: respuesta de token inválida');
  }

  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
};

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) return cachedToken.value;
  if (tokenInFlight) return tokenInFlight;

  tokenInFlight = requestAccessToken().finally(() => {
    tokenInFlight = null;
  });

  return tokenInFlight;
};

const pickAlbumArt = (images: { url?: string; width?: number }[] | undefined): string => {
  if (!images || images.length === 0) return '';

  const withUrl = images.filter((image) => typeof image.url === 'string' && image.url.length > 0);
  if (withUrl.length === 0) return '';

  // Spotify ordena de mayor a menor; preferimos una cercana a 300px.
  const preferred = withUrl.find((image) => (image.width ?? 0) >= 300);
  return (preferred ?? withUrl[withUrl.length - 1]).url as string;
};

const mapTrack = (track: SpotifyApiTrack): SpotifyTrack | null => {
  const spotifyUrl = track.external_urls?.spotify;
  if (!track.id || !track.name || !spotifyUrl || track.is_local) return null;

  return {
    id: track.id,
    name: track.name,
    artist: (track.artists ?? [])
      .map((artist) => artist.name)
      .filter((name): name is string => Boolean(name)),
    albumName: track.album?.name ?? '',
    albumArt: pickAlbumArt(track.album?.images),
    durationMs: track.duration_ms ?? 0,
    spotifyUrl,
    previewUrl: track.preview_url ?? null,
  };
};

/** Busca canciones reales por texto libre. Devuelve solo tracks utilizables. */
export const searchTracks = async (query: string, limit = 10): Promise<SpotifyTrack[]> => {
  const normalizedLimit = Math.min(Math.max(limit, 1), MAX_TRACK_LIMIT);
  const key = `${env.spotify.market}:${normalizedLimit}:${query.trim().toLowerCase()}`;

  return searchCache.getOrSet(key, async () => {
    const token = await getAccessToken();
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: String(normalizedLimit),
      market: env.spotify.market,
    });

    const { data } = await fetchJson<SpotifySearchResponse>(
      `${API_BASE}/search?${params.toString()}`,
      {
        provider: 'Spotify API',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return (data.tracks?.items ?? [])
      .map(mapTrack)
      .filter((track): track is SpotifyTrack => track !== null);
  });
};
