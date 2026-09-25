import mongoose, { Schema, Document } from 'mongoose';

export interface ICharacterUrl {
  type: string;
  url: string;
}

export interface IPopularity {
  comics: number;
  series: number;
  stories: number;
  events: number;
}

export interface IMarvelCharacter extends Document {
  /** Id numérico de Marvel (se guarda como string). */
  id: string;
  /** Identificador estable para las URLs, derivado del nombre. */
  slug: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  /** null cuando el dataset no indica si es héroe o villano. */
  role: 'hero' | 'villain' | null;
  /** Nº total de apariciones (comics + series + stories + events). */
  popularityScore: number;
  popularity: IPopularity;
  urls: ICharacterUrl[];
}

const CharacterUrlSchema = new Schema<ICharacterUrl>(
  {
    type: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const PopularitySchema = new Schema<IPopularity>(
  {
    comics: { type: Number, default: 0 },
    series: { type: Number, default: 0 },
    stories: { type: Number, default: 0 },
    events: { type: Number, default: 0 },
  },
  { _id: false },
);

const MarvelCharacterSchema = new Schema<IMarvelCharacter>({
  id: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  role: {
    type: String,
    enum: ['hero', 'villain'],
    default: null,
  },
  popularityScore: { type: Number, default: 0 },
  popularity: { type: PopularitySchema, default: () => ({}) },
  urls: { type: [CharacterUrlSchema], default: [] },
});

const MarvelCharacter = mongoose.model<IMarvelCharacter>('MarvelCharacter', MarvelCharacterSchema);
export default MarvelCharacter;
