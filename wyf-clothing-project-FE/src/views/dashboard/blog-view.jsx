import { useSearchParams } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import { useEffect, useState } from "react";

export default function BlogView() {
    const [searchParams] = useSearchParams();
    const blog_id = searchParams.get("id");

    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [imgHovered, setImgHovered] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/blog/get-blog-by-id`, {
                    params: { id: blog_id },
                });
                setBlog(res.data);
            } catch (err) {
                console.error("Unable to fetch blog:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [blog_id]);

    if (loading) return (
        <div style={styles.centered}>
            <div style={styles.loadingBar}>
                <div style={styles.loadingFill} />
            </div>
            <p style={styles.statusText}>Loading article…</p>
        </div>
    );

    if (error || !blog) return (
        <div style={styles.centered}>
            <p style={styles.statusText}>Article not found.</p>
            <a href="/blogs" style={styles.errorBack}>← Return to Blogs</a>
        </div>
    );

    const baseUrl = config.baseApi.replace("/api", "");

    let images = [];
    try {
        images = JSON.parse(blog.album || "[]");
    } catch {
        images = [];
    }

    const formattedDate = new Date(blog.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const handlePrev = () =>
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

    const handleNext = () =>
        setActiveIndex((prev) => (prev + 1) % images.length);

    return (
        <div style={styles.page}>

            <div className="caution-tape" />
            {/* ── Masthead ── */}
            <header style={styles.masthead}>
                <a href="/blogs" style={styles.backLink}>

                </a>
                <div style={styles.mastheadCenter}>
                    <span style={styles.mastheadLabel}>WYF? Journal</span>
                </div>
                <span style={styles.mastheadDate} className="masthead-date">{formattedDate}</span>
            </header>

            {/* ── Main content ── */}
            <main style={styles.main}>
                <div style={styles.layout} className="blog-layout">

                    {/* Left: Image Gallery */}
                    {images.length > 0 && (
                        <div style={styles.imageCol} className="blog-image-col">
                            <div
                                style={styles.mainImageWrapper}
                                onMouseEnter={() => setImgHovered(true)}
                                onMouseLeave={() => setImgHovered(false)}
                            >
                                <img
                                    key={activeIndex}
                                    src={`${baseUrl}/${images[activeIndex]}`}
                                    alt={`${blog.title} - image ${activeIndex + 1}`}
                                    style={{
                                        ...styles.mainImage,
                                        filter: imgHovered ? "grayscale(0%)" : "grayscale(100%)",
                                    }}
                                    className="blog-main-image"
                                />

                                {/* Gradient overlay */}
                                <div style={styles.imgOverlay} />

                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            style={{ ...styles.arrow, left: "12px" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#fff"}
                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                                        >
                                            ‹
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            style={{ ...styles.arrow, right: "12px" }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = "#fff";
                                                e.currentTarget.style.color = "#0a0a0a";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                                                e.currentTarget.style.color = "#fff";
                                            }}
                                        >
                                            ›
                                        </button>
                                        <span style={styles.counter}>
                                            <span style={styles.counterActive}>{activeIndex + 1}</span>
                                            <span style={styles.counterSep}> / </span>
                                            {images.length}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div style={styles.thumbRow}>
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveIndex(i)}
                                            style={{
                                                ...styles.thumbBtn,
                                                ...(i === activeIndex ? styles.thumbBtnActive : {}),
                                            }}
                                        >
                                            <img
                                                src={`${baseUrl}/${img}`}
                                                alt={`Thumbnail ${i + 1}`}
                                                style={{
                                                    ...styles.thumbImg,
                                                    filter: i === activeIndex ? "grayscale(0%)" : "grayscale(100%)",
                                                    opacity: i === activeIndex ? 1 : 0.5,
                                                }}
                                                className="blog-thumb-img"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Image caption slot */}
                            <p style={styles.imageCaption}>
                                Image {activeIndex + 1} of {images.length}
                            </p>
                        </div>
                    )}

                    {/* Right: Content */}
                    <div style={styles.contentCol}>
                        {/* Decorative title */}
                        <div style={styles.decoNumber} className="blog-deco-title">{blog.title}</div>

                        <div
                            className="blog-content"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                            style={styles.content}
                        />

                        {/* Footer tag */}
                        <div style={styles.articleFooter}>
                            <div style={styles.footerLine} />
                            <span style={styles.footerLabel}>Where you from?</span>
                            <div style={styles.footerLine} />
                        </div>
                    </div>
                </div>
            </main>
            <div className="caution-tape" />
            <style>{`
                @keyframes loadBar {
                    0% { width: 0% }
                    100% { width: 70% }
                }

                .blog-content p { margin: 0 0 1.5em 0; }
                .blog-content a { color: #0a0a0a; text-decoration: underline; text-underline-offset: 3px; }
                .blog-content img { max-width: 100%; height: auto; margin: 28px 0; }
                .blog-content h2 {
                    font-family: 'Georgia', serif;
                    font-size: 1.3rem;
                    font-weight: 800;
                    margin: 2.2em 0 0.6em;
                    letter-spacing: -0.01em;
                    color: #0a0a0a;
                }
                .blog-content h3 {
                    font-family: 'Georgia', serif;
                    font-size: 1.08rem;
                    font-weight: 700;
                    margin: 1.8em 0 0.4em;
                    color: #0a0a0a;
                }
                .blog-content blockquote {
                    border-left: 4px solid #0a0a0a;
                    margin: 2.2em 0;
                    padding: 0.8em 0 0.8em 1.6em;
                    font-family: 'Georgia', serif;
                    font-size: 1.1rem;
                    font-style: italic;
                    color: #1a1a1a;
                    background: rgba(0,0,0,0.03);
                }
                .blog-content strong { font-weight: 700; color: #0a0a0a; }

                .caution-tape {
                    width: 100%;
                    height: 36px;
                    background: repeating-linear-gradient(
                        -45deg,
                        #f5c800,
                        #f5c800 24px,
                        #0a0a0a 24px,
                        #0a0a0a 48px
                    );
                    flex-shrink: 0;
                }

                /* ── Tablet: 2-col collapses ── */
                @media (max-width: 820px) {
                    .blog-layout {
                        flex-direction: column !important;
                        gap: 36px !important;
                    }
                    .blog-image-col {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    .blog-main-image {
                        height: 420px !important;
                    }
                    .blog-deco-title {
                        font-size: 3.2rem !important;
                    }
                }

                /* ── Mobile ── */
                @media (max-width: 540px) {
                    /* Masthead */
                    .back-text { display: none; }
                    .masthead-date { display: none; }

                    /* Main padding */
                    .blog-main-image {
                        height: 280px !important;
                    }
                    .blog-thumb-img {
                        width: 56px !important;
                        height: 56px !important;
                    }
                    .blog-deco-title {
                        font-size: 2.2rem !important;
                        margin-bottom: -2px !important;
                    }
                    .blog-content p,
                    .blog-content li {
                        font-size: 0.95rem !important;
                    }
                    .blog-content h2 {
                        font-size: 1.1rem !important;
                    }
                    .blog-content h3 {
                        font-size: 1rem !important;
                    }
                    .blog-content blockquote {
                        font-size: 0.97rem !important;
                        padding-left: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#f0ede8",
        fontFamily: "system-ui, -apple-system, sans-serif",
        paddingTop: "80px",
    },

    /* ── Masthead ── */
    masthead: {
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: "52px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid #222",
    },
    backLink: {
        fontSize: "0.7rem",
        color: "rgba(255,255,255,0.55)",
        textDecoration: "none",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        transition: "color 0.15s",
        flexShrink: 0,
    },
    backArrow: {
        fontSize: "0.9rem",
    },
    mastheadCenter: {
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
    },
    mastheadLabel: {
        fontSize: "0.75rem",
        color: "#fff",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        fontWeight: "600",
        whiteSpace: "nowrap",
    },
    mastheadDate: {
        fontSize: "0.68rem",
        color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.08em",
        flexShrink: 0,
    },

    /* ── Main ── */
    main: {
        maxWidth: "1160px",
        margin: "0 auto",
        padding: "40px 20px 80px",
    },
    layout: {
        display: "flex",
        gap: "64px",
        alignItems: "flex-start",
    },

    /* ── Image column ── */
    imageCol: {
        flexShrink: 0,
        width: "min(520px, 100%)",
    },
    mainImageWrapper: {
        position: "relative",
        width: "100%",
        marginBottom: "0",
        backgroundColor: "#111",
        overflow: "hidden",
        cursor: "zoom-in",
    },
    mainImage: {
        width: "100%",
        height: "640px",
        objectFit: "cover",
        display: "block",
        transition: "filter 0.5s ease, transform 0.5s ease",
    },
    imgOverlay: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
        pointerEvents: "none",
    },
    arrow: {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(4px)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.2)",
        width: "40px",
        height: "40px",
        fontSize: "1.5rem",
        lineHeight: "1",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0",
        transition: "background 0.2s, color 0.2s",
        touchAction: "manipulation",
    },
    counter: {
        position: "absolute",
        bottom: "14px",
        left: "16px",
        fontSize: "0.7rem",
        color: "rgba(255,255,255,0.6)",
        fontFamily: "system-ui, sans-serif",
        letterSpacing: "0.1em",
    },
    counterActive: {
        color: "#fff",
        fontWeight: "700",
    },
    counterSep: {
        opacity: 0.4,
    },
    thumbRow: {
        display: "flex",
        gap: "4px",
        marginTop: "4px",
        flexWrap: "wrap",
    },
    thumbBtn: {
        padding: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        transition: "transform 0.15s",
        outline: "none",
        touchAction: "manipulation",
    },
    thumbBtnActive: {
        transform: "scale(1.05)",
    },
    thumbImg: {
        width: "80px",
        height: "80px",
        objectFit: "cover",
        display: "block",
        transition: "opacity 0.2s, filter 0.3s",
    },
    imageCaption: {
        margin: "10px 0 0",
        fontSize: "0.65rem",
        color: "#aaa",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "system-ui, sans-serif",
    },

    /* ── Content column ── */
    contentCol: {
        flex: 1,
        minWidth: 0, // prevents flex overflow
        borderTop: "3px solid #0a0a0a",
        paddingTop: "12px",
    },
    decoNumber: {
        fontSize: "5rem",
        fontWeight: "900",
        color: "rgba(26, 26, 26, 0.18)",
        fontFamily: "'Georgia', serif",
        lineHeight: "1",
        marginBottom: "-5px",
        letterSpacing: "-0.04em",
        userSelect: "none",
        wordBreak: "break-word",
    },
    content: {
        fontSize: "1rem",
        lineHeight: "1.95",
        color: "#2a2a2a",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    articleFooter: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginTop: "48px",
    },
    footerLine: {
        flex: 1,
        height: "1px",
        backgroundColor: "#d0cdc8",
    },
    footerLabel: {
        fontSize: "0.65rem",
        color: "#bbb",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        fontFamily: "system-ui, sans-serif",
    },

    /* ── Loading / error ── */
    centered: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "20px",
        backgroundColor: "#f0ede8",
        padding: "0 20px",
    },
    loadingBar: {
        width: "160px",
        height: "1px",
        backgroundColor: "#ddd",
        position: "relative",
        overflow: "hidden",
    },
    loadingFill: {
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "70%",
        backgroundColor: "#0a0a0a",
        animation: "loadBar 1.4s ease-in-out infinite alternate",
    },
    statusText: {
        color: "#999",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.75rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
    },
    errorBack: {
        fontSize: "0.75rem",
        color: "#0a0a0a",
        textDecoration: "none",
        letterSpacing: "0.1em",
        borderBottom: "1px solid #0a0a0a",
        paddingBottom: "2px",
    },
};