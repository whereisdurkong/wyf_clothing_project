import { useState, useRef } from "react";
import axios from "axios";
import config from "../../config";

import { Toast } from '../../components/Notification';
import Loading from "../../components/Loading";

// ── Shared style primitives (mirrors AddProduct) ────────────────────

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

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

function validateImageFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images are allowed.";
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_FILE_SIZE_MB}MB.`;
    return null;
}

// ── UI primitives ───────────────────────────────────────────────────

function Card({ title, children }) {
    return (
        <div style={{
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 8,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
        }}>
            {title && (
                <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#202223",
                    paddingBottom: 12,
                    borderBottom: "1px solid #e1e3e5",
                }}>
                    {title}
                </div>
            )}
            {children}
        </div>
    );
}

function Field({ label, required, children, error }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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

function StyledInput({ hasError, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <input
            {...props}
            style={{
                ...inputStyle,
                ...(focused ? focusStyle : {}),
                ...(hasError ? errorStyle : {}),
            }}
            onFocus={() => setFocused(true)}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
    );
}

function StyledTextarea({ hasError, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <textarea
            {...props}
            style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 110,
                lineHeight: 1.5,
                ...(focused ? focusStyle : {}),
                ...(hasError ? errorStyle : {}),
            }}
            onFocus={() => setFocused(true)}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
    );
}

function StyledSelect({ hasError, children, ...props }) {
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
                cursor: "pointer",
                ...(focused ? focusStyle : {}),
                ...(hasError ? errorStyle : {}),
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        >
            {children}
        </select>
    );
}

// ── Image upload (single, mirrors AddProduct's SingleImageUpload) ───

function SingleImageUpload({ label, required, file, preview, onChange, onClear, error }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files) => {
        const picked = files[0];
        if (!picked) return;
        const validationError = validateImageFile(picked);
        if (validationError) { onChange(null, null, validationError); return; }
        onChange(picked, URL.createObjectURL(picked), null);
    };

    return (
        <Field label={label} required={required} error={error}>
            {preview ? (
                <div style={{ position: "relative" }}>
                    <img
                        src={preview}
                        alt={label}
                        style={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            objectFit: "cover",
                            border: "1px solid #e1e3e5",
                            borderRadius: 6,
                            display: "block",
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
                            fontSize: 14, display: "flex",
                            alignItems: "center", justifyContent: "center",
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
                        padding: "32px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                        background: dragging ? "#f6f6f7" : "#fafafa",
                        transition: "border-color 0.15s, background 0.15s",
                    }}
                >

                    <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
                        Drag & drop or{" "}
                        <span style={{ color: "#202223", fontWeight: 500, textDecoration: "underline" }}>
                            browse
                        </span>
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

function SaveButton({ loading, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: loading ? "#44474a" : hovered ? "#44474a" : "#202223",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                width: "100%",
                opacity: loading ? 0.7 : 1,
                transition: "background 0.15s",
            }}
        >
            {loading ? "Saving…" : "Save collection"}
        </button>
    );
}

// ── Main component ──────────────────────────────────────────────────

export default function AddCollection() {
    const [form, setForm] = useState({
        collection_title: "",
        collection_subtitle: "",
        visibility: "Active",
    });

    const [image, setImage] = useState({ file: null, preview: null });
    const [imageError, setImageError] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    if (loading) return <Loading />;



    const validate = () => {
        const errs = {};
        if (!form.collection_title.trim()) errs.collection_title = "Title is required.";
        else if (form.collection_title.trim().length < 3) errs.collection_title = "Title must be at least 3 characters.";
        else if (form.collection_title.trim().length > 120) errs.collection_title = "Title must be 120 characters or fewer.";
        if (!image.file) errs.image = "A collection image is required.";
        return errs;
    };

    const handleForm = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const fieldErrors = validate();
        setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    };

    const handleImageChange = (file, preview, err) => {
        setImage({ file, preview });
        setImageError(err);
        if (!err && file) setErrors(prev => ({ ...prev, image: undefined }));
    };

    const handleDiscard = () => {
        setForm({ collection_title: "", collection_subtitle: "", visibility: "Active" });
        if (image.preview) URL.revokeObjectURL(image.preview);
        setImage({ file: null, preview: null });
        setImageError(null);
        setErrors({});
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (imageError) validationErrors.image = imageError;

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            addNotif("Validation failed", "Please fix the highlighted fields before saving.", "error");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("collection_title", form.collection_title);
            data.append("collection_subtitle", form.collection_subtitle);
            data.append("visibility", form.visibility);
            data.append("collection_image", image.file);

            await axios.post(`${config.baseApi}/product/add-collection`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            addNotif("Saved successfully", "Collection has been added.", "success");
            handleDiscard();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Server error.";
            addNotif("Something went wrong!", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#f1f2f4",
            color: "#202223",
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: "24px",
            marginTop: 100,
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                * { box-sizing: border-box; }
                ::placeholder { color: #8c9196; }
                select option { background: #fff; color: #202223; }
            `}</style>

            {/* Toast container */}
            <div style={{
                position: "fixed", bottom: 20, right: 24,
                zIndex: 9999, width: 340, pointerEvents: "none",
            }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast
                            {...n}
                            onDismiss={id =>
                                setNotifications(prev => prev.filter(n => n.id !== id))
                            }
                        />
                    </div>
                ))}
            </div>

            <div style={{ maxWidth: 900, margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

                    {/* ── Main column ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        <Card title="Collection details">
                            <Field label="Title" required error={errors.collection_title}>
                                <StyledInput
                                    name="collection_title"
                                    value={form.collection_title}
                                    onChange={handleForm}
                                    onBlur={handleBlur}
                                    hasError={!!errors.collection_title}
                                    placeholder="e.g. Summer Capsule 2025"
                                />
                            </Field>
                            <Field label="Subtitle">
                                <StyledTextarea
                                    name="collection_subtitle"
                                    value={form.collection_subtitle}
                                    onChange={handleForm}
                                    placeholder="Describe your collection…"
                                    rows={4}
                                />
                            </Field>
                        </Card>

                        <Card title="Collection image">
                            <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                                This image is displayed on the collection listing and banner.
                            </p>
                            <SingleImageUpload
                                label="Image"
                                required
                                file={image.file}
                                preview={image.preview}
                                onChange={handleImageChange}
                                onClear={() => {
                                    if (image.preview) URL.revokeObjectURL(image.preview);
                                    setImage({ file: null, preview: null });
                                    setImageError(null);
                                }}
                                error={errors.image || imageError}
                            />
                        </Card>
                    </div>

                    {/* ── Side column ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        <Card title="Status">
                            <Field label="Visibility">
                                <StyledSelect
                                    name="visibility"
                                    value={form.visibility}
                                    onChange={handleForm}
                                >
                                    <option>Active</option>
                                    <option>Draft</option>
                                    <option>Archived</option>
                                </StyledSelect>
                            </Field>
                        </Card>

                        <Card>
                            <button
                                type="button"
                                onClick={handleDiscard}
                                style={{
                                    background: "#fff",
                                    border: "1px solid #c9cccf",
                                    color: "#202223",
                                    borderRadius: 6,
                                    padding: "9px 20px",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    width: "100%",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={e => e.target.style.background = "#f6f6f7"}
                                onMouseLeave={e => e.target.style.background = "#fff"}
                            >
                                Discard
                            </button>
                            <SaveButton loading={loading} onClick={handleSubmit} />
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}