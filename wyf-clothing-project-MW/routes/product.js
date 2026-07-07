var express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var Sequelize = require('sequelize');
const supabase = require('../supabase');
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


const CollectionMaster = db.define('product_collection_master', {
    collection_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    collection_images: {
        type: DataTypes.STRING,
        allowNull: true
    },
    collection_title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    collection_subtitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
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
    is_active: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'product_collection_master'
})

const VariantMaster = db.define('product_variant_master', {
    product_variant_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_variant_size: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_variant_quantity: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_variant_price: {
        type: DataTypes.STRING,
        allowNull: true
    },
    product_variant_sale_price: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
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

}, {
    freezeTableName: false,
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    tableName: 'product_variant_master'
})

router.get('/test-sb', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('users_master').select('*');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error('Route error:', err);
        res.status(500).json({ error: err.message });
    }
});


// PRODUCTS
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

    let parsedVariants = variants;
    if (typeof variants === 'string') {
        try {
            parsedVariants = JSON.parse(variants);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid variants format' });
        }
    }

    const isVariant = has_variants === true || has_variants === "true" || has_variants === 1 || has_variants === "1";

    if (!product_name || !product_category) {
        return res.status(400).json({ message: 'product_name and product_category are required.' });
    }
    if (isVariant && (!parsedVariants || parsedVariants.length === 0)) {
        return res.status(400).json({ message: 'At least one variant is required when has_variants is true.' });
    }
    if (!isVariant && (quantity === undefined || quantity === null || quantity === "")) {
        return res.status(400).json({ message: 'quantity is required when has_variants is false.' });
    }

    const now = new Date().toISOString();

    // Helper: upload one file buffer to Supabase Storage and return its public URL
    async function uploadToStorage(fileBuffer, mimeType, filename) {
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filename, fileBuffer, { contentType: mimeType, upsert: true });

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('products').getPublicUrl(filename);
        return urlData.publicUrl;
    }

    // Cleanup temp files on error
    function cleanupFiles() {
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
    }

    try {
        // 1. Insert product row to get product_id
        const { data: product, error: insertError } = await supabase
            .from('product_master')
            .insert({
                product_name,
                product_description: product_description || null,
                product_category,
                product_collection: product_collection || null,
                has_variants: isVariant,
                product_quantity: isVariant ? null : quantity,
                created_at: now,
                created_by: created_by || null,
                is_active: '1',
            })
            .select('product_id')
            .single();

        if (insertError) {
            cleanupFiles();
            return res.status(500).json({ message: 'Failed to insert product.', error: insertError.message });
        }

        const productId = product.product_id;
        const safeName = sanitizeFileName(product_name);

        // 2. Upload images to Supabase Storage
        let productImageFront = null;
        let productImageBack = null;
        let productImagesJson = null;

        if (req.files['product_image_front']?.[0]) {
            const file = req.files['product_image_front'][0];
            const ext = path.extname(file.originalname);
            const filename = `product_image_front_${productId}_${safeName}${ext}`;
            const buffer = fs.readFileSync(file.path);
            productImageFront = await uploadToStorage(buffer, file.mimetype, filename);
            fs.unlinkSync(file.path);
        }

        if (req.files['product_image_back']?.[0]) {
            const file = req.files['product_image_back'][0];
            const ext = path.extname(file.originalname);
            const filename = `product_image_back_${productId}_${safeName}${ext}`;
            const buffer = fs.readFileSync(file.path);
            productImageBack = await uploadToStorage(buffer, file.mimetype, filename);
            fs.unlinkSync(file.path);
        }

        if (req.files['product_images']?.length > 0) {
            const additionalImages = [];
            for (let i = 0; i < req.files['product_images'].length; i++) {
                const file = req.files['product_images'][i];
                const ext = path.extname(file.originalname);
                const filename = `product_image_extra_${productId}_${i}_${safeName}${ext}`;
                const buffer = fs.readFileSync(file.path);
                const url = await uploadToStorage(buffer, file.mimetype, filename);
                additionalImages.push(url);
                fs.unlinkSync(file.path);
            }
            productImagesJson = JSON.stringify(additionalImages);
        }

        // 3. Update product row with image URLs
        const { error: updateError } = await supabase
            .from('product_master')
            .update({
                product_image_front: productImageFront,
                product_image_back: productImageBack,
                product_images: productImagesJson,
            })
            .eq('product_id', productId);

        if (updateError) {
            return res.status(500).json({ message: 'Failed to save image URLs.', error: updateError.message });
        }

        // 4. Insert variants
        if (isVariant && parsedVariants.length > 0) {
            const variantRows = parsedVariants.map(v => ({
                product_id: productId,
                product_variant_size: v.product_variant_size || v.size,
                product_variant_quantity: parseInt(v.product_variant_quantity || v.quantity) || 0,
                product_variant_price: parseFloat(v.product_variant_price || v.price) || 0,
                product_variant_sale_price: parseFloat(v.product_variant_sale_price || v.sale_price) || 0,
                created_at: now,
                created_by: created_by || null,
            }));

            const { error: variantError } = await supabase
                .from('product_variant_master')
                .insert(variantRows);

            if (variantError) {
                return res.status(500).json({ message: 'Failed to insert variants.', error: variantError.message });
            }
        }

        return res.status(201).json({
            message: 'Product saved successfully.',
            product_id: productId,
        });

    } catch (err) {
        console.error('Error saving product:', err);
        cleanupFiles();
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});
router.get('/get-all-products', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('product_master')
            .select('*');

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.error('Unable to fetch all products:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/get-all-product-variant', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('product_variant_master')
            .select('*');

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.error('Unable to fetch all product variants:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/get-variant-by-id-variant', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('product_variant_master')
            .select('*')
            .eq('product_id', req.query.id)
            .ilike('product_variant_size', req.query.variantSize)
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.error('Internal Error', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/get-product-by-id', async (req, res, next) => {
    try {
        const { data: product, error: productError } = await supabase
            .from('product_master')
            .select('*')
            .eq('product_id', req.query.id)
            .single();

        if (productError) {
            console.error('Supabase error:', productError);
            return res.status(500).json({ error: productError.message });
        }
        if (!product) return res.status(404).json({ message: 'Product not found.' });

        const { data: variants, error: variantError } = await supabase
            .from('product_variant_master')
            .select('*')
            .eq('product_id', req.query.id);

        if (variantError) {
            console.error('Supabase variant error:', variantError);
            return res.status(500).json({ error: variantError.message });
        }

        // Attach variants to the product object so the frontend shape stays the same
        product.product_variant_master = variants || [];

        res.json(product);
    } catch (err) {
        console.error('Unable to fetch product by id:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/get-variant-by-id', async (req, res, next) => {
    try {
        const { data: variant, error } = await supabase
            .from('product_variant_master')
            .select('*')
            .eq('product_variant_id', req.query.id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }
        if (!variant) return res.status(404).json({ message: 'Variant not found.' });

        res.json(variant);
    } catch (err) {
        console.error('Unable to fetch variant by id:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/update-product', upload.fields([
    { name: 'product_image_front', maxCount: 1 },
    { name: 'product_image_back', maxCount: 1 },
    { name: 'product_images', maxCount: 10 }
]), async (req, res, next) => {
    console.log('REQUEST BODY:', req.body);
    console.log('REQUEST FILES:', req.files);

    try {
        const {
            product_id,
            product_name,
            product_description,
            product_category,
            product_collection,
            is_active,
            has_variants,
            variants,
            existing_extra_images,
            clear_image_front,
            clear_image_back,
        } = req.body;

        if (!product_id) return res.status(400).json({ message: 'product_id is required.' });
        if (!product_name || !product_category) return res.status(400).json({ message: 'product_name and product_category are required.' });

        let parsedVariants = [];
        if (variants) {
            try { parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants; }
            catch (e) { return res.status(400).json({ message: 'Invalid variants format.' }); }
        }

        let keptExtras = [];
        if (existing_extra_images) {
            try { keptExtras = typeof existing_extra_images === 'string' ? JSON.parse(existing_extra_images) : existing_extra_images; }
            catch { keptExtras = []; }
        }

        const now = new Date().toISOString();
        const safeName = sanitizeFileName(product_name);

        // Helper: upload buffer to Supabase Storage, return public URL
        async function uploadToStorage(buffer, mimeType, filename) {
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filename, buffer, { contentType: mimeType, upsert: true });
            if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
            const { data: urlData } = supabase.storage.from('products').getPublicUrl(filename);
            return urlData.publicUrl;
        }

        // Helper: delete a file from Supabase Storage by its public URL
        async function deleteFromStorage(publicUrl) {
            if (!publicUrl) return;
            // Extract just the filename from the full URL
            const filename = publicUrl.split('/').pop();
            await supabase.storage.from('products').remove([filename]);
        }

        // Fetch current product
        const { data: current, error: fetchError } = await supabase
            .from('product_master')
            .select('*')
            .eq('product_id', product_id)
            .single();

        if (fetchError || !current) return res.status(404).json({ message: 'Product not found.' });

        // ── Front image ──────────────────────────────────────────────
        let productImageFront = current.product_image_front;

        if (req.files?.['product_image_front']?.[0]) {
            await deleteFromStorage(current.product_image_front);
            const file = req.files['product_image_front'][0];
            const ext = path.extname(file.originalname);
            const filename = `product_image_front_${product_id}_${safeName}${ext}`;
            const buffer = fs.readFileSync(file.path);
            productImageFront = await uploadToStorage(buffer, file.mimetype, filename);
            fs.unlinkSync(file.path);
        } else if (clear_image_front === 'true') {
            await deleteFromStorage(current.product_image_front);
            productImageFront = null;
        }

        // ── Back image ───────────────────────────────────────────────
        let productImageBack = current.product_image_back;

        if (req.files?.['product_image_back']?.[0]) {
            await deleteFromStorage(current.product_image_back);
            const file = req.files['product_image_back'][0];
            const ext = path.extname(file.originalname);
            const filename = `product_image_back_${product_id}_${safeName}${ext}`;
            const buffer = fs.readFileSync(file.path);
            productImageBack = await uploadToStorage(buffer, file.mimetype, filename);
            fs.unlinkSync(file.path);
        } else if (clear_image_back === 'true') {
            await deleteFromStorage(current.product_image_back);
            productImageBack = null;
        }

        // ── Extra images ─────────────────────────────────────────────
        let oldExtras = [];
        try { oldExtras = JSON.parse(current.product_images || '[]'); } catch { oldExtras = []; }

        // Delete extras that were removed by the user
        const removedExtras = oldExtras.filter(src => !keptExtras.includes(src));
        for (const src of removedExtras) {
            await deleteFromStorage(src);
        }

        // Upload new extras
        const newExtraPaths = [];
        if (req.files?.['product_images']?.length > 0) {
            for (let i = 0; i < req.files['product_images'].length; i++) {
                const file = req.files['product_images'][i];
                const ext = path.extname(file.originalname);
                const filename = `product_image_extra_${product_id}_${Date.now()}_${i}_${safeName}${ext}`;
                const buffer = fs.readFileSync(file.path);
                const url = await uploadToStorage(buffer, file.mimetype, filename);
                newExtraPaths.push(url);
                fs.unlinkSync(file.path);
            }
        }

        const allExtras = [...keptExtras, ...newExtraPaths];
        const productImagesJson = allExtras.length > 0 ? JSON.stringify(allExtras) : null;

        // ── Update product_master ────────────────────────────────────
        const { error: updateError } = await supabase
            .from('product_master')
            .update({
                product_name,
                product_description: product_description || null,
                product_category,
                product_collection: product_collection || null,
                is_active: is_active === '1' || is_active === 1 ? 1 : 0,
                has_variants: has_variants === 'true' || has_variants === true,
                product_image_front: productImageFront,
                product_image_back: productImageBack,
                product_images: productImagesJson,
                updated_at: now,
            })
            .eq('product_id', product_id);

        if (updateError) return res.status(500).json({ message: 'Failed to update product.', error: updateError.message });

        // ── Upsert variants ──────────────────────────────────────────
        if (parsedVariants.length > 0) {
            const incomingIds = parsedVariants
                .filter(v => v.product_variant_id)
                .map(v => v.product_variant_id);

            // Delete variants not in the incoming list
            if (incomingIds.length > 0) {
                await supabase
                    .from('product_variant_master')
                    .delete()
                    .eq('product_id', product_id)
                    .not('product_variant_id', 'in', `(${incomingIds.join(',')})`);
            } else {
                await supabase
                    .from('product_variant_master')
                    .delete()
                    .eq('product_id', product_id);
            }

            for (const v of parsedVariants) {
                const variantData = {
                    product_id,
                    product_variant_size: v.product_variant_size,
                    product_variant_quantity: parseInt(v.product_variant_quantity) || 0,
                    product_variant_price: parseFloat(v.product_variant_price) || 0,
                    product_variant_sale_price: v.product_variant_sale_price
                        ? parseFloat(v.product_variant_sale_price) || 0 : 0,
                };

                if (v.product_variant_id) {
                    await supabase
                        .from('product_variant_master')
                        .update(variantData)
                        .eq('product_variant_id', v.product_variant_id);
                } else {
                    await supabase
                        .from('product_variant_master')
                        .insert({ ...variantData, created_at: now });
                }
            }
        }

        return res.status(200).json({ message: 'Product updated successfully.', product_id });

    } catch (err) {
        console.error('INTERNAL ERROR:', err);
        if (req.files) {
            Object.values(req.files).flat().forEach(file => {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

router.post('/add-collection', uploadCollection.single('collection_image'), async (req, res, next) => {
    try {
        const { collection_title, collection_subtitle } = req.body;

        if (!collection_title) {
            return res.status(400).json({ message: 'collection_title is required.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'An image is required.' });
        }

        // 1. Insert to get collection_id
        const { data: collection, error: insertError } = await supabase
            .from('product_collection_master')
            .insert({
                collection_title,
                collection_subtitle: collection_subtitle || null,
                created_at: new Date(),
                is_active: '1'
            })
            .select('collection_id')
            .single();

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({ message: 'Failed to create collection.', error: insertError.message });
        }

        const collectionId = collection.collection_id;

        // 2. Upload image to Supabase Storage
        const ext = path.extname(req.file.originalname);
        const filename = `collection_image_${collectionId}${ext}`;
        const fileBuffer = fs.readFileSync(req.file.path);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('collection-images')
            .upload(filename, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        console.log('Upload result:', uploadData);
        console.log('Upload error:', uploadError);

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({ message: 'Failed to upload image.', error: uploadError.message });
        }

        // 3. Get public URL
        const { data: urlData } = supabase.storage
            .from('collection-images')
            .getPublicUrl(filename);

        const imagePath = urlData.publicUrl;

        // 4. Delete local temp file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        // 5. Update record with image URL
        const { error: updateError } = await supabase
            .from('product_collection_master')
            .update({ collection_images: imagePath })
            .eq('collection_id', collectionId);

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return res.status(500).json({ message: 'Failed to save image path.', error: updateError.message });
        }

        return res.status(201).json({
            message: 'Collection added successfully.',
            collection_id: collectionId,
            collection_images: imagePath
        });

    } catch (err) {
        console.error('Unable to add new collection:', err);
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

router.get('/get-all-collection', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('product_collection_master')
            .select('*');

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.log('Unable to fetch all collections: ', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/get-collection-by-id', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('product_collection_master')
            .select('*')
            .eq('collection_id', req.query.id)
            .single();

        if (error) return res.status(500).json({ error: error.message });
        if (!data) return res.status(404).json({ message: 'Collection not found.' });

        res.json(data);
    } catch (err) {
        console.log('Unable to fetch collection by id: ', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/update-collection', uploadCollection.single('collection_images'), async (req, res, next) => {
    try {
        const { collection_id, collection_title, collection_subtitle, is_active } = req.body;

        if (!collection_id) return res.status(400).json({ message: 'collection_id is required.' });
        if (!collection_title) return res.status(400).json({ message: 'collection_title is required.' });

        // 1. Fetch current record
        const { data: current, error: fetchError } = await supabase
            .from('product_collection_master')
            .select('*')
            .eq('collection_id', collection_id)
            .single();

        if (fetchError || !current) {
            return res.status(404).json({ message: 'Collection not found.' });
        }

        let imagePath = current.collection_images; // default: keep existing

        if (req.file) {
            // 2. Delete old image from Supabase Storage (if it exists)
            if (current.collection_images) {
                // Extract just the filename from the full Supabase URL
                const oldFilename = current.collection_images.split('/').pop();
                await supabase.storage
                    .from('collection-images')
                    .remove([oldFilename]);
            }

            // 3. Upload new image to Supabase Storage
            const ext = path.extname(req.file.originalname);
            const newFilename = `collection_image_${collection_id}${ext}`;

            const fileBuffer = fs.readFileSync(req.file.path);

            const { error: uploadError } = await supabase.storage
                .from('collection-images')
                .upload(newFilename, fileBuffer, {
                    contentType: req.file.mimetype,
                    upsert: true,
                });

            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            if (uploadError) {
                return res.status(500).json({ message: 'Image upload failed.', error: uploadError.message });
            }

            // 4. Get the public URL
            const { data: urlData } = supabase.storage
                .from('collection-images')
                .getPublicUrl(newFilename);

            imagePath = urlData.publicUrl;
        }

        // 5. Update the DB record
        const { error: updateError } = await supabase
            .from('product_collection_master')
            .update({
                collection_title,
                collection_subtitle: collection_subtitle || null,
                collection_images: imagePath,
                is_active: is_active == 1 ? '1' : '0',
                updated_at: new Date(),
            })
            .eq('collection_id', collection_id);

        if (updateError) {
            return res.status(500).json({ message: 'Failed to update collection.', error: updateError.message });
        }

        return res.status(200).json({
            message: 'Collection updated successfully.',
            collection_id,
            collection_images: imagePath,
        });

    } catch (err) {
        console.error('Unable to update collection:', err);
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

//SETUP
router.post('/add-setup', uploadSetup.fields([
    { name: 'shirt', maxCount: 1 },
    { name: 'hoodie', maxCount: 1 },
    { name: 'bottoms', maxCount: 1 },
    { name: 'footwear', maxCount: 1 },
]), async (req, res, next) => {
    try {
        const categories = ['shirt', 'hoodie', 'bottoms', 'footwear'];
        const savedUrls = {};

        // Helper: upload buffer to Supabase Storage, return public URL
        async function uploadToStorage(buffer, mimeType, filename) {
            const { error: uploadError } = await supabase.storage
                .from('setup-images')          // ← your bucket name
                .upload(filename, buffer, { contentType: mimeType, upsert: true });
            if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
            const { data: urlData } = supabase.storage
                .from('setup-images')
                .getPublicUrl(filename);
            return urlData.publicUrl;
        }

        // Upload each category file
        for (const category of categories) {
            if (req.files?.[category]?.[0]) {
                const file = req.files[category][0];
                const ext = path.extname(file.originalname);
                const filename = `setup_${category}${ext}`;   // e.g. setup_shirt.jpg
                const buffer = fs.readFileSync(file.path);

                savedUrls[category] = await uploadToStorage(buffer, file.mimetype, filename);

                // Clean up local temp file
                fs.unlinkSync(file.path);
            }
        }

        if (Object.keys(savedUrls).length === 0) {
            return res.status(400).json({ message: 'At least one image is required.' });
        }

        const { data: rows } = await supabase
            .from('setup_image_master')
            .select('setup_image_id')
            .limit(1);

        const existing = rows?.[0] ?? null;

        if (existing) {
            // Update only the uploaded categories
            const { error: updateError } = await supabase
                .from('setup_image_master')
                .update({ ...savedUrls, updated_at: new Date() })
                .eq('setup_image_id', existing.setup_image_id);

            if (updateError) throw new Error(updateError.message);
        } else {
            // Insert first-ever record
            const { error: insertError } = await supabase
                .from('setup_image_master')
                .insert({ ...savedUrls, created_at: new Date() });

            if (insertError) throw new Error(insertError.message);
        }

        return res.status(200).json({
            message: 'Setup images saved successfully.',
            paths: savedUrls
        });

    } catch (err) {
        console.error('Unable to save setup images:', err);
        // Clean up any remaining temp files
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
        const { data, error } = await supabase
            .from('setup_image_master')
            .select('*');

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        console.error('Unable to fetch all setup:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});







router.post('/create-order', async (req, res, next) => {
    try {
        const {
            items,
            user_id,
            sub_total,
            shipping_fee,
            total,
            country,
            email,
            first_name,
            last_name,
            barangay,
            street_address,
            city,
            postal_code,
            region,
            phone_number,
            billing,
            payment_method,
        } = req.body;

        // ── Validate ────────────────────────────────────────────────────
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain at least one item.' });
        }

        const requiredFields = {
            country, email, first_name, last_name, barangay,
            street_address, city, postal_code, region, phone_number,
        };
        const missing = Object.entries(requiredFields)
            .filter(([, v]) => v === undefined || v === null || String(v).trim() === '')
            .map(([k]) => k);

        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
        }
        if (sub_total === undefined || total === undefined) {
            return res.status(400).json({ message: 'sub_total and total are required.' });
        }

        const now = new Date().toISOString();

        // ── Insert order (items stored as JSON snapshot, no separate line-item table) ──
        const { data: order, error: orderError } = await supabase
            .from('order_master')
            .insert({
                items: JSON.stringify(items),
                user_id: user_id || null,
                sub_total,
                shipping_fee: shipping_fee || 0,
                total,
                payment_method: payment_method || 'cod',
                order_status: 'pending',
                country,
                email,
                first_name,
                last_name,
                barangay,
                street_address,
                city,
                postal_code,
                region,
                phone_number,
                billing: billing || null,
                created_by: user_id || null,
                created_at: now,
            })
            .select('order_id')
            .single();

        if (orderError) {
            console.error('Supabase insert error [order_master]:', orderError);
            return res.status(500).json({ message: 'Failed to create order.', error: orderError.message });
        }

        return res.status(201).json({
            message: 'Order placed successfully.',
            order_id: order.order_id,
        });

    } catch (err) {
        console.error('Unable to create order:', err);
        return res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});
module.exports = router;