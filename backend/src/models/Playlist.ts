import mongoose, { Document, Schema } from 'mongoose';

export interface ISong {
  spotifyId: string;
  name: string;
  artist: string[];
  albumName: string;
  albumArt: string;
  durationMs: number;
  spotifyUrl: string;
}

export interface IPlaylist extends Document {
  heroId: string;
  heroName: string;
  mood: string;
  description: string;
  songs: ISong[];
  createdAt: Date;
  updatedAt: Date;
}

const SongSchema = new Schema<ISong>(
  {
    spotifyId: { type: String, default: '', trim: true },
    name: { type: String, required: true, trim: true },
    artist: { type: [String], default: [] },
    albumName: { type: String, default: '', trim: true },
    albumArt: { type: String, default: '' },
    durationMs: { type: Number, default: 0 },
    spotifyUrl: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const PlaylistSchema = new Schema<IPlaylist>(
  {
    heroId: { type: String, required: true, trim: true, index: true },
    heroName: { type: String, required: true, trim: true },
    mood: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    songs: { type: [SongSchema], default: [] },
  },
  { timestamps: true },
);

const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
export default Playlist;
