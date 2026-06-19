import { useState, useRef } from "react";
import axios from "axios";
import config from "../../config";
import Loading from "../../components/Loading";
import { Toast } from '../../components/Notification';

// ── Shared style primitives ─────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

function validateImageFile(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Only JPG, PNG, or WebP images are allowed.";
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_FILE_SIZE_MB}MB.`;
    return null;
}

const categories = [
    { key: "shirt", label: "Shirt", tag: "SHIRT" },
    { key: "hoodie", label: "Hoodie", tag: "HOODIE" },
    { key: "bottoms", label: "Bottoms", tag: "BOTTOMS" },
    { key: "footwear", label: "Footwear", tag: "FOOTWEAR" },
];

// ── Card wrapper ────────────────────────────────────────────────────

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

// ── Single image upload tile ────────────────────────────────────────

function ImageUploadCard({ label, tag, preview, error, onFileChange, onRemove }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = (files) => {
        const file = files[0];
        if (!file) return;
        const err = validateImageFile(file);
        if (err) { onFileChange(null, err); return; }
        onFileChange(file, null);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => !preview && inputRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? "#202223" : error ? "#d82c0d" : "#c9cccf"}`,
                    borderRadius: 6,
                    overflow: "hidden",
                    height: 160,
                    cursor: preview ? "default" : "pointer",
                    background: dragging ? "#f6f6f7" : "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    transition: "border-color 0.15s, background 0.15s",
                }}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt={label}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onRemove(); }}
                            style={{
                                position: "absolute", top: 6, right: 6,
                                background: "rgba(0,0,0,0.55)", color: "#fff",
                                border: "none", borderRadius: "50%",
                                width: 24, height: 24, cursor: "pointer", fontSize: 14,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                            title={`Remove ${label} image`}
                        >×</button>
                    </>
                ) : (
                    <div style={{ textAlign: "center", color: "#6d7175", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <span style={{
                            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                            color: "#6d7175", background: "#f1f2f4",
                            padding: "3px 8px", borderRadius: 4,
                        }}>
                            {tag}
                        </span>
                        <div style={{ fontSize: 12 }}>
                            Drag & drop or{" "}
                            <span
                                style={{ color: "#202223", fontWeight: 500, textDecoration: "underline", cursor: "pointer" }}
                                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                            >
                                browse
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#8c9196" }}>
                            JPG, PNG, WebP — max {MAX_FILE_SIZE_MB}MB
                        </div>
                    </div>
                )}
            </div>

            <span style={{ fontSize: 13, fontWeight: 500, color: "#202223", textAlign: "center" }}>
                {label}
            </span>

            {error && (
                <span style={{ fontSize: 11, color: "#d82c0d", textAlign: "center" }}>
                    {error}
                </span>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                style={{ display: "none" }}
                onChange={e => handleFiles(e.target.files)}
            />
        </div>
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
                padding: "9px 24px",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: loading ? 0.7 : 1,
                transition: "background 0.15s",
            }}
        >
            {loading ? "Saving…" : "Save setup"}
        </button>
    );
}

// ── Main component ──────────────────────────────────────────────────

export default function AddSetup() {
    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const [fileErrors, setFileErrors] = useState({});

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    if (loading) return <Loading />;

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    const handleFileChange = (key, file, err) => {
        if (err) {
            setFileErrors(prev => ({ ...prev, [key]: err }));
            return;
        }
        setFiles(prev => ({ ...prev, [key]: file }));
        setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
        setFileErrors(prev => ({ ...prev, [key]: null }));
    };

    const handleRemove = (key) => {
        if (previews[key]) URL.revokeObjectURL(previews[key]);
        setFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
        setPreviews(prev => { const n = { ...prev }; delete n[key]; return n; });
        setFileErrors(prev => ({ ...prev, [key]: null }));
    };

    const handleSave = async () => {
        const hasAny = categories.some(({ key }) => files[key]);
        if (!hasAny) {
            addNotif("Nothing to save", "Please upload at least one image before saving.", "error");
            return;
        }

        const formData = new FormData();
        categories.forEach(({ key }) => {
            if (files[key]) formData.append(key, files[key]);
        });

        setLoading(true);
        try {
            await axios.post(`${config.baseApi}/product/add-setup`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            addNotif("Saved successfully", "Setup images have been updated.", "success");
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
                <Card title="Setup images">
                    <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>
                        Upload one image per category. These appear on the shop setup display.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                        {categories.map(({ key, label, tag }) => (
                            <ImageUploadCard
                                key={key}
                                label={label}
                                tag={tag}
                                preview={previews[key]}
                                error={fileErrors[key]}
                                onFileChange={(file, err) => handleFileChange(key, file, err)}
                                onRemove={() => handleRemove(key)}
                            />
                        ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <SaveButton loading={loading} onClick={handleSave} />
                    </div>
                </Card>
            </div>
        </div>
    );
}