var express = require('express');
const router = express.Router();
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../supabase');

// File filter for images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only .png, .jpg, .jpeg, .webp images are allowed'));
};

// Temp disk storage (files get uploaded to Supabase then deleted)
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../temp')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '_' + Math.round(Math.random() * 1e9) + ext);
    }
});

// Ensure temp dir exists
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const uploadBlogAlbum = multer({ storage: tempStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
const uploadDashboard = multer({ storage: tempStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// ── Helper ───────────────────────────────────────────────────────────────────

async function uploadToStorage(bucket, buffer, mimeType, filename) {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(filename, buffer, { contentType: mimeType, upsert: true });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
}

async function deleteFromStorage(bucket, publicUrl) {
    if (!publicUrl) return;
    const filename = publicUrl.split('/').pop();
    await supabase.storage.from(bucket).remove([filename]);
}

function cleanupTempFiles(files) {
    if (!files) return;
    const list = Array.isArray(files) ? files : Object.values(files).flat();
    list.forEach(f => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
}

// ── BLOG ─────────────────────────────────────────────────────────────────────

router.post('/add-blog', uploadBlogAlbum.array('albumImages', 20), async (req, res, next) => {
    try {
        const { title, contentHTML, createdAt } = req.body;

        // Upload album images to Supabase Storage
        const albumUrls = [];
        for (const file of (req.files || [])) {
            const buffer = fs.readFileSync(file.path);
            const ext = path.extname(file.originalname);
            const filename = `blog_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
            const url = await uploadToStorage('blog-images', buffer, file.mimetype, filename);
            albumUrls.push(url);
            fs.unlinkSync(file.path);
        }

        const { error } = await supabase
            .from('blog_master')
            .insert({
                title,
                content: contentHTML,
                album: albumUrls.length ? JSON.stringify(albumUrls) : null,
                created_by: req.body.created_by || null,
                created_at: createdAt || new Date().toISOString(),
            });

        if (error) throw new Error(error.message);

        res.json({ success: true, message: 'Blog published successfully.' });
    } catch (err) {
        cleanupTempFiles(req.files);
        next(err);
    }
});

router.get('/get-all-blog', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('blog_master').select('*');
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/get-blog-by-id', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('blog_master')
            .select('*')
            .eq('blog_id', req.query.id)
            .single();
        if (error) return res.status(500).json({ error: error.message });
        if (!data) return res.status(404).json({ message: 'Blog not found.' });
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.put('/update-blog', uploadBlogAlbum.array('albumImages', 20), async (req, res, next) => {
    try {
        const { id, title, content, updatedAt, removedImages } = req.body;

        if (!id) return res.status(400).json({ success: false, message: 'Blog ID is required.' });

        const { data: existing, error: fetchError } = await supabase
            .from('blog_master')
            .select('*')
            .eq('blog_id', id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ success: false, message: 'Blog not found.' });

        // Parse current album URLs
        let currentUrls = [];
        try { currentUrls = existing.album ? JSON.parse(existing.album) : []; } catch { currentUrls = []; }

        // Delete removed images from Supabase Storage
        let toRemove = [];
        try { toRemove = removedImages ? JSON.parse(removedImages) : []; } catch { toRemove = []; }

        for (const url of toRemove) {
            await deleteFromStorage('blog-images', url);
        }

        // Keep only non-removed URLs
        const keptUrls = currentUrls.filter(u => !toRemove.includes(u));

        // Upload new images
        const newUrls = [];
        for (const file of (req.files || [])) {
            const buffer = fs.readFileSync(file.path);
            const ext = path.extname(file.originalname);
            const filename = `blog_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
            const url = await uploadToStorage('blog-images', buffer, file.mimetype, filename);
            newUrls.push(url);
            fs.unlinkSync(file.path);
        }

        const updatedAlbum = [...keptUrls, ...newUrls];

        const { error: updateError } = await supabase
            .from('blog_master')
            .update({
                title: title || existing.title,
                content: content !== undefined ? content : existing.content,
                album: JSON.stringify(updatedAlbum),
                updated_at: updatedAt || new Date().toISOString(),
                updated_by: req.body.updated_by || null,
            })
            .eq('blog_id', id);

        if (updateError) throw new Error(updateError.message);

        res.json({ success: true, message: 'Blog updated successfully.', album: updatedAlbum });
    } catch (err) {
        cleanupTempFiles(req.files);
        next(err);
    }
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

router.post('/upload-dashboard-images', uploadDashboard.array('dashboardImages', 20), async (req, res, next) => {
    try {
        const files = req.files || [];
        if (!files.length) return res.status(400).json({ success: false, message: 'No images uploaded.' });

        const imageUrls = [];
        for (const file of files) {
            const buffer = fs.readFileSync(file.path);
            const ext = path.extname(file.originalname);
            const filename = `dashboard_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
            const url = await uploadToStorage('dashboard-images', buffer, file.mimetype, filename);
            imageUrls.push(url);
            fs.unlinkSync(file.path);
        }

        const { error } = await supabase
            .from('dashboard_master')
            .insert({
                images: JSON.stringify(imageUrls),
                created_by: req.body.created_by || null,
                created_at: new Date().toISOString(),
            });

        if (error) throw new Error(error.message);

        res.json({ success: true, message: 'Images uploaded.', imageUrls });
    } catch (err) {
        cleanupTempFiles(req.files);
        next(err);
    }
});

router.get('/get-all-dashboard', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('dashboard_master').select('*');
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.post('/update-dashboard', uploadDashboard.array('dashboardImages', 20), async (req, res, next) => {
    try {
        const { dashboard_id, keptImages } = req.body;
        if (!dashboard_id) return res.status(400).json({ success: false, message: 'dashboard_id is required.' });

        const { data: existing, error: fetchError } = await supabase
            .from('dashboard_master')
            .select('*')
            .eq('dashboard_id', dashboard_id)
            .single();

        if (fetchError || !existing) return res.status(404).json({ success: false, message: 'Dashboard not found.' });

        let currentUrls = [];
        try { currentUrls = existing.images ? JSON.parse(existing.images) : []; } catch { currentUrls = []; }

        let kept = [];
        try { kept = keptImages ? JSON.parse(keptImages) : []; } catch { kept = []; }

        // Delete removed images from Supabase Storage
        const removed = currentUrls.filter(u => !kept.includes(u));
        for (const url of removed) {
            await deleteFromStorage('dashboard-images', url);
        }

        // Upload new images
        const newUrls = [];
        for (const file of (req.files || [])) {
            const buffer = fs.readFileSync(file.path);
            const ext = path.extname(file.originalname);
            const filename = `dashboard_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
            const url = await uploadToStorage('dashboard-images', buffer, file.mimetype, filename);
            newUrls.push(url);
            fs.unlinkSync(file.path);
        }

        const updatedImages = [...kept, ...newUrls];

        if (updatedImages.length === 0) {
            await supabase.from('dashboard_master').delete().eq('dashboard_id', dashboard_id);
            return res.json({ success: true, message: 'Dashboard record deleted.', deleted: true });
        }

        const { error: updateError } = await supabase
            .from('dashboard_master')
            .update({ images: JSON.stringify(updatedImages) })
            .eq('dashboard_id', dashboard_id);

        if (updateError) throw new Error(updateError.message);

        res.json({ success: true, message: 'Dashboard updated.', newUrls });
    } catch (err) {
        cleanupTempFiles(req.files);
        next(err);
    }
});

module.exports = router;