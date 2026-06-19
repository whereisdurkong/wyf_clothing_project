import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../../config";

function formatPrice(p) {
    if (p === null || p === undefined || p === "") return "";
    return "₱" + Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function getTag(product, variantMap) {
    if (product.is_active == '0') return { label: "INACTIVE", cls: "tag-inactive" };
    if (product.has_variants == '1') {
        const variants = variantMap[product.product_id] || [];
        const totalQty = variants.reduce((sum, v) => sum + Number(v.product_variant_quantity || 0), 0);
        if (totalQty === 0) return { label: "SOLD OUT", cls: "tag-sold" };
        return null;
    }
    if (Number(product.product_quantity) === 0) return { label: "SOLD OUT", cls: "tag-sold" };
    return null;
}

const GarmentPlaceholder = () => (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <path d="M35 8 C35 8 28 12 10 20 L18 38 L30 32 L30 90 L90 90 L90 32 L102 38 L110 20 C92 12 85 8 85 8 C82 16 75 22 60 22 C45 22 38 16 35 8Z" fill="#e8e6e0" />
        <path d="M35 8 C35 8 28 12 10 20 L18 38 L30 32 L30 90 L90 90 L90 32 L102 38 L110 20 C92 12 85 8 85 8 C82 16 75 22 60 22 C45 22 38 16 35 8Z" fill="none" stroke="#ccc" strokeWidth="1.5" />
        <text x="60" y="55" textAnchor="middle" fontSize="7" fill="#aaa" fontWeight="bold" fontStyle="italic">no image</text>
    </svg>
);

const Icon3Col = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="4" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="7" y="1" width="4" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="13" y="1" width="4" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
    </svg>
);

const Icon4Col = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="3" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="5.5" y="1" width="3" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="10" y="1" width="3" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="14.5" y="1" width="3" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
    </svg>
);

const Icon5Col = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="2.2" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="4.5" y="1" width="2.2" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="7.9" y="1" width="2.2" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="11.3" y="1" width="2.2" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
        <rect x="14.7" y="1" width="2.2" height="16" rx="0.5" fill={active ? "#111" : "#bbb"} />
    </svg>
);

const ChevronDown = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M2 4L5.5 7.5L9 4" stroke="#555" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A–Z" },
    { value: "name-desc", label: "Name: Z–A" },
];

const ProductCard = ({ product, variants }) => {
    const [hovered, setHovered] = useState(false);
    const [frontError, setFrontError] = useState(false);
    const [backError, setBackError] = useState(false);

    const tag = getTag(product, variants);
    const price = formatPrice(product.product_price);
    const discountPrice = product.product_discount_price ? formatPrice(product.product_discount_price) : "";
    const displayPrice = discountPrice || price;
    const originalPrice = discountPrice ? price : "";
    const hasFront = product.product_image_front && !frontError;
    const hasBack = product.product_image_back && !backError;

    return (
        <div className="ap-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div className="ap-img-wrap">
                {tag && <span className={`ap-tag ${tag.cls}`}>{tag.label}</span>}
                {hasFront ? (
                    <img
                        className="ap-img ap-img-front"
                        style={{ opacity: hovered && hasBack ? 0 : 1 }}
                        src={`${config.baseApi.replace('/api', '')}${product.product_image_front}`}
                        alt={product.product_name}
                        onError={() => setFrontError(true)}
                    />
                ) : (
                    <div className="ap-img ap-img-front" style={{ opacity: hovered && hasBack ? 0 : 1 }}>
                        <GarmentPlaceholder />
                    </div>
                )}
                {hasBack && (
                    <img
                        className="ap-img ap-img-back"
                        style={{ opacity: hovered ? 1 : 0 }}
                        src={`${config.baseApi.replace('/api', '')}${product.product_image_back}`}
                        alt={`${product.product_name} back`}
                        onError={() => setBackError(true)}
                    />
                )}
            </div>
            <div className="ap-info">
                <p className="ap-name">{product.product_name || "—"}</p>
                <div className="ap-price-wrap">
                    {originalPrice && <span className="ap-original-price">{originalPrice}</span>}
                    <span className="ap-price">{displayPrice || "—"}</span>
                </div>
            </div>
        </div>
    );
};

const SkeletonCard = () => (
    <div className="ap-card">
        <div className="ap-img-wrap">
            <div className="skeleton" style={{ position: "absolute", inset: 0 }} />
        </div>
        <div className="ap-info">
            <div className="skeleton" style={{ height: 12, width: "70%", marginBottom: 8, borderRadius: 2 }} />
            <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 2 }} />
        </div>
    </div>
);

function applySort(products, sort) {
    const arr = [...products];
    switch (sort) {
        case "oldest": return arr; // already ascending by ID
        case "newest": return arr.reverse();
        case "price-asc": return arr.sort((a, b) => Number(a.product_price) - Number(b.product_price));
        case "price-desc": return arr.sort((a, b) => Number(b.product_price) - Number(a.product_price));
        case "name-asc": return arr.sort((a, b) => (a.product_name || "").localeCompare(b.product_name || ""));
        case "name-desc": return arr.sort((a, b) => (b.product_name || "").localeCompare(a.product_name || ""));
        default: return arr.reverse();
    }
}

export default function AllProduct() {
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cols, setCols] = useState(3);
    const [sort, setSort] = useState("newest");
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const sortRef = useRef(null);
    const filterRef = useRef(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true); setError(null);
                const [productsRes, variantsRes] = await Promise.all([
                    axios.get(`${config.baseApi}/product/get-all-products`),
                    axios.get(`${config.baseApi}/product/get-all-product-variant`),
                ]);
                const variantMap = {};
                variantsRes.data.forEach(v => {
                    if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
                    variantMap[v.product_id].push(v);
                });
                setProducts(productsRes.data);
                setVariants(variantMap);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // close dropdowns on outside click
    useEffect(() => {
        function handleClick(e) {
            if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
            if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const active = products.filter(p => p.is_active != '0');
    const displayProducts = applySort(active, sort);
    const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || "Sort by";

    return (
        <div className="ap-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

                .ap-page {
                    min-height: 100vh;
                    background: #fff;
                    font-family: 'DM Sans', sans-serif;
                    color: #111;
                    padding: 0 0 80px;
                    margin-top: 100px;
                }
                .ap-header {
                    text-align: center;
                    padding: 48px 40px 32px;
                    border-bottom: 1px solid #eee;
                }
                .ap-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: clamp(36px, 6vw, 72px);
                    letter-spacing: 0.12em;
                    color: #111;
                    line-height: 1;
                    margin: 0 0 6px;
                }
                .ap-count { font-size: 12px; color: #999; letter-spacing: 0.08em; }

                /* ── toolbar ── */
                .ap-toolbar {
                    display: flex;
                    align-items: center;
                    border-bottom: 1px solid #eee;
                }
                .ap-toolbar-left {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    padding: 0 16px;
                    border-right: 1px solid #eee;
                    height: 48px;
                }
                .ap-toolbar-right {
                    display: flex;
                    align-items: center;
                    margin-left: auto;
                }
                .ap-layout-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-radius: 3px;
                    padding: 0;
                    transition: background 0.15s;
                }
                .ap-layout-btn:hover { background: #f5f5f5; }
                .ap-layout-btn.active { background: #f0f0f0; }

                /* Sort by */
                .ap-sort-wrap {
                    position: relative;
                    height: 48px;
                    border-left: 1px solid #eee;
                }
                .ap-sort-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    height: 100%;
                    padding: 0 24px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 12px;
                    color: #555;
                    letter-spacing: 0.04em;
                    white-space: nowrap;
                    transition: background 0.15s;
                }
                .ap-sort-btn:hover { background: #fafafa; }
                .ap-sort-dropdown {
                    position: absolute;
                    top: calc(100% + 1px);
                    right: 0;
                    min-width: 180px;
                    background: #fff;
                    border: 1px solid #eee;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
                    z-index: 100;
                }
                .ap-sort-option {
                    display: block;
                    width: 100%;
                    padding: 10px 18px;
                    background: transparent;
                    border: none;
                    text-align: left;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 12px;
                    color: #555;
                    cursor: pointer;
                    letter-spacing: 0.03em;
                    transition: background 0.1s;
                }
                .ap-sort-option:hover  { background: #f7f7f7; }
                .ap-sort-option.active { color: #111; font-weight: 600; }

                /* Filter */
                .ap-filter-wrap {
                    position: relative;
                    height: 48px;
                    border-left: 1px solid #eee;
                }
                .ap-filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    height: 100%;
                    padding: 0 24px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 12px;
                    color: #555;
                    letter-spacing: 0.04em;
                    transition: background 0.15s;
                }
                .ap-filter-btn:hover { background: #fafafa; }
                .ap-filter-panel {
                    position: absolute;
                    top: calc(100% + 1px);
                    right: 0;
                    width: 240px;
                    background: #fff;
                    border: 1px solid #eee;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
                    z-index: 100;
                    padding: 20px;
                }
                .ap-filter-title {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.12em;
                    color: #999;
                    text-transform: uppercase;
                    margin: 0 0 12px;
                }
                .ap-filter-option {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin-bottom: 9px;
                    cursor: pointer;
                    font-size: 12px;
                    color: #444;
                }
                .ap-filter-option input { accent-color: #111; cursor: pointer; }

                /* ── grid ── */
                .ap-grid {
                    display: grid;
                    gap: 0;
                    margin: 0 40px;
                }
                .ap-grid[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
                .ap-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
                .ap-grid[data-cols="5"] { grid-template-columns: repeat(5, 1fr); }

                .ap-card {
                    position: relative;
                    cursor: pointer;
                    padding: 0 0 32px;
                    border-right: 1px solid #f0f0f0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .ap-grid[data-cols="3"] .ap-card:nth-child(3n) { border-right: none; }
                .ap-grid[data-cols="4"] .ap-card:nth-child(4n) { border-right: none; }
                .ap-grid[data-cols="5"] .ap-card:nth-child(5n) { border-right: none; }

                .ap-img-wrap {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    background: #f9f9f7;
                    overflow: hidden;
                    margin-bottom: 14px;
                }
                .ap-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    padding: 24px;
                    transition: opacity 0.35s ease;
                }
                .ap-img-back { pointer-events: none; }
                .ap-tag {
                    position: absolute;
                    top: 12px; left: 12px;
                    z-index: 2;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 3px 8px;
                    line-height: 1.4;
                }
                .tag-sold     { background: #fff; border: 1px solid #ddd; color: #999; }
                .tag-low      { background: #fff; border: 1px solid #d97706; color: #d97706; }
                .tag-inactive { background: #fff; border: 1px solid #ddd; color: #bbb; }
                .ap-info { padding: 0 16px; text-align: center; }
                .ap-name { font-size: 13px; font-weight: 500; color: #111; line-height: 1.4; margin: 0 0 6px; }
                .ap-price-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
                .ap-original-price { font-size: 11px; color: #bbb; text-decoration: line-through; }
                .ap-price { font-size: 14px; font-weight: 400; color: #555; }
                .skeleton { background: #f0f0f0; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .ap-state {
                    grid-column: 1 / -1;
                    display: flex; align-items: center; justify-content: center;
                    padding: 80px 0;
                    font-size: 13px; color: #bbb; letter-spacing: 0.06em;
                }

                @media (max-width: 768px) {
                    .ap-grid { margin: 0 16px; }
                    .ap-grid[data-cols="3"],
                    .ap-grid[data-cols="4"],
                    .ap-grid[data-cols="5"] { grid-template-columns: repeat(2, 1fr); }
                    .ap-grid .ap-card:nth-child(n)  { border-right: 1px solid #f0f0f0; }
                    .ap-grid .ap-card:nth-child(2n) { border-right: none; }
                    .ap-header { padding: 32px 16px 24px; }
                    .ap-sort-btn, .ap-filter-btn { padding: 0 14px; }
                }
            `}</style>

            <div className="ap-header">
                <h1 className="ap-title">ALL PRODUCTS</h1>
                {!loading && !error && <p className="ap-count">{displayProducts.length} ITEMS</p>}
            </div>

            {/* ── toolbar ── */}
            <div className="ap-toolbar">
                {/* layout icons */}
                <div className="ap-toolbar-left">
                    {[
                        { n: 3, Icon: Icon3Col },
                        { n: 4, Icon: Icon4Col },
                        { n: 5, Icon: Icon5Col },
                    ].map(({ n, Icon }) => (
                        <button
                            key={n}
                            className={`ap-layout-btn${cols === n ? " active" : ""}`}
                            onClick={() => setCols(n)}
                            title={`${n} columns`}
                        >
                            <Icon active={cols === n} />
                        </button>
                    ))}
                </div>

                {/* right side */}
                <div className="ap-toolbar-right">
                    {/* Sort by */}
                    <div className="ap-sort-wrap" ref={sortRef}>
                        <button className="ap-sort-btn" onClick={() => { setSortOpen(o => !o); setFilterOpen(false); }}>
                            Sort by &nbsp;<span style={{ color: "#111", fontWeight: 500 }}>{sortLabel}</span>
                            <ChevronDown />
                        </button>
                        {sortOpen && (
                            <div className="ap-sort-dropdown">
                                {SORT_OPTIONS.map(o => (
                                    <button
                                        key={o.value}
                                        className={`ap-sort-option${sort === o.value ? " active" : ""}`}
                                        onClick={() => { setSort(o.value); setSortOpen(false); }}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter */}
                    <div className="ap-filter-wrap" ref={filterRef}>
                        <button className="ap-filter-btn" onClick={() => { setFilterOpen(o => !o); setSortOpen(false); }}>
                            <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                                <line x1="0" y1="1.5" x2="13" y2="1.5" stroke="#555" strokeWidth="1.3" />
                                <line x1="2" y1="5.5" x2="11" y2="5.5" stroke="#555" strokeWidth="1.3" />
                                <line x1="4" y1="9.5" x2="9" y2="9.5" stroke="#555" strokeWidth="1.3" />
                            </svg>
                            Filter
                        </button>
                        {filterOpen && (
                            <div className="ap-filter-panel">
                                <p className="ap-filter-title">Availability</p>
                                <label className="ap-filter-option">
                                    <input type="checkbox" defaultChecked /> In Stock
                                </label>
                                <label className="ap-filter-option">
                                    <input type="checkbox" /> Sold Out
                                </label>
                                <p className="ap-filter-title" style={{ marginTop: 16 }}>Type</p>
                                <label className="ap-filter-option">
                                    <input type="checkbox" defaultChecked /> With Variants
                                </label>
                                <label className="ap-filter-option">
                                    <input type="checkbox" defaultChecked /> Single
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="ap-grid" data-cols={cols}>
                {loading ? (
                    Array.from({ length: cols * 2 }).map((_, i) => <SkeletonCard key={i} />)
                ) : error ? (
                    <div className="ap-state">Could not load products — {error}</div>
                ) : displayProducts.length === 0 ? (
                    <div className="ap-state">No products found.</div>
                ) : (
                    displayProducts.map(product => (
                        <ProductCard key={product.product_id} product={product} variants={variants} />
                    ))
                )}
            </div>
        </div>
    );
}