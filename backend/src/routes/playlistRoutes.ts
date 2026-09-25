import { Router } from 'express';
import {
  createPlaylist,
  deletePlaylist,
  getAllPlaylists,
  getPlaylistById,
} from '../controllers/playlistController';
import { generatePlaylist } from '../controllers/generationController';

const router = Router();

// Ruta específica antes de las que usan parámetros.
router.post('/generate', generatePlaylist);

router.post('/', createPlaylist);
router.get('/', getAllPlaylists);
router.get('/:id', getPlaylistById);
router.delete('/:id', deletePlaylist);

export default router;
