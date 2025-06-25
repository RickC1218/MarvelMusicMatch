import mongoose, { Document, Schema } from 'mongoose';

export interface ISong {
  name: string;
  artist: string[];
  albumArt: string;
  spotifyUrl: string;
}

export interface IPlaylist extends Document {
  heroId: string;
  heroName: string;
  mood: string;
  chatGptPrompt: string;
  songs: ISong[];
  createdAt: Date;
}

const SongSchema = new Schema<ISong>({
  name: String,
  artist: [String],
  albumArt: String,
  spotifyUrl: String
});

const PlaylistSchema = new Schema<IPlaylist>({
  heroId: String,
  heroName: String,
  mood: String,
  chatGptPrompt: String,
  songs: [SongSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
export default Playlist;