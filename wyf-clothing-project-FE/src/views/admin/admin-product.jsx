import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";

const styles = {
    page: {
        paddingTop: "100px",
        paddingBottom: "48px",
        paddingLeft: "24px",
        paddingRight: "24px",
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#0a0a0a",
    },
    header: {
        marginBottom: "24px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderBottom: "2px solid #0a0a0a",
        paddingBottom: "16px",
    },
    title: {
        fontSize: "22px",
        fontWeight: "800",
        color: "#0a0a0a",
        letterSpacing: "-0.5px",
        margin: 0,
        textTransform: "uppercase",
    },
    subtitle: {
        fontSize: "12px",
        color: "#888",
        marginTop: "4px",
        letterSpacing: "0.04em",
    },
    tableWrapper: {
        overflowX: "auto",
        border: "1px solid #0a0a0a",
        background: "#fff",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13px",
    },
    thead: {
        background: "#0a0a0a",
        position: "sticky",
        top: 0,
        zIndex: 2,
    },
    th: {
        padding: "12px 16px",
        textAlign: "left",
        fontSize: "10px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#fff",
        borderRight: "1px solid #2a2a2a",
        whiteSpace: "nowrap",
    },
    thCenter: {
        padding: "12px 12px",
        textAlign: "center",
        fontSize: "10px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#fff",
        borderRight: "1px solid #2a2a2a",
        whiteSpace: "nowrap",
    },
    tr: {
        cursor: "pointer",
        borderBottom: "1px solid #e5e5e5",
        transition: "background 0.1s ease",
    },
    td: {
        padding: "12px 16px",
        color: "#1a1a1a",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        borderRight: "1px solid #e5e5e5",
    },
    tdCenter: {
        padding: "12px 12px",
        textAlign: "center",
        color: "#1a1a1a",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
        borderRight: "1px solid #e5e5e5",
    },
    idBadge: {
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        fontSize: "11px",
        color: "#0a0a0a",
        background: "#f0f0f0",
        padding: "2px 8px",
        fontWeight: "700",
        border: "1px solid #d0d0d0",
    },
    productName: {
        fontWeight: "600",
        color: "#0a0a0a",
        fontSize: "13px",
    },
    categoryTag: {
        display: "inline-block",
        padding: "2px 9px",
        fontSize: "11px",
        fontWeight: "500",
        background: "#f5f5f5",
        color: "#444",
        border: "1px solid #d5d5d5",
    },
    collectionTag: {
        display: "inline-block",
        padding: "2px 9px",
        fontSize: "11px",
        fontWeight: "600",
        background: "#0a0a0a",
        color: "#fff",
    },
    saleBadgeTrue: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        fontSize: "11px",
        fontWeight: "700",
        background: "#0a0a0a",
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    saleBadgeFalse: {
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        fontSize: "11px",
        fontWeight: "400",
        color: "#bbb",
        border: "1px solid #e5e5e5",
    },
    stockHigh: {
        color: "#0a0a0a",
        fontWeight: "700",
        fontSize: "13px",
    },
    stockMid: {
        color: "#555",
        fontWeight: "600",
        fontSize: "13px",
    },
    stockLow: {
        color: "#999",
        fontWeight: "600",
        fontSize: "13px",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
    },
    stockEmpty: {
        color: "#ddd",
        fontSize: "13px",
    },
    loading: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        flexDirection: "column",
        gap: "16px",
        color: "#888",
        fontSize: "13px",
        background: "#fff",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
    },
    spinner: {
        width: "28px",
        height: "28px",
        border: "2px solid #e5e5e5",
        borderTop: "2px solid #0a0a0a",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
};

function StockCell({ qty }) {
    if (!qty || qty === 0) return <span style={styles.stockEmpty}>—</span>;
    const style = qty >= 10 ? styles.stockHigh : qty >= 4 ? styles.stockMid : styles.stockLow;
    return <span style={style}>{qty}</span>;
}

export default function AdminAllProduct() {
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredRow, setHoveredRow] = useState(null);

    const navigate = useNavigate();
    const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

    useEffect(() => {
        const styleEl = document.createElement("style");
        styleEl.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
        document.head.appendChild(styleEl);
        return () => document.head.removeChild(styleEl);
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {
                const [pRes, vRes] = await Promise.all([
                    axios.get(`${config.baseApi}/product/get-all-products`),
                    axios.get(`${config.baseApi}/product/get-all-product-variant`),
                ]);
                setProducts(pRes.data || []);
                setVariants(vRes.data || []);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getStock = (productId, size) => {
        const v = variants.find(
            (v) => Number(v.product_id) === Number(productId) && v.product_variant_size === size
        );
        return v ? v.product_variant_quantity : 0;
    };

    const isProductOnSale = (productId) => {
        const productVariants = variants.filter((v) => Number(v.product_id) === Number(productId));
        return productVariants.some(
            (v) =>
                v.product_variant_sale_price !== null &&
                v.product_variant_sale_price !== undefined &&
                v.product_variant_sale_price > 0
        );
    };

    const clean = (str) => str?.replace(/^"|"$/g, "") || "—";

    if (loading) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner} />
                <span>Loading products</span>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Product Inventory</h1>
                    <p style={styles.subtitle}>{products.length} products total</p>
                </div>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead style={styles.thead}>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Product</th>
                            <th style={styles.th}>Category</th>
                            <th style={styles.th}>Collection</th>
                            <th style={styles.thCenter}>On Sale</th>
                            {sizes.map((s) => (
                                <th key={s} style={styles.thCenter}>{s}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => {
                            const onSale = isProductOnSale(p.product_id);
                            const isHovered = hoveredRow === p.product_id;
                            return (
                                <tr
                                    key={p.product_id}
                                    style={{
                                        ...styles.tr,
                                        background: isHovered ? "#f7f7f7" : "#fff",
                                        boxShadow: isHovered ? "inset 3px 0 0 #0a0a0a" : "inset 3px 0 0 transparent",
                                    }}
                                    onClick={() => navigate("/admin/admin-product-view?id=" + p.product_id)}
                                    onMouseEnter={() => setHoveredRow(p.product_id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td style={styles.td}>
                                        <span style={styles.idBadge}>#{p.product_id}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.productName}>{clean(p.product_name)}</span>
                                    </td>
                                    <td style={styles.td}>
                                        {p.product_category ? (
                                            <span style={styles.categoryTag}>{p.product_category}</span>
                                        ) : (
                                            <span style={{ color: "#ccc" }}>—</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {clean(p.product_collection) !== "—" ? (
                                            <span style={styles.collectionTag}>{clean(p.product_collection)}</span>
                                        ) : (
                                            <span style={{ color: "#ccc" }}>—</span>
                                        )}
                                    </td>
                                    <td style={styles.tdCenter}>
                                        {onSale ? (
                                            <span style={styles.saleBadgeTrue}>● Sale</span>
                                        ) : (
                                            <span style={styles.saleBadgeFalse}>—</span>
                                        )}
                                    </td>
                                    {sizes.map((s) => (
                                        <td key={s} style={styles.tdCenter}>
                                            <StockCell qty={getStock(p.product_id, s)} />
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}