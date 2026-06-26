import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";

// ─── HELPERS ───────────────────────────────────────────────────────────────
function formatPrice(p) {
    if (p === null || p === undefined || p === "") return "";
    return "₱" + Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function getTag(product, variantMap) {
    if (product.is_active == '0') {
        return { label: "INACTIVE", cls: "tag-inactive" };
    }

    if (product.has_variants == '1') {
        const variants = variantMap[product.product_id] || [];
        const totalQty = variants.reduce((sum, v) => sum + Number(v.product_variant_quantity || 0), 0);
        if (totalQty === 0) return { label: "SOLD OUT", cls: "tag-sold" };
        return null;
    }

    if (Number(product.product_quantity) === 0) {
        return { label: "SOLD OUT", cls: "tag-sold" };
    }

    return null;
}

// ─── GARMENT SVG PLACEHOLDER ───────────────────────────────────────────────
const GarmentPlaceholder = () => (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <path
            d="M35 8 C35 8 28 12 10 20 L18 38 L30 32 L30 90 L90 90 L90 32 L102 38 L110 20 C92 12 85 8 85 8 C82 16 75 22 60 22 C45 22 38 16 35 8Z"
            fill="#e8e6e0"
        />
        <path
            d="M35 8 C35 8 28 12 10 20 L18 38 L30 32 L30 90 L90 90 L90 32 L102 38 L110 20 C92 12 85 8 85 8 C82 16 75 22 60 22 C45 22 38 16 35 8Z"
            fill="none" stroke="#ccc" strokeWidth="1.5"
        />
        <text x="60" y="55" textAnchor="middle" fontSize="7" fill="#aaa" fontWeight="bold" fontStyle="italic">
            no image
        </text>
    </svg>
);

// ─── PRODUCT CARD ──────────────────────────────────────────────────────────
const ProductCard = ({ product, variants }) => {
    const [hovered, setHovered] = useState(false);
    const [frontError, setFrontError] = useState(false);
    const [backError, setBackError] = useState(false);
    const navigate = useNavigate();
    const tag = getTag(product, variants);

    const productVariants = variants[product.product_id] || [];

    let displayPrice, originalPrice, priceLabel;

    if (product.has_variants == '1') {
        const available = productVariants.filter(v => Number(v.product_variant_quantity) > 0);
        const cheapest = available.reduce((min, v) => {
            const vEffective = Number(v.product_variant_sale_price) > 0
                ? Number(v.product_variant_sale_price)
                : Number(v.product_variant_price);
            const minEffective = Number(min.product_variant_sale_price) > 0
                ? Number(min.product_variant_sale_price)
                : Number(min.product_variant_price);
            return vEffective < minEffective ? v : min;
        }, available[0]);

        if (cheapest) {
            const hasSalePrice = cheapest.product_variant_sale_price &&
                Number(cheapest.product_variant_sale_price) > 0;

            if (hasSalePrice) {
                originalPrice = formatPrice(cheapest.product_variant_price);
                displayPrice = formatPrice(cheapest.product_variant_sale_price);
            } else {
                displayPrice = formatPrice(cheapest.product_variant_price);
            }

            priceLabel = available.length > 1 ? `From ${displayPrice}` : displayPrice;
        } else {
            priceLabel = "Out of stock";
        }
    } else {
        const price = formatPrice(product.product_price);
        const discountPrice = product.product_discount_price ? formatPrice(product.product_discount_price) : "";
        displayPrice = discountPrice || price;
        originalPrice = discountPrice ? price : "";
        priceLabel = displayPrice || "—";
    }

    const hasFront = product.product_image_front && !frontError;
    const hasBack = product.product_image_back && !backError;
    console.log("IMAGE URL:", `${config.baseApi.replace('/api', '')}${product.product_image_front}`);


    return (
        <div
            className="na-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => navigate('/product?id=' + product.product_id)}
        >
            {/* ── IMAGE ── */}
            <div className="na-img-wrap">
                {tag && <span className={`na-tag ${tag.cls}`}>{tag.label}</span>}

                {hasFront ? (
                    <img
                        className="na-img na-img-front"
                        style={{ opacity: hovered && hasBack ? 0 : 1 }}
                        src={`${config.baseApi.replace('/api', '')}${product.product_image_front}`}
                        alt={product.product_name}
                    />
                ) : (
                    <div className="na-img na-img-front" style={{ opacity: hovered && hasBack ? 0 : 1 }}>
                        <GarmentPlaceholder />
                    </div>
                )}

                {hasBack && (
                    <img
                        className="na-img na-img-back"
                        style={{ opacity: hovered ? 1 : 0 }}
                        src={`${config.baseApi.replace('/api', '')}${product.product_image_back}`}
                        alt={`${product.product_name} back`}
                        onError={() => setBackError(true)}
                    />
                )}
            </div>

            {/* ── INFO ── */}
            <div className="na-info">
                <p className="na-name">{product.product_name || "—"}</p>
                <div className="na-price-wrap">
                    {originalPrice && <span className="na-original-price">{originalPrice}</span>}
                    <span className="na-price">{priceLabel || "—"}</span>
                </div>
            </div>
        </div>
    );
};

// ─── SKELETON LOADER ───────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="na-card">
        <div className="na-img-wrap">
            <div className="skeleton" style={{ position: "absolute", inset: 0 }} />
        </div>
        <div className="na-info">
            <div className="skeleton" style={{ height: 12, width: "70%", marginBottom: 8, borderRadius: 2 }} />
            <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 2 }} />
        </div>
    </div>
);

// ─── FILTER BAR ────────────────────────────────────────────────────────────
const FilterBar = ({ categories, active, onChange }) => (
    <div className="na-filter-bar">
        <button
            className={`na-filter-btn${active === null ? " active" : ""}`}
            onClick={() => onChange(null)}
        >
            All
        </button>
        {categories.map(cat => (
            <button
                key={cat}
                className={`na-filter-btn${active === cat ? " active" : ""}`}
                onClick={() => onChange(cat)}
            >
                {cat}
            </button>
        ))}
    </div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function ShopCatalog() {
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const [productsRes, variantsRes] = await Promise.all([
                    axios.get(`${config.baseApi}/product/get-all-products`),
                    axios.get(`${config.baseApi}/product/get-all-product-variant`),
                ]);

                console.log(productsRes.data)


                const variantMap = {};
                variantsRes.data.forEach(v => {
                    if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
                    variantMap[v.product_id].push(v);
                });
                console.log(variantMap)
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

    const activeProducts = products
        .filter(p => p.is_active != '0')
        .slice(-6)
        .reverse();

    return (
        <div className="na-page">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

        .na-page {
          min-height: 100vh;
          background: #fff;
          font-family: 'DM Sans', sans-serif;
          color: #111;
          padding: 0 0 80px;
        }

        /* ── HEADER ── */
        .na-header {
          text-align: center;
          padding: 88px 40px 32px;
    
          margin-bottom: 32px;
        }
        .na-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(36px, 6vw, 72px);
          letter-spacing: 0.12em;
          color: #111;
          line-height: 1;
          margin: 0 0 6px;
        }
        .na-count {
          font-size: 12px;
          color: #999;
          letter-spacing: 0.08em;
        }

        /* ── FILTER BAR ── */
        .na-filter-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          padding: 0 40px 32px;
        }
        .na-filter-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 16px;
          background: transparent;
          border: 1px solid #ddd;
          color: #999;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          border-radius: 0;
        }
        .na-filter-btn:hover { border-color: #111; color: #111; }
        .na-filter-btn.active { background: #111; border-color: #111; color: #fff; }

        /* ── GRID ── */
        .na-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin: 0 40px;
        }

        /* ── CARD ── */
        .na-card {
          position: relative;
          cursor: pointer;
          padding: 0 0 32px;
          border-right: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }
        .na-card:nth-child(3n) { border-right: none; }

        /* ── IMAGE ── */
        .na-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          background: #f9f9f7;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .na-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 24px;
          transition: opacity 0.35s ease;
        }
        .na-img-back { pointer-events: none; }

        /* ── TAG / BADGE ── */
        .na-tag {
          position: absolute;
          top: 12px;
          left: 12px;
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

        /* ── INFO ── */
        .na-info {
          padding: 0 16px;
          text-align: center;
        }
        .na-name {
          font-size: 13px;
          font-weight: 500;
          color: #111;
          line-height: 1.4;
          margin: 0 0 6px;
        }
        .na-price-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .na-original-price {
          font-size: 11px;
          color: #bbb;
          text-decoration: line-through;
        }
        .na-price {
          font-size: 14px;
          font-weight: 400;
          color: #555;
        }

        /* ── SKELETON ── */
        .skeleton {
          background: #f0f0f0;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ── STATES ── */
        .na-state {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          font-size: 13px;
          color: #bbb;
          letter-spacing: 0.06em;
        }

        /* ── FOOTER ── */
        .na-footer {
          text-align: center;
          padding: 32px 40px 0;
          border-top: 1px solid #eee;
          margin-top: 48px;
          font-size: 12px;
          color: #bbb;
          letter-spacing: 0.06em;
        }

        /* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .na-grid { grid-template-columns: repeat(2, 1fr); margin: 0 12px; }

  /* reset desktop 3n rule, apply 2-col rule */
  .na-card:nth-child(3n) { border-right: 1px solid #f0f0f0; }
  .na-card:nth-child(2n) { border-right: none; }

  /* remove bottom border on last row */
  .na-card:nth-last-child(-n+2) { border-bottom: none; }

  .na-header { padding: 32px 16px 24px; }
  .na-filter-bar { padding: 0 16px 24px; }
}
       .na-shop-btn {
  position: relative;
  display: inline-block;
  padding: 13px 48px;
  background-color: #000000;
  color: #ffffff;
  font-family: 'Georgia', serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  border: 2px solid #000000;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  transition: color 0.4s ease, border-color 0.4s ease;
}

.na-shop-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000000;
  transform: translateX(0%);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.na-shop-btn span {
  position: relative;
  z-index: 1;
  font-family: "Roboto", sans-serif;
}

.na-shop-btn:hover::before {
  transform: translateX(105%);
}

.na-shop-btn:hover {
  color: #000000;
  border-color: #000000;
  background-color: transparent;
}
      `}</style>

            {/* ── HEADER ── */}
            <div className="na-header">
                <h1 className="na-title">NEW ARRIVALS</h1>

            </div>


            {/* ── GRID ── */}
            <div className="na-grid">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                ) : error ? (
                    <div className="na-state">Could not load products — {error}</div>
                ) : activeProducts.length === 0 ? (
                    <div className="na-state">No products found.</div>
                ) : (
                    activeProducts.map(product => (
                        <ProductCard
                            key={product.product_id}
                            product={product}
                            variants={variants}

                        />
                    ))
                )}
            </div>

            {/* ── FOOTER ── */}
            {!loading && !error && (
                <div className="na-footer">
                    <button className="na-shop-btn" onClick={() => navigate('/all-product')}>
                        <span>View All</span>
                    </button>
                </div>
            )}
        </div>
    );
}