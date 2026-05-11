const { GalleryImage } = require('../models/index')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = exports.upload = multer({ storage });

const listGalleryImages = exports.listGalleryImages = async (req, res) => {
    try {
        const images = await GalleryImage.findAll({
            where: { status: 'active' },
            order: [['order', 'ASC'], ['createdAt', 'DESC']]
        });
        res.json(images);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addGalleryImage = exports.addGalleryImage = async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const url = req.file ? `/uploads/${req.file.filename}` : req.body.url;
        
        if (!url) {
            return res.status(400).json({ error: 'Image URL or file is required' });
        }

        const image = await GalleryImage.create({
            url,
            title,
            description,
            order: order ? parseInt(order, 10) : 0
        });
        res.status(201).json(image);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteGalleryImage = exports.deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await GalleryImage.findByPk(id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // If it's a local file, delete it
        if (image.url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), image.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await image.destroy();
        res.json({ message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
