import { Router } from 'express';
import { getCharacter, listCharacters } from '../controllers/characterController';

const router = Router();

router.get('/', listCharacters);
router.get('/:identifier', getCharacter);

export default router;
