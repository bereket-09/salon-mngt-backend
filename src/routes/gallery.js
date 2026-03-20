import express from 'express';
import { listGalleryImages, addGalleryImage, deleteGalleryImage, upload } from '../controllers/galleryController.js';
// No authentication needed for listing, only for management

const router = express.Router();

router.get('/', listGalleryImages);
router.post('/', upload.single('image'), addGalleryImage);
router.delete('/:id', deleteGalleryImage);

export default router;
