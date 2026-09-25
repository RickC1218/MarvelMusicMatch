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
    role: 'hero' | 'villain' | null;
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

export interface SavedPlaylist {
  _id: string;
  heroId: string;
  heroName: string;
  mood: string;
  description: string;
  songs: Song[];
  createdAt: string;
  updatedAt: string;
}

export interface SavePlaylistInput {
  heroId: string;
  heroName: string;
  mood: string;
  description: string;
  songs: Song[];
}
