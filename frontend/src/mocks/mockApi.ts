import type { Paginated } from '../types/api';
import type { CharacterSummary } from '../types/character';
import type { SavedPlaylist, SavePlaylistInput } from '../types/playlist';
import {
  MOCK_CHARACTERS,
  MOCK_SAVED_PLAYLISTS,
  buildMockDetail,
  buildMockGeneratedPlaylist,
} from './fixtures';

/**
 * Interceptor de peticiones para el modo mock (solo desarrollo).
 *
 * Reproduce el mismo contrato que el backend (método + ruta + forma de
 * respuesta), así los servicios y hooks no cambian. Las rutas no reconocidas
 * devuelven { matched: false } y siguen el camino real.
 */

export const isMockEnabled = import.meta.env.VITE_USE_MOCKS === 'true';

export type MockResult =
  | { matched: false }
  | { matched: true; data: unknown }
  | { matched: true; error: { status: number; code: string; message: string } };

const notFound = (message: string): MockResult => ({
  matched: true,
  error: { status: 404, code: 'NOT_FOUND', message },
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const simulateLatency = () => delay(250 + Math.floor(Math.random() * 350));

const paginate = <T>(items: T[], page: number, pageSize: number): Paginated<T> => {
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
};

if (isMockEnabled) {
  console.info(
    '%c🧪 MODO MOCK activo%c  datos de ejemplo, no se llama al backend.\nDesactívalo quitando VITE_USE_MOCKS de frontend/.env.local',
    'background:#1DB954;color:#2C3E50;font-weight:600;padding:2px 6px;border-radius:4px',
    'color:#727272',
  );
}

export const resolveMockRequest = async (
  method: string,
  path: string,
  body?: unknown,
): Promise<MockResult> => {
  if (!isMockEnabled) return { matched: false };

  const url = new URL(path, 'http://mock.local');
  const { pathname, searchParams } = url;

  // GET /api/characters  (listado o búsqueda)
  if (method === 'GET' && pathname === '/api/characters') {
    await simulateLatency();

    const query = searchParams.get('q')?.trim().toLowerCase() ?? '';
    const role = searchParams.get('role');
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 12;

    let items: CharacterSummary[] = MOCK_CHARACTERS;
    if (role === 'hero' || role === 'villain') items = items.filter((c) => c.role === role);
    if (query) items = items.filter((c) => c.name.toLowerCase().includes(query));

    return { matched: true, data: paginate(items, page, pageSize) };
  }

  // GET /api/characters/:slug
  const characterMatch = /^\/api\/characters\/(.+)$/.exec(pathname);
  if (method === 'GET' && characterMatch) {
    await simulateLatency();

    const detail = buildMockDetail(decodeURIComponent(characterMatch[1]));
    return detail ? { matched: true, data: detail } : notFound('Personaje no encontrado (mock)');
  }

  // GET /api/playlists
  if (method === 'GET' && pathname === '/api/playlists') {
    await simulateLatency();

    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 12;
    const role = searchParams.get('role');

    let items = MOCK_SAVED_PLAYLISTS;
    if (role === 'hero' || role === 'villain') {
      const slugs = new Set(
        MOCK_CHARACTERS.filter((character) => character.role === role).map(
          (character) => character.slug,
        ),
      );
      items = items.filter((playlist) => slugs.has(playlist.heroId));
    }

    return { matched: true, data: paginate(items, page, pageSize) };
  }

  // POST /api/playlists/generate
  if (method === 'POST' && pathname === '/api/playlists/generate') {
    await simulateLatency();

    const input = (body ?? {}) as { character?: unknown; trackCount?: unknown };
    const identifier = typeof input.character === 'string' ? input.character : '';
    const detail = buildMockDetail(identifier);

    if (!detail) return notFound(`No se encontró el personaje "${identifier}" (mock)`);

    const requested = Number(input.trackCount);
    const trackCount = Number.isFinite(requested)
      ? Math.min(Math.max(Math.floor(requested), 5), 20)
      : 10;

    return { matched: true, data: buildMockGeneratedPlaylist(detail, trackCount) };
  }

  // POST /api/playlists
  if (method === 'POST' && pathname === '/api/playlists') {
    await simulateLatency();

    const input = body as SavePlaylistInput;
    const now = new Date().toISOString();
    const saved: SavedPlaylist = {
      _id: `mock-saved-${Date.now()}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    MOCK_SAVED_PLAYLISTS.unshift(saved);
    return { matched: true, data: saved };
  }

  // DELETE /api/playlists/:id
  const playlistMatch = /^\/api\/playlists\/(.+)$/.exec(pathname);
  if (method === 'DELETE' && playlistMatch) {
    await simulateLatency();

    const id = decodeURIComponent(playlistMatch[1]);
    const index = MOCK_SAVED_PLAYLISTS.findIndex((playlist) => playlist._id === id);
    if (index === -1) return notFound('Playlist no encontrada (mock)');

    MOCK_SAVED_PLAYLISTS.splice(index, 1);
    return { matched: true, data: { message: 'Playlist eliminada' } };
  }

  return { matched: false };
};
