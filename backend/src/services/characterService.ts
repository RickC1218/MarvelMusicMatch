import { findCurated, type CuratedCharacter } from '../data/characterMeta';
import { AppError } from '../errors/AppError';
import MarvelCharacter from '../models/MarvelCharacterSchema';
import type {
  CharacterDetail,
  CharacterRole,
  CharacterSummary,
  Paginated,
} from '../types/character';

/**
 * Catálogo de personajes servido desde MongoDB.
 *
 * La API pública de Marvel fue dada de baja; los 100 personajes más conocidos
 * se cargan con `npm run seed:characters` (ver src/scripts/generateTopCharacters.ts).
 */

interface CharacterLean {
  id: string;
  slug: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  role: CharacterRole | null;
  popularityScore: number;
  popularity?: {
    comics?: number;
    series?: number;
    stories?: number;
    events?: number;
  };
  urls?: { type: string; url: string }[];
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toSummary = (doc: CharacterLean, curated?: CuratedCharacter): CharacterSummary => ({
  id: Number(doc.id),
  slug: doc.slug,
  name: doc.name,
  role: doc.role ?? curated?.role ?? null,
  curated: Boolean(curated),
  thumbnail: doc.thumbnailUrl || null,
  description: doc.description ?? '',
  comicsAvailable: doc.popularity?.comics ?? 0,
});

const toDetail = (doc: CharacterLean, curated?: CuratedCharacter): CharacterDetail => ({
  ...toSummary(doc, curated),
  seriesAvailable: doc.popularity?.series ?? 0,
  urls: doc.urls ?? [],
  vibes: curated ? [...curated.vibes] : [],
});

/** Ordena por popularidad y mapea cada documento a un resumen. */
const paginate = async (
  filter: Record<string, unknown>,
  page: number,
  pageSize: number,
): Promise<Paginated<CharacterSummary>> => {
  const total = await MarvelCharacter.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const docs = (await MarvelCharacter.find(filter)
    .sort({ popularityScore: -1, name: 1 })
    .skip((safePage - 1) * pageSize)
    .limit(pageSize)
    .lean()) as unknown as CharacterLean[];

  return {
    items: docs.map((doc) => toSummary(doc, findCurated(doc.id, doc.name))),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
};

/** Lista los personajes del catálogo, opcionalmente filtrados por rol. */
export const listCharacters = (options: {
  role?: CharacterRole;
  page: number;
  pageSize: number;
}): Promise<Paginated<CharacterSummary>> =>
  paginate(options.role ? { role: options.role } : {}, options.page, options.pageSize);

/** Busca por nombre (contiene, sin distinguir mayúsculas), opcionalmente por rol. */
export const search = (
  query: string,
  options: { role?: CharacterRole; page: number; pageSize: number },
): Promise<Paginated<CharacterSummary>> => {
  const filter: Record<string, unknown> = {
    name: { $regex: escapeRegExp(query), $options: 'i' },
  };
  if (options.role) filter.role = options.role;

  return paginate(filter, options.page, options.pageSize);
};

/** Acepta slug, id numérico de Marvel o nombre exacto (sin distinguir mayúsculas). */
const findCharacter = async (identifier: string): Promise<CharacterLean | null> => {
  const trimmed = identifier.trim();

  if (/^\d+$/.test(trimmed)) {
    return (await MarvelCharacter.findOne({ id: trimmed }).lean()) as CharacterLean | null;
  }

  const bySlug = (await MarvelCharacter.findOne({
    slug: trimmed.toLowerCase(),
  }).lean()) as CharacterLean | null;
  if (bySlug) return bySlug;

  return (await MarvelCharacter.findOne({
    name: { $regex: `^${escapeRegExp(trimmed)}$`, $options: 'i' },
  }).lean()) as CharacterLean | null;
};

/** Detalle por slug (o id/nombre, por compatibilidad). */
export const getBySlugOrId = async (identifier: string): Promise<CharacterDetail> => {
  if (!identifier.trim()) throw AppError.badRequest('Identificador vacío');

  const doc = await findCharacter(identifier);
  if (!doc) throw AppError.notFound('Personaje no encontrado');

  return toDetail(doc, findCurated(doc.id, doc.name));
};

/** Punto de entrada para la generación de playlists (slug, id o nombre). */
export const resolveCharacter = async (identifier: string): Promise<CharacterDetail> => {
  const trimmed = identifier.trim();
  if (!trimmed) throw AppError.badRequest('El personaje es obligatorio');

  const doc = await findCharacter(trimmed);
  if (!doc) throw AppError.notFound(`No se encontró el personaje "${trimmed}"`);

  return toDetail(doc, findCurated(doc.id, doc.name));
};
