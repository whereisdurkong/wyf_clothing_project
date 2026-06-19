import { useState, useRef } from "react";
import axios from "axios";
import config from "../../config";

export default function AddDashboard() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const inputRef = useRef();

    const empInfo = JSON.parse(localStorage.getItem('user')) || {};
    const userInfo = empInfo.user || {};

    const addFiles = (incoming) => {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        const valid = Array.from(incoming).filter((f) => allowed.test(f.name));
        setFiles((prev) => [...prev, ...valid]);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };

    const handleSubmit = async () => {
        if (!files.length) return;
        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('created_by', userInfo.name)
        files.forEach((f) => formData.append("dashboardImages", f));

        try {
            const res = await axios.post(
                `${config.baseApi}/blog/upload-dashboard-images`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (res.data.success) {
                setMessage({ type: "success", text: "Images uploaded successfully!" });
                setFiles([]);
            } else {
                setMessage({ type: "error", text: res.data.message || "Upload failed." });
            }
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Network error. Please try again." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem" }}>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>
                Dashboard images{" "}
                <span style={{ fontSize: 12, color: "#888" }}>
                    ({files.length} selected)
                </span>
            </p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
                .jpg, .jpeg, .png, .webp — up to 5 MB each
            </p>

            {/* Drop zone */}
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
                style={{
                    border: "1.5px dashed #ccc",
                    borderRadius: 10,
                    padding: "2.5rem 1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                }}
            >
                <p style={{ margin: 0, color: "#888" }}>
                    Drag & drop images here, or <strong>browse</strong>
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    style={{ display: "none" }}
                    onChange={(e) => addFiles(e.target.files)}
                />
            </div>

            {/* Previews */}
            {files.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                        gap: 10,
                        marginTop: 12,
                    }}
                >
                    {files.map((file, i) => (
                        <div
                            key={i}
                            style={{
                                position: "relative",
                                aspectRatio: "1",
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "0.5px solid #ddd",
                            }}
                        >
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <button
                                onClick={() => removeFile(i)}
                                style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    background: "rgba(0,0,0,0.55)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: 22,
                                    height: 22,
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: 13,
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Feedback */}
            {message && (
                <p
                    style={{
                        marginTop: 10,
                        fontSize: 13,
                        color: message.type === "success" ? "green" : "red",
                    }}
                >
                    {message.text}
                </p>
            )}

            <button
                onClick={handleSubmit}
                disabled={uploading || !files.length}
                style={{
                    marginTop: 16,
                    width: "100%",
                    padding: "10px 0",
                    borderRadius: 8,
                    border: "0.5px solid #ccc",
                    cursor: files.length ? "pointer" : "not-allowed",
                    opacity: files.length ? 1 : 0.5,
                }}
            >
                {uploading ? "Uploading..." : "Upload images"}
            </button>
        </div>
    );
}