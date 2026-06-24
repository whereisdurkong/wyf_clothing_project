import axios from "axios";
import config from "../../config";

import { useState, useRef, useEffect } from "react";

import { Toast } from '../../components/Notification'
import Loading from "../../components/Loading";

const CATEGORIES = [
    { value: "tshirt", label: "T-Shirt" },
    { value: "hoodies_jackets", label: "Hoodies & Jackets" },
    { value: "bottoms", label: "Bottoms" },
    { value: "footwear", label: "Footwear" },
    { value: "accessories", label: "Accessories" },
    { value: "other", label: "Other" }
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size", "N/A"];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

const inputStyle = {
    background: "#fff",
    border: "1px solid #8c9196",
    borderRadius: 6,
    color: "#202223",
    fontSize: 14,
    padding: "8px 12px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
};

const focusStyle = {
    borderColor: "#202223",
    boxShadow: "0 0 0 2px rgba(32,34,35,0.12)",
};

const errorStyle = {
    borderColor: "#d82c0d",
    boxShadow: "0 0 0 2px rgba(216,44,13,0.12)",
};

// ── Validation helpers ──────────────────────────────────────────────

function validateImageFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images are allowed.";
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_FILE_SIZE_MB}MB.`;
    return null;
}

function validateForm(form, variants) {
    const errors = {};

    if (!form.product_name.trim()) {
        errors.product_name = "Title is required.";
    } else if (form.product_name.trim().length < 3) {
        errors.product_name = "Title must be at least 3 characters.";
    } else if (form.product_name.trim().length > 120) {
        errors.product_name = "Title must be 120 characters or fewer.";
    }

    if (!form.product_category) {
        errors.product_category = "Please select a category.";
    }

    // Validate variants - size, quantity, price, and sale price are required
    const variantErrors = variants.map((v) => {
        const ve = {};
        if (!v.size) ve.size = "Size is required.";
        if (v.quantity === "" || v.quantity === null) {
            ve.quantity = "Quantity is required.";
        } else if (isNaN(parseInt(v.quantity)) || parseInt(v.quantity) < 0) {
            ve.quantity = "Must be 0 or more.";
        }
        if (!v.price) {
            ve.price = "Price is required.";
        } else if (isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0) {
            ve.price = "Price must be greater than 0.";
        }
        if (!v.sale_price) {
            ve.sale_price = "Sale price is required.";
        } else if (isNaN(parseFloat(v.sale_price)) || parseFloat(v.sale_price) < 0) {
            ve.sale_price = "Sale price must be 0 or greater.";
        }
        // Validate that sale price is less than regular price
        if (v.price && v.sale_price && parseFloat(v.sale_price) >= parseFloat(v.price)) {
            ve.sale_price = "Sale price must be less than regular price.";
        }
        return ve;
    });

    // Check for duplicate sizes
    const seen = new Set();
    variants.forEach((v, idx) => {
        if (v.size && seen.has(v.size)) {
            variantErrors[idx].size = "Duplicate size combination.";
        }
        if (v.size) seen.add(v.size);
    });

    if (variantErrors.some(ve => Object.keys(ve).length > 0)) {
        errors.variants = variantErrors;
    }

    return errors;
}

// ── UI primitives ───────────────────────────────────────────────────

function Field({ label, required, children, spanFull, error }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, ...(spanFull ? { gridColumn: "1 / -1" } : {}) }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#202223" }}>
                {label}
                {required && <span style={{ color: "#d82c0d", marginLeft: 4 }}>*</span>}
            </label>
            {children}
            {error && (
                <span style={{ fontSize: 12, color: "#d82c0d", marginTop: 2 }}>
                    {error}
                </span>
            )}
        </div>
    );
}

function StyledInput({ style, hasError, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            {...props}
            style={{
                ...inputStyle,
                ...(focused ? focusStyle : {}),
                ...(hasError ? errorStyle : {}),
                ...style,
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        />
    );
}

function StyledSelect({ style, children, hasError, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <select
            {...props}
            style={{
                ...inputStyle,
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236d7175' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: 32,
                ...(focused ? focusStyle : {}),
                ...(hasError ? errorStyle : {}),
                ...style,
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        >
            {children}
        </select>
    );
}

function StyledTextarea({ style, hasError, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <textarea
            {...props}
            style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 100,
                lineHeight: 1.5,
                ...(focused ? focusStyle : {}),
                ...(hasError ? errorStyle : {}),
                ...style,
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        />
    );
}

// ── Image Upload Components ─────────────────────────────────────────

/**
 * Single image uploader with drag-and-drop and preview.
 * Props:
 *   label        – field label text
 *   required     – show red asterisk
 *   file         – current File | null
 *   preview      – object-URL string | null
 *   onChange     – (file, previewUrl) => void
 *   onClear      – () => void
 *   error        – error string | undefined
 */
function SingleImageUpload({ label, required, file, preview, onChange, onClear, error }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files) => {
        const picked = files[0];
        if (!picked) return;
        const validationError = validateImageFile(picked);
        if (validationError) {
            onChange(null, null, validationError);
            return;
        }
        const url = URL.createObjectURL(picked);
        onChange(picked, url, null);
    };

    return (
        <Field label={label} required={required} error={error}>
            {preview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                    <img
                        src={preview}
                        alt={label}
                        style={{
                            width: "100%", maxHeight: 200, objectFit: "contain",
                            border: "1px solid #e1e3e5", borderRadius: 6, background: "#f9fafb",
                        }}
                    />
                    <button
                        type="button"
                        onClick={onClear}
                        style={{
                            position: "absolute", top: 6, right: 6,
                            background: "rgba(0,0,0,0.55)", color: "#fff",
                            border: "none", borderRadius: "50%",
                            width: 24, height: 24, cursor: "pointer",
                            fontSize: 14, lineHeight: "24px", textAlign: "center",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Remove image"
                    >
                        ×
                    </button>
                    <p style={{ fontSize: 11, color: "#6d7175", margin: "4px 0 0", wordBreak: "break-all" }}>
                        {file?.name}
                    </p>
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                    style={{
                        border: `2px dashed ${dragging ? "#202223" : error ? "#d82c0d" : "#c9cccf"}`,
                        borderRadius: 6,
                        padding: "24px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                        background: dragging ? "#f6f6f7" : "#fafafa",
                        transition: "border-color 0.15s, background 0.15s",
                    }}
                >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Drag & drop or <span style={{ color: "#202223", fontWeight: 500, textDecoration: "underline" }}>browse</span>
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8c9196" }}>
                        JPG, PNG, WebP — max {MAX_FILE_SIZE_MB}MB
                    </p>
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                style={{ display: "none" }}
                onChange={e => handleFiles(e.target.files)}
            />
        </Field>
    );
}

/**
 * Multiple images uploader.
 * Props:
 *   files    – Array<{ file: File, preview: string }>
 *   onChange – (updatedFiles) => void
 *   error    – error string | undefined
 */
function MultiImageUpload({ files, onChange, error }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (incoming) => {
        const newEntries = [];
        const fileErrors = [];

        Array.from(incoming).forEach(f => {
            const err = validateImageFile(f);
            if (err) { fileErrors.push(`${f.name}: ${err}`); return; }
            newEntries.push({ file: f, preview: URL.createObjectURL(f) });
        });

        const updated = [...files, ...newEntries];
        onChange(updated, fileErrors.length ? fileErrors.join(" | ") : null);
    };

    const removeAt = (idx) => {
        URL.revokeObjectURL(files[idx].preview);
        onChange(files.filter((_, i) => i !== idx), null);
    };

    return (
        <Field label="Additional images" error={error}>
            {/* Drop zone */}
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                style={{
                    border: `2px dashed ${dragging ? "#202223" : error ? "#d82c0d" : "#c9cccf"}`,
                    borderRadius: 6,
                    padding: "20px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: dragging ? "#f6f6f7" : "#fafafa",
                    transition: "border-color 0.15s, background 0.15s",
                }}
            >
                <div style={{ fontSize: 24, marginBottom: 4 }}>📂</div>
                <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                    Drag & drop or <span style={{ color: "#202223", fontWeight: 500, textDecoration: "underline" }}>browse</span> multiple images
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8c9196" }}>
                    JPG, PNG, WebP — max {MAX_FILE_SIZE_MB}MB each
                </p>
            </div>

            {/* Thumbnails grid */}
            {files.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginTop: 4 }}>
                    {files.map((entry, idx) => (
                        <div key={idx} style={{ position: "relative" }}>
                            <img
                                src={entry.preview}
                                alt={`image-${idx}`}
                                style={{
                                    width: "100%", aspectRatio: "1 / 1", objectFit: "cover",
                                    border: "1px solid #e1e3e5", borderRadius: 6,
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeAt(idx)}
                                style={{
                                    position: "absolute", top: 3, right: 3,
                                    background: "rgba(0,0,0,0.55)", color: "#fff",
                                    border: "none", borderRadius: "50%",
                                    width: 20, height: 20, cursor: "pointer",
                                    fontSize: 13, display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                }}
                                title="Remove"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                style={{ display: "none" }}
                onChange={e => handleFiles(e.target.files)}
            />
        </Field>
    );
}

function VariantRow({ variant, index, onChange, onRemove, canRemove, errors = {} }) {
    // Calculate discount percentage
    const discountPercent = variant.price && variant.sale_price
        ? Math.round((1 - parseFloat(variant.sale_price) / parseFloat(variant.price)) * 100)
        : 0;

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1.2fr 1.2fr auto",
            gap: 12,
            alignItems: "end",
            background: "#f9fafb",
            border: `1px solid ${Object.keys(errors).length ? "#d82c0d" : "#e1e3e5"}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 10,
        }}>
            <Field label="Size" required error={errors.size}>
                <StyledSelect
                    value={variant.size}
                    onChange={e => onChange(index, "size", e.target.value)}
                    hasError={!!errors.size}
                    style={{ minWidth: "100%" }}
                >
                    <option value="">— Size —</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </StyledSelect>
            </Field>
            <Field label="Quantity" required error={errors.quantity}>
                <StyledInput
                    type="number"
                    min="0"
                    placeholder="0"
                    value={variant.quantity}
                    hasError={!!errors.quantity}
                    onChange={e => onChange(index, "quantity", e.target.value)}
                    style={{ minWidth: "100%" }}
                />
            </Field>
            <Field label="Price (₱)" required error={errors.price}>
                <StyledInput
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={variant.price}
                    hasError={!!errors.price}
                    onChange={e => onChange(index, "price", e.target.value)}
                    style={{ minWidth: "100%" }}
                />
            </Field>
            <Field label="Sale Price (₱)" required error={errors.sale_price}>
                <div style={{ position: "relative", width: "100%" }}>
                    <StyledInput
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={variant.sale_price}
                        hasError={!!errors.sale_price}
                        onChange={e => onChange(index, "sale_price", e.target.value)}
                        style={{ minWidth: "100%" }}
                    />
                    {discountPercent > 0 && (
                        <span style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#2e6b2e",
                            background: "#e8f5e9",
                            padding: "2px 10px",
                            borderRadius: 4,
                        }}>
                            -{discountPercent}%
                        </span>
                    )}
                </div>
            </Field>
            <RemoveButton onClick={() => onRemove(index)} disabled={!canRemove} />
        </div>
    );
}

function RemoveButton({ onClick, disabled }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: "none",
                border: `1px solid ${hovered && !disabled ? "#d82c0d" : "#e1e3e5"}`,
                color: hovered && !disabled ? "#d82c0d" : "#8c9196",
                borderRadius: 6,
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: 20,
                alignSelf: "end",
                transition: "all .15s",
                opacity: disabled ? 0.3 : 1,
                fontFamily: "inherit",
                marginBottom: 2,
            }}
        >
            ×
        </button>
    );
}

// ── Main component ──────────────────────────────────────────────────

export default function AddProduct() {
    const [form, setForm] = useState({
        product_id: `PRD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        product_name: "",
        product_description: "",
        product_category: "",
        product_price: "",
        product_discount_price: "",
        quantity: "",
    });

    // ── Image state ──
    const [imageFront, setImageFront] = useState({ file: null, preview: null });
    const [imageBack, setImageBack] = useState({ file: null, preview: null });
    const [extraImages, setExtraImages] = useState([]); // Array<{ file, preview }>
    const [imageErrors, setImageErrors] = useState({ front: null, back: null, extra: null });

    const empInfo = JSON.parse(localStorage.getItem('user')) || {};
    const userInfo = empInfo.user || {};
    const [collections, setCollections] = useState([]);
    const [variants, setVariants] = useState([
        { id: Date.now(), size: "", quantity: "", price: "", sale_price: "" },
    ]);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/product/get-all-collection`);
                const data = res.data || [];
                setCollections(data);
            } catch (err) {
                console.log('Unable to fetch data: ', err)
            }
        }
        fetch()
    }, [])


    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    if (isLoading) return <Loading />;

    const handleForm = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const fieldErrors = validateForm(
            { ...form, [name]: e.target.value },
            variants
        );
        setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    };

    const handleVariant = (index, field, value) => {
        setVariants(vs => vs.map((v, i) => i === index ? { ...v, [field]: value } : v));
        setErrors(prev => {
            const variantErrors = prev.variants ? [...prev.variants] : [];
            if (variantErrors[index]) {
                variantErrors[index] = { ...variantErrors[index], [field]: undefined };
            }
            return { ...prev, variants: variantErrors };
        });
    };

    const addVariant = () => {
        setVariants(vs => [...vs, { id: Date.now(), size: "", quantity: "", price: "", sale_price: "" }]);
    };

    const removeVariant = (index) => {
        if (variants.length > 1) setVariants(vs => vs.filter((_, i) => i !== index));
    };

    const totalQty = variants.reduce((s, v) => s + (parseInt(v.quantity) || 0), 0);

    // ── Image handlers ──

    const handleFrontChange = (file, preview, err) => {
        setImageFront({ file, preview });
        setImageErrors(e => ({ ...e, front: err }));
    };

    const handleBackChange = (file, preview, err) => {
        setImageBack({ file, preview });
        setImageErrors(e => ({ ...e, back: err }));
    };

    const handleExtraChange = (updatedFiles, err) => {
        setExtraImages(updatedFiles);
        setImageErrors(e => ({ ...e, extra: err }));
    };

    // ── Submit ──

    const handleSubmit = async () => {
        const validationErrors = validateForm(form, variants);
        setErrors(validationErrors);
        setIsLoading(true);

        const hasErrors = Object.keys(validationErrors).length > 0;
        if (hasErrors) {
            const firstErrorKey = Object.keys(validationErrors)[0];
            const el = document.querySelector(`[name="${firstErrorKey}"]`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            setIsLoading(false);
            addNotif("Validation failed", "Please fix the highlighted fields before saving.", "error");
            return;
        }

        setSubmitted(true);

        try {
            // Build multipart/form-data so images travel alongside JSON fields
            const formData = new FormData();

            // Scalar fields
            formData.append("product_id", form.product_id);
            formData.append("product_name", form.product_name);
            formData.append("product_description", form.product_description);
            formData.append("product_category", form.product_category);
            formData.append("created_by", userInfo.name || "");
            formData.append("has_variants", "true");
            formData.append("product_collection", form.collection || "");

            // Serialize variants array as JSON string - now with size, quantity, price, and sale_price
            const variantsData = variants.map(({ size, quantity, price, sale_price }) => ({
                product_variant_size: size,
                product_variant_quantity: parseInt(quantity) || 0,
                product_variant_price: parseFloat(price) || 0,
                product_variant_sale_price: parseFloat(sale_price) || 0,
            }));

            formData.append("variants", JSON.stringify(variantsData));

            // Image files (only if selected)
            if (imageFront.file) formData.append("product_image_front", imageFront.file);
            if (imageBack.file) formData.append("product_image_back", imageBack.file);
            extraImages.forEach(entry => formData.append("product_images", entry.file));

            // ─── CONSOLE LOGGING ──────────────────────────────────────────
            console.log("📦 PRODUCT DATA BEING SENT:");
            console.log("─────────────────────────────");

            // Log form data as object
            const formDataObject = {
                product_id: form.product_id,
                product_name: form.product_name,
                product_description: form.product_description,
                product_category: form.product_category,
                created_by: userInfo.name || "",
                has_variants: "true",
                product_collection: form.collection || "",
                variants: variantsData,
            };
            console.log("📝 Form Data:", formDataObject);

            // Log image files
            console.log("🖼️ Images:");
            if (imageFront.file) {
                console.log("  - Front image:", {
                    name: imageFront.file.name,
                    size: imageFront.file.size,
                    type: imageFront.file.type
                });
            } else {
                console.log("  - Front image: None");
            }

            if (imageBack.file) {
                console.log("  - Back image:", {
                    name: imageBack.file.name,
                    size: imageBack.file.size,
                    type: imageBack.file.type
                });
            } else {
                console.log("  - Back image: None");
            }

            if (extraImages.length > 0) {
                console.log("  - Extra images:", extraImages.map(img => ({
                    name: img.file.name,
                    size: img.file.size,
                    type: img.file.type
                })));
            } else {
                console.log("  - Extra images: None");
            }

            // Log FormData entries (for debugging multipart)
            console.log("📋 FormData entries:");
            for (let pair of formData.entries()) {
                if (pair[1] instanceof File) {
                    console.log(`  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
                } else {
                    console.log(`  ${pair[0]}: ${pair[1]}`);
                }
            }
            console.log("─────────────────────────────");

            await axios.post(`${config.baseApi}/product/add-product`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            addNotif("Product saved", "Your product has been added successfully.", "success");
            setErrors({});
            handleReset();

            setTimeout(() => { window.location.reload(); }, 2000);
        } catch (err) {
            setIsLoading(false);
            console.error("❌ Error saving product:", err);
            console.error("Response:", err.response?.data);
            addNotif("Save failed", "Something went wrong. Please try again.", "error");
        }

        setTimeout(() => setSubmitted(false), 2500);
    };

    const handleReset = () => {
        setForm(f => ({
            ...f,
            product_name: "",
            product_description: "",
            product_category: "",
            product_price: "",
            product_discount_price: "",
            collection: "",
            quantity: "",
        }));
        setVariants([{ id: Date.now(), size: "", quantity: "", price: "", sale_price: "" }]);
        setErrors({});
        setTouched({});

        // Revoke object-URLs to avoid memory leaks
        if (imageFront.preview) URL.revokeObjectURL(imageFront.preview);
        if (imageBack.preview) URL.revokeObjectURL(imageBack.preview);
        extraImages.forEach(e => URL.revokeObjectURL(e.preview));

        setImageFront({ file: null, preview: null });
        setImageBack({ file: null, preview: null });
        setExtraImages([]);
        setImageErrors({ front: null, back: null, extra: null });
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f1f2f4", color: "#202223", fontFamily: "'Inter',system-ui,sans-serif", padding: "24px", marginTop: '100px' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                * { box-sizing: border-box; }
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { opacity: 0.4; }
                select option { background: #fff; color: #202223; }
                ::placeholder { color: #8c9196; }
            `}</style>

            {/* Toast container */}
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 9999, width: 340, pointerEvents: "none" }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast {...n} onDismiss={id =>
                            setNotifications(prev => prev.filter(n => n.id !== id))
                        } />
                    </div>
                ))}
            </div>

            <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

                    {/* ── Main column ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Product details card */}
                        <Card title="Product details">
                            <Field label="Title" required error={errors.product_name}>
                                <StyledInput
                                    name="product_name"
                                    value={form.product_name}
                                    onChange={handleForm}
                                    onBlur={handleBlur}
                                    hasError={!!errors.product_name}
                                    placeholder="e.g. Wireless Headphones Pro"
                                />
                            </Field>
                            <Field label="Description">
                                <StyledTextarea
                                    name="product_description"
                                    value={form.product_description}
                                    onChange={handleForm}
                                    placeholder="Describe your product…"
                                    rows={4}
                                />
                            </Field>
                        </Card>

                        {/* ── Media card ── */}
                        <Card title="Media">
                            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6d7175" }}>
                                Front and back images are displayed on the product listing. Additional images appear in the gallery.
                            </p>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <SingleImageUpload
                                    label="Front image"
                                    file={imageFront.file}
                                    preview={imageFront.preview}
                                    onChange={handleFrontChange}
                                    onClear={() => {
                                        URL.revokeObjectURL(imageFront.preview);
                                        setImageFront({ file: null, preview: null });
                                        setImageErrors(e => ({ ...e, front: null }));
                                    }}
                                    error={imageErrors.front}
                                />
                                <SingleImageUpload
                                    label="Back image"
                                    file={imageBack.file}
                                    preview={imageBack.preview}
                                    onChange={handleBackChange}
                                    onClear={() => {
                                        URL.revokeObjectURL(imageBack.preview);
                                        setImageBack({ file: null, preview: null });
                                        setImageErrors(e => ({ ...e, back: null }));
                                    }}
                                    error={imageErrors.back}
                                />
                            </div>

                            <MultiImageUpload
                                files={extraImages}
                                onChange={handleExtraChange}
                                error={imageErrors.extra}
                            />
                        </Card>

                        {/* Variants card */}
                        <Card>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid #e1e3e5" }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#202223" }}>Variants</span>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    background: "#f6f6f7", border: "1px solid #e1e3e5",
                                    borderRadius: 20, padding: "3px 12px",
                                    fontSize: 12, color: "#6d7175", fontWeight: 500,
                                }}>
                                    Total: <strong style={{ color: "#202223", marginLeft: 3 }}>{totalQty}</strong>&nbsp;units
                                </span>
                            </div>

                            <div>
                                {variants.map((v, idx) => (
                                    <VariantRow
                                        key={v.id}
                                        variant={v}
                                        index={idx}
                                        onChange={handleVariant}
                                        onRemove={removeVariant}
                                        canRemove={variants.length > 1}
                                        errors={(errors.variants && errors.variants[idx]) || {}}
                                    />
                                ))}
                                <AddVariantButton onClick={addVariant} />
                            </div>
                        </Card>
                    </div>

                    {/* ── Side column ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        <Card title="Status">
                            <Field label="Visibility">
                                <StyledSelect defaultValue="Active">
                                    <option>Active</option>
                                    <option>Draft</option>
                                    <option>Archived</option>
                                </StyledSelect>
                            </Field>

                        </Card>

                        <Card title="Organization">
                            <Field label="Collection">
                                <StyledSelect
                                    name="collection"
                                    value={form.collection}
                                    onChange={handleForm}
                                >
                                    <option value="">— None —</option>
                                    {collections.map(c => (
                                        <option key={c.collection_title} value={c.collection_title}>
                                            {c.collection_title}
                                        </option>
                                    ))}
                                </StyledSelect>
                            </Field>

                            <Field label="Category" required error={errors.product_category}>
                                <StyledSelect
                                    name="product_category"
                                    value={form.product_category}
                                    onChange={handleForm}
                                    onBlur={handleBlur}
                                    hasError={!!errors.product_category}
                                >
                                    <option value="">— Select —</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </StyledSelect>
                            </Field>
                        </Card>

                        <Card>
                            <button
                                type="button"
                                onClick={handleReset}
                                style={{
                                    background: "#fff", border: "1px solid #c9cccf", color: "#202223",
                                    borderRadius: 6, padding: "9px 20px", fontSize: 13, fontWeight: 500,
                                    cursor: "pointer", fontFamily: "inherit", width: "100%",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={e => e.target.style.background = "#f6f6f7"}
                                onMouseLeave={e => e.target.style.background = "#fff"}
                            >
                                Discard
                            </button>
                            <SaveButton submitted={submitted} onClick={handleSubmit} />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Sub-components ── */

function Card({ title, children }) {
    return (
        <div style={{
            background: "#fff", border: "1px solid #e1e3e5",
            borderRadius: 8, padding: 20,
            display: "flex", flexDirection: "column", gap: 16,
        }}>
            {title && (
                <div style={{ fontSize: 14, fontWeight: 600, color: "#202223", paddingBottom: 12, borderBottom: "1px solid #e1e3e5" }}>
                    {title}
                </div>
            )}
            {children}
        </div>
    );
}

function AddVariantButton({ onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? "#f6f6f7" : "none",
                border: "1px dashed #8c9196",
                color: hovered ? "#202223" : "#6d7175",
                borderRadius: 6,
                padding: "10px 20px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 500,
                width: "100%",
                transition: "all 0.15s",
                marginTop: 6,
            }}
        >
            + Add variant
        </button>
    );
}

function SaveButton({ submitted, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: submitted ? "#2e844a" : hovered ? "#44474a" : "#202223",
                color: "#fff", border: "none", borderRadius: 6,
                padding: "9px 20px", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit", width: "100%",
                transition: "background 0.15s",
            }}
        >
            {submitted ? "✓ Saved!" : "Save product"}
        </button>
    );
}