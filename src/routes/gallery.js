import express from 'express';
import {
    listGalleryImages,
    addGalleryImage,
    deleteGalleryImage,
    getGalleryImageBinary,
    upload,
} from '../controllers/galleryController.js';

const router = express.Router();

router.get('/', listGalleryImages);
router.get('/:id/image', getGalleryImageBinary);
router.post('/', upload.single('image'), addGalleryImage);
router.delete('/:id', deleteGalleryImage);

export default router;
