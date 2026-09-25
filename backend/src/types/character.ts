export type CharacterRole = 'hero' | 'villain';

export interface CharacterSummary {
  id: number;
  /** Identificador estable para las URLs; usa el slug curado o el id de Marvel. */
  slug: string;
  name: string;
  /** null cuando el personaje no está curado (p. ej. resultados de búsqueda). */
  role: CharacterRole | null;
  curated: boolean;
  thumbnail: string | null;
  description: string;
  comicsAvailable: number;
}

export interface CharacterDetail extends CharacterSummary {
  seriesAvailable: number;
  urls: { type: string; url: string }[];
  vibes: string[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
