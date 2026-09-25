import { getCharacter, listCharacters } from '../services/characterService';
import type { CharacterRole } from '../types/character';
import { useAsyncData } from './useAsyncData';

interface UseCharactersParams {
  role?: CharacterRole;
  query?: string;
  page: number;
  pageSize?: number;
}

export const useCharacters = ({ role, query, page, pageSize }: UseCharactersParams) =>
  useAsyncData(
    (signal) => listCharacters({ role, query, page, pageSize, signal }),
    [role, query, page, pageSize],
  );

export const useCharacter = (slug: string) =>
  useAsyncData((signal) => getCharacter(slug, signal), [slug]);
