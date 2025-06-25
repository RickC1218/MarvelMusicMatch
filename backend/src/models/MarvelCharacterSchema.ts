import mongoose, { Schema, Document } from 'mongoose';

export interface IMarvelCharacter extends Document {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  role: 'hero' | 'villain';
}

const MarvelCharacterSchema = new Schema<IMarvelCharacter>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  role: {
    type: String,
    enum: ['hero', 'villain'],
    required: true
  }
});

const MarvelCharacter = mongoose.model<IMarvelCharacter>('MarvelCharacter', MarvelCharacterSchema);
export default MarvelCharacter;