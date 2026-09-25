import type { CharacterRole } from './character';

export interface Song {
  spotifyId: string;
  name: string;
  artist: string[];
  albumName: string;
  albumArt: string;
  durationMs: number;
  spotifyUrl: string;
}

export interface GeneratedPlaylist {
  character: {
    id: number;
    slug: string;
    name: string;
    role: CharacterRole | null;
    thumbnail: string | null;
    description: string;
  };
  vibes: { id: string; label: string }[];
  mood: string;
  profile: {
    personality: string;
    powers: string;
    summary: string;
  };
  songs: Song[];
  trackCount: number;
  generatedAt: string;
}
