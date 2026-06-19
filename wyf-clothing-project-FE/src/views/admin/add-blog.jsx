import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import config from "../../config";

// Import the Loading and Toast components
import { Toast } from '../../components/Notification';
import Loading from "../../components/Loading";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  .ab-wrap { max-width: 720px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; display: flex; flex-direction: column; gap: 24px; }
  .ab-label { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .ab-section { display: flex; flex-direction: column; }

  /* Title */
  .ab-title-input {
    width: 100%; border: none; border-bottom: 1.5px solid #ddd;
    background: transparent; font-size: 26px; font-weight: 600; color: #111;
    padding: 6px 0 10px; outline: none; font-family: inherit;
    transition: border-color 0.2s;
  }
  .ab-title-input:focus { border-bottom-color: #111; }
  .ab-title-input::placeholder { color: #bbb; }

  /* Toolbar */
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

  /* Editor */
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

  /* Album */
  .ab-album-dropzone {
    border: 1.5px dashed #ddd; border-radius: 12px;
    padding: 28px 20px; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 6px; cursor: pointer;
    background: #fafafa; transition: border-color 0.2s, background 0.2s;
  }
  .ab-album-dropzone:hover, .ab-album-dropzone.drag-over { border-color: #aaa; background: #f4f4f4; }
  .ab-album-dropzone.has-images { padding: 14px; cursor: default; }
  .ab-album-drop-icon { font-size: 28px; color: #ccc; }
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

  /* Meta */
  .ab-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .ab-meta-input {
    width: 100%; border: 1px solid #e5e5e5; border-radius: 8px;
    background: #fff; color: #111; padding: 9px 12px;
    font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s;
  }
  .ab-meta-input:focus { border-color: #bbb; }
  .ab-meta-input::placeholder { color: #bbb; }



  /* Actions */
  .ab-actions { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
  .ab-status { font-size: 12px; color: #22a06b; margin-right: auto; }
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

  @media (max-width: 520px) {
    .ab-meta-row { grid-template-columns: 1fr; }
    .ab-title-input { font-size: 20px; }
  }
`;

// ─── Toolbar config ────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddBlog({ onSaveDraft, onPublish } = {}) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [activeFormats, setActive] = useState({});
    const [albumImages, setAlbumImages] = useState([]); // [{ file, src }]

    // ── Loading and Toast states (copied from AddProduct) ──
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    const editorRef = useRef(null);
    const albumInputRef = useRef(null);
    const savedRange = useRef(null);

    const empInfo = JSON.parse(localStorage.getItem('user')) || {};
    const userInfo = empInfo.user || {};
    const [publishing, setPublishing] = useState(false);
    // ── Toast notification function (copied from AddProduct) ──
    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    // Show loading screen
    if (isLoading) return <Loading />;

    // Inject styles once
    useEffect(() => {
        if (document.getElementById("ab-styles")) return;
        const el = document.createElement("style");
        el.id = "ab-styles";
        el.textContent = styles;
        document.head.appendChild(el);
        return () => el.remove();
    }, []);

    // execCommand wrapper
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

    // Save selection before toolbar click blurs editor
    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel?.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
    };

    const restoreSelection = () => {
        const sel = window.getSelection();
        if (savedRange.current && sel) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
    };

    // Toolbar click
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

    const loadFiles = (files) => {
        const MAX_IMAGES = 5;
        const validFiles = Array.from(files).filter((file) => {
            if (!file.type.startsWith("image/")) {
                addNotif("Invalid file", `"${file.name}" is not an image. Only image files are allowed.`, "error");
                return false;
            }
            return true;
        });

        setAlbumImages((prev) => {
            const remaining = MAX_IMAGES - prev.length;
            if (validFiles.length === 0) return prev;
            if (remaining <= 0) {
                addNotif("Limit reached", `You can only upload up to ${MAX_IMAGES} images.`, "error");
                return prev;
            }
            const allowed = validFiles.slice(0, remaining);
            if (validFiles.length > remaining) {
                addNotif("Limit reached", `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added (max ${MAX_IMAGES}).`, "error");
            }
            allowed.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setAlbumImages((p) => [...p, { file, src: ev.target.result }]);
                };
                reader.readAsDataURL(file);
            });
            return prev;
        });
    };

    const handleAlbumChange = (e) => {
        loadFiles(e.target.files);
        e.target.value = "";
    };

    const handleAlbumDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");
        loadFiles(e.dataTransfer.files);
    };

    const removeAlbumImage = (idx) => {
        setAlbumImages((prev) => prev.filter((_, i) => i !== idx));
    };





    // Save draft (updated with toast)
    const handleDraft = async () => {
        if (!title.trim()) {
            addNotif("Missing title", "Please add a title before saving draft.", "error");
            return;
        }

        setIsLoading(true);

        try {
            const payload = buildPayload();
            if (onSaveDraft) await onSaveDraft(payload);
            addNotif("Draft saved", "Your blog draft has been saved successfully.", "success");
        } catch (error) {
            addNotif("Save failed", "Something went wrong while saving draft.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            addNotif("Missing title", "Please add a title before publishing.", "error");
            return;
        }
        if (!editorRef.current?.innerText?.trim()) {
            addNotif("Missing content", "Please add content before publishing.", "error");
            return;
        }

        setPublishing(true); // Set publishing to true

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('contentHTML', editorRef.current?.innerHTML ?? '');
            formData.append('contentText', editorRef.current?.innerText ?? '');
            formData.append('created_by', userInfo.name || '');
            formData.append('createdAt', new Date().toISOString());



            albumImages.forEach(({ file }) => {
                formData.append('albumImages', file);
            });

            const res = await axios.post(`${config.baseApi}/blog/add-blog`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (onPublish) await onPublish(res.data);
            addNotif("Post published", "Your blog post has been published successfully!", "success");
            setSubmitted(true); // Set submitted to true for button text

            setTimeout(() => {
                handleReset();
                setSubmitted(false);
            }, 2000);

        } catch (err) {
            console.error("Publish error:", err);
            addNotif("Publish failed", err.response?.data?.message || "Something went wrong. Please try again.", "error");
        } finally {
            setPublishing(false);
            // Don't set isLoading to false here since we're not using it for publish
        }
    };
    // Reset form (optional)
    const handleReset = () => {
        setTitle("");
        setAlbumImages([]);

        setWordCount(0);
        addNotif("Form reset", "The form has been cleared.", "info");
    };

    // Collect all data into a single object
    const buildPayload = () => ({
        title,
        contentHTML: editorRef.current?.innerHTML ?? "",
        contentText: editorRef.current?.innerText ?? "",
        albumFiles: albumImages.map((a) => a.file),
        albumPreviews: albumImages.map((a) => a.src),

        wordCount,
        createdAt: new Date().toISOString(),
    });

    const hasAlbumImages = albumImages.length > 0;

    return (
        <>
            {/* Toast container - copied from AddProduct */}
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 9999, width: 340, pointerEvents: "none" }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast {...n} onDismiss={id =>
                            setNotifications(prev => prev.filter(n => n.id !== id))
                        } />
                    </div>
                ))}
            </div>

            <div className="ab-wrap" style={{ paddingTop: '100px' }}>

                {/* Hidden file input for album */}
                <input
                    ref={albumInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleAlbumChange}
                />

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

                    {/* Toolbar */}
                    <div className="ab-toolbar" onMouseDown={saveSelection}>
                        {TOOLBAR.map((item, i) =>
                            item.sep ? (
                                <div key={i} className="ab-tb-sep" aria-hidden="true" />
                            ) : (
                                <button
                                    key={i}
                                    type="button"
                                    className={[
                                        "ab-tb-btn",
                                        item.cls ?? "",
                                        activeFormats[item.cmd] ? "active" : "",
                                    ].join(" ").trim()}
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

                    {/* Contenteditable area */}
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
                                {albumImages.map((img, idx) => (
                                    <div key={idx} className="ab-album-thumb">
                                        <img src={img.src} alt={`Album image ${idx + 1}`} />
                                        <button
                                            type="button"
                                            className="ab-album-thumb-remove"
                                            aria-label={`Remove image ${idx + 1}`}
                                            onClick={(e) => { e.stopPropagation(); removeAlbumImage(idx); }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {albumImages.length < 5 && (
                                    <div
                                        className="ab-album-add-tile"
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => { e.stopPropagation(); albumInputRef.current?.click(); }}
                                        onKeyDown={(e) => { if (e.key === "Enter") albumInputRef.current?.click(); }}
                                    >
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
                            {albumImages.length} {albumImages.length === 1 ? "image" : "images"} in album
                        </div>
                    )}
                </div>
                {/* Actions */}
                <div className="ab-actions">
                    <button
                        type="button"
                        className="ab-btn-draft"
                        onClick={handleDraft}
                        disabled={isLoading}
                    >
                        Save draft
                    </button>
                    <button
                        type="button"
                        className="ab-btn-publish"
                        onClick={handlePublish}
                        disabled={publishing || submitted}
                    >
                        {submitted ? "✓ Published!" : (publishing ? "Publishing…" : "Publish post →")}
                    </button>
                </div>

            </div>
        </>
    );
}