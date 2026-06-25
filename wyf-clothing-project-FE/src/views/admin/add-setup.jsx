import { useState, useRef } from "react";
import axios from "axios";
import config from "../../config";
import Loading from "../../components/Loading";
import { Toast } from '../../components/Notification';
import ShopSetupProduct from "../dashboard/shop-setupProduct";

// ── Constants ───────────────────────────────────────────────────────

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

// ── Styles ──────────────────────────────────────────────────────────

const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .as-root {
        min-height: 100vh;
        background: #f5f5f5;
        color: #0a0a0a;
        font-family: 'Inter', system-ui, sans-serif;
        padding: 28px 24px;
        margin-top: 100px;
    }

    .as-inner {
        max-width: 1160px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    /* Page header */
    .as-page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding-bottom: 20px;
        border-bottom: 2px solid #0a0a0a;
        margin-bottom: 24px;
    }

    .as-page-title {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.5px;
        color: #0a0a0a;
        line-height: 1;
    }

    .as-page-subtitle {
        font-size: 12px;
        color: #888;
        font-weight: 400;
        margin-top: 6px;
        letter-spacing: 0.01em;
    }

    /* Card */
    .as-card {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-top: 3px solid #0a0a0a;
        padding: 28px;
    }

    .as-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 24px;
    }

    .as-card-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #888;
    }

    .as-card-divider {
        flex: 1;
        height: 1px;
        background: #e0e0e0;
    }

    /* Upload grid */
    .as-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
    }

    /* Upload tile */
    .as-tile {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .as-tile-drop {
        border: 1.5px solid #e0e0e0;
        height: 200px;
        cursor: pointer;
        background: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        transition: border-color 0.15s, background 0.15s;
    }

    .as-tile-drop:hover {
        border-color: #0a0a0a;
        background: #f5f5f5;
    }

    .as-tile-drop.dragging {
        border-color: #0a0a0a;
        border-style: solid;
        background: #f0f0f0;
    }

    .as-tile-drop.has-error {
        border-color: #c0392b;
    }

    .as-tile-drop.has-preview {
        cursor: default;
        border-color: #0a0a0a;
    }

    .as-tile-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .as-tile-remove {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #0a0a0a;
        color: #fff;
        border: none;
        width: 26px;
        height: 26px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
        line-height: 1;
    }

    .as-tile-remove:hover {
        background: #333;
    }

    .as-tile-empty {
        text-align: center;
        color: #aaa;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 16px;
    }

    .as-tile-tag {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: #0a0a0a;
        background: #0a0a0a;
        color: #fff;
        padding: 3px 8px;
        display: inline-block;
    }

    .as-tile-hint {
        font-size: 11px;
        color: #aaa;
        line-height: 1.5;
    }

    .as-tile-hint span {
        color: #0a0a0a;
        font-weight: 500;
        text-decoration: underline;
        cursor: pointer;
    }

    .as-tile-meta {
        font-size: 10px;
        color: #bbb;
        letter-spacing: 0.02em;
    }

    /* Tile footer */
    .as-tile-footer {
        background: #0a0a0a;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .as-tile-name {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #fff;
    }

    .as-tile-error {
        font-size: 10px;
        color: #c0392b;
        padding: 6px 0 2px;
        letter-spacing: 0.01em;
    }

    /* Actions row */
    .as-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
    }

    .as-hint-text {
        font-size: 11px;
        color: #bbb;
    }

    /* Save button */
    .as-save-btn {
        background: #0a0a0a;
        color: #fff;
        border: 1.5px solid #0a0a0a;
        padding: 10px 28px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s, color 0.15s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .as-save-btn:hover:not(:disabled) {
        background: #fff;
        color: #0a0a0a;
    }

    .as-save-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    /* Preview section */
    .as-preview-section {
        margin-top: 32px;
    }

    .as-preview-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
    }

    .as-preview-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #888;
    }

    .as-preview-divider {
        flex: 1;
        height: 1px;
        background: #e0e0e0;
    }

    .as-preview-inner {
        border: 1px solid #e0e0e0;
        border-top: 3px solid #0a0a0a;
        overflow: hidden;
        background: #fff;
    }

    /* Toast */
    .as-toast-wrap {
        position: fixed;
        bottom: 20px;
        right: 24px;
        z-index: 9999;
        width: 340px;
        pointer-events: none;
    }

    .as-toast-wrap > div {
        pointer-events: auto;
    }
`;

// ── Sub-components ──────────────────────────────────────────────────

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

    let dropClass = "as-tile-drop";
    if (dragging) dropClass += " dragging";
    if (error) dropClass += " has-error";
    if (preview) dropClass += " has-preview";

    return (
        <div className="as-tile">
            <div
                className={dropClass}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => !preview && inputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <img className="as-tile-preview" src={preview} alt={label} />
                        <button
                            type="button"
                            className="as-tile-remove"
                            onClick={e => { e.stopPropagation(); onRemove(); }}
                            title={`Remove ${label}`}
                        >×</button>
                    </>
                ) : (
                    <div className="as-tile-empty">
                        <span className="as-tile-tag">{tag}</span>
                        <div className="as-tile-hint">
                            Drop image or{" "}
                            <span onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                                browse
                            </span>
                        </div>
                        <div className="as-tile-meta">JPG · PNG · WebP — {MAX_FILE_SIZE_MB}MB max</div>
                    </div>
                )}
            </div>

            <div className="as-tile-footer">
                <span className="as-tile-name">{label}</span>
                {preview && (
                    <span style={{ fontSize: 10, color: "#666", letterSpacing: "0.04em" }}>✓ Ready</span>
                )}
            </div>

            {error && <div className="as-tile-error">{error}</div>}

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
    return (
        <button
            type="button"
            className="as-save-btn"
            onClick={onClick}
            disabled={loading}
        >
            {loading ? (
                <>
                    <span style={{
                        display: "inline-block",
                        width: 10, height: 10,
                        border: "1.5px solid currentColor",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "as-spin 0.7s linear infinite",
                    }} />
                    Saving
                </>
            ) : "Save setup"}
        </button>
    );
}

function PreviewSection({ refreshKey }) {
    return (
        <div className="as-preview-section">
            <div className="as-preview-header">
                <span className="as-preview-label">Preview</span>
                <div className="as-preview-divider" />
            </div>
            <div className="as-preview-inner">
                <ShopSetupProduct key={refreshKey} />
            </div>
        </div>
    );
}

// ── Main ────────────────────────────────────────────────────────────

export default function AddSetup() {
    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const [fileErrors, setFileErrors] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshPreview, setRefreshPreview] = useState(0);

    if (loading) return <Loading />;

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
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
            addNotif("Nothing to save", "Upload at least one image before saving.", "error");
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
            addNotif("Saved", "Setup images have been updated.", "success");
            setRefreshPreview(prev => prev + 1);
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Server error.";
            addNotif("Something went wrong", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const uploadedCount = categories.filter(({ key }) => previews[key]).length;

    return (
        <div className="as-root">
            <style>{STYLES}</style>
            <style>{`@keyframes as-spin { to { transform: rotate(360deg); } }`}</style>

            {/* Toasts */}
            <div className="as-toast-wrap">
                {notifications.map(n => (
                    <div key={n.id}>
                        <Toast {...n} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
                    </div>
                ))}
            </div>

            <div className="as-inner">

                {/* Page header */}
                <div className="as-page-header">
                    <div>
                        <div className="as-page-title">Shop Setup</div>
                        <div className="as-page-subtitle">Upload one image per clothing category</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>
                        {uploadedCount} / {categories.length} uploaded
                    </div>
                </div>

                {/* Upload card */}
                <div className="as-card">
                    <div className="as-card-header">
                        <span className="as-card-label">Category Images</span>
                        <div className="as-card-divider" />
                    </div>

                    <div className="as-grid">
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

                    <div className="as-actions">
                        <span className="as-hint-text">Changes are saved immediately on upload</span>
                        <SaveButton loading={loading} onClick={handleSave} />
                    </div>
                </div>

                {/* Preview */}
                <PreviewSection refreshKey={refreshPreview} />

            </div>
        </div>
    );
}