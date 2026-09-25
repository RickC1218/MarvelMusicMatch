import { AppError } from '../errors/AppError';
import {
  getBySlugOrId,
  listCharacters as listCharactersService,
  search as searchCharacters,
} from '../services/characterService';
import type { CharacterRole } from '../types/character';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePage, parsePageSize } from '../utils/pagination';

const parseRole = (value: unknown): CharacterRole | undefined => {
  if (value === undefined || value === '') return undefined;
  if (value === 'hero' || value === 'villain') return value;
  throw AppError.badRequest("El parámetro 'role' debe ser 'hero' o 'villain'");
};

export const listCharacters = asyncHandler(async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const page = parsePage(req.query.page);
  const pageSize = parsePageSize(req.query.pageSize, 12);
  const role = parseRole(req.query.role);

  if (query) {
    res.json(await searchCharacters(query, { role, page, pageSize }));
    return;
  }

  res.json(await listCharactersService({ role, page, pageSize }));
});

export const getCharacter = asyncHandler(async (req, res) => {
  const detail = await getBySlugOrId(req.params.identifier);
  res.json(detail);
});
