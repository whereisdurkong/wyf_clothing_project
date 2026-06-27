

// import { useSearchParams } from "react-router-dom";
// import axios from "axios";
// import { useEffect, useState } from "react";
// import config from "../../config";
// import FeatherIcon from 'feather-icons-react';

// // ─── helpers (mirrors AllProduct logic) ───────────────────────────────────────

// function formatPrice(p) {
//     if (p === null || p === undefined || p === "") return "";
//     return "₱" + Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 });
// }

// function getCheapestVariant(variants) {
//     if (!variants || variants.length === 0) return null;
//     const available = variants.filter(v => Number(v.product_variant_quantity) > 0);
//     if (available.length === 0) return null;
//     return available.reduce((cheapest, current) =>
//         Number(current.product_variant_price) < Number(cheapest.product_variant_price)
//             ? current
//             : cheapest
//     );
// }

// // ─── sub-components ───────────────────────────────────────────────────────────

// function Stars({ rating }) {
//     const filled = Math.round(parseFloat(rating) || 0);
//     return (
//         <div style={{ display: "flex", gap: 2 }}>
//             {[1, 2, 3, 4, 5].map((i) => (
//                 <span key={i} style={{ color: i <= filled ? "#f5a623" : "#ddd", fontSize: 16 }}>★</span>
//             ))}
//         </div>
//     );
// }

// function AccordionItem({ label, icon }) {
//     const [open, setOpen] = useState(false);

//     const ShippingIcon = () => (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//             <rect x="1" y="3" width="15" height="13" rx="1" />
//             <path d="M16 8h4l3 5v3h-7V8z" />
//             <circle cx="5.5" cy="18.5" r="2.5" />
//             <circle cx="18.5" cy="18.5" r="2.5" />
//         </svg>
//     );

//     const ReturnIcon = () => (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
//             <path d="M3 3v5h5" />
//         </svg>
//     );

//     return (
//         <div style={styles.accordion}>
//             <button onClick={() => setOpen(p => !p)} style={styles.accordionBtn} aria-expanded={open}>
//                 <span style={styles.accordionLeft}>
//                     {icon === "shipping" ? <ShippingIcon /> : <ReturnIcon />}
//                     <span>{label}</span>
//                 </span>
//                 <span style={{ fontSize: 18, lineHeight: 1, color: "#555" }}>{open ? "−" : "+"}</span>
//             </button>
//             {open && (
//                 <p style={styles.accordionBody}>
//                     {label === "Shipping"
//                         ? "We ship nationwide. Orders are processed within 1–3 business days."
//                         : "Returns and exchanges accepted within 7 days of delivery. Item must be unused and in original packaging."}
//                 </p>
//             )}
//         </div>
//     );
// }

// // ─── main component ───────────────────────────────────────────────────────────
// const SIZE_LABEL_MAP = {
//     xs: "XS",
//     s: "S",
//     m: "M",
//     l: "L",
//     xl: "XL",
//     xxl: "XXL",
//     xxxl: "XXXL",
//     one_size: "One Size",
// };

// function getSizeLabel(sizeKey) {
//     return SIZE_LABEL_MAP[sizeKey?.toLowerCase()] ?? sizeKey?.toUpperCase() ?? "—";
// }

// export default function Product() {
//     const [searchParams] = useSearchParams();
//     const product_id = searchParams.get("id");

//     // data
//     const [product, setProduct] = useState(null);
//     const [variants, setVariants] = useState([]); // array of variant rows for this product
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);


//     // UI
//     const [selectedVariant, setSelectedVariant] = useState(null); // chosen variant object (or null)
//     const [selectedSize, setSelectedSize] = useState(null);
//     const [quantity, setQuantity] = useState(1);
//     const [activeImage, setActiveImage] = useState(null);
//     const [activeIndex, setActiveIndex] = useState(0);
//     const [lightboxOpen, setLightboxOpen] = useState(false);
//     const [zoom, setZoom] = useState(1);
//     const [isDragging, setIsDragging] = useState(false);
//     const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
//     const [offset, setOffset] = useState({ x: 0, y: 0 });
//     const [dragStartX, setDragStartX] = useState(null);

//     const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

//     useEffect(() => {
//         const handleResize = () => {
//             setIsMobile(window.innerWidth <= 768);
//         };

//         window.addEventListener("resize", handleResize);
//         return () => window.removeEventListener("resize", handleResize);
//     }, []);

//     // ── fetch product + all variants, then filter ──────────────────────────────
//     useEffect(() => {
//         if (!product_id) return;

//         const fetchAll = async () => {
//             try {
//                 setLoading(true);
//                 const [productRes, variantsRes] = await Promise.all([
//                     axios.get(`${config.baseApi}/product/get-product-by-id`, { params: { id: product_id } }),
//                     axios.get(`${config.baseApi}/product/get-all-product-variant`),
//                 ]);

//                 const res = await axios.get(`${config.baseApi}/product/get-product-by-id`, { params: { id: product_id } });

//                 console.log(productRes, variantsRes)

//                 const data = productRes.data || {};
//                 setProduct(data);

//                 // Filter variants that belong to this product (same as AllProduct's variantMap)
//                 const productVariants = variantsRes.data.filter(
//                     v => String(v.product_id) === String(product_id)
//                 );
//                 setVariants(productVariants);

//                 // Pre-select cheapest available variant if the product uses variants
//                 if (data.has_variants == '1') {
//                     const cheapest = getCheapestVariant(productVariants);
//                     setSelectedVariant(cheapest || null);
//                 }

//                 // Build image list
//                 let extras = [];
//                 try { extras = JSON.parse(data.product_images || "[]"); } catch { extras = []; }
//                 const allImages = [
//                     { src: data.product_image_front, label: "Front" },
//                     { src: data.product_image_back, label: "Back" },
//                     ...extras.map((img, i) => ({ src: img, label: `View ${i + 1}` })),
//                 ].filter(img => img.src);

//                 setActiveImage(allImages[0]?.src || null);
//             } catch (err) {
//                 console.error("Unable to fetch product:", err);
//                 setError("Failed to load product.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAll();
//     }, [product_id]);

//     // ── derived image list ─────────────────────────────────────────────────────
//     const getImages = () => {
//         if (!product) return [];
//         let extras = [];
//         try { extras = JSON.parse(product.product_images || "[]"); } catch { extras = []; }
//         return [
//             { src: product.product_image_front, label: "Front" },
//             { src: product.product_image_back, label: "Back" },
//             ...extras.map((img, i) => ({ src: img, label: `View ${i + 1}` })),
//         ].filter(img => img.src);
//     };

//     const images = getImages();

//     // ── price logic (mirrors AllProduct) ──────────────────────────────────────
//     let displayPrice = "—";
//     let originalPrice = null;
//     let priceLabel = "—";
//     let stockQty = 0;
//     let isSoldOut = false;

//     if (product) {
//         if (product.has_variants == '1') {
//             const cheapest = getCheapestVariant(variants);
//             const availableVariants = variants.filter(v => Number(v.product_variant_quantity) > 0);

//             if (selectedVariant) {
//                 // Show selected variant's price
//                 const hasSale =
//                     selectedVariant.product_variant_sale_price &&
//                     Number(selectedVariant.product_variant_sale_price) > 0 &&
//                     Number(selectedVariant.product_variant_sale_price) < Number(selectedVariant.product_variant_price);

//                 displayPrice = formatPrice(hasSale ? selectedVariant.product_variant_sale_price : selectedVariant.product_variant_price);
//                 originalPrice = hasSale ? formatPrice(selectedVariant.product_variant_price) : null;
//                 stockQty = Number(selectedVariant.product_variant_quantity || 0);
//             } else if (cheapest) {
//                 const hasSale =
//                     cheapest.product_variant_sale_price &&
//                     Number(cheapest.product_variant_sale_price) > 0 &&
//                     Number(cheapest.product_variant_sale_price) < Number(cheapest.product_variant_price);

//                 displayPrice = formatPrice(hasSale ? cheapest.product_variant_sale_price : cheapest.product_variant_price);
//                 originalPrice = hasSale ? formatPrice(cheapest.product_variant_price) : null;
//                 priceLabel = availableVariants.length > 1 ? `From ${displayPrice}` : displayPrice;
//                 stockQty = Number(cheapest.product_variant_quantity || 0);
//             } else {
//                 displayPrice = "Out of stock";
//                 isSoldOut = true;
//             }

//             if (!isSoldOut) priceLabel = displayPrice;
//         } else {
//             // Single product — same as AllProduct
//             const base = formatPrice(product.product_price);
//             const disc = product.product_discount_price ? formatPrice(product.product_discount_price) : "";
//             displayPrice = disc || base;
//             originalPrice = disc ? base : null;
//             priceLabel = displayPrice || "—";
//             stockQty = Number(product.product_quantity || 0);
//             isSoldOut = stockQty === 0;
//         }
//     }

//     // ── handlers ───────────────────────────────────────────────────────────────
//     const handleThumbnailClick = (img, index) => {
//         setActiveImage(img.src);
//         setActiveIndex(index);
//     };

//     const handleQuantityChange = (delta) => {
//         setQuantity(prev => Math.max(1, Math.min(stockQty || 99, prev + delta)));
//     };

//     const handleWheel = (e) => {
//         e.preventDefault();
//         setZoom(prev => Math.min(4, Math.max(1, prev + (e.deltaY < 0 ? 0.2 : -0.2))));
//     };

//     const handleMouseDown = (e) => {
//         if (zoom > 1) {
//             setIsDragging(true);
//             setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
//         }
//     };

//     const handleMouseMove = (e) => {
//         if (isDragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
//     };

//     const handleMouseUp = () => setIsDragging(false);

//     const resetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

//     // ── render guards ──────────────────────────────────────────────────────────
//     if (loading) return (
//         <div style={styles.centered}><p style={{ color: "#888", fontSize: 14 }}>Loading product…</p></div>
//     );

//     if (error || !product) return (
//         <div style={styles.centered}><p style={{ color: "#c0392b", fontSize: 14 }}>{error || "Product not found."}</p></div>
//     );

//     // ── variant selector (only for has_variants == '1') ────────────────────────
//     const hasVariants = product.has_variants == '1';
//     const availableVariantIds = new Set(
//         variants.filter(v => Number(v.product_variant_quantity) > 0).map(v => v.product_variant_id)
//     );

//     // ── render ─────────────────────────────────────────────────────────────────
//     return (
//         <div style={{ ...styles.page, padding: isMobile ? "15px" : "60px" }}>
//             <style>{`
// @keyframes slideDown { 0%{transform:translateY(0)} 50%{transform:translateY(4px)} 100%{transform:translateY(0)} }
// @keyframes slideLeft { 0%{transform:translateX(0)} 50%{transform:translateX(-4px)} 100%{transform:translateX(0)} }
// @keyframes slideRight { 0%{transform:translateX(0)} 50%{transform:translateX(4px)} 100%{transform:translateX(0)} }
// .icon-close:hover svg { animation: slideDown 0.3s ease; }
// .icon-prev:hover svg { animation: slideLeft 0.3s ease; }
// .icon-next:hover svg { animation: slideRight 0.3s ease; }
// `}</style>

//             <div style={{
//                 ...styles.grid,
//                 ...(isMobile && {
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "20px",
//                 }),
//             }}>

//                 {/* ── Thumbnails ── */}
//                 <div
//                     style={{
//                         ...styles.thumbnails,
//                         ...(isMobile && {
//                             flexDirection: "row",
//                             overflowX: "auto",
//                             marginTop: 0,
//                             paddingLeft: 0,
//                             width: "100%",
//                         }),
//                     }}
//                 >
//                     {images.map((img, i) => (
//                         <button
//                             key={i}
//                             onClick={() => handleThumbnailClick(img, i)}
//                             style={{
//                                 ...styles.thumb,
//                                 border: activeIndex === i ? "1.5px solid #111" : "0.1px solid #dddddd00",
//                                 padding: "1px",
//                             }}
//                             aria-label={`View ${img.label}`}
//                         >
//                             <img
//                                 src={`${config.baseApi.replace("/api", "")}${img.src}`}
//                                 alt={img.label}
//                                 style={styles.thumbImg}
//                             />
//                         </button>
//                     ))}
//                 </div>

//                 {/* ── Main image ── */}
//                 <div
//                     style={{
//                         ...styles.mainImageWrap,
//                         ...(isMobile && {
//                             height: "450px",
//                             marginTop: 0,
//                         }),
//                     }}
//                     onClick={() => setLightboxOpen(true)}
//                 >
//                     {activeImage ? (
//                         <img
//                             src={`${config.baseApi.replace("/api", "")}${activeImage}`}
//                             alt={product.product_name}
//                             style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "top", cursor: "zoom-in" }}
//                         />
//                     ) : (
//                         <div style={styles.noImage}>No image available</div>
//                     )}
//                 </div>

//                 {/* ── Product info ── */}
//                 <div
//                     style={{
//                         ...styles.info,
//                         marginTop: isMobile ? 0 : "40px",
//                     }}
//                 >

//                     <div>
//                         <p style={styles.brand}>Where You From?</p>
//                         <h1
//                             style={{
//                                 ...styles.productName,
//                                 fontSize: isMobile ? "24px" : "32px",
//                             }}
//                         >{product.product_name}</h1>
//                     </div>

//                     {/* Price */}
//                     <div style={styles.priceRow}>
//                         <span style={styles.price}>{priceLabel}</span>
//                         {originalPrice && <span style={styles.originalPrice}>{originalPrice}</span>}
//                         {isSoldOut && (
//                             <span style={{ fontSize: 12, color: "#fff", background: "#111", padding: "2px 8px", letterSpacing: "0.08em" }}>
//                                 SOLD OUT
//                             </span>
//                         )}
//                     </div>

//                     <hr style={styles.divider} />

//                     {/* ── Variant selector ── */}
//                     {hasVariants && (
//                         <div>
//                             <div style={styles.sizeHeader}>
//                                 <p style={styles.label}>
//                                     Size:
//                                     {selectedVariant && (
//                                         <span style={{ fontWeight: 400, color: "#555", marginLeft: 6 }}>
//                                             {getSizeLabel(selectedVariant.product_variant_size)}
//                                         </span>
//                                     )}
//                                 </p>
//                                 <span style={styles.sizeChartLink}>Size chart</span>
//                             </div>
//                             <div style={styles.sizeGrid}>
//                                 {["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size"].map(sizeKey => {
//                                     // Find matching variant from DB for this size
//                                     const variant = variants.find(
//                                         v => v.product_variant_size?.toLowerCase() === sizeKey
//                                     );
//                                     const exists = !!variant;
//                                     const inStock = exists && Number(variant.product_variant_quantity) > 0;
//                                     const selected = selectedVariant?.product_variant_id === variant?.product_variant_id;

//                                     return (
//                                         <button
//                                             key={sizeKey}
//                                             onClick={() => {
//                                                 if (!inStock) return;
//                                                 setSelectedVariant(variant);
//                                                 setQuantity(1);
//                                             }}
//                                             title={
//                                                 !exists ? "Not available" :
//                                                     !inStock ? "Out of stock" :
//                                                         getSizeLabel(sizeKey)
//                                             }
//                                             style={{
//                                                 ...styles.sizeBtn,
//                                                 background: selected ? "#111" : "#fff",
//                                                 color: selected ? "#fff" : !inStock ? "#bbb" : "#111",
//                                                 border: selected
//                                                     ? "1.5px solid #111"
//                                                     : !inStock
//                                                         ? "0.5px solid #e0e0e0"
//                                                         : "0.5px solid #d0d0d0",
//                                                 cursor: inStock ? "pointer" : "not-allowed",
//                                                 position: "relative",
//                                                 overflow: "hidden",
//                                             }}
//                                         >
//                                             {getSizeLabel(sizeKey)}

//                                             {/* Diagonal slash for unavailable sizes */}
//                                             {!inStock && (
//                                                 <svg
//                                                     style={{
//                                                         position: "absolute",
//                                                         inset: 0,
//                                                         width: "100%",
//                                                         height: "100%",
//                                                         pointerEvents: "none",
//                                                     }}
//                                                     viewBox="0 0 52 40"
//                                                     preserveAspectRatio="none"
//                                                 >
//                                                     <line x1="4" y1="36" x2="48" y2="4" stroke="#d0d0d0" strokeWidth="1" />
//                                                 </svg>
//                                             )}
//                                         </button>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     )}

//                     {/* ── Size (non-variant products) ── */}
//                     {!hasVariants && (
//                         <div>
//                             <div style={styles.sizeHeader}>
//                                 <p style={styles.label}>Size:</p>
//                                 <span style={styles.sizeChartLink}>Size chart</span>
//                             </div>
//                             <div style={styles.sizeGrid}>
//                                 {sizes.map(size => (
//                                     <button
//                                         key={size}
//                                         onClick={() => setSelectedSize(size)}
//                                         style={{
//                                             ...styles.sizeBtn,
//                                             background: selectedSize === size ? "#111" : "#fff",
//                                             color: selectedSize === size ? "#fff" : "#111",
//                                             border: selectedSize === size ? "1.5px solid #111" : "0.5px solid #d0d0d0",
//                                         }}
//                                     >
//                                         {size}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     {/* Quantity + Stock */}
//                     <div
//                         style={{
//                             display: "flex",
//                             flexDirection: isMobile ? "column" : "row",
//                             alignItems: isMobile ? "flex-start" : "center",
//                             gap: "12px",
//                         }}
//                     >
//                         <div style={styles.qtyRow}>
//                             <button onClick={() => handleQuantityChange(-1)} style={styles.qtyBtn} aria-label="Decrease quantity">−</button>
//                             <span style={styles.qtyVal}>{quantity}</span>
//                             <button onClick={() => handleQuantityChange(1)} style={styles.qtyBtn} aria-label="Increase quantity">+</button>
//                         </div>

//                         {/* Stock badge */}
//                         {isSoldOut ? (
//                             <span style={{ fontSize: 12, color: "#fff", background: "#111", padding: "4px 10px", letterSpacing: "0.08em" }}>
//                                 SOLD OUT
//                             </span>
//                         ) : stockQty <= 10 ? (
//                             <span style={{ fontSize: 12, color: "#d97706" }}>
//                                 Only {stockQty} left
//                             </span>
//                         ) : (
//                             <span style={{ fontSize: 12, color: "#6f6f6f" }}>
//                                 {stockQty} in stock
//                             </span>
//                         )}
//                     </div>

//                     {/* Actions */}
//                     <button style={{ ...styles.btnCart, opacity: isSoldOut ? 0.5 : 1, cursor: isSoldOut ? "not-allowed" : "pointer" }} disabled={isSoldOut}>
//                         Add to cart
//                     </button>
//                     <button style={{ ...styles.btnBuy, opacity: isSoldOut ? 0.5 : 1, cursor: isSoldOut ? "not-allowed" : "pointer" }} disabled={isSoldOut}>
//                         Buy it now
//                     </button>

//                     {/* Description */}
//                     <p style={styles.desc}>{product.product_description}</p>
//                     <p style={styles.notice}>
//                         * The product color may differ slightly due to lighting conditions during photography, image editing, or variations in your monitor settings.
//                     </p>

//                     <AccordionItem label="Shipping" icon="shipping" />
//                     <AccordionItem label="Return & Exchange" icon="return" />

//                     <div style={styles.ratingsRow}>
//                         <Stars rating={product.ratings} />
//                         <span style={styles.chevron}>{"∨"}</span>
//                         <span style={styles.reviewLabel}>
//                             {product.ratings ? `${product.ratings} / 5` : "No reviews"}
//                         </span>
//                     </div>
//                 </div>
//             </div>

//             {/* ── Lightbox ── */}
//             {lightboxOpen && (
//                 <div
//                     style={styles.lightboxOverlay}
//                     onWheel={handleWheel}
//                     onMouseMove={handleMouseMove}
//                     onMouseUp={(e) => {
//                         handleMouseUp();
//                         if (dragStartX !== null && zoom === 1) {
//                             const diff = e.clientX - dragStartX;
//                             if (diff > 80) { const i = (activeIndex - 1 + images.length) % images.length; handleThumbnailClick(images[i], i); }
//                             else if (diff < -80) { const i = (activeIndex + 1) % images.length; handleThumbnailClick(images[i], i); }
//                         }
//                         setDragStartX(null);
//                     }}
//                     onMouseDown={(e) => { setDragStartX(e.clientX); handleMouseDown(e); }}
//                     onClick={() => { setLightboxOpen(false); resetZoom(); }}
//                 >
//                     <img
//                         src={`${config.baseApi.replace("/api", "")}${activeImage}`}
//                         alt={product.product_name}
//                         style={{
//                             position: "absolute", inset: 0,
//                             width: "100%", height: "100%",
//                             objectFit: "contain",
//                             transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
//                             cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "grab",
//                             transition: isDragging ? "none" : "transform 0.2s ease",
//                             userSelect: "none", pointerEvents: "none",
//                         }}
//                         onClick={(e) => e.stopPropagation()}
//                     />

//                     <div style={styles.lightboxZoomControls} onClick={(e) => e.stopPropagation()}>
//                         <button style={styles.lightboxZoomBtn} onClick={() => { setZoom(p => Math.max(1, p - 0.2)); if (zoom <= 1.2) resetZoom(); }}>−</button>
//                         <span style={{ fontSize: 13, color: "#888", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
//                         <button style={styles.lightboxZoomBtn} onClick={() => setZoom(p => Math.min(4, p + 0.2))}>+</button>
//                     </div>

//                     <div style={styles.lightboxControls} onClick={(e) => e.stopPropagation()}>
//                         <button style={styles.lightboxNavBtn} className="icon-prev" onClick={() => { resetZoom(); const i = (activeIndex - 1 + images.length) % images.length; handleThumbnailClick(images[i], i); }}>
//                             <FeatherIcon icon="chevron-left" size={18} />
//                         </button>
//                         <button style={styles.lightboxNavBtn} className="icon-close" onClick={() => { setLightboxOpen(false); resetZoom(); }}>
//                             <FeatherIcon icon="x" size={18} />
//                         </button>
//                         <button style={styles.lightboxNavBtn} className="icon-next" onClick={() => { resetZoom(); const i = (activeIndex + 1) % images.length; handleThumbnailClick(images[i], i); }}>
//                             <FeatherIcon icon="chevron-right" size={18} />
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// // ─── styles (unchanged from original) ────────────────────────────────────────

// const styles = {
//     page: {
//         background: "#fff",
//         minHeight: "100vh",
//         padding: "60px",
//         fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
//         marginTop: "20px",
//         width: "100%",
//         boxSizing: "border-box",
//     },
//     centered: {
//         display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px",
//     },
//     grid: {
//         display: "grid",
//         gridTemplateColumns: "70px minmax(0, 1fr) minmax(320px, 650px)",
//         gap: "20px",
//         width: "100%",
//         alignItems: "start",
//     },
//     thumbnails: {
//         display: "flex", flexDirection: "column", gap: "14px", marginTop: "50px", paddingLeft: "10px",
//     },
//     thumb: {
//         width: "56px", height: "56px", padding: 0, border: "1px solid #d9d9d9",
//         background: "#fff", cursor: "pointer", overflow: "hidden",
//         display: "flex", alignItems: "center", justifyContent: "center",
//     },
//     thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
//     mainImageWrap: {
//         width: "100%",
//         height: "700px",
//         marginTop: "40px",
//         overflow: "hidden",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         background: "#fff",
//     },
//     noImage: { color: "#999", fontSize: "14px" },
//     info: {
//         marginTop: "40px", display: "flex", flexDirection: "column", gap: "12px", width: "100%",
//     },
//     brand: { fontSize: "14px", fontWeight: 700, color: "#6f6f6f", margin: 0 },
//     productName: { fontSize: "32px", fontWeight: 700, color: "#111", lineHeight: 1.3, margin: "20px 0 10px", wordBreak: "break-word", },
//     priceRow: { display: "flex", alignItems: "center", gap: "12px", paddingBottom: '20px' },
//     price: { fontSize: "18px", fontWeight: 700, color: "#5f5f5f" },
//     originalPrice: { fontSize: "16px", color: "#9e9e9e", textDecoration: "line-through" },
//     divider: { border: "none", borderTop: "1px solid #3f3f3f", margin: "0" },
//     sizeHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
//     label: { margin: 0, fontSize: "15px", color: "#111" },
//     sizeChartLink: { fontSize: "14px", color: "#111", textDecoration: "underline", cursor: "pointer" },
//     sizeGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
//     sizeBtn: {
//         width: "52px", height: "40px", border: "1px solid #d8d8d8",
//         background: "#fff", fontSize: "14px", cursor: "pointer", transition: "all .15s ease",
//     },
//     qtyRow: {
//         display: "flex", alignItems: "center", width: "118px", height: "42px",
//         border: "1px solid #d9d9d9", background: "#fff",
//     },
//     qtyBtn: { width: "40px", height: "40px", border: "none", background: "#fff", cursor: "pointer", fontSize: "20px", color: "#111" },
//     qtyVal: { flex: 1, textAlign: "center", fontSize: "15px", color: "#111" },
//     btnCart: { width: "100%", height: "50px", border: "1px solid #d9d9d9", background: "#fff", color: "#111", fontSize: "16px", cursor: "pointer", marginTop: "6px" },
//     btnBuy: { width: "100%", height: "50px", border: "none", background: "#000", color: "#fff", fontSize: "16px", fontWeight: 600, cursor: "pointer", marginTop: "-8px" },
//     desc: { fontSize: "14px", lineHeight: "1.9", color: "#111", fontWeight: 600, margin: 0 },
//     notice: { fontSize: "13px", lineHeight: "1.8", color: "#666", margin: 0 },
//     accordion: { borderTop: "1px solid #e5e5e5" },
//     accordionBtn: {
//         width: "100%", background: "transparent", border: "none", padding: "18px 0",
//         display: "flex", justifyContent: "space-between", alignItems: "center",
//         cursor: "pointer", fontSize: "15px", color: "#111",
//     },
//     accordionLeft: { display: "flex", alignItems: "center", gap: "12px" },
//     accordionBody: { fontSize: "13px", lineHeight: "1.8", color: "#666", paddingBottom: "16px", margin: 0 },
//     ratingsRow: { display: "flex", alignItems: "center", gap: "6px", paddingTop: "8px" },
//     chevron: { fontSize: "12px", color: "#888" },
//     reviewLabel: { fontSize: "14px", color: "#888" },
//     lightboxOverlay: {
//         position: "fixed", inset: 0, background: "rgb(255,255,255)",
//         zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
//     },
//     lightboxControls: {
//         position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)",
//         display: "flex", alignItems: "center", gap: "8px", zIndex: 1100,
//     },
//     lightboxNavBtn: {
//         width: "60px", height: "60px", borderRadius: "50%", border: "1px solid #ddd",
//         background: "#fff", fontSize: "18px", cursor: "pointer", color: "#111",
//         display: "flex", alignItems: "center", justifyContent: "center",
//     },
//     lightboxZoomControls: {
//         position: "absolute", top: "24px", left: "50%", transform: "translateX(-50%)",
//         display: "flex", alignItems: "center", gap: "12px",
//         background: "rgba(245,245,245,0.9)", padding: "6px 16px",
//         borderRadius: "20px", border: "1px solid #ddd", zIndex: 1100,
//     },
//     lightboxZoomBtn: {
//         background: "transparent", border: "none", fontSize: "20px", cursor: "pointer",
//         color: "#111", width: "28px", height: "28px",
//         display: "flex", alignItems: "center", justifyContent: "center",
//     },
// };





// --------------------------------- org


import { useSearchParams } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import { useEffect, useState, useRef } from "react";

import FeatherIcon from 'feather-icons-react';

import { Toast } from '../../components/Notification'
import Loading from "../../components/Loading";

import { useCartFly } from "../../components/CartFlyContext";


// ─── helpers (mirrors AllProduct logic) ───────────────────────────────────────

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
            ? current
            : cheapest
    );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Stars({ rating }) {
    const filled = Math.round(parseFloat(rating) || 0);
    return (
        <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{ color: i <= filled ? "#f5a623" : "#ddd", fontSize: 16 }}>★</span>
            ))}
        </div>
    );
}

function AccordionItem({ label, icon }) {
    const [open, setOpen] = useState(false);

    const ShippingIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <path d="M16 8h4l3 5v3h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    );

    const ReturnIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );

    return (
        <div style={styles.accordion}>
            <button onClick={() => setOpen(p => !p)} style={styles.accordionBtn} aria-expanded={open}>
                <span style={styles.accordionLeft}>
                    {icon === "shipping" ? <ShippingIcon /> : <ReturnIcon />}
                    <span>{label}</span>
                </span>
                <span style={{ fontSize: 18, lineHeight: 1, color: "#555" }}>{open ? "−" : "+"}</span>
            </button>
            {open && (
                <p style={styles.accordionBody}>
                    {label === "Shipping"
                        ? `Please note that order preparation times may vary depending on the current volume of orders. 
                        Rest assured, we will do our best to have your order shipped out as soon as possible.
                            Once shipped, estimated delivery times are:
                            - 2-3 days within Metro Manila and GMA
                            - 3-5 days for Luzon
                            - 7-9 days for Visayas and Mindanao

                            You may track your orders through the email confirmation that will be sent to you.`
                        : `Returns and exchanges are only valid for change of size, subject to availability.

                            To approve your return, please ensure the following conditions are met:
                            - The item(s) must be returned within 7 days of receiving your order.
                            - The item(s) must be undamaged; washing or altering the item(s) will be considered damage.
                            - The item(s) must be returned in their original condition, including tags, stickers, and packaging.
                            · We do not issue refunds.
                            · Exchanges are permitted within 7 days, with the customer covering all shipping expenses. 
                            · If our staff sent you a wrong item, we will cover the shipping fee if your return/exchange is approved.
                            · To arrange your exchange, please view our Return Policy and Exchange.`}
                </p>
            )}
        </div>
    );
}
// ─── main component ───────────────────────────────────────────────────────────
const SIZE_LABEL_MAP = {
    xs: "XS",
    s: "S",
    m: "M",
    l: "L",
    xl: "XL",
    xxl: "XXL",
    xxxl: "XXXL",
    one_size: "One Size",
};

function getSizeLabel(sizeKey) {
    return SIZE_LABEL_MAP[sizeKey?.toLowerCase()] ?? sizeKey?.toUpperCase() ?? "—";
}

export default function Product() {
    const [searchParams] = useSearchParams();
    const product_id = searchParams.get("id");

    const { flyToCart } = useCartFly();
    const addToCartBtnRef = useRef(null);

    // data
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragStartX, setDragStartX] = useState(null);
    const [touchStartX, setTouchStartX] = useState(null);

    const [animDir, setAnimDir] = useState(null);
    const [animKey, setAnimKey] = useState(0);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [notifications, setNotifications] = useState([]);

    // ── attach wheel listener to document when lightbox is open ──────────────
    const setZoomRef = useRef(null);
    setZoomRef.current = setZoom;

    useEffect(() => {
        if (!lightboxOpen) return;
        const onWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setZoomRef.current(prev => Math.min(4, Math.max(1, prev + (e.deltaY < 0 ? 0.2 : -0.2))));
        };
        document.addEventListener("wheel", onWheel, { passive: false });
        return () => document.removeEventListener("wheel", onWheel);
    }, [lightboxOpen]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ── fetch product + all variants ──────────────────────────────────────────
    useEffect(() => {
        if (!product_id) return;

        const fetchAll = async () => {
            try {
                setLoading(true);
                const [productRes, variantsRes] = await Promise.all([
                    axios.get(`${config.baseApi}/product/get-product-by-id`, { params: { id: product_id } }),
                    axios.get(`${config.baseApi}/product/get-all-product-variant`),
                ]);

                console.log(productRes, variantsRes);

                const data = productRes.data || {};
                setProduct(data);

                const productVariants = variantsRes.data.filter(
                    v => String(v.product_id) === String(product_id)
                );
                setVariants(productVariants);

                if (data.has_variants == '1') {
                    const cheapest = getCheapestVariant(productVariants);
                    setSelectedVariant(cheapest || null);
                }

                let extras = [];
                try { extras = JSON.parse(data.product_images || "[]"); } catch { extras = []; }
                const allImages = [
                    { src: data.product_image_front, label: "Front" },
                    { src: data.product_image_back, label: "Back" },
                    ...extras.map((img, i) => ({ src: img, label: `View ${i + 1}` })),
                ].filter(img => img.src);

                setActiveImage(allImages[0]?.src || null);
            } catch (err) {
                console.error("Unable to fetch product:", err);
                setError("Failed to load product.");
                addNotif("Error", "Failed to load product. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [product_id]);

    // ── derived image list ────────────────────────────────────────────────────
    const getImages = () => {
        if (!product) return [];
        let extras = [];
        try { extras = JSON.parse(product.product_images || "[]"); } catch { extras = []; }
        return [
            { src: product.product_image_front, label: "Front" },
            { src: product.product_image_back, label: "Back" },
            ...extras.map((img, i) => ({ src: img, label: `View ${i + 1}` })),
        ].filter(img => img.src);
    };

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    const images = getImages();

    // ── price logic ───────────────────────────────────────────────────────────
    let displayPrice = "—";
    let originalPrice = null;
    let priceLabel = "—";
    let stockQty = 0;
    let isSoldOut = false;
    let salePercentage = null;
    let currentPrice = 0;
    let regularPrice = 0;

    if (product) {
        if (product.has_variants == '1') {
            const cheapest = getCheapestVariant(variants);
            const availableVariants = variants.filter(v => Number(v.product_variant_quantity) > 0);

            if (selectedVariant) {
                const hasSale =
                    selectedVariant.product_variant_sale_price &&
                    Number(selectedVariant.product_variant_sale_price) > 0 &&
                    Number(selectedVariant.product_variant_sale_price) < Number(selectedVariant.product_variant_price);

                if (hasSale) {
                    currentPrice = Number(selectedVariant.product_variant_sale_price);
                    regularPrice = Number(selectedVariant.product_variant_price);
                    salePercentage = Math.round(((regularPrice - currentPrice) / regularPrice) * 100);
                    displayPrice = formatPrice(currentPrice);
                    originalPrice = formatPrice(regularPrice);
                } else {
                    displayPrice = formatPrice(selectedVariant.product_variant_price);
                    originalPrice = null;
                    salePercentage = null;
                }
                stockQty = Number(selectedVariant.product_variant_quantity || 0);
            } else if (cheapest) {
                const hasSale =
                    cheapest.product_variant_sale_price &&
                    Number(cheapest.product_variant_sale_price) > 0 &&
                    Number(cheapest.product_variant_sale_price) < Number(cheapest.product_variant_price);

                if (hasSale) {
                    currentPrice = Number(cheapest.product_variant_sale_price);
                    regularPrice = Number(cheapest.product_variant_price);
                    salePercentage = Math.round(((regularPrice - currentPrice) / regularPrice) * 100);
                    displayPrice = formatPrice(currentPrice);
                    originalPrice = formatPrice(regularPrice);
                } else {
                    displayPrice = formatPrice(cheapest.product_variant_price);
                    originalPrice = null;
                    salePercentage = null;
                }
                priceLabel = availableVariants.length > 1 ? `From ${displayPrice}` : displayPrice;
                stockQty = Number(cheapest.product_variant_quantity || 0);
            } else {
                displayPrice = "Out of stock";
                isSoldOut = true;
            }

            if (!isSoldOut) priceLabel = displayPrice;
        } else {
            const basePrice = Number(product.product_price);
            const discountPrice = product.product_discount_price ? Number(product.product_discount_price) : null;

            if (discountPrice && discountPrice < basePrice) {
                currentPrice = discountPrice;
                regularPrice = basePrice;
                salePercentage = Math.round(((regularPrice - currentPrice) / regularPrice) * 100);
                displayPrice = formatPrice(currentPrice);
                originalPrice = formatPrice(regularPrice);
            } else {
                displayPrice = formatPrice(basePrice);
                originalPrice = null;
                salePercentage = null;
                currentPrice = basePrice;
            }
            priceLabel = displayPrice || "—";
            stockQty = Number(product.product_quantity || 0);
            isSoldOut = stockQty === 0;
        }
    }

    // ── handlers ──────────────────────────────────────────────────────────────
    const handleThumbnailClick = (img, index, dir = "right") => {
        setAnimDir(dir);
        setAnimKey(k => k + 1);
        setActiveImage(img.src);
        setActiveIndex(index);
    };

    // ── Swipe handlers for mobile ──────────────────────────────────────────
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        setTouchStartX(touch.clientX);
        setIsDragging(true);
        setDragStartX(touch.clientX);
        if (zoom > 1) {
            setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging || touchStartX === null) return;

        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartX;

        if (zoom > 1) {
            setOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
            return;
        }
    };

    const handleTouchEnd = (e) => {
        if (!isDragging || touchStartX === null || zoom > 1) {
            setIsDragging(false);
            setTouchStartX(null);
            setDragStartX(null);
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;
        const SWIPE_THRESHOLD = 50;

        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            if (diffX > 0) {
                const i = (activeIndex - 1 + images.length) % images.length;
                handleThumbnailClick(images[i], i, "left");
            } else {
                const i = (activeIndex + 1) % images.length;
                handleThumbnailClick(images[i], i, "right");
            }
        }

        setIsDragging(false);
        setTouchStartX(null);
        setDragStartX(null);
    };

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, Math.min(stockQty || 99, prev + delta)));
    };

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const resetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

    // ── render guards ─────────────────────────────────────────────────────────
    if (loading) return <Loading />;

    if (error || !product) return (
        <div style={styles.centered}><p style={{ color: "#c0392b", fontSize: 14 }}>{error || "Product not found."}</p></div>
    );

    const hasVariants = product.has_variants == '1';

    const AddToCart = () => {
        // Get existing cart
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Create cart item with only what you need
        const cartItem = {
            product_id: product.product_id,
            quantity: quantity,
            variant_size: selectedVariant ? getSizeLabel(selectedVariant.product_variant_size) : null
        };

        // Check if same product + size already exists
        const existingIndex = cart.findIndex(item =>
            item.product_id === cartItem.product_id &&
            item.variant_size === cartItem.variant_size
        );

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        //xxx
        addNotif("Added to cart", `${quantity} item(s) added to your cart.`, "success");

        flyToCart(
            `${config.baseApi.replace("/api", "")}${activeImage}`,
            addToCartBtnRef.current
        );

    };
    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div style={{
            ...styles.page,
            padding: isMobile ? "15px" : "60px",
            paddingTop: isMobile ? "80px" : "60px", // Added extra top padding for mobile
        }}>

            {/* Toast container */}
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 9999, width: 340, pointerEvents: "none" }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast {...n} onDismiss={id =>
                            setNotifications(prev => prev.filter(n => n.id !== id))
                        } />
                    </div>
                ))}
            </div>


            <style>{`
                    @keyframes slideDown { 0%{transform:translateY(0)} 50%{transform:translateY(4px)} 100%{transform:translateY(0)} }
                    @keyframes slideLeft { 0%{transform:translateX(0)} 50%{transform:translateX(-4px)} 100%{transform:translateX(0)} }
                    @keyframes slideRight { 0%{transform:translateX(0)} 50%{transform:translateX(4px)} 100%{transform:translateX(0)} }
                    .icon-close:hover svg { animation: slideDown 0.3s ease; }
                    .icon-prev:hover svg { animation: slideLeft 0.3s ease; }
                    .icon-next:hover svg { animation: slideRight 0.3s ease; }
                    
                    @keyframes imgSlideInRight {
                        from { opacity: 0; transform: translateX(60px); }
                        to   { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes imgSlideInLeft {
                        from { opacity: 0; transform: translateX(-60px); }
                        to   { opacity: 1; transform: translateX(0); }
                    }
                    .img-slide-right { animation: imgSlideInRight 0.3s cubic-bezier(.25,.8,.25,1) both; }
                    .img-slide-left  { animation: imgSlideInLeft  0.3s cubic-bezier(.25,.8,.25,1) both; }

                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                    .sale-badge {
                        animation: pulse 2s ease-in-out infinite;
                    }

                    .add-to-cart-btn { transition: color 0.35s cubic-bezier(.25,.8,.25,1); }
                    .add-to-cart-btn .fill-white {
                        position: absolute; inset: 0;
                        background: white;
                        transform: scaleX(1);
                        transform-origin: left;
                        transition: transform 0.35s cubic-bezier(.25,.8,.25,1);
                        z-index: 1;
                    }
                    .add-to-cart-btn .fill-black {
                        position: absolute; inset: 0;
                        background: #111;
                        transform: scaleX(0);
                        transform-origin: right;
                        transition: transform 0.35s cubic-bezier(.25,.8,.25,1);
                        z-index: 2;
                    }
                    .add-to-cart-btn:hover .fill-white { transform: scaleX(0); }
                    .add-to-cart-btn:hover .fill-black {
                        transform: scaleX(1);
                        transform-origin: left;
                    }
                    .add-to-cart-btn:hover { color: #fff; }

                    .buy-now-btn { transition: color 0.35s cubic-bezier(.25,.8,.25,1); color: #fff !important; }
                    .buy-now-btn span { color: #fff !important; transition: color 0.35s cubic-bezier(.25,.8,.25,1); }
                    .buy-now-btn .fill-white {
                        position: absolute; inset: 0;
                        background: #fff;
                        transform: scaleX(0);
                        transform-origin: right;
                        transition: transform 0.35s cubic-bezier(.25,.8,.25,1);
                        z-index: 1;
                    }
                    .buy-now-btn .fill-black {
                        position: absolute; inset: 0;
                        background: #111;
                        transform: scaleX(1);
                        transform-origin: left;
                        transition: transform 0.35s cubic-bezier(.25,.8,.25,1);
                        z-index: 2;
                    }
                    .buy-now-btn:hover .fill-white { transform: scaleX(1); transform-origin: left; }
                    .buy-now-btn:hover .fill-black { transform: scaleX(0); transform-origin: right; }
                    .buy-now-btn:hover { color: #111 !important; }
                    .buy-now-btn:hover span { color: #111 !important; }
 
                    `}</style>

            <div style={{
                ...styles.grid,
                ...(isMobile && {
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    gridTemplateColumns: "1fr",
                    marginTop: "10px", // Added margin-top for mobile
                }),
            }}>

                {/* ── Thumbnails (Mobile: below main image) ── */}
                {isMobile ? (
                    <>
                        {/* Main image */}
                        <div
                            style={{
                                ...styles.mainImageWrap,
                                height: "400px",
                                marginTop: 0,
                                touchAction: "none",
                                position: "relative",
                            }}
                            onClick={() => setLightboxOpen(true)}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {activeImage ? (

                                <img
                                    key={animKey}
                                    onAnimationEnd={() => setAnimDir(null)}
                                    src={`${config.baseApi.replace("/api", "")}${activeImage}`}
                                    alt={product.product_name}
                                    className={animDir === "right" ? "img-slide-right" : animDir === "left" ? "img-slide-left" : ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        objectPosition: "top",
                                        cursor: "zoom-in",
                                        transform: zoom > 1 ? `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)` : "none",
                                        transition: isDragging ? "none" : "transform 0.2s ease",
                                    }}
                                    draggable={false}
                                />


                            ) : (
                                <div style={styles.noImage}>No image available</div>
                            )}
                        </div>

                        {/* Thumbnails below main image */}
                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            overflowX: "auto",
                            gap: "10px",
                            padding: "10px 0",
                            width: "100%",
                            justifyContent: "center",
                            flexWrap: "nowrap",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                        }}>
                            <style>{`
                                div::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleThumbnailClick(img, i)}
                                    style={{
                                        flex: "0 0 60px",
                                        width: "60px",
                                        height: "60px",
                                        border: activeIndex === i ? "2px solid #111" : "1px solid #ddd",
                                        background: "#fff",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                        flexShrink: 0,
                                    }}
                                    aria-label={`View ${img.label}`}
                                >
                                    <img
                                        src={`${config.baseApi.replace("/api", "")}${img.src}`}
                                        alt={img.label}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    // Desktop layout
                    <>
                        {/* Thumbnails - left side */}
                        <div style={styles.thumbnails}>
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleThumbnailClick(img, i)}
                                    style={{
                                        ...styles.thumb,
                                        border: activeIndex === i ? "1.5px solid #111" : "0.1px solid #dddddd00",
                                        padding: "1px",
                                    }}
                                    aria-label={`View ${img.label}`}
                                >
                                    <img
                                        src={`${config.baseApi.replace("/api", "")}${img.src}`}
                                        alt={img.label}
                                        style={styles.thumbImg}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Main image - center */}
                        <div
                            style={{
                                ...styles.mainImageWrap,
                                height: "900px",
                                marginTop: "40px",
                                position: "relative",
                            }}
                            onClick={() => setLightboxOpen(true)}
                        >
                            {activeImage ? (

                                <img
                                    key={animKey}
                                    onAnimationEnd={() => setAnimDir(null)}
                                    src={`${config.baseApi.replace("/api", "")}${activeImage}`}
                                    alt={product.product_name}
                                    className={animDir === "right" ? "img-slide-right" : animDir === "left" ? "img-slide-left" : ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        objectPosition: "top",
                                        cursor: "zoom-in"
                                    }}
                                />

                            ) : (
                                <div style={styles.noImage}>No image available</div>
                            )}
                        </div>
                    </>
                )}

                {/* ── Product info ── */}
                <div style={{ ...styles.info, marginTop: isMobile ? "0" : "40px" }}>
                    <div>
                        <p style={styles.brand}>Where You From?</p>
                        <h1 style={{ ...styles.productName, fontSize: isMobile ? "24px" : "32px" }}>
                            {product.product_name}
                        </h1>
                    </div>

                    <div style={styles.priceRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <span style={styles.price}>{priceLabel}</span>
                            {originalPrice && <span style={styles.originalPrice}>{originalPrice}</span>}
                            {salePercentage && (
                                <span style={styles.salePercentage}>
                                    Save {salePercentage}%
                                </span>
                            )}
                            {isSoldOut && (
                                <span style={{ fontSize: 12, color: "#fff", background: "#111", padding: "2px 8px", letterSpacing: "0.08em" }}>
                                    SOLD OUT
                                </span>
                            )}
                        </div>
                    </div>

                    <hr style={styles.divider} />

                    {hasVariants && (
                        <div>
                            <div style={styles.sizeHeader}>
                                <p style={styles.label}>
                                    Size:
                                    {selectedVariant && (
                                        <span style={{ fontWeight: 400, color: "#555", marginLeft: 6 }}>
                                            {getSizeLabel(selectedVariant.product_variant_size)}
                                        </span>
                                    )}
                                </p>
                                <span style={styles.sizeChartLink}>Size chart</span>
                            </div>
                            <div style={styles.sizeGrid}>
                                {["xs", "s", "m", "l", "xl", "xxl", "xxxl", "one_size"].map(sizeKey => {
                                    const variant = variants.find(v => v.product_variant_size?.toLowerCase() === sizeKey);
                                    const exists = !!variant;
                                    const inStock = exists && Number(variant.product_variant_quantity) > 0;
                                    const selected = selectedVariant?.product_variant_id === variant?.product_variant_id;

                                    return (
                                        <button
                                            key={sizeKey}
                                            onClick={() => { if (!inStock) return; setSelectedVariant(variant); setQuantity(1); }}
                                            title={!exists ? "Not available" : !inStock ? "Out of stock" : getSizeLabel(sizeKey)}
                                            style={{
                                                ...styles.sizeBtn,
                                                background: selected ? "#111" : "#fff",
                                                color: selected ? "#fff" : !inStock ? "#bbb" : "#111",
                                                border: selected ? "1.5px solid #111" : !inStock ? "0.5px solid #e0e0e0" : "0.5px solid #d0d0d0",
                                                cursor: inStock ? "pointer" : "not-allowed",
                                                position: "relative",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {getSizeLabel(sizeKey)}
                                            {!inStock && (
                                                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 52 40" preserveAspectRatio="none">
                                                    <line x1="4" y1="36" x2="48" y2="4" stroke="#d0d0d0" strokeWidth="1" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {!hasVariants && (
                        <div>
                            <div style={styles.sizeHeader}>
                                <p style={styles.label}>Size:</p>
                                <span style={styles.sizeChartLink}>Size chart</span>
                            </div>
                            <div style={styles.sizeGrid}>
                                {["S", "M", "L", "XL"].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        style={{
                                            ...styles.sizeBtn,
                                            background: selectedSize === size ? "#111" : "#fff",
                                            color: selectedSize === size ? "#fff" : "#111",
                                            border: selectedSize === size ? "1.5px solid #111" : "0.5px solid #d0d0d0",
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: "12px" }}>
                        <div style={styles.qtyRow}>
                            <button onClick={() => handleQuantityChange(-1)} style={styles.qtyBtn} aria-label="Decrease quantity">−</button>
                            <span style={styles.qtyVal}>{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)} style={styles.qtyBtn} aria-label="Increase quantity">+</button>
                        </div>
                        {isSoldOut ? (
                            <span style={{ fontSize: 12, color: "#fff", background: "#111", padding: "4px 10px", letterSpacing: "0.08em" }}>SOLD OUT</span>
                        ) : stockQty <= 10 ? (
                            <span style={{ fontSize: 12, color: "#d97706" }}>Only {stockQty} left</span>
                        ) : (
                            <span style={{ fontSize: 12, color: "#6f6f6f" }}>{stockQty} in stock</span>
                        )}
                    </div>

                    <button
                        ref={addToCartBtnRef}
                        className="add-to-cart-btn"
                        style={{
                            width: "100%",
                            height: "50px",
                            fontSize: "16px",
                            cursor: isSoldOut ? "not-allowed" : "pointer",
                            position: "relative",
                            overflow: "hidden",
                            border: "1px solid #e2e2e2",
                            background: "transparent",
                            zIndex: 1,
                            opacity: isSoldOut ? 0.5 : 1,
                        }}
                        disabled={isSoldOut}
                        onClick={AddToCart}
                    >
                        <div className="fill-white" />
                        <div className="fill-black" />
                        <span style={{ position: "relative", zIndex: 3 }}>Add to cart</span>
                    </button>
                    <button
                        className="buy-now-btn"
                        style={{
                            width: "100%",
                            height: "50px",
                            fontSize: "16px",
                            cursor: isSoldOut ? "not-allowed" : "pointer",
                            position: "relative",
                            overflow: "hidden",
                            border: "1px solid #000000",
                            background: "transparent",
                            zIndex: 1,
                            opacity: isSoldOut ? 0.5 : 1,
                        }}
                        disabled={isSoldOut}
                    >
                        <div className="fill-white" />
                        <div className="fill-black" />
                        <span style={{ position: "relative", zIndex: 3 }}>Buy it now</span>
                    </button>

                    <p style={styles.desc}>{product.product_description}</p>
                    <p style={styles.notice}>
                        * The product color may differ slightly due to lighting conditions during photography, image editing, or variations in your monitor settings.
                    </p>

                    <AccordionItem label="Shipping" icon="shipping" />
                    <AccordionItem label="Return & Exchange" icon="return" />

                    <div style={styles.ratingsRow}>
                        <Stars rating={product.ratings} />
                        <span style={styles.chevron}>{"∨"}</span>
                        <span style={styles.reviewLabel}>
                            {product.ratings ? `${product.ratings} / 5` : "No reviews"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Lightbox ── */}
            {lightboxOpen && (
                <div
                    style={styles.lightboxOverlay}
                    onMouseMove={handleMouseMove}
                    onMouseUp={(e) => {
                        handleMouseUp();
                        if (dragStartX !== null && zoom === 1) {
                            const diff = e.clientX - dragStartX;
                            if (diff > 80) { const i = (activeIndex - 1 + images.length) % images.length; handleThumbnailClick(images[i], i, "left"); }
                            else if (diff < -80) { const i = (activeIndex + 1) % images.length; handleThumbnailClick(images[i], i, "right"); }
                        }
                        setDragStartX(null);
                    }}
                    onMouseDown={(e) => { setDragStartX(e.clientX); handleMouseDown(e); }}
                    onClick={() => { setLightboxOpen(false); resetZoom(); }}
                >
                    <img
                        key={`lb-${animKey}`}
                        src={`${config.baseApi.replace("/api", "")}${activeImage}`}
                        alt={product.product_name}
                        className={animDir === "right" ? "img-slide-right" : animDir === "left" ? "img-slide-left" : ""}
                        style={{
                            position: "absolute", inset: 0,
                            width: "100%", height: "100%",
                            objectFit: "contain",
                            transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "grab",
                            transition: isDragging ? "none" : "transform 0.2s ease",
                            userSelect: "none"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    <div style={styles.lightboxZoomControls} onClick={(e) => e.stopPropagation()}>
                        <button style={styles.lightboxZoomBtn} onClick={() => { setZoom(p => Math.max(1, p - 0.2)); if (zoom <= 1.2) resetZoom(); }}>−</button>
                        <span style={{ fontSize: 13, color: "#888", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
                        <button style={styles.lightboxZoomBtn} onClick={() => setZoom(p => Math.min(4, p + 0.2))}>+</button>
                    </div>

                    <div style={styles.lightboxControls} onClick={(e) => e.stopPropagation()}>
                        <button style={styles.lightboxNavBtn} className="icon-prev" onClick={() => { resetZoom(); const i = (activeIndex - 1 + images.length) % images.length; handleThumbnailClick(images[i], i, "left"); }}>
                            <FeatherIcon icon="chevron-left" size={18} />
                        </button>
                        <button style={styles.lightboxNavBtn} className="icon-close" onClick={() => { setLightboxOpen(false); resetZoom(); }}>
                            <FeatherIcon icon="x" size={18} />
                        </button>
                        <button style={styles.lightboxNavBtn} className="icon-next" onClick={() => { resetZoom(); const i = (activeIndex + 1) % images.length; handleThumbnailClick(images[i], i, "right"); }}>
                            <FeatherIcon icon="chevron-right" size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = {
    page: {
        background: "#fff",
        minHeight: "100vh",
        padding: "60px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        marginTop: "20px",
        width: "100%",
        boxSizing: "border-box",
    },
    centered: {
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "70px minmax(0, 1fr) minmax(320px, 650px)",
        gap: "20px",
        width: "100%",
        alignItems: "start",
    },
    thumbnails: {
        display: "flex", flexDirection: "column", gap: "14px", marginTop: "50px", paddingLeft: "10px",
    },
    thumb: {
        width: "56px", height: "56px", padding: 0, border: "1px solid #d9d9d9",
        background: "#fff", cursor: "pointer", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
    mainImageWrap: {
        width: "100%", height: "700px", marginTop: "40px", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center", background: "#fff",
        position: "relative",
    },

    salePercentage: {
        fontSize: "13px",
        fontWeight: 700,
        color: "#e74c3c",
        background: "#fde8e8",
        padding: "2px 10px",
        borderRadius: "3px",
        letterSpacing: "0.03em",
    },
    noImage: { color: "#999", fontSize: "14px" },
    info: {
        marginTop: "40px", display: "flex", flexDirection: "column", gap: "12px", width: "100%",
    },
    brand: { fontSize: "14px", fontWeight: 700, color: "#6f6f6f", margin: 0 },
    productName: { fontSize: "32px", fontWeight: 700, color: "#111", lineHeight: 1.3, margin: "20px 0 10px", wordBreak: "break-word" },
    priceRow: { display: "flex", alignItems: "center", gap: "12px", paddingBottom: '20px' },
    price: { fontSize: "18px", fontWeight: 700, color: "#5f5f5f" },
    originalPrice: { fontSize: "16px", color: "#9e9e9e", textDecoration: "line-through" },
    divider: { border: "none", borderTop: "1px solid #3f3f3f", margin: "0" },
    sizeHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
    label: { margin: 0, fontSize: "15px", color: "#111" },
    sizeChartLink: { fontSize: "14px", color: "#111", textDecoration: "underline", cursor: "pointer" },
    sizeGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
    sizeBtn: {
        width: "52px", height: "40px", border: "1px solid #d8d8d8",
        background: "#fff", fontSize: "14px", cursor: "pointer", transition: "all .15s ease",
    },
    qtyRow: {
        display: "flex", alignItems: "center", width: "118px", height: "42px",
        border: "1px solid #d9d9d9", background: "#fff",
    },
    qtyBtn: { width: "40px", height: "40px", border: "none", background: "#fff", cursor: "pointer", fontSize: "20px", color: "#111" },
    qtyVal: { flex: 1, textAlign: "center", fontSize: "15px", color: "#111" },
    btnCart: { width: "100%", height: "50px", border: "1px solid #d9d9d9", background: "#fff", color: "#111", fontSize: "16px", cursor: "pointer", marginTop: "20px" },
    btnBuy: { width: "100%", height: "50px", border: "none", background: "#000", color: "#fff", fontSize: "16px", fontWeight: 600, cursor: "pointer" },
    desc: { fontSize: "14px", lineHeight: "1.9", color: "#111", fontWeight: 600, margin: 0 },
    notice: { fontSize: "13px", lineHeight: "1.8", color: "#666", margin: 0 },
    accordion: { borderTop: "1px solid #e5e5e5" },
    accordionBtn: {
        width: "100%", background: "transparent", border: "none", padding: "18px 0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        cursor: "pointer", fontSize: "15px", color: "#111",
    },
    accordionLeft: { display: "flex", alignItems: "center", gap: "12px" },
    accordionBody: { fontSize: "13px", lineHeight: "1.8", color: "#666", paddingBottom: "16px", margin: 0, whiteSpace: "pre-line" },
    ratingsRow: { display: "flex", alignItems: "center", gap: "6px", paddingTop: "8px" },
    chevron: { fontSize: "12px", color: "#888" },
    reviewLabel: { fontSize: "14px", color: "#888" },
    lightboxOverlay: {
        position: "fixed", inset: 0, background: "rgb(255,255,255)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
    },
    lightboxControls: {
        position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: "8px", zIndex: 1100,
    },
    lightboxNavBtn: {
        width: "60px", height: "60px", borderRadius: "50%", border: "1px solid #ddd",
        background: "#fff", fontSize: "18px", cursor: "pointer", color: "#111",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    lightboxZoomControls: {
        position: "absolute", top: "24px", left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: "12px",
        background: "rgba(245,245,245,0.9)", padding: "6px 16px",
        borderRadius: "20px", border: "1px solid #ddd", zIndex: 1100,
    },
    lightboxZoomBtn: {
        background: "transparent", border: "none", fontSize: "20px", cursor: "pointer",
        color: "#111", width: "28px", height: "28px",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
};