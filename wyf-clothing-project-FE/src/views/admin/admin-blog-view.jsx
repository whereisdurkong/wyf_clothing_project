import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import config from "../../config";

import { Toast } from '../../components/Notification';
import Loading from "../../components/Loading";

// ─── Styles (same as AddBlog) ─────────────────────────────────────────────────
const styles = `
  .ab-wrap { max-width: 720px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; display: flex; flex-direction: column; gap: 24px; }
  .ab-label { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .ab-section { display: flex; flex-direction: column; }

  .ab-title-input {
    width: 100%; border: none; border-bottom: 1.5px solid #ddd;
    background: transparent; font-size: 26px; font-weight: 600; color: #111;
    padding: 6px 0 10px; outline: none; font-family: inherit;
    transition: border-color 0.2s;
  }
  .ab-title-input:focus { border-bottom-color: #111; }
  .ab-title-input::placeholder { color: #bbb; }

  .ab-toolbar {
    display: flex; align-items: center; gap: 2px; flex-wrap: wrap;
    border: 1px solid #e5e5e5; border-bottom: none;
    border-radius: 8px 8px 0 0; padding: 6px 8px; background: #f9f9f9;
  }
  .ab-tb-btn {
    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; border-radius: 6px; cursor: pointer;
    color: #666; font-size: 14px; transition: background 0.15s, color 0.15s;
    font-family: inherit; line-height: 1;
  }
  .ab-tb-btn:hover { background: #fff; color: #111; }
  .ab-tb-btn.active { background: #111; color: #fff; }
  .ab-tb-btn.bold-btn { font-weight: 700; }
  .ab-tb-btn.italic-btn { font-style: italic; }
  .ab-tb-btn.underline-btn { text-decoration: underline; }
  .ab-tb-sep { width: 1px; height: 18px; background: #e0e0e0; margin: 0 4px; }

  .ab-editor {
    border: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;
    min-height: 220px; padding: 14px 16px; outline: none;
    font-size: 16px; line-height: 1.75; color: #111; background: #fff;
    font-family: inherit;
  }
  .ab-editor:focus { border-color: #bbb; }
  .ab-editor:empty::before { content: attr(data-placeholder); color: #bbb; pointer-events: none; }
  .ab-editor blockquote { border-left: 3px solid #ddd; margin: 8px 0; padding-left: 14px; color: #666; }
  .ab-editor h2 { font-size: 22px; font-weight: 600; margin: 12px 0 4px; }
  .ab-editor h3 { font-size: 18px; font-weight: 600; margin: 10px 0 4px; }
  .ab-editor a { color: #0066cc; text-decoration: underline; }
  .ab-word-count { font-size: 12px; color: #aaa; margin-top: 5px; text-align: right; }

  .ab-album-dropzone {
    border: 1.5px dashed #ddd; border-radius: 12px;
    padding: 28px 20px; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 6px; cursor: pointer;
    background: #fafafa; transition: border-color 0.2s, background 0.2s;
  }
  .ab-album-dropzone:hover, .ab-album-dropzone.drag-over { border-color: #aaa; background: #f4f4f4; }
  .ab-album-dropzone.has-images { padding: 14px; cursor: default; }
  .ab-album-drop-label { font-size: 13px; color: #999; }
  .ab-album-drop-sub { font-size: 11px; color: #bbb; }
  .ab-album-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px; width: 100%;
  }
  .ab-album-thumb {
    position: relative; border-radius: 8px; overflow: hidden;
    aspect-ratio: 1; background: #f0f0f0;
  }
  .ab-album-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ab-album-thumb-remove {
    position: absolute; top: 5px; right: 5px; width: 22px; height: 22px;
    border-radius: 50%; background: rgba(0,0,0,0.55); border: none; cursor: pointer;
    color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.15s;
  }
  .ab-album-thumb:hover .ab-album-thumb-remove { opacity: 1; }
  .ab-album-thumb-existing::after {
    content: "Saved"; position: absolute; bottom: 5px; left: 5px;
    font-size: 9px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
    background: rgba(0,0,0,0.45); color: #fff; border-radius: 4px; padding: 2px 5px;
  }
  .ab-album-add-tile {
    border: 1.5px dashed #ddd; border-radius: 8px; aspect-ratio: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; cursor: pointer; background: #fafafa;
    transition: background 0.15s, border-color 0.15s;
  }
  .ab-album-add-tile:hover { background: #f4f4f4; border-color: #aaa; }
  .ab-album-add-tile span { font-size: 11px; color: #aaa; }
  .ab-album-add-icon { font-size: 20px; color: #ccc; }
  .ab-album-count { font-size: 12px; color: #aaa; margin-top: 6px; }

  .ab-actions { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
  .ab-btn-draft {
    padding: 9px 20px; font-size: 14px; font-weight: 500; border-radius: 8px;
    border: 1px solid #e0e0e0; background: transparent; color: #666;
    cursor: pointer; font-family: inherit; transition: border-color 0.15s, color 0.15s;
  }
  .ab-btn-draft:hover { border-color: #aaa; color: #111; }
  .ab-btn-publish {
    padding: 9px 22px; font-size: 14px; font-weight: 500; border-radius: 8px;
    border: none; background: #111; color: #fff; cursor: pointer;
    font-family: inherit; transition: opacity 0.15s;
  }
  .ab-btn-publish:hover { opacity: 0.82; }
  .ab-btn-publish:disabled { opacity: 0.4; cursor: not-allowed; }

  .ab-page-header { display: flex; flex-direction: column; gap: 4px; }
  .ab-page-title { font-size: 13px; font-weight: 600; color: #111; }
  .ab-page-sub { font-size: 12px; color: #aaa; }

  @media (max-width: 520px) {
    .ab-title-input { font-size: 20px; }
  }
`;

const TOOLBAR = [
    { cmd: "bold", label: "B", cls: "bold-btn", title: "Bold (Ctrl+B)" },
    { cmd: "italic", label: "I", cls: "italic-btn", title: "Italic (Ctrl+I)" },
    { cmd: "underline", label: "U", cls: "underline-btn", title: "Underline (Ctrl+U)" },
    { sep: true },
    { cmd: "formatBlock", val: "H2", label: "H2", title: "Heading 2" },
    { cmd: "formatBlock", val: "H3", label: "H3", title: "Heading 3" },
    { cmd: "formatBlock", val: "P", label: "¶", title: "Paragraph" },
    { sep: true },
    { cmd: "insertUnorderedList", label: "•—", title: "Bullet list" },
    { cmd: "insertOrderedList", label: "1.", title: "Numbered list" },
    { cmd: "formatBlock", val: "BLOCKQUOTE", label: "❝", title: "Blockquote" },
    { sep: true },
    { cmd: "createLink", label: "🔗", title: "Insert link" },
    { sep: true },
    { cmd: "undo", label: "↩", title: "Undo" },
    { cmd: "redo", label: "↪", title: "Redo" },
];

export default function AdminBlogView() {
    const [searchParams] = useSearchParams();
    const blog_id = searchParams.get("id");

    const [title, setTitle] = useState("");
    const [initialContent, setInitialContent] = useState(null); // raw HTML from API
    const [wordCount, setWordCount] = useState(0);
    const [activeFormats, setActive] = useState({});

    const [newImages, setNewImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [removedExisting, setRemovedExisting] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const navigate = useNavigate()

    const editorRef = useRef(null);
    const albumInputRef = useRef(null);
    const savedRange = useRef(null);

    // ── Inject styles ──
    useEffect(() => {
        if (document.getElementById("ab-styles")) return;
        const el = document.createElement("style");
        el.id = "ab-styles";
        el.textContent = styles;
        document.head.appendChild(el);
        return () => el.remove();
    }, []);

    // ── Toast helper ──
    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
    };

    // ── Fetch blog ──
    useEffect(() => {
        if (!blog_id) {
            addNotif("Missing ID", "No blog ID provided in the URL.", "error");
            setIsLoading(false);
            return;
        }
        const fetchBlog = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/blog/get-blog-by-id`, {
                    params: { id: blog_id }
                });
                const data = res.data;

                setTitle(data.title || "");
                setInitialContent(data.content || ""); // <-- store in state, apply via useEffect below

                try {
                    const parsed = typeof data.album === "string" ? JSON.parse(data.album) : (data.album || []);
                    setExistingImages(parsed.map(path => ({
                        url: `${config.baseApi.replace(/\/api$/, "")}/${path}`,
                        filename: path.split("/").pop()
                    })));
                } catch {
                    setExistingImages([]);
                }
            } catch (err) {
                console.error("Fetch blog error:", err);
                addNotif("Load failed", "Could not load the blog post. Please try again.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlog();
    }, [blog_id]);

    // ── Inject content HTML into editor AFTER it mounts (isLoading false → editor renders) ──
    useEffect(() => {
        if (!isLoading && initialContent !== null && editorRef.current) {
            editorRef.current.innerHTML = initialContent;
            const text = editorRef.current.innerText?.trim() ?? "";
            setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
        }
    }, [isLoading, initialContent]);

    // ── execCommand helpers ──
    const exec = useCallback((cmd, value = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, value);
        updateFormats();
    }, []);

    const updateFormats = useCallback(() => {
        setActive({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            insertUnorderedList: document.queryCommandState("insertUnorderedList"),
            insertOrderedList: document.queryCommandState("insertOrderedList"),
        });
    }, []);

    const updateWordCount = useCallback(() => {
        const text = editorRef.current?.innerText?.trim() ?? "";
        setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
    }, []);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel?.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
    };
    const restoreSelection = () => {
        const sel = window.getSelection();
        if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
    };

    const handleToolbar = (e) => {
        const btn = e.currentTarget;
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        restoreSelection();
        editorRef.current?.focus();
        if (cmd === "createLink") {
            const url = window.prompt("Enter URL (include https://):");
            if (url) exec("createLink", url);
            return;
        }
        if (cmd === "formatBlock" && val === "BLOCKQUOTE") {
            const sel = window.getSelection();
            const node = sel?.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
            const el = node?.nodeType === 3 ? node.parentElement : node;
            exec("formatBlock", el?.closest("blockquote") ? "P" : "BLOCKQUOTE");
            return;
        }
        exec(cmd, val);
    };

    // ── Album ──
    const loadFiles = (files) => {
        const MAX_IMAGES = 5;
        const usedSlots = visibleExisting.length + newImages.length;
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith("image/")) {
                addNotif("Invalid file", `"${file.name}" is not an image.`, "error");
                return false;
            }
            return true;
        });
        const remaining = MAX_IMAGES - usedSlots;
        if (remaining <= 0) { addNotif("Limit reached", `Max ${MAX_IMAGES} images allowed.`, "error"); return; }
        const allowed = validFiles.slice(0, remaining);
        if (validFiles.length > remaining) addNotif("Limit reached", `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added.`, "error");
        allowed.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => setNewImages(p => [...p, { file, src: ev.target.result }]);
            reader.readAsDataURL(file);
        });
    };

    const handleAlbumChange = (e) => { loadFiles(e.target.files); e.target.value = ""; };
    const handleAlbumDrop = (e) => { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); loadFiles(e.dataTransfer.files); };
    const removeNewImage = (idx) => setNewImages(prev => prev.filter((_, i) => i !== idx));
    const removeExistingImage = (filename) => setRemovedExisting(prev => [...prev, filename]);

    const visibleExisting = existingImages.filter(img => !removedExisting.includes(img.filename));
    const totalImages = visibleExisting.length + newImages.length;
    const hasAlbumImages = totalImages > 0;

    // ── Save ──
    const handleSave = async () => {
        if (!title.trim()) { addNotif("Missing title", "Please add a title before saving.", "error"); return; }
        if (!editorRef.current?.innerText?.trim()) { addNotif("Missing content", "Please add content before saving.", "error"); return; }
        setIsLoading(true)
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("id", blog_id);
            formData.append("title", title);
            formData.append("content", editorRef.current?.innerHTML ?? "");
            formData.append("updatedAt", new Date().toISOString());
            if (removedExisting.length > 0) formData.append("removedImages", JSON.stringify(removedExisting));
            newImages.forEach(({ file }) => formData.append("albumImages", file));

            await axios.put(`${config.baseApi}/blog/update-blog`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            addNotif("Changes saved", "Your blog post has been updated successfully!", "success");
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 2000);

            const merged = newImages.map(({ src, file }) => ({ url: src, filename: file.name }));
            setExistingImages(prev => [...prev.filter(img => !removedExisting.includes(img.filename)), ...merged]);
            setNewImages([]);
            setRemovedExisting([]);
        } catch (err) {
            console.error("Update error:", err);
            addNotif("Save failed", err.response?.data?.message || "Something went wrong. Please try again.", "error");
        } finally {
            setIsLoading(false)
            setIsSaving(false);
            setTimeout(() => {
                navigate('/admin/admin-blog')
            }, 1500);
        }
    };

    const handleDiscard = () => {
        setRemovedExisting([]);
        setNewImages([]);
        // Re-apply original content
        if (editorRef.current && initialContent !== null) {
            editorRef.current.innerHTML = initialContent;
            updateWordCount();
        }
        addNotif("Changes discarded", "Your unsaved changes have been reverted.", "info");
    };

    if (isLoading) return <Loading />;

    return (
        <>
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 9999, width: 340, pointerEvents: "none" }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast {...n} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
                    </div>
                ))}
            </div>

            <div className="ab-wrap" style={{ paddingTop: "100px" }}>

                <input ref={albumInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleAlbumChange} />

                <div className="ab-page-header">
                    <div className="ab-page-title">Edit blog post</div>
                    <div className="ab-page-sub">ID: {blog_id}</div>
                </div>

                {/* Title */}
                <div className="ab-section">
                    <div className="ab-label">Title</div>
                    <input
                        className="ab-title-input"
                        type="text"
                        placeholder="Your blog post title..."
                        maxLength={120}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Rich Text Editor */}
                <div className="ab-section">
                    <div className="ab-label">Content</div>
                    <div className="ab-toolbar" onMouseDown={saveSelection}>
                        {TOOLBAR.map((item, i) =>
                            item.sep ? (
                                <div key={i} className="ab-tb-sep" aria-hidden="true" />
                            ) : (
                                <button
                                    key={i}
                                    type="button"
                                    className={["ab-tb-btn", item.cls ?? "", activeFormats[item.cmd] ? "active" : ""].join(" ").trim()}
                                    title={item.title}
                                    aria-label={item.title}
                                    data-cmd={item.cmd}
                                    data-val={item.val ?? ""}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleToolbar}
                                >
                                    {item.label}
                                </button>
                            )
                        )}
                    </div>
                    <div
                        ref={editorRef}
                        className="ab-editor"
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Write your story here..."
                        onInput={updateWordCount}
                        onKeyUp={updateFormats}
                        onMouseUp={updateFormats}
                    />
                    <div className="ab-word-count">{wordCount} {wordCount === 1 ? "word" : "words"}</div>
                </div>

                {/* Album */}
                <div className="ab-section">
                    <div className="ab-label">Album</div>
                    <div
                        className={`ab-album-dropzone${hasAlbumImages ? " has-images" : ""}`}
                        onClick={() => { if (!hasAlbumImages) albumInputRef.current?.click(); }}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
                        onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                        onDrop={handleAlbumDrop}
                        role={hasAlbumImages ? undefined : "button"}
                        tabIndex={hasAlbumImages ? undefined : 0}
                        aria-label={hasAlbumImages ? undefined : "Upload album images"}
                        onKeyDown={(e) => { if (!hasAlbumImages && e.key === "Enter") albumInputRef.current?.click(); }}
                    >
                        {hasAlbumImages ? (
                            <div className="ab-album-grid">
                                {visibleExisting.map((img, idx) => (
                                    <div key={`existing-${idx}`} className="ab-album-thumb ab-album-thumb-existing">
                                        <img src={img.url} alt={`Saved image ${idx + 1}`} />
                                        <button type="button" className="ab-album-thumb-remove" aria-label={`Remove saved image ${idx + 1}`} onClick={(e) => { e.stopPropagation(); removeExistingImage(img.filename); }}>✕</button>
                                    </div>
                                ))}
                                {newImages.map((img, idx) => (
                                    <div key={`new-${idx}`} className="ab-album-thumb">
                                        <img src={img.src} alt={`New image ${idx + 1}`} />
                                        <button type="button" className="ab-album-thumb-remove" aria-label={`Remove new image ${idx + 1}`} onClick={(e) => { e.stopPropagation(); removeNewImage(idx); }}>✕</button>
                                    </div>
                                ))}
                                {totalImages < 5 && (
                                    <div className="ab-album-add-tile" role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); albumInputRef.current?.click(); }} onKeyDown={(e) => { if (e.key === "Enter") albumInputRef.current?.click(); }}>
                                        <span className="ab-album-add-icon">＋</span>
                                        <span>Add more</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <span className="ab-album-drop-label">Click or drag images here</span>
                                <span className="ab-album-drop-sub">JPG, PNG, WEBP · multiple files supported</span>
                            </>
                        )}
                    </div>
                    {hasAlbumImages && (
                        <div className="ab-album-count">
                            {totalImages} {totalImages === 1 ? "image" : "images"} in album
                            {newImages.length > 0 && <span style={{ color: "#f0a500", marginLeft: 6 }}>· {newImages.length} unsaved</span>}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="ab-actions">
                    <button type="button" className="ab-btn-draft" onClick={handleDiscard} disabled={isSaving}>
                        Discard changes
                    </button>
                    <button type="button" className="ab-btn-publish" onClick={handleSave} disabled={isSaving || submitted}>
                        {submitted ? "✓ Saved!" : (isSaving ? "Saving…" : "Save changes →")}
                    </button>
                </div>

            </div>
        </>
    );
}