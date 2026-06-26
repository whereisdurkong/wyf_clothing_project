// import axios from "axios";
// import config from "../../config";
// import { useEffect } from "react";


// export default function AdminDashboard() {


//     useEffect(() => {
//         const fetch = async () => {
//             try {
//                 const res = await axios.get(`${config.baseApi}/blog/get-all-dashboard`);
//                 const data = res.data || [];

//                 const allImages = data.flatMap((item) =>
//                     JSON.parse(item.images || "[]")
//                 );

//                 console.log(allImages)
//             } catch (err) {
//                 console.log('Unable to fetch dashboard images: ', err)
//             }
//         }
//         fetch();
//     }, []);

// }


import { useState, useRef, useEffect } from "react";
import axios from "axios";
import config from "../../config";

const baseUrl = config.baseApi.replace("/api", "");

export default function AdminDashboard() {
    const [records, setRecords] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [keptImages, setKeptImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const inputRef = useRef();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/blog/get-all-dashboard`);
                const data = res.data || [];
                setRecords(data);
                if (data.length) {
                    const first = data[0];
                    setActiveId(first.dashboard_id);
                    setKeptImages(JSON.parse(first.images || "[]"));
                }
            } catch (err) {
                console.log("Unable to fetch dashboard images: ", err);
            }
        };
        fetch();
    }, []);

    const selectRecord = (record) => {
        setActiveId(record.dashboard_id);
        setKeptImages(JSON.parse(record.images || "[]"));
        setNewFiles([]);
        setMessage(null);
    };

    const removeKept = (path) => {
        setKeptImages((prev) => prev.filter((p) => p !== path));
    };

    const addFiles = (incoming) => {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        const valid = Array.from(incoming).filter((f) => allowed.test(f.name));
        setNewFiles((prev) => [...prev, ...valid]);
    };

    const removeNew = (index) => {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!activeId) return;
        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append("dashboard_id", activeId);
        formData.append("keptImages", JSON.stringify(keptImages));
        newFiles.forEach((f) => formData.append("dashboardImages", f));

        try {
            const res = await axios.post(
                `${config.baseApi}/blog/update-dashboard`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.data.success) {
                if (res.data.deleted) {
                    const remaining = records.filter((r) => r.dashboard_id !== activeId);
                    setRecords(remaining);
                    setActiveId(remaining[0]?.dashboard_id || null);
                    setKeptImages(remaining[0] ? JSON.parse(remaining[0].images || "[]") : []);
                    setMessage({ type: "success", text: "Dashboard record deleted." });
                } else {
                    setMessage({ type: "success", text: "Dashboard updated!" });
                    setNewFiles([]);
                    setRecords((prev) =>
                        prev.map((r) =>
                            r.dashboard_id === activeId
                                ? { ...r, images: JSON.stringify([...keptImages, ...(res.data.newPaths || [])]) }
                                : r
                        )
                    );
                }
            } else {
                setMessage({ type: "error", text: res.data.message || "Update failed." });
            }
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Network error." });
        } finally {
            setUploading(false);
        }
    };

    const activeRecord = records.find((r) => r.dashboard_id === activeId);

    const formatDate = (str) => {
        if (!str) return "";
        return new Date(str).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
        });
    };

    return (
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "2rem 1rem", paddingTop: 100 }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Edit Dashboard Images</p>

            {/* Record tabs */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {records.map((r) => (
                    <button
                        key={r.dashboard_id}
                        onClick={() => selectRecord(r)}
                        style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            border: "0.5px solid #ccc",
                            background: r.dashboard_id === activeId ? "#000" : "#fff",
                            color: r.dashboard_id === activeId ? "#fff" : "#000",
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        {formatDate(r.created_at)}
                    </button>
                ))}
            </div>

            {activeRecord && (
                <>
                    {/* Current images */}
                    <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                        Current images — click × to remove
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                            gap: 10,
                            marginBottom: 20,
                        }}
                    >
                        {keptImages.map((path, i) => (
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
                                    src={`${baseUrl}/${path}`}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <button
                                    onClick={() => removeKept(path)}
                                    style={{
                                        position: "absolute",
                                        top: 4, right: 4,
                                        background: "rgba(0,0,0,0.55)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: 22, height: 22,
                                        color: "#fff",
                                        cursor: "pointer",
                                        fontSize: 13,
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {keptImages.length === 0 && (
                            <p style={{ fontSize: 13, color: "#aaa", gridColumn: "1/-1" }}>
                                No images remaining.
                            </p>
                        )}
                    </div>

                    {/* Add new images */}
                    <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                        Add new images ({newFiles.length} selected)
                    </p>
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                        onClick={() => inputRef.current.click()}
                        style={{
                            border: "1.5px dashed #ccc",
                            borderRadius: 10,
                            padding: "2rem 1.5rem",
                            textAlign: "center",
                            cursor: "pointer",
                            marginBottom: 12,
                        }}
                    >
                        <p style={{ margin: 0, color: "#888", fontSize: 13 }}>
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

                    {newFiles.length > 0 && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                                gap: 10,
                                marginBottom: 16,
                            }}
                        >
                            {newFiles.map((file, i) => (
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
                                        onClick={() => removeNew(i)}
                                        style={{
                                            position: "absolute",
                                            top: 4, right: 4,
                                            background: "rgba(0,0,0,0.55)",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: 22, height: 22,
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

                    {message && (
                        <p style={{ fontSize: 13, color: message.type === "success" ? "green" : "red", marginBottom: 8 }}>
                            {message.text}
                        </p>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={uploading}
                        style={{
                            width: "100%",
                            padding: "10px 0",
                            borderRadius: 8,
                            border: "0.5px solid #ccc",
                            background: uploading ? "#f5f5f5" : "#000",
                            color: uploading ? "#999" : "#fff",
                            cursor: uploading ? "not-allowed" : "pointer",
                            fontSize: 14,
                        }}
                    >
                        {uploading ? "Saving..." : "Save changes"}
                    </button>
                </>
            )}
        </div>
    );
}