const express = require('express')
const { listGalleryImages, addGalleryImage, deleteGalleryImage, upload } = require('../controllers/galleryController')
// No authentication needed for listing, only for management

const router = express.Router();

router.get('/', listGalleryImages);
router.post('/', upload.single('image'), addGalleryImage);
router.delete('/:id', deleteGalleryImage);

module.exports = router;
