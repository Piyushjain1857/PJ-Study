import { Router } from 'express';
import collectionController from './collection.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';

const router = Router();

// All study collection endpoints require valid authentication
router.use(requireAuth);

router.get('/', collectionController.listCollections);
router.post('/', collectionController.createCollection);
router.get('/:id', collectionController.getCollection);
router.patch('/:id', collectionController.updateCollection);
router.delete('/:id', collectionController.deleteCollection);

router.post('/:id/notes', collectionController.addNote);
router.delete('/:id/notes/:noteId', collectionController.removeNote);

export default router;
