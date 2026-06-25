// import { useSearchParams } from "react-router-dom";
// import axios from "axios";
// import config from "../../config";
// import { useEffect } from "react";
// export default function AdminProductView() {

//     const [searchParams] = useSearchParams();
//     const product_id = searchParams.get("id");

//     useEffect(() => {
//         const fetch = async () => {
//             try {
//                 const [productRes, variantsRes] = await Promise.all([
//                     axios.get(`${config.baseApi}/product/get-product-by-id`, { params: { id: product_id } }),
//                     axios.get(`${config.baseApi}/product/get-all-product-variant`),
//                 ]);

//                 const productVar = variantsRes.data.filter(
//                     v => String(v.product_id) === String(product_id)
//                 );

//                 const ProductData = productRes.data
//                 const ProductVariant = productVar

//                 console.log('Product Data: ', ProductData);
//                 console.log('Product Variant: ', ProductVariant)
//             } catch (err) {
//                 console.log('Unable to fetch product data: ', err)
//             }
//         }
//         fetch();
//     }, [])

// }


import { useSearchParams } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import { useEffect, useState, useRef } from "react";
import { Toast } from '../../components/Notification';
import Loading from "../../components/Loading";

// ── Constants ────────────────────────────────────────────────────────

const BASE_URL = config.baseApi.replace("/api", "");

const CATEGORIES = [
    { value: "tshirt", label: "T-Shirt" },
    { value: "hoodies_jackets", label: "Hoodies & Jackets" },
    { value: "bottoms", label: "Bottoms" },
    { value: "footwear", label: "Footwear" },
    { value: "accessories", label: "Accessories" },
    { value: "other", label: "Other" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size", "N/A"];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

// ── Helpers ──────────────────────────────────────────────────────────

function imgUrl(src) {
    if (!src) return null;
    if (/^https?:\/\//.test(src)) return src;
    return `${BASE_URL}${src}`;
}

function formatPrice(val) {
    const n = parseFloat(val);
    if (!val || isNaN(n)) return null;
    return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function discountPct(price, salePrice) {
    const p = parseFloat(price);
    const s = parseFloat(salePrice);
    if (!p || !s || s >= p) return 0;
    return Math.round((1 - s / p) * 100);
}

function validateImageFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images are allowed.";
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_FILE_SIZE_MB}MB.`;
    return null;
}

function validateEditForm(form, variants) {
    const errors = {};
    if (!form.product_name?.trim()) errors.product_name = "Title is required.";
    else if (form.product_name.trim().length < 3) errors.product_name = "Title must be at least 3 characters.";
    else if (form.product_name.trim().length > 120) errors.product_name = "Title must be 120 characters or fewer.";
    if (!form.product_category) errors.product_category = "Please select a category.";

    const variantErrors = variants.map(v => {
        const ve = {};
        if (!v.size) ve.size = "Size is required.";
        if (v.quantity === "" || v.quantity === null) ve.quantity = "Quantity is required.";
        else if (isNaN(parseInt(v.quantity)) || parseInt(v.quantity) < 0) ve.quantity = "Must be 0 or more.";
        if (!v.price) ve.price = "Price is required.";
        else if (isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0) ve.price = "Price must be greater than 0.";
        if (v.price && v.sale_price && parseFloat(v.sale_price) >= parseFloat(v.price))
            ve.sale_price = "Sale price must be less than regular price.";
        return ve;
    });
    const seen = new Set();
    variants.forEach((v, idx) => {
        if (v.size && seen.has(v.size)) variantErrors[idx].size = "Duplicate size.";
        if (v.size) seen.add(v.size);
    });
    if (variantErrors.some(ve => Object.keys(ve).length > 0)) errors.variants = variantErrors;
    return errors;
}

// ── Shared input styles ──────────────────────────────────────────────

const inputStyle = {
    background: "#fff", border: "1px solid #8c9196", borderRadius: 6,
    color: "#202223", fontSize: 14, padding: "8px 12px", outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
};
const focusStyle = { borderColor: "#202223", boxShadow: "0 0 0 2px rgba(32,34,35,0.12)" };
const errorStyle = { borderColor: "#d82c0d", boxShadow: "0 0 0 2px rgba(216,44,13,0.12)" };

// ── UI primitives ────────────────────────────────────────────────────

function Card({ title, children, style = {} }) {
    return (
        <div style={{
            background: "#fff", border: "1px solid #e1e3e5",
            borderRadius: 8, padding: 20,
            display: "flex", flexDirection: "column", gap: 16, ...style,
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

function Badge({ children, color = "#e1e3e5", textColor = "#202223" }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center",
            background: color, color: textColor,
            borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 500,
        }}>
            {children}
        </span>
    );
}

function DetailRow({ label, value }) {
    if (value === null || value === undefined || value === "") return null;
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f2f4" }}>
            <span style={{ fontSize: 13, color: "#6d7175" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#202223", textAlign: "right", maxWidth: "60%" }}>{value}</span>
        </div>
    );
}

function SkeletonBlock({ height = 20, width = "100%", radius = 6, style = {} }) {
    return (
        <div style={{
            height, width, borderRadius: radius,
            background: "linear-gradient(90deg, #f1f2f4 25%, #e8e9eb 50%, #f1f2f4 75%)",
            backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style,
        }} />
    );
}

function Field({ label, required, children, error, spanFull }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, ...(spanFull ? { gridColumn: "1 / -1" } : {}) }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#202223" }}>
                {label}
                {required && <span style={{ color: "#d82c0d", marginLeft: 4 }}>*</span>}
            </label>
            {children}
            {error && <span style={{ fontSize: 12, color: "#d82c0d", marginTop: 2 }}>{error}</span>}
        </div>
    );
}

function StyledInput({ hasError, style: s, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <input {...props}
            style={{ ...inputStyle, ...(focused ? focusStyle : {}), ...(hasError ? errorStyle : {}), ...s }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
    );
}

function StyledSelect({ hasError, style: s, children, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <select {...props}
            style={{
                ...inputStyle, appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236d7175' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
                ...(focused ? focusStyle : {}), ...(hasError ? errorStyle : {}), ...s,
            }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        >
            {children}
        </select>
    );
}

function StyledTextarea({ hasError, style: s, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <textarea {...props}
            style={{ ...inputStyle, resize: "vertical", minHeight: 100, lineHeight: 1.5, ...(focused ? focusStyle : {}), ...(hasError ? errorStyle : {}), ...s }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
    );
}

// ── Image upload components ──────────────────────────────────────────

function SingleImageUpload({ label, required, file, preview, existingSrc, onChange, onClear, error }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files) => {
        const picked = files[0];
        if (!picked) return;
        const err = validateImageFile(picked);
        if (err) { onChange(null, null, err); return; }
        onChange(picked, URL.createObjectURL(picked), null);
    };

    const displayPreview = preview || imgUrl(existingSrc);

    return (
        <Field label={label} required={required} error={error}>
            {displayPreview ? (
                <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                    <img src={displayPreview} alt={label}
                        style={{ width: "100%", maxHeight: 200, objectFit: "contain", border: "1px solid #e1e3e5", borderRadius: 6, background: "#f9fafb" }}
                    />
                    <button type="button" onClick={onClear}
                        style={{
                            position: "absolute", top: 6, right: 6,
                            background: "rgba(0,0,0,0.55)", color: "#fff",
                            border: "none", borderRadius: "50%", width: 24, height: 24,
                            cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >×</button>
                    {file && <p style={{ fontSize: 11, color: "#6d7175", margin: "4px 0 0", wordBreak: "break-all" }}>{file.name}</p>}
                </div>
            ) : (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                    style={{
                        border: `2px dashed ${dragging ? "#202223" : error ? "#d82c0d" : "#c9cccf"}`,
                        borderRadius: 6, padding: "24px 16px", textAlign: "center", cursor: "pointer",
                        background: dragging ? "#f6f6f7" : "#fafafa", transition: "border-color 0.15s",
                    }}
                >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Drag & drop or <span style={{ color: "#202223", fontWeight: 500, textDecoration: "underline" }}>browse</span>
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8c9196" }}>JPG, PNG, WebP — max {MAX_FILE_SIZE_MB}MB</p>
                </div>
            )}
            <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        </Field>
    );
}

function MultiImageUpload({ files, existingSrcs, onChange, onRemoveExisting, error }) {
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
        onChange([...files, ...newEntries], fileErrors.length ? fileErrors.join(" | ") : null);
    };

    const removeNew = (idx) => {
        URL.revokeObjectURL(files[idx].preview);
        onChange(files.filter((_, i) => i !== idx), null);
    };

    return (
        <Field label="Additional images" error={error}>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                style={{
                    border: `2px dashed ${dragging ? "#202223" : error ? "#d82c0d" : "#c9cccf"}`,
                    borderRadius: 6, padding: "20px 16px", textAlign: "center", cursor: "pointer",
                    background: dragging ? "#f6f6f7" : "#fafafa", transition: "border-color 0.15s",
                }}
            >
                <div style={{ fontSize: 24, marginBottom: 4 }}>📂</div>
                <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                    Drag & drop or <span style={{ color: "#202223", fontWeight: 500, textDecoration: "underline" }}>browse</span> multiple images
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8c9196" }}>JPG, PNG, WebP — max {MAX_FILE_SIZE_MB}MB each</p>
            </div>

            {(existingSrcs.length > 0 || files.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginTop: 4 }}>
                    {existingSrcs.map((src, idx) => (
                        <div key={`ex-${idx}`} style={{ position: "relative" }}>
                            <img src={imgUrl(src)} alt={`extra-${idx}`}
                                style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", border: "1px solid #e1e3e5", borderRadius: 6 }}
                            />
                            <button type="button" onClick={() => onRemoveExisting(idx)}
                                style={{
                                    position: "absolute", top: 3, right: 3,
                                    background: "rgba(0,0,0,0.55)", color: "#fff",
                                    border: "none", borderRadius: "50%", width: 20, height: 20,
                                    cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >×</button>
                        </div>
                    ))}
                    {files.map((entry, idx) => (
                        <div key={`new-${idx}`} style={{ position: "relative" }}>
                            <img src={entry.preview} alt={`new-${idx}`}
                                style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", border: "2px solid #202223", borderRadius: 6 }}
                            />
                            <button type="button" onClick={() => removeNew(idx)}
                                style={{
                                    position: "absolute", top: 3, right: 3,
                                    background: "rgba(0,0,0,0.55)", color: "#fff",
                                    border: "none", borderRadius: "50%", width: 20, height: 20,
                                    cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >×</button>
                        </div>
                    ))}
                </div>
            )}
            <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        </Field>
    );
}

// ── Variant row (edit mode) ──────────────────────────────────────────

function VariantRow({ variant, index, onChange, onRemove, canRemove, errors = {} }) {
    const pct = variant.price && variant.sale_price
        ? Math.round((1 - parseFloat(variant.sale_price) / parseFloat(variant.price)) * 100) : 0;

    return (
        <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr 1.2fr auto",
            gap: 12, alignItems: "end",
            background: "#f9fafb",
            border: `1px solid ${Object.keys(errors).length ? "#d82c0d" : "#e1e3e5"}`,
            borderRadius: 8, padding: 16, marginBottom: 10,
        }}>
            <Field label="Size" required error={errors.size}>
                <StyledSelect value={variant.size} onChange={e => onChange(index, "size", e.target.value)} hasError={!!errors.size}>
                    <option value="">— Size —</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </StyledSelect>
            </Field>
            <Field label="Quantity" required error={errors.quantity}>
                <StyledInput type="number" min="0" placeholder="0"
                    value={variant.quantity} hasError={!!errors.quantity}
                    onChange={e => onChange(index, "quantity", e.target.value)} />
            </Field>
            <Field label="Price (₱)" required error={errors.price}>
                <StyledInput type="number" min="0" step="0.01" placeholder="0.00"
                    value={variant.price} hasError={!!errors.price}
                    onChange={e => onChange(index, "price", e.target.value)} />
            </Field>
            <Field label="Sale Price (₱)" error={errors.sale_price}>
                <div style={{ position: "relative" }}>
                    <StyledInput type="number" min="0" step="0.01" placeholder="0.00"
                        value={variant.sale_price} hasError={!!errors.sale_price}
                        onChange={e => onChange(index, "sale_price", e.target.value)} />
                    {pct > 0 && (
                        <span style={{
                            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                            fontSize: 11, fontWeight: 600, color: "#2e6b2e",
                            background: "#e8f5e9", padding: "2px 10px", borderRadius: 4,
                        }}>−{pct}%</span>
                    )}
                </div>
            </Field>
            <button type="button" onClick={() => onRemove(index)} disabled={!canRemove}
                style={{
                    background: "none", border: "1px solid #e1e3e5", color: "#8c9196",
                    borderRadius: 6, width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: canRemove ? "pointer" : "not-allowed", fontSize: 20,
                    alignSelf: "end", marginBottom: 2, opacity: canRemove ? 1 : 0.3,
                    fontFamily: "inherit",
                }}
            >×</button>
        </div>
    );
}

// ── View-mode sub-components ─────────────────────────────────────────

function ImageGallery({ product }) {
    const images = [];
    if (product.product_image_front) images.push({ src: product.product_image_front, label: "Front" });
    if (product.product_image_back) images.push({ src: product.product_image_back, label: "Back" });
    let extras = [];
    try { extras = JSON.parse(product.product_images || "[]"); } catch { extras = []; }
    extras.forEach((src, i) => images.push({ src, label: `Image ${i + 1}` }));

    const [active, setActive] = useState(0);

    if (images.length === 0) return (
        <div style={{
            height: 280, background: "#f6f6f7", border: "1px solid #e1e3e5", borderRadius: 8,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#8c9196", fontSize: 13, gap: 8,
        }}>
            <span style={{ fontSize: 36 }}>🖼️</span>No images uploaded
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #e1e3e5", background: "#f9fafb" }}>
                <img src={imgUrl(images[active].src)} alt={images[active].label}
                    style={{ width: "100%", height: 320, objectFit: "contain", display: "block" }}
                    onError={e => { e.target.style.display = "none"; }} />
                <span style={{
                    position: "absolute", bottom: 10, left: 10,
                    background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 4,
                }}>{images[active].label}</span>
            </div>
            {images.length > 1 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {images.map((img, idx) => (
                        <button key={idx} type="button" onClick={() => setActive(idx)}
                            style={{
                                width: 64, height: 64, padding: 0,
                                border: `2px solid ${active === idx ? "#202223" : "#e1e3e5"}`,
                                borderRadius: 6, overflow: "hidden", cursor: "pointer", background: "#f9fafb", flexShrink: 0,
                            }}
                        >
                            <img src={imgUrl(img.src)} alt={img.label}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                onError={e => { e.target.style.display = "none"; }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function VariantsTable({ variants }) {
    if (!variants || variants.length === 0)
        return <p style={{ fontSize: 13, color: "#8c9196", margin: 0 }}>No variants found.</p>;

    const totalQty = variants.reduce((s, v) => s + (parseInt(v.product_variant_quantity) || 0), 0);
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                    <tr style={{ background: "#f6f6f7" }}>
                        {["Size", "Qty", "Price", "Sale Price", "Discount", "Status"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6d7175", borderBottom: "1px solid #e1e3e5", whiteSpace: "nowrap" }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {variants.map((v, idx) => {
                        const pct = discountPct(v.product_variant_price, v.product_variant_sale_price);
                        const qty = parseInt(v.product_variant_quantity) || 0;
                        return (
                            <tr key={v.product_variant_id || idx} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f1f2f4" }}>
                                <td style={{ padding: "12px 14px", fontWeight: 500 }}>{v.product_variant_size || "—"}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    <span style={{ fontWeight: 600, color: qty === 0 ? "#d82c0d" : qty <= 5 ? "#b98900" : "#202223" }}>{qty}</span>
                                </td>
                                <td style={{ padding: "12px 14px" }}>{formatPrice(v.product_variant_price) || "—"}</td>
                                <td style={{ padding: "12px 14px" }}>{formatPrice(v.product_variant_sale_price) || <span style={{ color: "#8c9196" }}>—</span>}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    {pct > 0 ? <Badge color="#e8f5e9" textColor="#2e6b2e">−{pct}%</Badge> : <span style={{ color: "#8c9196" }}>—</span>}
                                </td>
                                <td style={{ padding: "12px 14px" }}>
                                    <Badge color={qty > 0 ? "#e3f1df" : "#fce8e6"} textColor={qty > 0 ? "#2e6b2e" : "#d82c0d"}>
                                        {qty > 0 ? "In stock" : "Out of stock"}
                                    </Badge>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr style={{ background: "#f6f6f7" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>Total</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{totalQty}</td>
                        <td colSpan={4} />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card><SkeletonBlock height={280} /><div style={{ display: "flex", gap: 8 }}>{[1, 2, 3].map(i => <SkeletonBlock key={i} height={64} width={64} />)}</div></Card>
                <Card title="Product details"><SkeletonBlock height={16} width="60%" /><SkeletonBlock height={14} width="40%" /><SkeletonBlock height={60} /></Card>
                <Card title="Variants"><SkeletonBlock height={140} /></Card>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card title="Organization"><SkeletonBlock height={14} /><SkeletonBlock height={14} width="70%" /></Card>
            </div>
        </div>
    );
}

// ── Toast imported from ../../components/Notification ───────────────

// ── Main component ───────────────────────────────────────────────────

export default function AdminProductView() {
    const [searchParams] = useSearchParams();
    const product_id = searchParams.get("id");

    // ── Data ──
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Edit mode ──
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    // ── Edit form state ──
    const [form, setForm] = useState({});
    const [editVariants, setEditVariants] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [notifications, setNotifications] = useState([]);

    // Edit image state
    const [imageFront, setImageFront] = useState({ file: null, preview: null, cleared: false });
    const [imageBack, setImageBack] = useState({ file: null, preview: null, cleared: false });
    const [existingExtras, setExistingExtras] = useState([]);   // existing srcs kept
    const [newExtras, setNewExtras] = useState([]);   // new File entries
    const [imageErrors, setImageErrors] = useState({ front: null, back: null, extra: null });

    // ── Fetch data ──
    useEffect(() => {
        if (!product_id) { setError("No product ID provided."); setLoading(false); return; }
        const fetchData = async () => {
            try {
                const [productRes, variantsRes, collectionsRes] = await Promise.all([
                    axios.get(`${config.baseApi}/product/get-product-by-id`, { params: { id: product_id } }),
                    axios.get(`${config.baseApi}/product/get-all-product-variant`),
                    axios.get(`${config.baseApi}/product/get-all-collection`),
                ]);
                const pd = productRes.data;
                const pv = variantsRes.data.filter(v => String(v.product_id) === String(product_id));
                setProduct(pd);
                setVariants(pv);
                setCollections(collectionsRes.data || []);
            } catch (err) {
                console.error(err);
                setError("Failed to load product. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [product_id]);

    // ── Toast helpers ──
    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(p => [...p, { id, title, message, type }]);
        setTimeout(() => setNotifications(p => p.filter(n => n.id !== id)), 4000);
    };

    // ── Enter edit mode: seed form from current product data ──
    const enterEdit = () => {
        setForm({
            product_name: product.product_name || "",
            product_description: product.product_description || "",
            product_category: product.product_category || "",
            product_collection: product.product_collection || "",
            status: product.is_active ?? 1,
        });
        setEditVariants(variants.map(v => ({
            id: v.product_variant_id,
            size: v.product_variant_size || "",
            quantity: String(v.product_variant_quantity ?? ""),
            price: String(v.product_variant_price ?? ""),
            sale_price: String(v.product_variant_sale_price ?? ""),
            _isExisting: true,
        })));
        setImageFront({ file: null, preview: null, cleared: false });
        setImageBack({ file: null, preview: null, cleared: false });
        let extras = [];
        try { extras = JSON.parse(product.product_images || "[]"); } catch { }
        setExistingExtras(extras);
        setNewExtras([]);
        setImageErrors({ front: null, back: null, extra: null });
        setFormErrors({});
        setEditMode(true);
    };

    const cancelEdit = () => {
        setEditMode(false);
        setFormErrors({});
    };

    // ── Edit form handlers ──
    const handleForm = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setFormErrors(p => ({ ...p, [name]: undefined }));
    };

    const handleVariant = (index, field, value) => {
        setEditVariants(vs => vs.map((v, i) => i === index ? { ...v, [field]: value } : v));
        setFormErrors(p => {
            const ve = p.variants ? [...p.variants] : [];
            if (ve[index]) ve[index] = { ...ve[index], [field]: undefined };
            return { ...p, variants: ve };
        });
    };

    const addVariant = () =>
        setEditVariants(vs => [...vs, { id: null, size: "", quantity: "", price: "", sale_price: "", _isExisting: false }]);

    const removeVariant = idx => {
        if (editVariants.length > 1) setEditVariants(vs => vs.filter((_, i) => i !== idx));
    };

    const totalEditQty = editVariants.reduce((s, v) => s + (parseInt(v.quantity) || 0), 0);

    // ── Save (console-only — swap in API call when ready) ──
    const handleSave = async () => {
        const errs = validateEditForm(form, editVariants);
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            addNotif("Validation failed", "Please fix the highlighted fields.", "error");
            return;
        }

        const variantsData = editVariants.map(v => ({
            product_variant_id: v._isExisting ? v.id : null,
            product_variant_size: v.size,
            product_variant_quantity: parseInt(v.quantity) || 0,
            product_variant_price: parseFloat(v.price) || 0,
            product_variant_sale_price: parseFloat(v.sale_price) || 0,
        }));

        console.log("PRODUCT UPDATE PAYLOAD:");
        console.log("─────────────────────────────");
        console.log("Fields:", {
            product_id,
            product_name: form.product_name,
            product_description: form.product_description,
            product_category: form.product_category,
            product_collection: form.product_collection || "",
            status: form.status || "Active",
            has_variants: true,
        });
        console.log("Variants:", variantsData);
        console.log("Images:", {
            front_new: imageFront.file ? { name: imageFront.file.name, size: imageFront.file.size, type: imageFront.file.type } : null,
            front_cleared: imageFront.cleared && !imageFront.file,
            back_new: imageBack.file ? { name: imageBack.file.name, size: imageBack.file.size, type: imageBack.file.type } : null,
            back_cleared: imageBack.cleared && !imageBack.file,
            existing_extras: existingExtras,
            new_extras: newExtras.map(e => ({ name: e.file.name, size: e.file.size, type: e.file.type })),
        });
        console.log("─────────────────────────────");

        addNotif("Logged to console", "Open DevTools to inspect the payload.", "success");

        // ── TODO: uncomment when backend is ready ──────────────────────
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("product_id", product_id);
            fd.append("product_name", form.product_name);
            fd.append("product_description", form.product_description);
            fd.append("product_category", form.product_category);
            fd.append("product_collection", form.product_collection || "");
            fd.append("is_active", form.status);
            fd.append("has_variants", "true");
            fd.append("variants", JSON.stringify(variantsData));
            if (imageFront.file) fd.append("product_image_front", imageFront.file);
            if (imageFront.cleared && !imageFront.file) fd.append("clear_image_front", "true");
            if (imageBack.file) fd.append("product_image_back", imageBack.file);
            if (imageBack.cleared && !imageBack.file) fd.append("clear_image_back", "true");
            fd.append("existing_extra_images", JSON.stringify(existingExtras));
            newExtras.forEach(e => fd.append("product_images", e.file));
            await axios.post(`${config.baseApi}/product/update-product`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const [productRes, variantsRes] = await Promise.all([
                axios.get(`${config.baseApi}/product/get-product-by-id`, { params: { id: product_id } }),
                axios.get(`${config.baseApi}/product/get-all-product-variant`),
            ]);
            setProduct(productRes.data);
            setVariants(variantsRes.data.filter(v => String(v.product_id) === String(product_id)));
            addNotif("Changes saved", "Product updated successfully.", "success");
            setEditMode(false);
        } catch (err) {
            console.error(err);
            addNotif("Save failed", err.response?.data?.message || "Something went wrong.", "error");
        } finally {
            setSaving(false);
        }
    };

    // ── Derived summary values (view mode) ──
    const priceRange = () => {
        const prices = variants.map(v => parseFloat(v.product_variant_price)).filter(p => p > 0);
        if (!prices.length) return null;
        const min = Math.min(...prices), max = Math.max(...prices);
        return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
    };
    const salePriceRange = () => {
        const prices = variants.map(v => parseFloat(v.product_variant_sale_price)).filter(p => p > 0);
        if (!prices.length) return null;
        const min = Math.min(...prices), max = Math.max(...prices);
        return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
    };
    const totalStock = variants.reduce((s, v) => s + (parseInt(v.product_variant_quantity) || 0), 0);
    const outOfStockCount = variants.filter(v => (parseInt(v.product_variant_quantity) || 0) === 0).length;

    const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

    // ── Render ──
    if (saving) return <Loading />;

    return (
        <div style={{ minHeight: "100vh", background: "#f1f2f4", color: "#202223", fontFamily: "'Inter',system-ui,sans-serif", padding: "24px 32px", marginTop: 100 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                * { box-sizing: border-box; }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { opacity: 0.4; }
                select option { background:#fff; color:#202223; }
                ::placeholder { color:#8c9196; }
            `}</style>

            {/* Toast */}
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 9999, width: 340, pointerEvents: "none" }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast {...n} onDismiss={id => setNotifications(p => p.filter(n => n.id !== id))} />
                    </div>
                ))}
            </div>

            <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ── Header ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#202223" }}>
                            {loading ? "Loading…" : (product?.product_name || "Product")}
                        </h1>
                        {!loading && product && (
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8c9196" }}>ID: {product.product_id}</p>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => window.history.back()}
                            style={{ background: "#fff", border: "1px solid #c9cccf", color: "#202223", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                            ← Back
                        </button>
                        {!loading && product && !editMode && (
                            <button type="button" onClick={enterEdit}
                                style={{ background: "#202223", border: "none", color: "#fff", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                                Edit product
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div style={{ background: "#fce8e6", border: "1px solid #f5c5c0", borderRadius: 8, padding: 16, color: "#d82c0d", fontSize: 14 }}>
                        {error}
                    </div>
                )}

                {loading && <Loading />}

                {/* ══════════════ VIEW MODE ══════════════ */}
                {!loading && !error && product && !editMode && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <Card><ImageGallery product={product} /></Card>
                            <Card title="Product details">
                                <div>
                                    <DetailRow label="Product ID" value={product.product_id} />
                                    <DetailRow label="Title" value={product.product_name} />
                                    <DetailRow label="Category" value={CATEGORY_LABELS[product.product_category] || product.product_category} />
                                    <DetailRow label="Collection" value={product.product_collection || null} />
                                    <DetailRow label="Created by" value={product.created_by} />
                                    {product.created_at && (
                                        <DetailRow label="Date added"
                                            value={new Date(product.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                                        />
                                    )}
                                </div>
                                {product.product_description && (
                                    <div>
                                        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, color: "#6d7175" }}>Description</p>
                                        <p style={{ margin: 0, fontSize: 13, color: "#202223", lineHeight: 1.6, background: "#f6f6f7", borderRadius: 6, padding: "10px 14px", whiteSpace: "pre-wrap" }}>
                                            {product.product_description}
                                        </p>
                                    </div>
                                )}
                            </Card>
                            <Card title="Variants"><VariantsTable variants={variants} /></Card>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <Card title="Status">
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 13, color: "#6d7175" }}>Visibility</span>
                                    <Badge
                                        color={product.is_active === 1 || product.is_active === undefined ? "#e3f1df" : "#f1f2f4"}
                                        textColor={product.is_active === 1 || product.is_active === undefined ? "#2e6b2e" : "#6d7175"}
                                    >
                                        {product.is_active === 1 || product.is_active === undefined ? "Active" : "Archived"}
                                    </Badge>
                                </div>
                            </Card>
                            <Card title="Inventory">
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 13, color: "#6d7175" }}>Total stock</span>
                                        <span style={{ fontSize: 18, fontWeight: 700, color: totalStock === 0 ? "#d82c0d" : "#202223" }}>{totalStock}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 13, color: "#6d7175" }}>Variants</span>
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{variants.length}</span>
                                    </div>
                                    {outOfStockCount > 0 && (
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 13, color: "#6d7175" }}>Out of stock</span>
                                            <Badge color="#fce8e6" textColor="#d82c0d">{outOfStockCount} size{outOfStockCount > 1 ? "s" : ""}</Badge>
                                        </div>
                                    )}
                                </div>
                            </Card>
                            {priceRange() && (
                                <Card title="Pricing">
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 13, color: "#6d7175" }}>Price</span>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{priceRange()}</span>
                                        </div>
                                        {salePriceRange() && (
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: 13, color: "#6d7175" }}>Sale price</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#2e6b2e" }}>{salePriceRange()}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════ EDIT MODE ══════════════ */}
                {!loading && !error && product && editMode && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

                        {/* ── Main edit column ── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Product details */}
                            <Card title="Product details">
                                <Field label="Title" required error={formErrors.product_name}>
                                    <StyledInput name="product_name" value={form.product_name} onChange={handleForm} hasError={!!formErrors.product_name} placeholder="e.g. Wireless Headphones Pro" />
                                </Field>
                                <Field label="Description">
                                    <StyledTextarea name="product_description" value={form.product_description} onChange={handleForm} placeholder="Describe your product…" rows={4} />
                                </Field>
                            </Card>

                            {/* Media */}
                            <Card title="Media">
                                <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6d7175" }}>
                                    Front and back images appear on the product listing. Additional images appear in the gallery.
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <SingleImageUpload
                                        label="Front image"
                                        file={imageFront.file}
                                        preview={imageFront.preview}
                                        existingSrc={!imageFront.cleared ? product.product_image_front : null}
                                        onChange={(file, preview, err) => { setImageFront({ file, preview, cleared: false }); setImageErrors(e => ({ ...e, front: err })); }}
                                        onClear={() => { if (imageFront.preview) URL.revokeObjectURL(imageFront.preview); setImageFront({ file: null, preview: null, cleared: true }); }}
                                        error={imageErrors.front}
                                    />
                                    <SingleImageUpload
                                        label="Back image"
                                        file={imageBack.file}
                                        preview={imageBack.preview}
                                        existingSrc={!imageBack.cleared ? product.product_image_back : null}
                                        onChange={(file, preview, err) => { setImageBack({ file, preview, cleared: false }); setImageErrors(e => ({ ...e, back: err })); }}
                                        onClear={() => { if (imageBack.preview) URL.revokeObjectURL(imageBack.preview); setImageBack({ file: null, preview: null, cleared: true }); }}
                                        error={imageErrors.back}
                                    />
                                </div>
                                <MultiImageUpload
                                    files={newExtras}
                                    existingSrcs={existingExtras}
                                    onChange={(updated, err) => { setNewExtras(updated); setImageErrors(e => ({ ...e, extra: err })); }}
                                    onRemoveExisting={idx => setExistingExtras(ex => ex.filter((_, i) => i !== idx))}
                                    error={imageErrors.extra}
                                />
                            </Card>

                            {/* Variants */}
                            <Card>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid #e1e3e5" }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: "#202223" }}>Variants</span>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f6f6f7", border: "1px solid #e1e3e5", borderRadius: 20, padding: "3px 12px", fontSize: 12, color: "#6d7175", fontWeight: 500 }}>
                                        Total: <strong style={{ color: "#202223", marginLeft: 3 }}>{totalEditQty}</strong>&nbsp;units
                                    </span>
                                </div>
                                <div>
                                    {editVariants.map((v, idx) => (
                                        <VariantRow key={v.id || `new-${idx}`} variant={v} index={idx}
                                            onChange={handleVariant} onRemove={removeVariant}
                                            canRemove={editVariants.length > 1}
                                            errors={(formErrors.variants && formErrors.variants[idx]) || {}}
                                        />
                                    ))}
                                    <button type="button" onClick={addVariant}
                                        style={{ background: "none", border: "1px dashed #8c9196", color: "#6d7175", borderRadius: 6, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, width: "100%", marginTop: 6 }}>
                                        + Add variant
                                    </button>
                                </div>
                            </Card>
                        </div>

                        {/* ── Side edit column ── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            <Card title="Status">
                                <Field label="Visibility">
                                    <StyledSelect name="status" value={form.status} onChange={handleForm}>
                                        <option value={1}>Active</option>
                                        <option value={0}>Archived</option>
                                    </StyledSelect>
                                </Field>
                            </Card>

                            <Card title="Organization">
                                <Field label="Collection">
                                    <StyledSelect name="product_collection" value={form.product_collection} onChange={handleForm}>
                                        <option value="">— None —</option>
                                        {collections.map(c => (
                                            <option key={c.collection_title} value={c.collection_title}>{c.collection_title}</option>
                                        ))}
                                    </StyledSelect>
                                </Field>
                                <Field label="Category" required error={formErrors.product_category}>
                                    <StyledSelect name="product_category" value={form.product_category} onChange={handleForm} hasError={!!formErrors.product_category}>
                                        <option value="">— Select —</option>
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </StyledSelect>
                                </Field>
                            </Card>

                            <Card>
                                <button type="button" onClick={cancelEdit}
                                    style={{ background: "#fff", border: "1px solid #c9cccf", color: "#202223", borderRadius: 6, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                                    Discard changes
                                </button>
                                <button type="button" onClick={handleSave} disabled={saving}
                                    style={{ background: saving ? "#2e6b2e" : "#202223", color: "#fff", border: "none", borderRadius: 6, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", width: "100%", transition: "background 0.15s" }}>
                                    {saving ? "Saving…" : "Save changes"}
                                </button>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}