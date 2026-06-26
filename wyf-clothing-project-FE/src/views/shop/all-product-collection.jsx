

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../../config";
import { useNavigate, useSearchParams } from "react-router-dom";

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
        return null; // No tag for in-stock items
    }
    if (Number(product.product_quantity) === 0) return { label: "SOLD OUT", cls: "tag-sold" };
    return null; // No tag for in-stock items
}

// Get the cheapest variant with stock
function getCheapestVariant(variants) {
    if (!variants || variants.length === 0) return null;

    // Filter variants with quantity > 0
    const availableVariants = variants.filter(v => Number(v.product_variant_quantity) > 0);
    if (availableVariants.length === 0) return null;

    // Find the variant with the lowest price
    return availableVariants.reduce((cheapest, current) => {
        const currentPrice = Number(current.product_variant_price) || 0;
        const cheapestPrice = Number(cheapest.product_variant_price) || 0;
        return currentPrice < cheapestPrice ? current : cheapest;
    });
}

// Get all available variants with stock
function getAvailableVariants(variants) {
    if (!variants || variants.length === 0) return [];
    return variants.filter(v => Number(v.product_variant_quantity) > 0);
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

    const navigate = useNavigate();
    const tag = getTag(product, variants);

    // Get product variants
    const productVariants = variants[product.product_id] || [];

    // Get cheapest available variant
    const cheapestVariant = getCheapestVariant(productVariants);

    // Get all available variants (with stock)
    const availableVariants = getAvailableVariants(productVariants);

    // Determine display price
    let displayPrice = null;
    let originalPrice = null;
    let priceLabel = "";

    if (product.has_variants == '1') {
        // For products with variants
        if (cheapestVariant) {
            displayPrice = formatPrice(cheapestVariant.product_variant_price);
            // Check if there's a sale price and it's lower
            if (cheapestVariant.product_variant_sale_price &&
                Number(cheapestVariant.product_variant_sale_price) > 0 &&
                Number(cheapestVariant.product_variant_sale_price) < Number(cheapestVariant.product_variant_price)) {
                originalPrice = formatPrice(cheapestVariant.product_variant_price);
                displayPrice = formatPrice(cheapestVariant.product_variant_sale_price);
            }
            priceLabel = availableVariants.length > 1 ? `From ${displayPrice}` : displayPrice;
        } else {
            displayPrice = "Out of stock";
        }
    } else {
        // For products without variants (single product)
        const price = formatPrice(product.product_price);
        const discountPrice = product.product_discount_price ? formatPrice(product.product_discount_price) : "";
        displayPrice = discountPrice || price;
        originalPrice = discountPrice ? price : "";
        priceLabel = displayPrice || "—";
    }

    const hasFront = product.product_image_front && !frontError;
    const hasBack = product.product_image_back && !backError;

    const handleCardClick = () => {
        navigate(`/product?id=${product.product_id}`);
    };

    return (
        <div className="ap-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
        >
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
                    <span className="ap-price">{priceLabel || "—"}</span>
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
        case "oldest": return arr;
        case "newest": return arr.reverse();
        case "price-asc": return arr.sort((a, b) => Number(a.product_price) - Number(b.product_price));
        case "price-desc": return arr.sort((a, b) => Number(b.product_price) - Number(a.product_price));
        case "name-asc": return arr.sort((a, b) => (a.product_name || "").localeCompare(b.product_name || ""));
        case "name-desc": return arr.sort((a, b) => (b.product_name || "").localeCompare(a.product_name || ""));
        default: return arr.reverse();
    }
}

const Pagination = ({ page, totalPages, onChange }) => {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (page <= 3) {
            pages.push(1, 2, 3, "...", totalPages);
        } else if (page >= totalPages - 2) {
            pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, "...", page, "...", totalPages);
        }
        return pages;
    };

    return (
        <div className="ap-pagination">
            <button
                className="ap-page-btn ap-page-arrow"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
            >
                ‹
            </button>
            {getPages().map((p, i) =>
                p === "..." ? (
                    <span key={`ellipsis-${i}`} className="ap-page-ellipsis">…</span>
                ) : (
                    <button
                        key={p}
                        className={`ap-page-btn${page === p ? " ap-page-active" : ""}`}
                        onClick={() => onChange(p)}
                    >
                        {p}
                    </button>
                )
            )}
            <button
                className="ap-page-btn ap-page-arrow"
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
            >
                ›
            </button>
        </div>
    );
};

const ITEMS_PER_PAGE = 8;

export default function AllProductCollection() {
    const [searchParamsID] = useSearchParams();
    const collection_id = searchParamsID.get("id");

    const [page, setPage] = useState(1);
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cols, setCols] = useState(4);
    const [sort, setSort] = useState("newest");
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const sortRef = useRef(null);
    const filterRef = useRef(null);
    const [searchParams] = useSearchParams();

    // const category = searchParams.get('category');
    // const categoryDisplayName = category
    //     ? category.charAt(0).toUpperCase() + category.slice(1)
    //     : 'ALL PRODUCTS';



    const [collectionData, setCollectionData] = useState([])


    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/product/get-collection-by-id`, {
                    params: { id: collection_id }
                });
                const data = res.data || []
                setCollectionData(data)
                console.log(data)
            } catch (err) {
                console.log('UNable to fetch collection_master: ', err)
            }
        }
        fetch();
    }, [])



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

    useEffect(() => {
        function handleClick(e) {
            if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
            if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => { setPage(1); }, [sort]);

    const active = products.filter(p => p.is_active != '0');

    const filteredProducts =
        active.filter(p => {
            return p.product_collection === collectionData.collection_title;
        })
    //    

    const displayProducts = applySort(filteredProducts, sort);
    const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = displayProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || "Sort by";

    function handlePageChange(p) {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <div className="ap-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
                .layout {
                    overflow: hidden;
                    height: 100vh;
                }
                .ap-page {
                    min-height: 100vh;
                    background: #fff;
                    font-family: 'DM Sans', sans-serif;
                    color: #111;
                    padding: 0px 0px 150px;
                    margin-top: 100px;
                }
                .ap-header {
    text-align: center;
    padding: 80px 40px 48px;   /* increased vertical padding */
    border-bottom: 1px solid #eee;
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
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

                .ap-toolbar {
                    display: flex;
                    align-items: center;
                    border-bottom: 1px solid #eee;
                    position: sticky;
                    top: 90px;
                    background: #fff;
                    z-index: 50;
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

                .ap-grid {
                    display: grid;
                    gap: 0;
                    margin: 0 40px;
                }
                .ap-grid[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
                .ap-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
                .ap-grid[data-cols="6"] { grid-template-columns: repeat(6, 1fr); }

                .ap-card {
                    position: relative;
                    cursor: pointer;
                    padding: 0 0 32px;
                    border-right: 1px solid #f0f0f0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .ap-grid[data-cols="3"] .ap-card:nth-child(3n) { border-right: none; }
                .ap-grid[data-cols="4"] .ap-card:nth-child(4n) { border-right: none; }
                .ap-grid[data-cols="6"] .ap-card:nth-child(6n) { border-right: none; }

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
                    top: 12px;
                    left: 12px;
                    z-index: 2;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 3px 10px;
                    line-height: 1.4;
                }
                .tag-sold     { 
                    background: #111; 
                    color: #fff; 
                    border: none;
                }
                .tag-low      { background: #fff; border: 1px solid #d97706; color: #d97706; }
                .tag-inactive { background: #fff; border: 1px solid #ddd; color: #bbb; }
                .tag-instock  { 
                    background: #111; 
                    color: #fff; 
                    border: none;
                }
                .ap-info { padding: 0 16px; text-align: center; }
                .ap-name { 
                    font-size: 13px; 
                    font-weight: 500; 
                    color: #111; 
                    line-height: 1.4; 
                    margin: 0 0 6px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
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

                /* ── Pagination ── */
                .ap-pagination {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 48px 0 0;
                }
                .ap-page-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 32px;
                    height: 32px;
                    padding: 0 4px;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    color: #555;
                    cursor: pointer;
                    transition: color 0.15s, border-color 0.15s;
                }
                .ap-page-btn:hover:not(:disabled) { color: #111; }
                .ap-page-btn:disabled { color: #ccc; cursor: default; }
                .ap-page-active { color: #111; font-weight: 600; border-bottom: 2px solid #111; }
                .ap-page-arrow { font-size: 20px; color: #999; padding-bottom: 2px; }
                .ap-page-ellipsis { font-size: 13px; color: #bbb; padding: 0 4px; line-height: 32px; }

                @media (max-width: 768px) {
                    .ap-grid { margin: 0 16px; }
                    .ap-grid[data-cols="3"],
                    .ap-grid[data-cols="4"],
                    .ap-grid[data-cols="6"] { grid-template-columns: repeat(2, 1fr); }
                    .ap-grid .ap-card:nth-child(n)  { border-right: 1px solid #f0f0f0; }
                    .ap-grid .ap-card:nth-child(2n) { border-right: none; }
                    .ap-header { padding: 32px 16px 24px; }
                    .ap-sort-btn, .ap-filter-btn { padding: 0 14px; }
                }
            `}</style>

            <div
                className="ap-header"
                style={collectionData.collection_images ? {
                    backgroundImage: `url(${config.baseApi.replace('/api', '')}${collectionData.collection_images})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    position: "relative",
                } : {}}
            >
                {collectionData.collection_images && (
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        zIndex: 0,
                    }} />
                )}
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h1 className="ap-title" style={collectionData.collection_images ? { color: "#fff" } : {}}>
                        {collectionData.collection_title}
                    </h1>
                    {collectionData.collection_subtitle && (
                        <p style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "13px",
                            letterSpacing: "0.18em",
                            color: collectionData.collection_images ? "rgba(255,255,255,0.7)" : "#aaa",
                            textTransform: "uppercase",
                            margin: "0 0 6px",
                        }}>
                            {collectionData.collection_subtitle}
                        </p>
                    )}
                    {!loading && !error && (
                        <p className="ap-count" style={collectionData.collection_images ? { color: "rgba(255,255,255,0.55)" } : {}}>
                            {displayProducts.length} ITEMS
                        </p>
                    )}
                </div>
            </div>

            <div className="ap-toolbar">
                <div className="ap-toolbar-left">
                    {[
                        { n: 3, Icon: Icon3Col },
                        { n: 4, Icon: Icon4Col },
                        { n: 6, Icon: Icon5Col },
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

                <div className="ap-toolbar-right">
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
                ) : paginatedProducts.length === 0 ? (
                    <div className="ap-state">No products found.</div>
                ) : (
                    paginatedProducts.map(product => (
                        <ProductCard key={product.product_id} product={product} variants={variants} />
                    ))
                )}
            </div>

            {!loading && !error && (
                <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            )}
        </div>
    );
}