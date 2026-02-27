const express       = require('express');
const multer        = require('multer');
const path          = require('path');
const fs            = require('fs');
const { spawn }     = require('child_process');
const auth          = require('../middleware/auth');
const Image         = require('../models/Image');
const dockerService = require('../services/dockerService');

const router = express.Router();

// ── uploads directory ────────────────────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtSize = (bytes) => {
    if (bytes < 1024)               return bytes + ' B';
    if (bytes < 1024 * 1024)        return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const isZip = (filename) => path.extname(filename).toLowerCase() === '.zip';

// ── POST /images/push ─────────────────────────────────────────────────────────
router.post('/push', auth, upload.single('file'), async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !req.file) return res.status(400).json({ message: 'Project name and file are required' });

        const filePath = path.join(uploadDir, req.file.filename);

        // If it's a ZIP try to build a Docker image from it
        if (isZip(req.file.originalname)) {
            // Create a "building" record immediately so the UI can show progress
            const image = await Image.create({
                name,
                description:  description || '',
                source:       'upload',
                filename:     req.file.filename,
                originalName: req.file.originalname,
                size:         fmtSize(req.file.size),
                buildStatus:  'building',
                user:         req.user._id,
            });

            // Kick off Docker build in background (non-blocking)
            dockerService.buildFromUpload(filePath, name, req.user.username, image._id.toString())
                .then(async (result) => {
                    await Image.findByIdAndUpdate(image._id, {
                        dockerImage:  result.imageName,
                        buildStatus:  'success',
                        size:         'Docker image',
                    });
                })
                .catch(async (err) => {
                    await Image.findByIdAndUpdate(image._id, {
                        buildStatus: 'failed',
                        buildError:  err.message,
                    });
                });

            return res.json({ id: image._id, name, buildStatus: 'building', message: 'Building Docker image…' });
        }

        // Non-ZIP: store as a raw file
        const image = await Image.create({
            name,
            description:  description || '',
            source:       'upload',
            filename:     req.file.filename,
            originalName: req.file.originalname,
            size:         fmtSize(req.file.size),
            buildStatus:  'success',
            user:         req.user._id,
        });

        res.json({ id: image._id, name, size: image.size, createdAt: image.createdAt });
    } catch (err) {
        console.error('Push error:', err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

// ── GET /images ───────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const images = await Image.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.json(images.map(img => ({
            id:           img._id,
            name:         img.name,
            description:  img.description,
            size:         img.size,
            source:       img.source,
            dockerImage:  img.dockerImage  || null,
            buildStatus:  img.buildStatus,
            buildError:   img.buildError   || null,
            originalName: img.originalName || null,
            createdAt:    img.createdAt,
        })));
    } catch (err) {
        console.error('Fetch images error:', err);
        res.status(500).json({ message: 'Failed to fetch images' });
    }
});

// ── GET /images/:id/download ──────────────────────────────────────────────────
router.get('/:id/download', auth, async (req, res) => {
    try {
        const image = await Image.findOne({ _id: req.params.id, user: req.user._id });
        if (!image) return res.status(404).json({ message: 'Not found' });

        // Docker image → export via `docker save`
        if (image.dockerImage) {
            const tarName = `${image.name.replace(/[^a-z0-9_-]/gi, '-')}.tar`;
            res.setHeader('Content-Type', 'application/x-tar');
            res.setHeader('Content-Disposition', `attachment; filename="${tarName}"`);

            const proc = spawn('docker', ['save', image.dockerImage]);
            proc.stdout.pipe(res);
            proc.stderr.on('data', d => console.error('[docker save]', d.toString()));
            proc.on('error', err => {
                if (!res.headersSent) res.status(500).json({ message: 'docker save failed: ' + err.message });
            });
            return;
        }

        // Raw file download
        if (!image.filename) return res.status(400).json({ message: 'No file available' });
        const filePath = path.join(uploadDir, image.filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on server' });

        res.download(filePath, image.originalName || image.name);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Download failed' });
    }
});

// ── DELETE /images/:id ────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
    try {
        const image = await Image.findOne({ _id: req.params.id, user: req.user._id });
        if (!image) return res.status(404).json({ message: 'Not found' });

        if (image.filename) {
            const fp = path.join(uploadDir, image.filename);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }

        await Image.findByIdAndDelete(image._id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

module.exports = router;
