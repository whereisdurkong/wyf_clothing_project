import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import { useNavigate, useNavigation } from "react-router-dom";

export default function AdminBlog() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate()


    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/blog/get-all-blog`);
                const data = res.data || [];

                const sorted = [...data].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );

                setBlogs(sorted);
            } catch (err) {
                console.log("Unable to fetch all blog details");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
    if (!blogs.length) return <p style={{ textAlign: "center" }}>No blogs found.</p>;

    const baseUrl = config.baseApi.replace('/api', '');

    return (
        <div style={{ padding: "150px 24px" }}>
            <h2 style={{
                textAlign: "center",
                fontWeight: "800",
                fontSize: "1.4rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "40px",
                // paddingTop: '100px'
            }}>
                Blogs
            </h2>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "32px",
                maxWidth: "1100px",
                margin: "0 auto",
            }}>
                {blogs.map((blog, index) => {
                    // Parse album JSON string safely
                    let images = [];
                    try {
                        images = JSON.parse(blog.album || "[]");
                    } catch {
                        images = [];
                    }
                    const imageUrl = images[0] || null;

                    return (
                        <div key={blog.blog_id ?? index} style={{
                            display: "flex",
                            flexDirection: "column",
                            cursor: 'pointer'
                        }}
                            onClick={() => navigate('/admin/admin-blog-view?id=' + blog.blog_id)}
                        >
                            {/* Image */}
                            {imageUrl && (
                                <img
                                    src={`${baseUrl}/${imageUrl}`}
                                    alt={blog.title}
                                    style={{
                                        width: "100%",
                                        height: "280px",
                                        objectFit: "cover",
                                        display: "block",
                                        marginBottom: "16px",
                                        filter: "grayscale(100%)",
                                    }}
                                />
                            )}

                            {/* Title */}
                            <h3 style={{
                                fontSize: "1.2rem",
                                fontWeight: "900",
                                marginBottom: "5px",
                                color: "#111",
                                lineHeight: "1.4",
                            }}>
                                {blog.title}
                            </h3>

                            {/* Content — rendered as HTML, clamped to 4 lines */}
                            <div
                                dangerouslySetInnerHTML={{ __html: blog.content }}
                                style={{
                                    fontSize: "0.88rem",
                                    color: "#444",
                                    lineHeight: "1.7",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    marginBottom: "12px",
                                    flex: 1,
                                }}
                            />

                            {/* Read more */}
                            <a
                                href={`/blog/${blog.blog_id}`}
                                style={{
                                    fontSize: "0.85rem",
                                    color: "#111",
                                    textDecoration: "underline",
                                    fontWeight: "500",
                                    marginTop: "auto",
                                }}
                            >
                                Read more
                            </a>
                        </div>
                    );
                })}
            </div>
        </div >
    );
}