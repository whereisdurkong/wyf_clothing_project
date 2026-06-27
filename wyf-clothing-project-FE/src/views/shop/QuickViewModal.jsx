import { useState, useEffect, useRef } from "react";
import config from "../../config";
import FeatherIcon from "feather-icons-react";
import { useCartFly } from "../../components/CartFlyContext";

function formatPrice(p) {
    if (p === null || p === undefined || p === "") return "";
    return "₱" + Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function getCheapestVariant(variants) {
    if (!variants || variants.length === 0) return null;
    const available = variants.filter(v => Number(v.product_variant_quantity) > 0);
    if (available.length === 0) return null;
    return available.reduce((cheapest, current) =>
        Number(current.product_variant_price) < Number(cheapest.product_variant_price)
            ? current : cheapest
    );
}

const SIZE_LABEL_MAP = {
    xs: "XS", s: "S", m: "M", l: "L",
    xl: "XL", xxl: "2XL", xxxl: "3XL", one_size: "One Size",
};

function getSizeLabel(sizeKey) {
    return SIZE_LABEL_MAP[sizeKey?.toLowerCase()] ?? sizeKey?.toUpperCase() ?? "—";
}

function Stars({ rating }) {
    const filled = Math.round(parseFloat(rating) || 0);
    return (
        <div style={{ display: "flex", gap: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 13 13" fill={i <= filled ? "#111" : "none"} stroke={i <= filled ? "#111" : "#ccc"} strokeWidth="1">
                    <polygon points="6.5,1 8.2,4.5 12,5.1 9.3,7.7 9.9,11.5 6.5,9.7 3.1,11.5 3.7,7.7 1,5.1 4.8,4.5" />
                </svg>
            ))}
        </div>
    );
}

const GarmentPlaceholder = () => (
    <svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "60%", height: "60%", opacity: 0.18 }}>
        <path d="M35 8 C35 8 28 12 10 20 L18 38 L30 32 L30 90 L90 90 L90 32 L102 38 L110 20 C92 12 85 8 85 8 C82 16 75 22 60 22 C45 22 38 16 35 8Z" fill="#111" />
    </svg>
);

export default function QuickViewModal({ product, variants: allVariants, onClose, onAddToCart }) {
    const productVariants = allVariants[product.product_id] || [];
    const hasVariants = product.has_variants == "1";

    const { flyToCart } = useCartFly();
    const addToCartBtnRef = useRef(null);

    const [selectedVariant, setSelectedVariant] = useState(() =>
        hasVariants ? getCheapestVariant(productVariants) : null
    );
    const [quantity, setQuantity] = useState(1);
    const [activeIndex, setActiveIndex] = useState(0);
    const [animDir, setAnimDir] = useState(null);
    const [animKey, setAnimKey] = useState(0);
    const [addedFeedback, setAddedFeedback] = useState(false);
    const [imgError, setImgError] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const overlayRef = useRef(null);
    const touchStartX = useRef(null);

    const getImages = () => {
        let extras = [];
        try { extras = JSON.parse(product.product_images || "[]"); } catch { extras = []; }
        return [
            { src: product.product_image_front, label: "Front" },
            { src: product.product_image_back, label: "Back" },
            ...extras.map((img, i) => ({ src: img, label: `View ${i + 1}` })),
        ].filter(img => img.src);
    };
    const images = getImages();
    const activeImage = images[activeIndex]?.src || null;

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Price logic
    let displayPrice = "—";
    let originalPrice = null;
    let stockQty = 0;
    let isSoldOut = false;
    let salePercentage = null;

    if (hasVariants) {
        const cheapest = getCheapestVariant(productVariants);
        const availableVariants = productVariants.filter(v => Number(v.product_variant_quantity) > 0);
        const src = selectedVariant || cheapest;
        if (src) {
            const hasSale = src.product_variant_sale_price &&
                Number(src.product_variant_sale_price) > 0 &&
                Number(src.product_variant_sale_price) < Number(src.product_variant_price);
            if (hasSale) {
                const cur = Number(src.product_variant_sale_price);
                const reg = Number(src.product_variant_price);
                salePercentage = Math.round(((reg - cur) / reg) * 100);
                displayPrice = formatPrice(cur);
                originalPrice = formatPrice(reg);
            } else {
                displayPrice = formatPrice(src.product_variant_price);
            }
            stockQty = Number(src.product_variant_quantity || 0);
            if (!selectedVariant && availableVariants.length > 1) displayPrice = `From ${displayPrice}`;
        } else {
            displayPrice = "Out of stock";
            isSoldOut = true;
        }
    } else {
        const basePrice = Number(product.product_price);
        const discountPrice = product.product_discount_price ? Number(product.product_discount_price) : null;
        if (discountPrice && discountPrice < basePrice) {
            salePercentage = Math.round(((basePrice - discountPrice) / basePrice) * 100);
            displayPrice = formatPrice(discountPrice);
            originalPrice = formatPrice(basePrice);
        } else {
            displayPrice = formatPrice(basePrice);
        }
        stockQty = Number(product.product_quantity || 0);
        isSoldOut = stockQty === 0;
    }

    const handleThumb = (index, dir = "right") => {
        if (index === activeIndex) return;
        setAnimDir(dir);
        setAnimKey(k => k + 1);
        setActiveIndex(index);
    };

    const handleQuantity = (delta) => {
        setQuantity(prev => Math.max(1, Math.min(stockQty || 99, prev + delta)));
    };

    const handleAddToCart = () => {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const cartItem = {
            product_id: product.product_id,
            quantity,
            variant_size: selectedVariant ? getSizeLabel(selectedVariant.product_variant_size) : null,
        };
        const existingIndex = cart.findIndex(
            item => item.product_id === cartItem.product_id && item.variant_size === cartItem.variant_size
        );
        if (existingIndex !== -1) cart[existingIndex].quantity += quantity;
        else cart.push(cartItem);
        localStorage.setItem("cart", JSON.stringify(cart));
        if (onAddToCart) onAddToCart(cartItem);
        setAddedFeedback(true);
        setTimeout(() => setAddedFeedback(false), 2000);

        // 🚀 fly to cart
        flyToCart(
            activeImage ? `${config.baseApi.replace("/api", "")}${activeImage}` : null,
            addToCartBtnRef.current
        );
    };

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 44) {
            if (diff > 0) handleThumb((activeIndex - 1 + images.length) % images.length, "left");
            else handleThumb((activeIndex + 1) % images.length, "right");
        }
        touchStartX.current = null;
    };

    const imgBase = config.baseApi.replace("/api", "");
    const SIZES = ["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size"];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

                .qv-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.55);
                    backdrop-filter: blur(3px);
                    -webkit-backdrop-filter: blur(3px);
                    z-index: 1200;
                    display: flex; align-items: center; justify-content: center;
                    padding: 16px;
                    animation: qvFadeIn 0.2s ease both;
                    font-family: 'DM Sans', sans-serif;
                }
                @media (max-width: 639px) {
                    .qv-overlay { align-items: flex-end; padding: 0; }
                }

                @keyframes qvFadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes qvSlideUp {
                    from { opacity:0; transform: translateY(32px) scale(0.985); }
                    to   { opacity:1; transform: translateY(0) scale(1); }
                }
                @keyframes qvSheetUp {
                    from { transform: translateY(100%); }
                    to   { transform: translateY(0); }
                }
                @keyframes imgIn {
                    from { opacity:0; transform: translateX(var(--tx, 30px)); }
                    to   { opacity:1; transform: translateX(0); }
                }
                @keyframes checkBounce {
                    0%   { transform: scale(0); opacity:0; }
                    55%  { transform: scale(1.25); opacity:1; }
                    100% { transform: scale(1); opacity:1; }
                }

                .qv-modal {
                    position: relative;
                    background: #fff;
                    width: 100%;
                    max-width: 880px;
                    max-height: 88vh;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    animation: qvSlideUp 0.28s cubic-bezier(.25,.8,.25,1) both;
                    overflow: hidden;
                }
                @media (max-width: 639px) {
                    .qv-modal {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto 1fr;
                        max-height: 92vh;
                        border-radius: 18px 18px 0 0;
                        animation: qvSheetUp 0.32s cubic-bezier(.25,.8,.25,1) both;
                    }
                }

                /* Image panel */
                .qv-image-panel {
                    background: #f5f5f3;
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                }
                @media (max-width: 639px) {
                    .qv-image-panel { max-height: 56vw; min-height: 220px; }
                }

                .qv-main-img-wrap {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    min-height: 0;
                }

                .qv-main-img {
                    width: 100%; height: 100%;
                    object-fit: contain;
                    padding: 20px;
                    --tx: 30px;
                    animation: imgIn 0.26s cubic-bezier(.25,.8,.25,1) both;
                }
                .qv-main-img.left  { --tx: -30px; }
                .qv-main-img.right { --tx:  30px; }

                .qv-arrow {
                    position: absolute; top: 50%;
                    transform: translateY(-50%);
                    width: 30px; height: 30px;
                    border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.12);
                    background: rgba(255,255,255,0.9);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #333; z-index: 4;
                    transition: background 0.15s, border-color 0.15s;
                    backdrop-filter: blur(4px);
                }
                .qv-arrow:hover { background: #fff; border-color: #bbb; }
                .qv-arrow.left  { left: 10px; }
                .qv-arrow.right { right: 10px; }

                /* Thumbnail strip */
                .qv-thumbs {
                    display: flex; gap: 6px;
                    padding: 10px 14px;
                    background: #fff;
                    border-top: 1px solid #ebebeb;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .qv-thumbs::-webkit-scrollbar { display: none; }

                .qv-thumb {
                    flex-shrink: 0;
                    width: 46px; height: 46px;
                    border: 1.5px solid transparent;
                    background: #f5f5f3;
                    cursor: pointer;
                    overflow: hidden;
                    transition: border-color 0.15s, opacity 0.15s;
                    opacity: 0.6;
                }
                .qv-thumb.active { border-color: #111; opacity: 1; }
                .qv-thumb:hover:not(.active) { opacity: 0.85; border-color: #ccc; }
                .qv-thumb img { width:100%; height:100%; object-fit: cover; }

                /* Dots */
                .qv-dots {
                    display: flex; gap: 5px; justify-content: center;
                    padding: 8px 0 10px;
                    background: #fff;
                }
                .qv-dot {
                    height: 5px; border-radius: 3px;
                    border: none; padding: 0; cursor: pointer;
                    transition: width 0.25s ease, background 0.25s ease;
                    background: #ddd;
                }
                .qv-dot.active { background: #111; width: 20px !important; }

                /* Info panel */
                .qv-info-panel {
                    display: flex; flex-direction: column; gap: 0;
                    overflow-y: auto;
                    min-height: 0;
                }
                @media (max-width: 639px) {
                    .qv-info-panel { max-height: 50vh; }
                }

                .qv-info-inner {
                    padding: 28px 28px 24px;
                    display: flex; flex-direction: column; gap: 16px;
                }
                @media (max-width: 639px) {
                    .qv-info-inner { padding: 20px 18px 28px; gap: 14px; }
                }

                /* Close btn */
                .qv-close {
                    position: absolute; top: 12px; right: 12px;
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    border: 1px solid rgba(0,0,0,0.12);
                    background: rgba(255,255,255,0.95);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #444; z-index: 20;
                    transition: background 0.15s, color 0.15s;
                    backdrop-filter: blur(4px);
                }
                .qv-close:hover { background: #111; color: #fff; border-color: #111; }

                /* drag handle mobile */
                .qv-handle {
                    display: none;
                    width: 36px; height: 4px;
                    background: #ddd; border-radius: 2px;
                    margin: 10px auto 0;
                }
                @media (max-width: 639px) { .qv-handle { display: block; } }

                /* Size buttons */
                .qv-size {
                    min-width: 48px; height: 36px;
                    padding: 0 10px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 12px; font-weight: 500;
                    letter-spacing: 0.04em;
                    border: 1px solid #ddd;
                    background: #fff; color: #111;
                    cursor: pointer;
                    position: relative; overflow: hidden;
                    transition: border-color 0.15s, background 0.15s, color 0.15s;
                }
                .qv-size.selected { background: #111; color: #fff; border-color: #111; }
                .qv-size.oos { color: #c8c8c8; border-color: #ebebeb; cursor: not-allowed; }
                .qv-size:hover:not(.selected):not(.oos) { border-color: #888; }

                /* Qty */
                .qv-qty-row {
                    display: flex; align-items: center;
                    border: 1px solid #e0e0e0;
                    width: fit-content;
                    height: 40px;
                }
                .qv-qty-btn {
                    width: 38px; height: 40px;
                    border: none; background: transparent;
                    font-size: 17px; color: #111;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.12s;
                }
                .qv-qty-btn:hover { background: #f5f5f5; }
                .qv-qty-val {
                    min-width: 36px; text-align: center;
                    font-size: 13px; font-weight: 500; color: #111;
                    border-left: 1px solid #e0e0e0;
                    border-right: 1px solid #e0e0e0;
                    height: 100%;
                    display: flex; align-items: center; justify-content: center;
                }

                /* Buttons */
                .qv-btn-add {
                    width: 100%; height: 46px;
                    border: 1.5px solid #111;
                    background: #fff; color: #111;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px; font-weight: 600;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    cursor: pointer;
                    position: relative; overflow: hidden;
                    transition: color 0.28s cubic-bezier(.25,.8,.25,1);
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .qv-btn-add::before {
                    content: '';
                    position: absolute; inset: 0;
                    background: #111;
                    transform: scaleX(0); transform-origin: right;
                    transition: transform 0.28s cubic-bezier(.25,.8,.25,1);
                    z-index: 0;
                }
                .qv-btn-add:hover::before { transform: scaleX(1); transform-origin: left; }
                .qv-btn-add:hover { color: #fff; }
                .qv-btn-add:disabled { opacity: 0.4; cursor: not-allowed; }
                .qv-btn-add:disabled::before { display: none; }
                .qv-btn-add span { position: relative; z-index: 1; display: flex; align-items: center; gap: 7px; }
                .qv-btn-add.added::before { transform: scaleX(1); transform-origin: left; }
                .qv-btn-add.added { color: #fff; }

                .qv-btn-buy {
                    width: 100%; height: 46px;
                    border: 1.5px solid #111;
                    background: #111; color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px; font-weight: 600;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    cursor: pointer;
                    position: relative; overflow: hidden;
                    transition: color 0.28s cubic-bezier(.25,.8,.25,1);
                }
                .qv-btn-buy::before {
                    content: '';
                    position: absolute; inset: 0;
                    background: #fff;
                    transform: scaleX(0); transform-origin: right;
                    transition: transform 0.28s cubic-bezier(.25,.8,.25,1);
                    z-index: 0;
                }
                .qv-btn-buy:hover::before { transform: scaleX(1); transform-origin: left; }
                .qv-btn-buy:hover { color: #111; }
                .qv-btn-buy:disabled { opacity: 0.4; cursor: not-allowed; }
                .qv-btn-buy:disabled::before { display: none; }
                .qv-btn-buy span { position: relative; z-index: 1; }

                .check-bounce { animation: checkBounce 0.35s cubic-bezier(.25,.8,.25,1) both; }

                .qv-divider { border: none; border-top: 1px solid #ebebeb; margin: 0; }

                .qv-stock-chip {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 11px; font-weight: 500; letter-spacing: 0.03em;
                    padding: 3px 9px;
                    border-radius: 2px;
                }
                .qv-stock-chip.low  { background: #fff8ed; color: #c07700; border: 1px solid #f5dfa0; }
                .qv-stock-chip.ok   { background: #f0faf4; color: #267a46; border: 1px solid #b6e5c8; }
                .qv-stock-chip.sold { background: #111; color: #fff; }

                .qv-view-link {
                    font-size: 11px; color: #888;
                    text-decoration: none;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 1px;
                    transition: color 0.15s, border-color 0.15s;
                }
                .qv-view-link:hover { color: #111; border-color: #111; }

                .qv-sale-badge {
                    font-size: 10px; font-weight: 700;
                    letter-spacing: 0.06em; text-transform: uppercase;
                    color: #b91c1c; background: #fef2f2;
                    border: 1px solid #fecaca;
                    padding: 2px 7px;
                }

                @media (max-width: 639px) {
                    .qv-arrow { display: none; }
                }
            `}</style>

            <div
                ref={overlayRef}
                className="qv-overlay"
                onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            >
                <div className="qv-modal">
                    {/* drag handle (mobile only) */}
                    <div className="qv-handle" />

                    {/* Close */}
                    <button className="qv-close" onClick={onClose} aria-label="Close">
                        <FeatherIcon icon="x" size={14} />
                    </button>

                    {/* ── LEFT: Image panel ── */}
                    <div className="qv-image-panel">
                        <div
                            className="qv-main-img-wrap"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {activeImage && !imgError[activeIndex] ? (
                                <img
                                    key={animKey}
                                    src={`${imgBase}${activeImage}`}
                                    alt={product.product_name}
                                    className={`qv-main-img ${animDir || ""}`}
                                    onAnimationEnd={() => setAnimDir(null)}
                                    onError={() => setImgError(prev => ({ ...prev, [activeIndex]: true }))}
                                    draggable={false}
                                />
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                                    <GarmentPlaceholder />
                                </div>
                            )}

                            {/* sold out overlay ribbon */}
                            {isSoldOut && (
                                <div style={{
                                    position: "absolute", top: 14, left: 0,
                                    background: "#111", color: "#fff",
                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                                    padding: "4px 14px",
                                }}>SOLD OUT</div>
                            )}

                            {images.length > 1 && (
                                <>
                                    <button className="qv-arrow left" onClick={() => handleThumb((activeIndex - 1 + images.length) % images.length, "left")}>
                                        <FeatherIcon icon="chevron-left" size={13} />
                                    </button>
                                    <button className="qv-arrow right" onClick={() => handleThumb((activeIndex + 1) % images.length, "right")}>
                                        <FeatherIcon icon="chevron-right" size={13} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="qv-thumbs">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        className={`qv-thumb ${activeIndex === i ? "active" : ""}`}
                                        onClick={() => handleThumb(i, i > activeIndex ? "right" : "left")}
                                        aria-label={`View ${img.label}`}
                                    >
                                        <img src={`${imgBase}${img.src}`} alt={img.label} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Dots */}
                        {images.length > 1 && (
                            <div className="qv-dots">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`qv-dot ${activeIndex === i ? "active" : ""}`}
                                        style={{ width: activeIndex === i ? 20 : 5 }}
                                        onClick={() => handleThumb(i, i > activeIndex ? "right" : "left")}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Info panel ── */}
                    <div className="qv-info-panel">
                        <div className="qv-info-inner">

                            {/* Brand + Name */}
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 5px" }}>
                                    Where You From?
                                </p>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", lineHeight: 1.25, margin: 0 }}>
                                    {product.product_name}
                                </h2>
                            </div>

                            {/* Price row */}
                            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>
                                    {displayPrice}
                                </span>
                                {originalPrice && (
                                    <span style={{ fontSize: 14, color: "#bbb", textDecoration: "line-through" }}>
                                        {originalPrice}
                                    </span>
                                )}
                                {salePercentage && (
                                    <span className="qv-sale-badge">−{salePercentage}%</span>
                                )}
                            </div>

                            <hr className="qv-divider" />

                            {/* Size selector */}
                            {hasVariants && (
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#111", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                            Size
                                            {selectedVariant && (
                                                <span style={{ fontWeight: 400, color: "#666", textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>
                                                    — {getSizeLabel(selectedVariant.product_variant_size)}
                                                </span>
                                            )}
                                        </p>
                                        <span style={{ fontSize: 11, color: "#888", textDecoration: "underline", cursor: "pointer", letterSpacing: "0.03em" }}>
                                            Size guide
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {SIZES.map(sizeKey => {
                                            const variant = productVariants.find(v => v.product_variant_size?.toLowerCase() === sizeKey);
                                            const exists = !!variant;
                                            const inStock = exists && Number(variant.product_variant_quantity) > 0;
                                            const selected = selectedVariant?.product_variant_id === variant?.product_variant_id;
                                            return (
                                                <button
                                                    key={sizeKey}
                                                    className={`qv-size ${selected ? "selected" : ""} ${!inStock ? "oos" : ""}`}
                                                    onClick={() => { if (!inStock) return; setSelectedVariant(variant); setQuantity(1); }}
                                                    title={!exists ? "Not available" : !inStock ? "Out of stock" : getSizeLabel(sizeKey)}
                                                >
                                                    {getSizeLabel(sizeKey)}
                                                    {!inStock && (
                                                        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 52 36" preserveAspectRatio="none">
                                                            <line x1="4" y1="32" x2="48" y2="4" stroke="#e0e0e0" strokeWidth="1" />
                                                        </svg>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Qty + stock */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                <div className="qv-qty-row">
                                    <button className="qv-qty-btn" onClick={() => handleQuantity(-1)}>−</button>
                                    <span className="qv-qty-val">{quantity}</span>
                                    <button className="qv-qty-btn" onClick={() => handleQuantity(1)}>+</button>
                                </div>
                                {isSoldOut ? (
                                    <span className="qv-stock-chip sold">Sold out</span>
                                ) : stockQty <= 5 ? (
                                    <span className="qv-stock-chip low">
                                        <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="#c07700" /></svg>
                                        Only {stockQty} left
                                    </span>
                                ) : stockQty <= 10 ? (
                                    <span className="qv-stock-chip low">
                                        <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="#c07700" /></svg>
                                        {stockQty} left
                                    </span>
                                ) : (
                                    <span className="qv-stock-chip ok">
                                        <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="#267a46" /></svg>
                                        In stock
                                    </span>
                                )}
                            </div>

                            {/* CTA buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <button
                                    ref={addToCartBtnRef}
                                    className={`qv-btn-add ${addedFeedback ? "added" : ""}`}
                                    onClick={handleAddToCart}
                                    disabled={isSoldOut}
                                >
                                    <span>
                                        {addedFeedback ? (
                                            <>
                                                <svg className="check-bounce" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Added to cart
                                            </>
                                        ) : "Add to cart"}
                                    </span>
                                </button>
                                <button className="qv-btn-buy" disabled={isSoldOut}>
                                    <span>Buy it now</span>
                                </button>
                            </div>

                            <hr className="qv-divider" />

                            {/* Footer: stars + view details */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                    <Stars rating={product.ratings} />
                                    <span style={{ fontSize: 11, color: "#aaa" }}>
                                        {product.ratings ? `${parseFloat(product.ratings).toFixed(1)}` : "No reviews"}
                                    </span>
                                </div>
                                <a href={`/product?id=${product.product_id}`} className="qv-view-link">
                                    Full details →
                                </a>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}