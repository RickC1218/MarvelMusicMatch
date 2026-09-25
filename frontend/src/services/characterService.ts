import type { Paginated } from '../types/api';
import type { CharacterDetail, CharacterRole, CharacterSummary } from '../types/character';
import { apiRequest } from './apiClient';

interface ListCharactersParams {
  role?: CharacterRole;
  query?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export const listCharacters = ({
  role,
  query,
  page = 1,
  pageSize = 12,
  signal,
}: ListCharactersParams = {}): Promise<Paginated<CharacterSummary>> => {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (role) params.set('role', role);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  return apiRequest(`/api/characters?${params.toString()}`, { signal });
};

export const getCharacter = (slug: string, signal?: AbortSignal): Promise<CharacterDetail> =>
  apiRequest(`/api/characters/${encodeURIComponent(slug)}`, { signal });
