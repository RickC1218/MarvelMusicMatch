import { Router } from 'express';
import {
  createPlaylist,
  getAllPlaylists,
  getPlaylistById,
  deletePlaylist
} from '../controllers/playlistController';

const router = Router();

router.post('/', createPlaylist);
router.get('/', getAllPlaylists);
router.get('/:id', getPlaylistById);
router.delete('/:id', deletePlaylist);

export default router;