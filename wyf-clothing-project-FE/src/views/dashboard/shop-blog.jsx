import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";

export default function ShopBlog() {
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    const baseUrl = config.baseApi.replace('/api', '');

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/blog/get-all-blog`);
                const data = res.data || [];
                const first = data[0] ?? null;
                setBlog(first);
            } catch (err) {
                console.log("Unable to fetch all blog details");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (!blog) return <p>No blog found.</p>;

    const images = JSON.parse(blog.album || "[]");

    const formattedDate = new Date(blog.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="sb-wrap">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Jost:wght@300;400;500&display=swap');

                .sb-wrap {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 100px 40px 80px;
                    font-family: 'Jost', sans-serif;
                    color: #1a1a1a;
                }

                /* ── Header row: TITLE --- DATE ── */
                .sb-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 10px;
                }

                .sb-title {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(22px, 3vw, 36px);
                    font-weight: 600;
                    white-space: nowrap;
                    margin: 0;
                }

                .sb-line {
                    flex: 1;
                    height: 1px;
                    background: #d0d0d0;
                }

                .sb-date {
                    font-size: 12px;
                    letter-spacing: 0.1em;
                    color: #888;
                    white-space: nowrap;
                    text-transform: uppercase;
                }

                /* ── Author ── */
                .sb-author {
                    font-size: 12px;
                    letter-spacing: 0.08em;
                    color: #aaa;
                    text-transform: uppercase;
                    margin-bottom: 36px;
                }

                /* ── Body: content only ── */
                .sb-body {
                    font-size: 15px;
                    line-height: 1.8;
                    color: #444;
                }

                .sb-body h1,
                .sb-body h2,
                .sb-body h3 {
                    font-family: 'Playfair Display', serif;
                    color: #1a1a1a;
                }

                /* ── Collage (below content) ── */
                .sb-collage {
                    display: grid;
                    gap: 6px;
                    width: 100%;
                    margin-top: 40px;
                }

                .sb-collage img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    border-radius: 4px;
                    transition: opacity 0.3s ease;
                }

                .sb-collage img:hover {
                    opacity: 0.88;
                }

                /* 1 image — full-width hero */
                .sb-collage--1 img {
                    height: 420px;
                }

                /* 2 images — side by side */
                .sb-collage--2 {
                    grid-template-columns: 1fr 1fr;
                }
                .sb-collage--2 img {
                    height: 280px;
                }

                /* 3 images — wide left, two stacked right */
                .sb-collage--3 {
                    grid-template-columns: 2fr 1fr;
                    grid-template-rows: 160px 160px;
                }
                .sb-collage--3 .img-0 {
                    grid-row: 1 / 3;
                }

                /* 4 images — 2×2 grid */
                .sb-collage--4 {
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: 200px 200px;
                }

                /* 5 images — full-width hero + four below */
                .sb-collage--5 {
                    grid-template-columns: repeat(4, 1fr);
                    grid-template-rows: 240px 160px;
                }
                .sb-collage--5 .img-0 {
                    grid-column: 1 / 5;
                }

                /* ── Responsive ── */
                @media (max-width: 720px) {
                    .sb-header {
                        flex-wrap: wrap;
                    }

                    .sb-collage--2,
                    .sb-collage--3,
                    .sb-collage--4 {
                        grid-template-columns: 1fr 1fr;
                        grid-template-rows: unset;
                    }

                    .sb-collage--3 .img-0 {
                        grid-row: unset;
                        grid-column: 1 / 3;
                    }

                    .sb-collage--5 {
                        grid-template-columns: 1fr 1fr;
                        grid-template-rows: unset;
                    }
                    .sb-collage--5 .img-0 {
                        grid-column: 1 / 3;
                    }

                    .sb-collage img {
                        height: 160px !important;
                    }
                }
            `}</style>

            {/* TITLE ---- DATE */}
            <div className="sb-header">
                <h1 className="sb-title">{blog.title}</h1>
                <div className="sb-line" />
                <span className="sb-date">{formattedDate}</span>
            </div>

            {/* Author */}
            <p className="sb-author">By {blog.created_by}</p>

            {/* Content */}
            <div
                className="sb-body"
                dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Image collage — renders below content, adapts 1–5 images */}
            {images.length > 0 && (
                <div className={`sb-collage sb-collage--${Math.min(images.length, 5)}`}>
                    {images.slice(0, 5).map((imgPath, i) => (
                        <img
                            key={i}
                            className={`img-${i}`}
                            src={`${baseUrl}/${imgPath}`}
                            alt={`${blog.title} ${i + 1}`}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}