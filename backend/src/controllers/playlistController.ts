import mongoose from 'mongoose';
import { CURATED_CHARACTERS } from '../data/characterMeta';
import { AppError } from '../errors/AppError';
import Playlist from '../models/Playlist';
import type { CharacterRole } from '../types/character';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePage, parsePageSize } from '../utils/pagination';

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const parseSong = (value: unknown, index: number) => {
  if (typeof value !== 'object' || value === null) {
    throw AppError.badRequest(`songs[${index}] debe ser un objeto`);
  }

  const song = value as Record<string, unknown>;
  const name = asString(song.name);
  const spotifyUrl = asString(song.spotifyUrl);

  if (!name) throw AppError.badRequest(`songs[${index}].name es obligatorio`);
  if (!spotifyUrl) throw AppError.badRequest(`songs[${index}].spotifyUrl es obligatorio`);

  const artist = Array.isArray(song.artist)
    ? song.artist.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : [];

  return {
    spotifyId: asString(song.spotifyId) ?? '',
    name,
    artist,
    albumName: asString(song.albumName) ?? '',
    albumArt: asString(song.albumArt) ?? '',
    durationMs: asNumber(song.durationMs) ?? 0,
    spotifyUrl,
  };
};

/** Whitelist explícita de campos para evitar mass assignment. */
const parsePlaylistInput = (body: unknown) => {
  if (typeof body !== 'object' || body === null) {
    throw AppError.badRequest('El cuerpo de la petición debe ser un objeto');
  }

  const input = body as Record<string, unknown>;
  const heroId = asString(input.heroId);
  const heroName = asString(input.heroName);

  if (!heroId) throw AppError.badRequest('heroId es obligatorio');
  if (!heroName) throw AppError.badRequest('heroName es obligatorio');

  const rawSongs = Array.isArray(input.songs) ? input.songs : [];

  return {
    heroId,
    heroName,
    mood: asString(input.mood) ?? '',
    description: asString(input.description) ?? '',
    songs: rawSongs.map((song, index) => parseSong(song, index)),
  };
};

const requireValidObjectId = (id: string): void => {
  if (!mongoose.isValidObjectId(id)) {
    throw AppError.badRequest('Identificador de playlist inválido');
  }
};

const asRole = (value: unknown): CharacterRole | undefined =>
  value === 'hero' || value === 'villain' ? value : undefined;

/** Slugs curados de un rol; permite filtrar playlists sin guardar el rol. */
const slugsByRole = (role: CharacterRole): string[] =>
  CURATED_CHARACTERS.filter((character) => character.role === role).map(
    (character) => character.slug,
  );

export const createPlaylist = asyncHandler(async (req, res) => {
  const playlist = await Playlist.create(parsePlaylistInput(req.body));
  res.status(201).json(playlist);
});

export const getAllPlaylists = asyncHandler(async (req, res) => {
  const page = parsePage(req.query.page);
  const pageSize = parsePageSize(req.query.pageSize, 12);
  const role = asRole(req.query.role);

  const filter = role ? { heroId: { $in: slugsByRole(role) } } : {};

  const [items, total] = await Promise.all([
    Playlist.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Playlist.countDocuments(filter),
  ]);

  res.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  });
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id);

  const playlist = await Playlist.findById(req.params.id).lean();
  if (!playlist) throw AppError.notFound('Playlist no encontrada');

  res.json(playlist);
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  requireValidObjectId(req.params.id);

  const deleted = await Playlist.findByIdAndDelete(req.params.id);
  if (!deleted) throw AppError.notFound('Playlist no encontrada');

  res.json({ message: 'Playlist eliminada' });
});
