import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";
export default function Cart({ onClose }) {
    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("cart")) || [];
        } catch {
            return [];
        }
    });
    const navigate = useNavigate();

    const [orderNote, setOrderNote] = useState("");
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [visible, setVisible] = useState(false);

    // Trigger slide-in on mount
    useEffect(() => {
        // Tiny delay lets the browser register the initial (off-screen) state
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);


    useEffect(() => {
        if (cart.length === 0) return;

        const fetchCartProducts = async () => {
            try {
                const responses = await Promise.all(
                    cart.map((item) =>
                        Promise.all([
                            axios.get(`${config.baseApi}/product/get-product-by-id`, {
                                params: { id: item.product_id },
                            }),
                            axios.get(`${config.baseApi}/product/get-variant-by-id-variant`, {
                                params: {
                                    id: item.product_id,
                                    variantSize: item.variant_size, // must match wha<div style={styles.itemDetails}>t's saved in localStorage
                                },
                            }),
                        ])
                    )
                );

                // Merge product + variant data into each cart item
                setCart((prev) =>
                    prev.map((item, index) => {
                        const [productRes, variantRes] = responses[index];
                        return {
                            ...item,
                            ...productRes.data,
                            price: variantRes.data?.product_variant_price || productRes.data?.price || 0,
                            sale_price: variantRes.data?.product_variant_sale_price || null,
                            variant_size: variantRes.data?.product_variant_size || item.variant_size,
                        };
                    })
                );
            } catch (err) {
                console.log("UNABLE TO FETCH CART DATA: ", err);
            }
        };

        fetchCartProducts();
    }, []);

    // Slide out, then call onClose after the animation finishes
    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 320); // match transition duration
    };

    const updateQuantity = (index, delta) => {
        setCart((prev) => {
            const updated = prev
                .map((item, i) => {
                    if (i !== index) return item;
                    const newQty = item.quantity + delta;
                    if (newQty < 1) return null;
                    return { ...item, quantity: newQty };
                })
                .filter(Boolean);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const removeItem = (index) => {
        setCart((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const total = cart.reduce(
        (sum, item) => sum + (item.price || 0) * item.quantity,
        0
    );

    const formatPrice = (amount) =>
        `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
    const baseUrl = config.baseApi.replace("/api", "");
    return (
        <>
            <style>{`
    .cart-panel {
        transform: translateX(100%);
        transition: transform 320ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .cart-panel.open {
        transform: translateX(0);
    }
    .cart-overlay {
        opacity: 0;
        transition: opacity 320ms ease;
    }
    .cart-overlay.open {
        opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
        .cart-panel, .cart-overlay {
            transition: none;
        }
    }

    /* Mobile: full width panel */
    @media (max-width: 480px) {
        .cart-panel {
            max-width: 100% !important;
            width: 100% !important;
        }
    }

    /* Mobile: tighten header */
    @media (max-width: 480px) {
        .cart-header {
            padding: 14px 16px !important;
        }
        .cart-title {
            font-size: 16px !important;
        }
    }

    /* Mobile: price row wraps cleanly */
    @media (max-width: 480px) {
        .cart-price-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
        }
    }

    /* Mobile: qty row stacks remove below controls */
    @media (max-width: 360px) {
        .cart-qty-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
        }
    }

    /* Checkout button full width, easier to tap */
    .cart-checkout-btn {
        min-height: 52px;
        touch-action: manipulation;
    }
`}</style>

            <div
                className={`cart-overlay${visible ? " open" : ""}`}
                style={styles.overlay}
                onClick={handleClose}
            >
                <div
                    className={`cart-panel${visible ? " open" : ""}`}
                    style={styles.panel}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={styles.header}>
                        <h2 style={styles.title}>Cart</h2>
                        <button
                            style={styles.closeBtn}
                            onClick={handleClose}
                            aria-label="Close cart"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Items */}
                    <div style={styles.itemsContainer}>
                        {cart.length === 0 ? (
                            <p style={styles.emptyText}>Your cart is empty.</p>
                        ) : (
                            cart.map((item, index) => (
                                <div key={index} style={styles.cartItem} >
                                    {/* Product Image */}
                                    <div style={styles.imageWrapper}>
                                        {item.product_image_front ? (
                                            <img

                                                src={`${baseUrl}${item.product_image_front}`}
                                                alt={item.name || "Product"}
                                                style={styles.image}
                                            />
                                        ) : (
                                            <div style={styles.imagePlaceholder}>
                                                <span style={{ fontSize: 28 }}>🛍️</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div style={styles.itemDetails}>
                                        <div style={styles.itemName} onClick={() => navigate('/product?id=' + item.product_id)}>
                                            {item.product_name || 'INVALID ITEM'}
                                        </div>

                                        {/* Price display */}
                                        {item.sale_price && parseFloat(item.sale_price) > 0 ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <span style={styles.originalPrice}>
                                                    {formatPrice((parseFloat(item.price) || 0) * item.quantity)}
                                                </span>
                                                <span style={styles.salePrice}>
                                                    {formatPrice((parseFloat(item.sale_price) || 0) * item.quantity)}
                                                </span>
                                                <span style={styles.saleBadge}>
                                                    -{Math.round((1 - parseFloat(item.sale_price) / parseFloat(item.price)) * 100)}%
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={styles.itemPrice}>
                                                {formatPrice((parseFloat(item.price) || 0) * item.quantity)}
                                            </div>
                                        )}

                                        {item.variant_size && (
                                            <div style={styles.itemVariant}>{item.variant_size}</div>
                                        )}

                                        <div style={styles.qtyRow}>
                                            <div style={styles.qtyControl}>
                                                <button
                                                    style={styles.qtyBtn}
                                                    onClick={() => updateQuantity(index, -1)}
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>
                                                <span style={styles.qtyValue}>{item.quantity}</span>
                                                <button
                                                    style={styles.qtyBtn}
                                                    onClick={() => updateQuantity(index, 1)}
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                style={styles.removeBtn}
                                                onClick={() => removeItem(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <button
                            style={styles.orderNoteToggle}
                            onClick={() => setShowNoteInput(!showNoteInput)}
                        >
                            Add order note
                        </button>
                        {showNoteInput && (
                            <textarea
                                style={styles.noteInput}
                                placeholder="How can we help you?"
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                rows={3}
                            />
                        )}
                        <p style={styles.taxNote}>Taxes and shipping calculated at checkout</p>
                        <button
                            style={{
                                ...styles.checkoutBtn,
                                ...(cart.length === 0 ? styles.checkoutBtnDisabled : {}),
                            }}
                            disabled={cart.length === 0}
                            onClick={() => {
                                window.location.href = "/checkout";
                            }}
                        >
                            Checkout&nbsp;<span style={{ color: "#999" }}>•</span>&nbsp;
                            {formatPrice(total)}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.3)",
    },
    panel: {
        background: "#fff",
        width: "100%",
        maxWidth: 440,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.1)",
        overflowY: "auto",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid #e5e5e5",
    },
    title: {
        fontSize: 18,
        fontWeight: 600,
        color: "#111",
        margin: 0,
    },
    closeBtn: {
        background: "none",
        border: "none",
        fontSize: 20,
        cursor: "pointer",
        color: "#555",
        lineHeight: 1,
        padding: 4,
    },
    itemsContainer: {
        flex: 1,
        padding: "8px 16px",
    },
    emptyText: {
        textAlign: "center",
        color: "#888",
        marginTop: 40,
        fontSize: 14,
    },
    cartItem: {
        display: "flex",
        gap: 12,
        padding: "16px 0",
        borderBottom: "1px solid #f0f0f0",
    },
    imageWrapper: {
        width: 125,
        height: 125,
        border: "2px solid #000000",
        flexShrink: 0,
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        background: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    itemDetails: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
    },
    itemName: {
        fontSize: 13,
        fontWeight: 600,
        color: "#111",
        lineHeight: 1.4,
        cursor: 'pointer'
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: 500,
        color: "#111",
    },
    itemVariant: {
        fontSize: 13,
        color: "#555",
    },
    qtyRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginTop: 6,
    },
    qtyControl: {
        display: "flex",
        alignItems: "center",
        border: "1px solid #ccc",
        borderRadius: 2,
    },
    qtyBtn: {
        background: "none",
        border: "none",
        padding: "4px 10px",
        cursor: "pointer",
        fontSize: 16,
        color: "#333",
        lineHeight: 1,
    },
    qtyValue: {
        padding: "4px 10px",
        fontSize: 14,
        borderLeft: "1px solid #ccc",
        borderRight: "1px solid #ccc",
        minWidth: 36,
        textAlign: "center",
    },
    removeBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        color: "#111",
        textDecoration: "underline",
        padding: 0,
    },
    footer: {
        borderTop: "1px solid #e5e5e5",
        padding: "12px 16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
    },
    orderNoteToggle: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        color: "#111",
        textAlign: "left",
        padding: 0,
    },
    noteInput: {
        width: "100%",
        border: "1px solid #ccc",
        borderRadius: 2,
        padding: "8px 10px",
        fontSize: 13,
        resize: "vertical",
        fontFamily: "inherit",
        outline: "none",
    },
    taxNote: {
        fontSize: 13,
        fontWeight: 300,

        color: "#5e5e5e",
    },
    checkoutBtn: {
        width: "100%",
        background: "#111",
        color: "#fff",
        border: "none",
        padding: "16px",
        fontSize: 15,
        fontWeight: 500,
        cursor: "pointer",
        borderRadius: 2,
        marginTop: 8,
    },
    checkoutBtnDisabled: {
        background: "#999",
        cursor: "not-allowed",
    },
    // Add to styles object
    originalPrice: {
        fontSize: 13,
        color: "#999",
        textDecoration: "line-through",
    },
    salePrice: {
        fontSize: 14,
        fontWeight: 600,
        color: "#436d45",
    },
    saleBadge: {
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        background: "#8ebe82",
        borderRadius: 2,
        padding: "2px 6px",
    },
};