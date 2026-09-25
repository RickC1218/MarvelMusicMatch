export type CharacterRole = 'hero' | 'villain';

export interface CharacterSummary {
  id: number;
  slug: string;
  name: string;
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
