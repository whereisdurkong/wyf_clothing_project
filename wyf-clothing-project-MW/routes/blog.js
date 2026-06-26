var express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var Sequelize = require('sequelize');
const { DataTypes } = Sequelize;

var db = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
    host: process.env.SERVER,
    dialect: "mssql",
    port: parseInt(process.env.APP_SERVER_PORT),
});

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

const BlogMaster = db.define('blog_master', {
    blog_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    content: {
        type: DataTypes.STRING,
        allowNull: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    album: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_by: {
        type: DataTypes.STRING,
        allowNull: true
    },
    updated_by: {
        type: DataTypes.STRING,
        allowNull: true
    },
    updated_at: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // is_active: {
    //     type: DataTypes.STRING(100),
    //     allowNull: true
    // },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'blog_master'
})


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

router.get('/get-blog-by-id', async (req, res, next) => {
    try {
        console.log('+++++++++++++++++++===', req.query.id)
        const getById = await BlogMaster.findAll({
            where: {
                blog_id: req.query.id
            }
        })
        console.log(getById)
        console.log('triggered /blog-by-id')
        res.json(getById[0])
    } catch (err) {

    }
})

router.put('/update-blog', uploadBlogAlbum.array('albumImages', 20), async (req, res, next) => {
    try {
        const { id, title, content, updatedAt, removedImages } = req.body;

        if (!id) return res.status(400).json({ success: false, message: 'Blog ID is required.' });

        // Fetch current record to get existing album paths
        const existing = await knex('blog_master').where({ blog_id: id }).first();
        if (!existing) return res.status(404).json({ success: false, message: 'Blog not found.' });

        let currentPaths = [];
        try {
            currentPaths = existing.album ? JSON.parse(existing.album) : [];
        } catch {
            currentPaths = [];
        }

        // Parse which filenames the user removed on the frontend
        let toRemove = [];
        try {
            toRemove = removedImages ? JSON.parse(removedImages) : [];
        } catch {
            toRemove = [];
        }

        // Delete removed image files from disk
        for (const filename of toRemove) {
            const filePath = path.join(__dirname, '../blogAlbum', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Keep only paths that were NOT removed
        const keptPaths = currentPaths.filter(p => {
            const fname = p.split('/').pop();
            return !toRemove.includes(fname);
        });

        // Append newly uploaded files
        const newPaths = (req.files || []).map(f => `blogAlbum/${f.filename}`);
        const updatedAlbum = [...keptPaths, ...newPaths];

        // Update the DB row
        await knex('blog_master').where({ blog_id: id }).update({
            title: title || existing.title,
            content: content !== undefined ? content : existing.content,
            album: JSON.stringify(updatedAlbum),
            updated_at: updatedAt || new Date().toISOString(),
            updated_by: req.body.updated_by || null
        });

        res.json({ success: true, message: 'Blog updated successfully.', album: updatedAlbum });
    } catch (err) {
        next(err);
    }
});

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


router.post('/update-dashboard', uploadDashboard.array('dashboardImages', 20), async (req, res, next) => {
    try {
        const { dashboard_id, keptImages } = req.body;

        if (!dashboard_id) return res.status(400).json({ success: false, message: 'dashboard_id is required.' });

        // Fetch current record
        const existing = await knex('dashboard_master').where({ dashboard_id }).first();
        if (!existing) return res.status(404).json({ success: false, message: 'Dashboard not found.' });

        let currentPaths = [];
        try {
            currentPaths = existing.images ? JSON.parse(existing.images) : [];
        } catch {
            currentPaths = [];
        }

        let kept = [];
        try {
            kept = keptImages ? JSON.parse(keptImages) : [];
        } catch {
            kept = [];
        }

        // Delete removed images from disk
        const removed = currentPaths.filter((p) => !kept.includes(p));
        for (const imgPath of removed) {
            const filePath = path.join(__dirname, '..', imgPath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Append new uploads
        const newPaths = (req.files || []).map((f) => `dashboardImages/${f.filename}`);
        const updatedImages = [...kept, ...newPaths];

        // Delete row if no images remain
        if (updatedImages.length === 0) {
            await knex('dashboard_master').where({ dashboard_id }).delete();
            return res.json({ success: true, message: 'Dashboard record deleted.', deleted: true });
        }

        // Update DB
        await knex('dashboard_master').where({ dashboard_id }).update({
            images: JSON.stringify(updatedImages),
        });
        res.json({ success: true, message: 'Dashboard updated.', newPaths });
    } catch (err) {
        next(err);
    }
});
module.exports = router;