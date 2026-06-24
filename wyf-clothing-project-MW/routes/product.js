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

// Ensure products directory exists (not uploads)
const productsDir = path.join(__dirname, '../products');
if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, productsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp_randomstring_originalname
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '_' + uniqueSuffix + ext);
    }
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

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});


// Ensure collectionImages directory exists
const collectionImagesDir = path.join(__dirname, '../collectionImages');
if (!fs.existsSync(collectionImagesDir)) {
    fs.mkdirSync(collectionImagesDir, { recursive: true });
}

// Multer storage for collection images
const collectionStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, collectionImagesDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '_' + uniqueSuffix + ext);
    }
});

const uploadCollection = multer({
    storage: collectionStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter  // reuse the same fileFilter you already have above
});


// Add this after the collectionImages setup (around line 60)

// Ensure setupImages directory exists
const setupImagesDir = path.join(__dirname, '../setupImages');
if (!fs.existsSync(setupImagesDir)) {
    fs.mkdirSync(setupImagesDir, { recursive: true });
}

// Multer storage for setup images
const setupStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, setupImagesDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '_' + uniqueSuffix + ext);
    }
});

const uploadSetup = multer({
    storage: setupStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});
// Helper function to sanitize filename for storage path
function sanitizeFileName(productName) {
    return productName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 50);
}

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

var db = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD, {
    host: process.env.SERVER,
    dialect: "mssql",
    port: parseInt(process.env.APP_SERVER_PORT),
});


const ProductMaster = db.define('product_master', {
    product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    product_category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_image_front: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_image_back: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_images: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    ratings: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_by: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    updated_by: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    has_variants: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    product_collection: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'product_master'
});


// Update your POST route
router.post('/add-product', upload.fields([
    { name: 'product_image_front', maxCount: 1 },
    { name: 'product_image_back', maxCount: 1 },
    { name: 'product_images', maxCount: 10 }
]), async (req, res) => {
    console.log('REQUEST BODY:', req.body);
    console.log('REQUEST FILES:', req.files);

    const {
        created_by,
        product_name,
        product_description,
        product_category,
        product_collection,
        has_variants,
        quantity,
        variants,
    } = req.body;

    // Parse variants if it's a string
    let parsedVariants = variants;
    if (typeof variants === 'string') {
        try {
            parsedVariants = JSON.parse(variants);
        } catch (e) {
            console.error('Error parsing variants:', e);
            return res.status(400).json({ message: 'Invalid variants format' });
        }
    }

    // Normalize has_variants to a real boolean
    const isVariant = has_variants === true || has_variants === "true" || has_variants === 1 || has_variants === "1";

    // Basic validation
    if (!product_name || !product_category) {
        return res.status(400).json({ message: 'product_name and product_category are required.' });
    }

    if (isVariant && (!parsedVariants || parsedVariants.length === 0)) {
        return res.status(400).json({ message: 'At least one variant is required when has_variants is true.' });
    }

    if (!isVariant && (quantity === undefined || quantity === null || quantity === "")) {
        return res.status(400).json({ message: 'quantity is required when has_variants is false.' });
    }

    const now = new Date();

    try {
        // First, insert product to get the product_id (without price fields)
        const [product] = await knex('product_master').insert({
            product_name,
            product_description,
            product_category,
            product_collection: product_collection || null,
            has_variants: isVariant,
            product_quantity: isVariant ? null : quantity,
            created_at: now,
            created_by,
            is_active: '1'
        }).returning('product_id');

        const productId = product.product_id;

        // Process and save image paths
        let productImageFront = null;
        let productImageBack = null;
        let productImagesJson = null;

        // Handle front image
        if (req.files['product_image_front'] && req.files['product_image_front'][0]) {
            const file = req.files['product_image_front'][0];
            const ext = path.extname(file.filename);
            const newFilename = `product_image_front_${productId}_${sanitizeFileName(product_name)}${ext}`;
            const newPath = path.join(productsDir, newFilename);

            fs.renameSync(file.path, newPath);
            productImageFront = `/products/${newFilename}`;
        }

        // Handle back image
        if (req.files['product_image_back'] && req.files['product_image_back'][0]) {
            const file = req.files['product_image_back'][0];
            const ext = path.extname(file.filename);
            const newFilename = `product_image_back_${productId}_${sanitizeFileName(product_name)}${ext}`;
            const newPath = path.join(productsDir, newFilename);

            fs.renameSync(file.path, newPath);
            productImageBack = `/products/${newFilename}`;
        }

        // Handle multiple additional images
        if (req.files['product_images'] && req.files['product_images'].length > 0) {
            const additionalImages = [];
            for (let i = 0; i < req.files['product_images'].length; i++) {
                const file = req.files['product_images'][i];
                const ext = path.extname(file.filename);
                const newFilename = `product_image_extra_${productId}_${i}_${sanitizeFileName(product_name)}${ext}`;
                const newPath = path.join(productsDir, newFilename);

                fs.renameSync(file.path, newPath);
                additionalImages.push(`/products/${newFilename}`);
            }
            productImagesJson = JSON.stringify(additionalImages);
        }

        // Update product with image paths
        await knex('product_master')
            .where({ product_id: productId })
            .update({
                product_image_front: productImageFront,
                product_image_back: productImageBack,
                product_images: productImagesJson
            });

        // If has variants, insert each row into product_variant_master
        if (isVariant && parsedVariants.length > 0) {
            const variantRows = parsedVariants.map(v => ({
                product_id: productId,
                product_variant_size: v.product_variant_size || v.size,
                product_variant_quantity: parseInt(v.product_variant_quantity || v.quantity) || 0,
                product_variant_price: parseFloat(v.product_variant_price || v.price) || 0,
                product_variant_sale_price: parseFloat(v.product_variant_sale_price || v.sale_price) || 0,
                created_at: now,
                created_by: created_by,
            }));

            await knex('product_variant_master').insert(variantRows);
        }

        return res.status(201).json({
            message: 'Product saved successfully.',
            product_id: productId
        });

    } catch (err) {
        console.error('Error saving product:', err);
        // Clean up uploaded files if there's an error
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

router.get('/get-all-products', async (req, res, next) => {
    try {
        const getAllProducts = await knex('product_master').select('*');
        res.json(getAllProducts)
    } catch (err) {
        console.log('Unable to fetch all products: ', err)
    }
});

router.get('/get-all-product-variant', async (req, res, next) => {
    try {
        const getAllProductsVar = await knex('product_variant_master').select('*');
        res.json(getAllProductsVar)
    } catch (err) {
        console.log('Unable to fetch all product: ', err)
    }
})



router.get('/get-product-by-id', async (req, res, next) => {
    try {
        console.log('+++++++++++++++++++===', req.query.id)
        const getById = await ProductMaster.findAll({
            where: {
                product_id: req.query.id
            }
        })
        console.log(getById)
        console.log('triggered /ticket-by-id')
        res.json(getById[0])
    } catch (err) {

    }
})

router.post('/add-collection', uploadCollection.single('collection_image'), async (req, res, next) => {
    try {
        const { collection_title, collection_subtitle } = req.body;

        if (!collection_title) {
            return res.status(400).json({ message: 'collection_title is required.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'An image is required.' });
        }

        const now = new Date();

        const [collection] = await knex('product_collection_master').insert({
            collection_title,
            collection_subtitle: collection_subtitle || null,
            created_at: now,
            is_active: '1'
        }).returning('collection_id');

        const collectionId = collection.collection_id;

        const ext = path.extname(req.file.filename);
        const newFilename = `collection_image_${collectionId}${ext}`;
        const newPath = path.join(collectionImagesDir, newFilename);

        fs.renameSync(req.file.path, newPath);
        const imagePath = `/collectionImages/${newFilename}`;

        await knex('product_collection_master')
            .where({ collection_id: collectionId })
            .update({ collection_images: imagePath });  // single string, not JSON array

        return res.status(201).json({
            message: 'Collection added successfully.',
            collection_id: collectionId,
            collection_images: imagePath
        });

    } catch (err) {
        console.error('Unable to add new collection', err);
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

router.get('/get-all-collection', async (req, res, next) => {
    try {
        const getAllCollection = await knex('product_collection_master').select('*');
        res.json(getAllCollection)
    } catch (err) {
        console.log('Unable to fetch all collections: ', err)
    }
})




router.post('/add-setup', uploadSetup.fields([
    { name: 'shirt', maxCount: 1 },
    { name: 'hoodie', maxCount: 1 },
    { name: 'bottoms', maxCount: 1 },
    { name: 'footwear', maxCount: 1 },
]), async (req, res, next) => {
    try {
        const categories = ['shirt', 'hoodie', 'bottoms', 'footwear'];
        const savedPaths = {};

        for (const category of categories) {
            if (req.files?.[category]?.[0]) {
                const file = req.files[category][0];
                const ext = path.extname(file.filename);
                const newFilename = `setup_${category}${ext}`;
                const newPath = path.join(setupImagesDir, newFilename);

                if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
                fs.renameSync(file.path, newPath);

                savedPaths[category] = `/setupImages/${newFilename}`;
            }
        }

        if (Object.keys(savedPaths).length === 0) {
            return res.status(400).json({ message: 'At least one image is required.' });
        }

        // Check if a record already exists
        const existing = await knex('setup_image_master').select('setup_image_id').first();

        if (existing) {
            // Update only the categories that were uploaded
            await knex('setup_image_master')
                .where({ setup_image_id: existing.setup_image_id })
                .update({
                    ...savedPaths,
                    updated_at: new Date()
                });
        } else {
            // Insert new record
            await knex('setup_image_master').insert({
                ...savedPaths,
                created_at: new Date()
            });
        }

        return res.status(200).json({
            message: 'Setup images saved successfully.',
            paths: savedPaths
        });

    } catch (err) {
        console.error('Unable to save setup images:', err);
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

router.get('/get-all-setup', async (req, res, next) => {
    try {
        const getAllSetup = await knex('setup_image_master').select('*');
        res.json(getAllSetup)
    } catch (err) {
        console.log('Unable to fetch all setup: ', err)
    }
})

router.get('/get-all-collection', async (req, res, next) => {
    try {
        const getAll = await knex('product_collection_master').select('*');
        res.json(getAll)
    } catch (err) {
        console.log('Unable to fetch all collection: ', err)
    }
})

module.exports = router;