var express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');



// File filter for images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg, .jpeg, .webp images are allowed'));
    }
};


var knex = require("knex")({
    client: 'mssql',
    connection: {
        user: process.env.USER,
        password: process.env.PASSWORD,
        server: process.env.SERVER,
        database: process.env.DATABASE,
        port: parseInt(process.env.APP_SERVER_PORT),
        options: {
            enableArithAbort: true,
            trustServerCertificate: true
        }
    }
});

// Ensure blogAlbum directory exists
const blogAlbumDir = path.join(__dirname, '../blogAlbum');
if (!fs.existsSync(blogAlbumDir)) {
    fs.mkdirSync(blogAlbumDir, { recursive: true });
}

// Multer storage for blog album images
const blogAlbumStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, blogAlbumDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'blogAlbum_' + uniqueSuffix + ext);
    }
});

const uploadBlogAlbum = multer({
    storage: blogAlbumStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter  // reuses your existing fileFilter
});


// Ensure dashboardImages directory exists
const dashboardImagesDir = path.join(__dirname, '../dashboardImages');
if (!fs.existsSync(dashboardImagesDir)) {
    fs.mkdirSync(dashboardImagesDir, { recursive: true });
}

// Multer storage for dashboard images
const dashboardStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dashboardImagesDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'dashboard_' + uniqueSuffix + ext);
    },
});

const uploadDashboard = multer({
    storage: dashboardStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter, // reuses your existing fileFilter
});


// POST /add-blog
router.post('/add-blog', uploadBlogAlbum.array('albumImages', 20), async (req, res, next) => {
    try {
        const { title, contentHTML, contentText, wordCount, createdAt } = req.body;
        const albumFiles = req.files || [];

        // Build file paths for DB storage
        const albumPaths = albumFiles.map(f => `blogAlbum/${f.filename}`);

        // Insert into DB — adjust columns to match your schema
        await knex('blog_master').insert({
            title,
            content: contentHTML,
            album: JSON.stringify(albumPaths),
            created_by: req.body.created_by || null,
            created_at: createdAt || new Date().toISOString()
        });


        res.json({ success: true, message: 'Blog published successfully.', albumPaths });
    } catch (err) {
        next(err);
    }
});

router.get('/get-all-blog', async (req, res, next) => {
    try {
        const getAll = await knex('blog_master').select('*');
        res.json(getAll)

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})

// POST /upload-dashboard-images
router.post('/upload-dashboard-images', uploadDashboard.array('dashboardImages', 20), async (req, res, next) => {
    try {
        const files = req.files || [];
        if (!files.length) {
            return res.status(400).json({ success: false, message: 'No images uploaded.' });
        }

        const imagePaths = files.map((f) => `dashboardImages/${f.filename}`);

        await knex('dashboard_master').insert({
            images: JSON.stringify(imagePaths),
            created_by: req.body.created_by || null,
            created_at: new Date().toISOString()
        });


        res.json({ success: true, message: 'Images uploaded.', imagePaths });
    } catch (err) {
        next(err);
    }
}
);


router.get('/get-all-dashboard', async (req, res, next) => {
    try {
        const getAll = await knex('dashboard_master').select('*');
        res.json(getAll)

    } catch (err) {
        console.log('INTERNAL ERROR: ', err)
    }
})
module.exports = router;