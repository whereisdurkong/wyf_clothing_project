import { useState, useRef, useEffect } from "react";
import axios from "axios";
import config from "../../config";

import { Toast } from "../../components/Notification";
import Loading from "../../components/Loading";

const baseUrl = config.baseApi.replace("/api", "");

const styles = {
    root: {
        minHeight: "100vh",
        background: "#FAFAFA",
        fontFamily: "-apple-system, 'Inter', BlinkMacSystemFont, sans-serif",
        padding: "0 0 4rem 0",
    },
    header: {
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(250,250,250,0.9)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E8E8E8",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: { fontSize: 14, fontWeight: 600, color: "#0F0F0F", letterSpacing: "-0.01em", margin: 0 },
    headerBadge: { fontSize: 11, fontWeight: 500, color: "#6B6B6B", background: "#F0F0F0", borderRadius: 20, padding: "2px 8px", letterSpacing: "0.02em" },
    body: { maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem", paddingTop: 150 },
    section: { marginBottom: "2rem" },
    sectionLabel: { fontSize: 11, fontWeight: 600, color: "#6B6B6B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 },
    sectionCount: { background: "#E8E8E8", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 600, color: "#6B6B6B", letterSpacing: 0, textTransform: "none" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 },
    imageCard: { position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1px solid #E8E8E8", background: "#F5F5F5", transition: "box-shadow 0.15s ease" },
    imageCardImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
    removeBtn: { position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(15,15,15,0.7)", border: "none", color: "#fff", fontSize: 14, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.1s", backdropFilter: "blur(4px)" },
    emptyState: { gridColumn: "1 / -1", padding: "2rem", textAlign: "center", border: "1px dashed #D4D4D4", borderRadius: 10 },
    emptyText: { fontSize: 13, color: "#ABABAB", margin: 0 },
    dropzone: { border: "1.5px dashed #D4D4D4", borderRadius: 12, padding: "2.5rem 1.5rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s, background 0.15s", background: "#FDFDFD", marginBottom: 0 },
    dropzoneActive: { borderColor: "#6366F1", background: "#F5F4FF" },
    dropzoneIcon: { fontSize: 24, marginBottom: 8, display: "block" },
    dropzoneText: { fontSize: 13, color: "#6B6B6B", margin: 0 },
    dropzoneStrong: { color: "#6366F1", fontWeight: 600 },
    dropzoneHint: { fontSize: 11, color: "#ABABAB", marginTop: 4, display: "block" },
    divider: { height: 1, background: "#EEEEEE", margin: "0 0 2rem 0" },
    footer: { position: "sticky", bottom: 0, background: "rgba(250,250,250,0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid #E8E8E8", padding: "1rem 1.25rem", maxWidth: "100%" },
    footerInner: { maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 },
    saveBtn: { flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "#18181B", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 0.15s, transform 0.1s" },
    saveBtnDisabled: { opacity: 0.45, cursor: "not-allowed" },
    noRecords: { padding: "4rem 2rem", textAlign: "center", color: "#ABABAB", fontSize: 13 },
    spinnerWrap: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center" },
};

export default function AdminDashboard() {
    const [records, setRecords] = useState([]);
    const [keptImages, setKeptImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const inputRef = useRef();

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/blog/get-all-dashboard`);
                const data = res.data || [];
                setRecords(data);
                const combined = data.flatMap((record) =>
                    JSON.parse(record.images || "[]").map((path) => ({
                        path,
                        dashboard_id: record.dashboard_id,
                    }))
                );
                setKeptImages(combined);
            } catch (err) {
                console.log("Unable to fetch dashboard images: ", err);
                addNotif("Failed to load", "Could not fetch dashboard images. Please refresh.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <Loading />;

    const removeKept = (path) => {
        setKeptImages((prev) => prev.filter((img) => img.path !== path));
    };

    const addFiles = (incoming) => {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        const valid = Array.from(incoming).filter((f) => allowed.test(f.name));
        const skipped = Array.from(incoming).length - valid.length;
        setNewFiles((prev) => [...prev, ...valid]);
        if (skipped > 0) {
            addNotif("Some files skipped", `${skipped} file${skipped > 1 ? "s were" : " was"} not a supported format (JPG, PNG, WEBP).`, "warning");
        }
    };

    const removeNew = (index) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!records.length) return;
        setUploading(true);

        const keptByRecord = {};
        for (const record of records) {
            keptByRecord[record.dashboard_id] = keptImages
                .filter((img) => img.dashboard_id === record.dashboard_id)
                .map((img) => img.path);
        }

        const targetId = records[0]?.dashboard_id;

        try {
            const errors = [];
            const updates = [];

            for (const record of records) {
                const formData = new FormData();
                formData.append("dashboard_id", record.dashboard_id);
                formData.append("keptImages", JSON.stringify(keptByRecord[record.dashboard_id] || []));
                if (record.dashboard_id === targetId) {
                    newFiles.forEach((f) => formData.append("dashboardImages", f));
                }

                const res = await axios.post(
                    `${config.baseApi}/blog/update-dashboard`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );

                if (!res.data.success) {
                    errors.push(res.data.message || `Update failed for record ${record.dashboard_id}`);
                } else {
                    updates.push({
                        dashboard_id: record.dashboard_id,
                        deleted: res.data.deleted,
                        newPaths: res.data.newPaths || [],
                    });
                }
            }

            if (errors.length) {
                addNotif("Save failed", errors.join("; "), "error");
                return;
            }

            const survivingRecords = records.filter((r) => {
                const update = updates.find((u) => u.dashboard_id === r.dashboard_id);
                return update && !update.deleted;
            });

            const addedImages = (
                updates.find((u) => u.dashboard_id === targetId)?.newPaths || []
            ).map((path) => ({ path, dashboard_id: targetId }));

            setRecords(survivingRecords);
            setKeptImages((prev) => {
                const deletedIds = updates.filter((u) => u.deleted).map((u) => u.dashboard_id);
                const remaining = prev.filter((img) => !deletedIds.includes(img.dashboard_id));
                return [...remaining, ...addedImages];
            });
            setNewFiles([]);
            addNotif("Changes saved", "Dashboard images updated successfully.", "success");
        } catch (err) {
            addNotif("Network error", err.response?.data?.message || "Something went wrong. Please try again.", "error");
        } finally {
            setUploading(false);
        }
    };

    const hasContent = records.length > 0;
    const totalImages = keptImages.length + newFiles.length;

    return (
        <>
            <style>{`
        @media (max-width: 480px) {
          .img-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important; }
          .footer-inner { flex-direction: column; }
        }
        .remove-btn:hover { background: rgba(220,38,38,0.85) !important; }
        .dropzone:hover { border-color: #6366F1 !important; background: #F9F8FF !important; }
        .save-btn:not(:disabled):hover  { opacity: 0.82; }
        .save-btn:not(:disabled):active { transform: scale(0.98); }
        .image-card:hover .remove-btn { opacity: 1 !important; }
        .image-card .remove-btn { opacity: 0; transition: opacity 0.15s; }
        @media (hover: none) { .image-card .remove-btn { opacity: 1 !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
      `}</style>

            {/* Toast container */}
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 9999, width: 340, pointerEvents: "none" }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast
                            {...n}
                            onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))}
                        />
                    </div>
                ))}
            </div>

            <div style={styles.root}>
                {/* Sticky header */}
                <div style={styles.header}>
                    <p style={styles.headerTitle}>Dashboard Images</p>
                    {hasContent && (
                        <span style={styles.headerBadge}>
                            {totalImages} {totalImages === 1 ? "image" : "images"}
                        </span>
                    )}
                </div>

                {hasContent ? (
                    <>
                        <div style={styles.body}>
                            {/* Current images */}
                            <div style={styles.section}>
                                <div style={styles.sectionLabel}>
                                    Current
                                    <span style={styles.sectionCount}>{keptImages.length}</span>
                                </div>
                                <div className="img-grid" style={styles.grid}>
                                    {keptImages.map((img, i) => (
                                        <div key={i} className="image-card" style={styles.imageCard}>
                                            <img src={`${baseUrl}/${img.path}`} alt="" style={styles.imageCardImg} />
                                            <button
                                                className="remove-btn"
                                                onClick={() => removeKept(img.path)}
                                                style={styles.removeBtn}
                                                title="Remove"
                                                aria-label="Remove image"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {keptImages.length === 0 && (
                                        <div style={styles.emptyState}>
                                            <p style={styles.emptyText}>
                                                All images removed — saving will clear all records.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={styles.divider} />

                            {/* Add new */}
                            <div style={styles.section}>
                                <div style={styles.sectionLabel}>
                                    Add images
                                    {newFiles.length > 0 && (
                                        <span style={styles.sectionCount}>{newFiles.length} new</span>
                                    )}
                                </div>
                                {newFiles.length > 0 && (
                                    <div className="img-grid" style={{ ...styles.grid, marginTop: 12, marginBottom: 12 }}>
                                        {newFiles.map((file, i) => (
                                            <div key={i} className="image-card" style={{ ...styles.imageCard, border: "1px solid #C7C5FF" }}>
                                                <img src={URL.createObjectURL(file)} alt={file.name} style={styles.imageCardImg} />
                                                <button
                                                    className="remove-btn"
                                                    onClick={() => removeNew(i)}
                                                    style={styles.removeBtn}
                                                    title="Remove"
                                                    aria-label="Remove image"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div
                                    className="dropzone"
                                    style={{ ...styles.dropzone, ...(isDragging ? styles.dropzoneActive : {}) }}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
                                    onClick={() => inputRef.current.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
                                    aria-label="Upload images"
                                >
                                    <span style={styles.dropzoneIcon}>{isDragging ? "📂" : "🖼️"}</span>
                                    <p style={styles.dropzoneText}>
                                        Drag & drop, or <span style={styles.dropzoneStrong}>browse files</span>
                                    </p>
                                    <span style={styles.dropzoneHint}>JPG, PNG, WEBP accepted</span>
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.webp"
                                        style={{ display: "none" }}
                                        onChange={(e) => addFiles(e.target.files)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sticky footer */}
                        <div style={styles.footer}>
                            <div className="footer-inner" style={styles.footerInner}>
                                <button
                                    className="save-btn"
                                    onClick={handleSave}
                                    disabled={uploading}
                                    style={{ ...styles.saveBtn, ...(uploading ? styles.saveBtnDisabled : {}) }}
                                >
                                    {uploading ? (
                                        <span style={styles.spinnerWrap}>
                                            <span className="spinner" /> Saving…
                                        </span>
                                    ) : (
                                        "Save changes"
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={styles.noRecords}>No dashboard records found.</div>
                )}
            </div>
        </>
    );
}