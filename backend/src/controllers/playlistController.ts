import { Request, Response } from 'express';
import Playlist from '../models/Playlist';

/**
 * Controlador para manejar las operaciones de las playlists.
 * Incluye crear, obtener todas, obtener por ID y eliminar una playlist.
 */
export const createPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const newPlaylist = new Playlist(req.body);
    const saved = await newPlaylist.save();
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPlaylists = async (req: Request, res: Response): Promise<void> => {
  try {
    const playlists = await Playlist.find();
    res.status(200).json(playlists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlaylistById = async (req: Request, res: Response): Promise<void> => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      res.status(404).json({ message: 'Playlist no encontrada' });
      return;
    }
    res.status(200).json(playlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Playlist.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'No encontrada' });
      return;
    }
    res.status(200).json({ message: 'Playlist eliminada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};