import { GalleryImage } from '../models/index.js';
import multer from 'multer';

const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
});

const toPublic = (img) => {
    const json = img.toJSON();
    delete json.data;
    if (!json.url) {
        json.url = `/gallery/${img.id}/image`;
    }
    return json;
};

export const listGalleryImages = async (req, res) => {
    try {
        const images = await GalleryImage.findAll({
            where: { status: 'active' },
            order: [['order', 'ASC'], ['createdAt', 'DESC']],
            attributes: { exclude: ['data'] },
        });
        res.json(images.map(toPublic));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getGalleryImageBinary = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await GalleryImage.findByPk(id, {
            attributes: ['id', 'data', 'mimeType'],
        });
        if (!image || !image.data) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.set('Content-Type', image.mimeType || 'application/octet-stream');
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addGalleryImage = async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const payload = {
            title,
            description,
            order: order ? parseInt(order, 10) : 0,
        };

        if (req.file) {
            payload.data = req.file.buffer;
            payload.mimeType = req.file.mimetype;
            payload.url = null;
        } else if (req.body.url) {
            payload.url = req.body.url;
        } else {
            return res.status(400).json({ error: 'Image file or URL is required' });
        }

        const image = await GalleryImage.create(payload);
        res.status(201).json(toPublic(image));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await GalleryImage.findByPk(id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        await image.destroy();
        res.json({ message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
