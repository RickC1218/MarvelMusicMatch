import { AppError } from '../errors/AppError';
import {
  generatePlaylist as generatePlaylistService,
  type ReusedProfile,
} from '../services/playlistGenerationService';
import { asyncHandler } from '../utils/asyncHandler';

const asString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Perfil opcional a reutilizar al regenerar. Si viene completo, el servicio
 * omite la llamada a la IA y solo vuelve a buscar canciones en Spotify.
 */
const parseReusedProfile = (body: Record<string, unknown>): ReusedProfile | undefined => {
  if (typeof body.profile !== 'object' || body.profile === null) return undefined;

  const profile = body.profile as Record<string, unknown>;
  const personality = asString(profile.personality);
  const powers = asString(profile.powers);
  const summary = asString(profile.summary);

  if (!personality && !powers && !summary) return undefined;

  const vibes = Array.isArray(body.vibes)
    ? body.vibes.filter((value): value is string => typeof value === 'string')
    : [];

  return { personality, powers, summary, vibes };
};

export const generatePlaylist = asyncHandler(async (req, res) => {
  const body = req.body;
  if (typeof body !== 'object' || body === null) {
    throw AppError.badRequest('El cuerpo de la petición debe ser un objeto');
  }

  const input = body as Record<string, unknown>;
  const identifier = typeof input.character === 'string' ? input.character.trim() : '';
  if (!identifier) {
    throw AppError.badRequest("El campo 'character' es obligatorio (slug, id o nombre)");
  }

  const trackCount = Number(input.trackCount);

  const result = await generatePlaylistService({
    identifier,
    trackCount: Number.isFinite(trackCount) ? trackCount : undefined,
    reuse: parseReusedProfile(input),
  });

  res.json(result);
});
