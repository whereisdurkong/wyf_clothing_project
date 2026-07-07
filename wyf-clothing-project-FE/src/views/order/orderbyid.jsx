import axios from "axios";
import config from "../../config";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Toast } from '../../components/Notification';
import Loading from "../../components/Loading";

function StarIcon({ filled, size = 13 }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            aria-hidden="true"
            style={{
                fill: filled ? "#B23A2F" : "none",
                stroke: filled ? "#B23A2F" : "#C9C7BE",
                strokeWidth: filled ? 0 : 1.5,
                transition: "fill 150ms ease, stroke 150ms ease",
            }}
        >
            <path d="M12 2.5l2.95 6.53 7.05.72-5.3 4.86 1.5 7.14L12 18.1l-6.2 3.65 1.5-7.14-5.3-4.86 7.05-.72L12 2.5z" />
        </svg>
    );
}

export default function OrderById() {
    const [searchParams] = useSearchParams();
    const order_id = searchParams.get("id");
    const [hoverRating, setHoverRating] = useState(null);
    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Controls visibility of the "did you receive this?" confirmation modal
    const [showReceivedModal, setShowReceivedModal] = useState(false);
    // Which screen inside the modal is currently showing
    // "confirm" -> "review" -> "thanks"
    const [modalStage, setModalStage] = useState("confirm");

    // Review form state
    const [reviewRating, setReviewRating] = useState(null); // 0-5, null = not chosen yet
    const [reviewDescription, setReviewDescription] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    // "to_receive" and "received" are system/customer-driven statuses.
    const LOCKED_STATUSES = ["to_receive", "received"];

    // Display label for a status value, e.g. "to_ship" -> "TO SHIP"
    const formatStatus = (status) =>
        (status || "").replace(/_/g, " ").toUpperCase();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/order/get-order-by-id`, {
                    params: { id: order_id }
                });
                console.log('Order fetched successfully', res.data);

                setOrder(res.data);

                // items comes back as a JSON string — parse it first
                const parsedItems = JSON.parse(res.data.items || "[]");

                // fetch product + variant details for each line item
                const responses = await Promise.all(
                    parsedItems.map((item) =>
                        Promise.all([
                            axios.get(`${config.baseApi}/product/get-product-by-id`, {
                                params: { id: item.product_id },
                            }),
                            axios.get(`${config.baseApi}/product/get-variant-by-id`, {
                                params: { id: item.product_variant_id },
                            }),
                        ])
                    )
                );

                const merged = parsedItems.map((item, index) => {
                    const [productRes, variantRes] = responses[index];
                    return {
                        ...item,
                        product_name: productRes.data?.product_name || 'INVALID ITEM',
                        product_image_front: productRes.data?.product_image_front || null,
                        variant_size: variantRes.data?.product_variant_size || null,
                    };
                });

                setOrderItems(merged);
            } catch (err) {
                console.log("Unable to fetch order", err);
                setError("Failed to load order.");
                addNotif("Error", "Failed to load order. Please try again.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [order_id]);

    // Auto-show review modal if order is received but not yet reviewed
    useEffect(() => {
        if (
            order &&
            order.order_status === "received" &&
            (order.is_reviewed === null || order.is_reviewed === false)
        ) {
            setModalStage("review");
            setShowReceivedModal(true);
        }
    }, [order]);

    const formatPrice = (amount) =>
        `₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

    const formatDate = (isoString) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Opens the confirmation modal instead of updating the status directly
    const handleOrderReceivedClick = () => {
        setModalStage("confirm");
        setShowReceivedModal(true);
    };

    const resetReviewForm = () => {
        setReviewRating(null);
        setReviewDescription("");
    };

    const closeReceivedModal = () => {
        if (updatingStatus || submittingReview) return; // don't allow closing mid-request
        setShowReceivedModal(false);
        setModalStage("confirm");
        resetReviewForm();
    };

    const confirmOrderReceived = async () => {
        setUpdatingStatus(true);
        try {
            await axios.post(`${config.baseApi}/order/update-status`, {
                order_id: order.order_id,
                order_status: "received",
            });

            setOrder(prev => ({ ...prev, order_status: "received" }));
            addNotif("Success", "Order marked as received.", "success");

            // Move the modal into the review step instead of closing it
            setModalStage("review");
        } catch (err) {
            console.log("Unable to update order status", err);
            addNotif("Error", "Failed to update order status. Please try again.", "error");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const finishWithThanks = () => {
        setModalStage("thanks");
        setTimeout(() => {
            setShowReceivedModal(false);
            setModalStage("confirm");
            resetReviewForm();
        }, 2200);
    };

    const submitReview = async () => {
        if (reviewRating === null) return;

        setSubmittingReview(true);
        try {
            await axios.post(`${config.baseApi}/order/create-review`, {
                order_id: order.order_id,
                rating: reviewRating,
                description: reviewDescription.trim(),
            });

            // Update local order state so the review card shows immediately
            setOrder(prev => ({
                ...prev,
                is_reviewed: true,
                rating: reviewRating,
                description: reviewDescription.trim(),
            }));

            addNotif("Success", "Thanks for sharing your feedback!", "success");
            finishWithThanks();
        } catch (err) {
            console.log("Unable to submit review", err);
            addNotif("Error", "Failed to submit your review. Please try again.", "error");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <Loading />;

    if (error || !order) {
        return (
            <div className="oid-root">
                <StyleSheet />

                <div className="oid-toast-stack">
                    {notifications.map(n => (
                        <div key={n.id} style={{ pointerEvents: "auto" }}>
                            <Toast {...n} onDismiss={id =>
                                setNotifications(prev => prev.filter(n => n.id !== id))
                            } />
                        </div>
                    ))}
                </div>

                <div className="oid-empty">
                    <span className="oid-empty-mark" aria-hidden="true" />
                    <p>Order not found</p>
                </div>
            </div>
        );
    }

    const zip = String(order.order_id).padStart(6, "0");

    return (
        <div className="oid-root">
            <StyleSheet />

            {/* Toast container */}
            <div className="oid-toast-stack">
                {notifications.map(n => (
                    <div key={n.id} style={{ pointerEvents: "auto" }}>
                        <Toast {...n} onDismiss={id =>
                            setNotifications(prev => prev.filter(n => n.id !== id))
                        } />
                    </div>
                ))}
            </div>

            {/* Order Received confirmation / review modal */}
            {showReceivedModal && (
                <div
                    className="oid-modal-overlay"
                    onClick={closeReceivedModal}
                >
                    <div
                        key={modalStage}
                        className="oid-modal oid-anim oid-anim--rise"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="oid-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {modalStage === "confirm" && (
                            <>
                                <div className="oid-modal-icon">
                                    <svg viewBox="0 0 64 64" className="oid-modal-icon-svg">
                                        <circle cx="32" cy="32" r="28" className="oid-modal-icon-ring" />
                                        <path d="M18 33 L27.5 42.5 L47 21" className="oid-modal-icon-check" />
                                    </svg>
                                </div>

                                <p className="oid-modal-eyebrow">Confirm Delivery</p>
                                <h3 id="oid-modal-title" className="oid-modal-title">
                                    Did you receive this order?
                                </h3>
                                <p className="oid-modal-order-ref">№ {order.order_id}</p>
                                <p className="oid-modal-text">
                                    This order will be marked as received. This can't be undone.
                                </p>

                                <div className="oid-modal-actions">
                                    <button
                                        className="oid-modal-btn oid-modal-btn--ghost"
                                        onClick={closeReceivedModal}
                                        disabled={updatingStatus}
                                    >
                                        Not Yet
                                    </button>
                                    <button
                                        className="oid-modal-btn oid-modal-btn--solid"
                                        onClick={confirmOrderReceived}
                                        disabled={updatingStatus}
                                    >
                                        {updatingStatus ? "Updating…" : "Yes, Received"}
                                    </button>
                                </div>
                            </>
                        )}

                        {modalStage === "review" && (
                            <div className="oid-modal-review">
                                <p className="oid-modal-eyebrow">Rate Your Order</p>
                                <h3 id="oid-modal-title" className="oid-modal-title">How was it?</h3>
                                <p className="oid-modal-order-ref">№ {order.order_id}</p>
                                <p className="oid-modal-text">
                                    Give us a rating, 0 to 5 stars. Your feedback helps us improve.
                                </p>

                                <div className="oid-star-row">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className="oid-star-btn"
                                            onClick={() => setReviewRating(value)}
                                            onMouseEnter={() => setHoverRating(value)}
                                            onMouseLeave={() => setHoverRating(null)}
                                            disabled={submittingReview}
                                            aria-label={`${value} star${value > 1 ? 's' : ''}`}
                                        >
                                            <StarIcon filled={value <= (hoverRating ?? reviewRating ?? 0)} size={30} />
                                        </button>
                                    ))}
                                </div>

                                <p className="oid-star-label">
                                    {reviewRating
                                        ? ["", "Terrible", "Poor", "Okay", "Good", "Excellent"][reviewRating]
                                        : "\u00A0"}
                                </p>

                                <textarea
                                    className="oid-review-textarea"
                                    placeholder="Tell us more about your experience (optional)"
                                    value={reviewDescription}
                                    onChange={(e) => setReviewDescription(e.target.value)}
                                    disabled={submittingReview}
                                    maxLength={1000}
                                />

                                {reviewRating === null && (
                                    <p className="oid-review-hint">Select a rating to continue</p>
                                )}

                                <div className="oid-modal-actions">
                                    <button
                                        className="oid-modal-btn oid-modal-btn--solid"
                                        onClick={submitReview}
                                        disabled={submittingReview || reviewRating === null}
                                    >
                                        {submittingReview ? "Submitting…" : "Submit Review"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalStage === "thanks" && (
                            <div className="oid-modal-thanks">
                                <div className="oid-modal-icon">
                                    <svg viewBox="0 0 64 64" className="oid-modal-icon-svg">
                                        <circle cx="32" cy="32" r="28" className="oid-modal-icon-ring" />
                                        <path d="M18 33 L27.5 42.5 L47 21" className="oid-modal-icon-check" />
                                    </svg>
                                </div>

                                <p className="oid-modal-eyebrow">Delivery Confirmed</p>
                                <h3 className="oid-modal-title">Thank You</h3>
                                <p className="oid-modal-order-ref">№ {order.order_id}</p>
                                <p className="oid-modal-text">
                                    Your order has been marked as received.
                                </p>
                                <p className="oid-modal-thanks-sub">
                                    From the block, to yours — thank you.
                                </p>

                                <div className="oid-modal-progress" aria-hidden="true">
                                    <span className="oid-modal-progress-fill" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="oid-page">
                {/* HEADER */}
                <header className="oid-tag">
                    <p className="oid-brandline">
                        WHERE YOU FROM? <span className="oid-brandline-dim">— Order Confirmation</span>
                    </p>
                    <div className="oid-tag-row">
                        <div>
                            <h1 className="oid-order-no">№ {order.order_id}</h1>
                            <p className="oid-order-code">WYF-{zip}-PH · Placed {formatDate(order.created_at)}</p>
                        </div>
                        <div className="oid-status-control">
                            <span className={`oid-stamp${order.order_status === "received" ? " oid-stamp--received" : ""}`}>
                                {formatStatus(order.order_status)}
                            </span>

                            {order.order_status === "to_receive" && (
                                <button
                                    className="oid-received-btn"
                                    onClick={handleOrderReceivedClick}
                                    disabled={updatingStatus}
                                >
                                    {updatingStatus ? "Updating…" : "Order Received"}
                                </button>
                            )}
                        </div>
                    </div>

                    {(order.order_status === "to_ship" || LOCKED_STATUSES.includes(order.order_status)) && (
                        <div className="oid-tracking">
                            <span className="oid-tracking-label">Tracking</span>
                            <div className="oid-tracking-input-wrapper">
                                <span className="oid-tracking-static">
                                    {order.tracking_number || "Not yet assigned"}
                                </span>
                                {order.tracking_number && (
                                    <a
                                        href={`https://www.jtexpress.ph/track-and-trace?waybillNo=${order.tracking_number}&flag=1`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="oid-track-btn"
                                    >
                                        Track
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <div className="oid-body">
                    {/* LEFT: order details */}
                    <div className="oid-col oid-col--left">
                        <section className="oid-section">
                            <h4 className="oid-label">Recipient</h4>
                            <p className="oid-text oid-text--strong">
                                {order.first_name} {order.last_name}
                            </p>
                            <p className="oid-text oid-text--muted">{order.email}</p>
                            <p className="oid-text oid-text--muted">{order.phone_number}</p>
                        </section>

                        <section className="oid-section">
                            <h4 className="oid-label">Ship To</h4>
                            <p className="oid-text">{order.street_address}</p>
                            <p className="oid-text">{order.barangay}, {order.city}</p>
                            <p className="oid-text">{order.region}, {order.postal_code}</p>
                            <p className="oid-text oid-text--upper oid-text--strong">{order.country}</p>
                        </section>

                        <section className="oid-section">
                            <h4 className="oid-label">Payment</h4>
                            <span className="oid-payment-chip">{order.payment_method}</span>
                        </section>

                        {order.order_status === "received" && order.is_reviewed && (
                            <section className="oid-section">
                                <h4 className="oid-label">Your Review</h4>
                                <div className="oid-review-display">
                                    <div className="oid-review-stars">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <StarIcon key={i} filled={i <= order.rating} size={15} />
                                        ))}
                                        <span className="oid-review-rating-num">{order.rating} / 5</span>
                                    </div>
                                    {order.description && (
                                        <p className="oid-review-body">"{order.description}"</p>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="oid-divider" aria-hidden="true" />

                    {/* RIGHT: items + total */}
                    <div className="oid-col oid-col--right">
                        <div className="oid-items-head">
                            <h4 className="oid-label">Items</h4>
                            <span className="oid-items-count">{orderItems.length} PC{orderItems.length === 1 ? "" : "S"}</span>
                        </div>

                        <div className="oid-items">
                            {orderItems.map((item, index) => (
                                <div
                                    key={`${item.product_id}-${item.product_variant_id}-${index}`}
                                    className="oid-item"
                                >
                                    <div className="oid-item-image">
                                        {item.product_image_front ? (
                                            <img
                                                src={item.product_image_front}
                                                alt={item.product_name}
                                            />
                                        ) : (
                                            <div className="oid-item-image--empty" />
                                        )}
                                    </div>

                                    <div className="oid-item-info">
                                        <div className="oid-item-name">{item.product_name}</div>
                                        {item.variant_size && (
                                            <div className="oid-item-size">Size {item.variant_size}</div>
                                        )}
                                        <div className="oid-item-meta">
                                            <span>Qty {item.quantity}</span>
                                            <span>{formatPrice(item.unit_price)} each</span>
                                        </div>
                                    </div>

                                    <div className="oid-item-total">
                                        {formatPrice(item.line_total)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="oid-totals">
                            <div className="oid-totals-row">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.sub_total)}</span>
                            </div>
                            <div className="oid-totals-row">
                                <span>Shipping</span>
                                <span>{order.shipping_fee ? formatPrice(order.shipping_fee) : "Free"}</span>
                            </div>
                            <div className="oid-totals-row oid-totals-row--grand">
                                <span>Total</span>
                                <span>{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="oid-footer">
                    <span>From the block, to yours — thank you.</span>
                </footer>
            </div>
        </div>
    );
}

function StyleSheet() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

           .oid-root {
    --ink: #0B0B0A;
    --paper: #FFFFFF;
    --mid: #8A8880;
    --line: #0B0B0A;
    --hair: #E4E2DB;
    --panel: #F1F0EB;
    --accent: #B23A2F;
    --accent-dim: rgba(178, 58, 47, 0.1);

    background:
        radial-gradient(ellipse 1200px 700px at 50% -8%, #2A2822, transparent 60%),
        linear-gradient(180deg, #201F1B, #171613 70%);
    position: relative;
    min-height: 100vh;
    color: var(--ink);
    font-family: 'Inter', sans-serif;

    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    padding-top: calc(40px + 90px); /* base padding + desktop navbar height */

    box-sizing: border-box;
}

            .oid-root * { box-sizing: border-box; }

            .oid-page {
                max-width: 1040px;
                margin: 0 auto;
                background: var(--paper);
                border: 1px solid var(--line);
                box-shadow:
                    0 2px 0 var(--accent),
                    0 50px 90px -30px rgba(0, 0, 0, 0.65);
            }

            /* ---------- Empty state ---------- */
            .oid-empty {
                max-width: 1040px;
                margin: 140px auto;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 14px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                font-size: 12px;
                color: #B5B2A8;
            }
            .oid-empty-mark {
                width: 22px;
                height: 22px;
                border: 1px solid var(--accent);
                border-radius: 50%;
                position: relative;
            }
            .oid-empty-mark::before,
            .oid-empty-mark::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 12px;
                height: 1.5px;
                background: var(--accent);
                transform-origin: center;
            }
            .oid-empty-mark::before { transform: translate(-50%, -50%) rotate(45deg); }
            .oid-empty-mark::after { transform: translate(-50%, -50%) rotate(-45deg); }

            /* ---------- Toasts ---------- */
            .oid-toast-stack {
                position: fixed;
                bottom: 20px;
                right: 24px;
                left: 24px;
                z-index: 9999;
                max-width: 340px;
                margin-left: auto;
                pointer-events: none;
            }

            /* ---------- Header ---------- */
            .oid-tag {
                border-bottom: 1px solid var(--line);
                padding: 32px 40px 24px;
            }
            .oid-brandline {
                margin: 0 0 22px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.16em;
                text-transform: uppercase;
            }
            .oid-brandline-dim {
                font-weight: 400;
                color: var(--mid);
                text-transform: none;
                letter-spacing: 0.02em;
            }
            .oid-tag-row {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 20px;
                flex-wrap: wrap;
            }
            .oid-order-no {
                margin: 0;
                font-family: 'Bebas Neue', sans-serif;
                font-weight: 400;
                font-size: 46px;
                letter-spacing: 0.01em;
                line-height: 1;
            }
            .oid-order-code {
                margin: 8px 0 0;
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                letter-spacing: 0.04em;
                color: var(--mid);
            }

            .oid-status-control {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .oid-stamp {
                display: inline-flex;
                align-items: center;
                border: 1.5px solid var(--ink);
                padding: 8px 16px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                white-space: nowrap;
            }
            .oid-stamp--received {
                border-color: var(--accent);
                color: var(--accent);
                background: var(--accent-dim);
            }

            .oid-received-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 9px 18px;
                background: var(--accent);
                color: var(--paper);
                border: 1.5px solid var(--accent);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                cursor: pointer;
                white-space: nowrap;
                transition: all 160ms ease;
            }
            .oid-received-btn:hover:not(:disabled) {
                background: var(--paper);
                color: var(--accent);
            }
            .oid-received-btn:disabled { opacity: 0.55; cursor: not-allowed; }

            .oid-tracking {
                margin-top: 20px;
                display: flex;
                align-items: center;
                gap: 14px;
                flex-wrap: wrap;
            }
            .oid-tracking-label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: var(--mid);
            }
            .oid-tracking-input-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1 1 220px;
            }
            .oid-tracking-static {
                font-family: 'Space Mono', monospace;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.05em;
                background: var(--panel);
                border: 1px solid var(--hair);
                padding: 8px 12px;
                flex: 1;
            }
            .oid-track-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 8px 16px;
                background: var(--paper);
                color: var(--ink);
                border: 1.5px solid var(--ink);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                text-decoration: none;
                white-space: nowrap;
                transition: all 160ms ease;
                flex-shrink: 0;
            }
            .oid-track-btn:hover { background: var(--accent); color: var(--paper); border-color: var(--accent); }

            /* ---------- Body ---------- */
            .oid-body { display: flex; align-items: stretch; }
            .oid-col { padding: 32px 40px; }
            .oid-col--left { flex: 1 1 300px; min-width: 260px; }
            .oid-col--right { flex: 1.3 1 460px; min-width: 320px; }

            .oid-divider {
                width: 1px;
                background: var(--hair);
            }

            .oid-section { margin-bottom: 24px; }
            .oid-section:last-child { margin-bottom: 0; }

            .oid-label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                color: var(--mid);
                margin: 0 0 10px;
            }

            .oid-text { margin: 3px 0; font-size: 14px; line-height: 1.55; }
            .oid-text--strong { font-weight: 600; }
            .oid-text--muted { color: var(--mid); }
            .oid-text--upper { text-transform: uppercase; letter-spacing: 0.03em; }

            .oid-payment-chip {
                display: inline-block;
                border: 1.5px solid var(--ink);
                padding: 6px 14px;
                font-family: 'Space Mono', monospace;
                font-size: 12px;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                font-weight: 700;
            }

            .oid-items-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                margin-bottom: 6px;
            }
            .oid-items-count {
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                color: var(--mid);
            }

            .oid-items { display: flex; flex-direction: column; }

            .oid-item {
                display: flex;
                gap: 14px;
                align-items: center;
                padding: 16px 0;
                border-bottom: 1px solid var(--hair);
            }
            .oid-item:first-child { padding-top: 0; }

            .oid-item-image {
                width: 68px;
                height: 68px;
                border: 1px solid var(--hair);
                flex-shrink: 0;
                overflow: hidden;
            }
            .oid-item-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .oid-item-image--empty { width: 100%; height: 100%; background: var(--panel); }

            .oid-item-info { flex: 1; min-width: 0; }
            .oid-item-name {
                font-size: 15px;
                font-weight: 600;
                margin-bottom: 2px;
            }
            .oid-item-size {
                font-size: 12px;
                color: var(--mid);
                margin-bottom: 5px;
            }
            .oid-item-meta {
                display: flex;
                gap: 14px;
                font-family: 'Space Mono', monospace;
                font-size: 12px;
                color: var(--mid);
            }
            .oid-item-total {
                font-family: 'Space Mono', monospace;
                font-size: 14px;
                font-weight: 700;
                flex-shrink: 0;
            }

            .oid-totals {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--line);
                font-family: 'Space Mono', monospace;
            }
            .oid-totals-row {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                padding: 4px 0;
                color: var(--mid);
            }
            .oid-totals-row--grand {
                color: var(--accent);
                font-weight: 700;
                font-size: 18px;
                margin-top: 8px;
                padding-top: 10px;
                border-top: 1px solid var(--hair);
            }
            .oid-totals-row--grand span:first-child { color: var(--ink); }

            .oid-footer {
                border-top: 1px solid var(--line);
                padding: 16px 40px;
                font-size: 11px;
                letter-spacing: 0.06em;
                color: var(--mid);
            }

            /* ---------- Review display ---------- */
            .oid-review-display {
                border: 1px solid var(--hair);
                background: var(--panel);
                padding: 14px 16px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .oid-review-stars { display: flex; align-items: center; gap: 3px; }
            .oid-review-rating-num {
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                font-weight: 700;
                margin-left: 6px;
            }
            .oid-review-body {
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
                font-style: italic;
                border-left: 2px solid var(--ink);
                padding-left: 10px;
            }

            /* ---------- Modal ---------- */
            .oid-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 10000;
                background: rgba(11, 11, 10, 0.55);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: oid-fade-in 180ms ease forwards;
            }
            .oid-modal {
                position: relative;
                width: 100%;
                max-width: 400px;
                background: var(--paper);
                border: 1px solid var(--line);
                padding: 36px 30px 26px;
                text-align: center;
            }
            .oid-anim--rise { animation: oid-rise-in 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            @keyframes oid-rise-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes oid-fade-in { from { opacity: 0; } to { opacity: 1; } }

            .oid-modal-icon { width: 52px; height: 52px; margin: 0 auto 16px; }
            .oid-modal-icon-svg { width: 100%; height: 100%; overflow: visible; }
            .oid-modal-icon-ring {
                fill: none;
                stroke: var(--accent);
                stroke-width: 2;
                stroke-dasharray: 176;
                stroke-dashoffset: 176;
                animation: oid-ring-draw 460ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
                animation-delay: 60ms;
            }
            .oid-modal-icon-check {
                fill: none;
                stroke: var(--accent);
                stroke-width: 3.5;
                stroke-linecap: round;
                stroke-linejoin: round;
                stroke-dasharray: 40;
                stroke-dashoffset: 40;
                animation: oid-check-draw 300ms ease forwards;
                animation-delay: 460ms;
            }
            @keyframes oid-ring-draw { to { stroke-dashoffset: 0; } }
            @keyframes oid-check-draw { to { stroke-dashoffset: 0; } }

            .oid-modal-eyebrow {
                margin: 0 0 8px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: var(--mid);
            }
            .oid-modal-title {
                margin: 0 0 6px;
                font-size: 22px;
                font-weight: 700;
                line-height: 1.25;
            }
            .oid-modal-order-ref {
                margin: 0 0 16px;
                font-family: 'Space Mono', monospace;
                font-size: 12px;
                color: var(--mid);
            }
            .oid-modal-text {
                margin: 0 0 24px;
                font-size: 13px;
                line-height: 1.55;
                color: var(--mid);
            }
            .oid-modal-thanks-sub {
                margin: -8px 0 20px;
                font-size: 11px;
                letter-spacing: 0.03em;
                color: var(--mid);
                font-style: italic;
            }

            .oid-modal-actions { display: flex; gap: 10px; }
            .oid-modal-btn {
                flex: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 12px 18px;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                cursor: pointer;
                transition: all 160ms ease;
                border: 1.5px solid var(--ink);
            }
            .oid-modal-btn--ghost { background: var(--paper); color: var(--ink); }
            .oid-modal-btn--ghost:hover:not(:disabled) { background: var(--panel); }
            .oid-modal-btn--solid { background: var(--accent); color: var(--paper); border-color: var(--accent); }
            .oid-modal-btn--solid:hover:not(:disabled) { background: var(--paper); color: var(--accent); }
            .oid-modal-btn:disabled { opacity: 0.55; cursor: not-allowed; }

            @media (max-width: 480px) {
                .oid-root { padding: 32px 12px; padding-top: calc(32px + 70px); }

                .oid-modal { padding: 30px 22px 20px; }
                .oid-modal-actions { flex-direction: column-reverse; }
                .oid-modal-btn { width: 100%; padding: 13px 18px; }
            }

            /* Review step */
            .oid-star-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 6px; }
            .oid-star-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                transition: transform 140ms ease;
                line-height: 0;
            }
            .oid-star-btn:hover:not(:disabled) { transform: scale(1.15); }
            .oid-star-btn:disabled { cursor: not-allowed; opacity: 0.6; }
            .oid-star-label {
                margin: 0 0 16px;
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                min-height: 18px;
            }
            .oid-review-textarea {
                width: 100%;
                min-height: 84px;
                resize: vertical;
                background: var(--paper);
                border: 1.5px solid var(--hair);
                padding: 10px 12px;
                font-family: 'Inter', sans-serif;
                font-size: 13px;
                line-height: 1.5;
                color: var(--ink);
                margin-bottom: 10px;
            }
            .oid-review-hint {
                margin: -4px 0 14px;
                font-size: 11px;
                color: var(--mid);
            }

            .oid-modal-progress {
                height: 3px;
                margin: 22px -30px -4px;
                background: var(--hair);
                overflow: hidden;
                position: relative;
            }
            .oid-modal-progress-fill {
                position: absolute;
                inset: 0;
                background: var(--accent);
                transform: scaleX(0);
                transform-origin: left center;
                animation: oid-progress-fill 2200ms linear forwards;
            }
            @keyframes oid-progress-fill { to { transform: scaleX(1); } }

            @media (prefers-reduced-motion: reduce) {
                .oid-anim--rise, .oid-modal-overlay, .oid-modal-icon-ring,
                .oid-modal-icon-check, .oid-modal-progress-fill {
                    animation: none !important;
                    opacity: 1 !important;
                    transform: none !important;
                }
            }

            /* ---------- Responsive ---------- */
            @media (max-width: 720px) {
                .oid-body { flex-direction: column; }
                .oid-divider { display: none; height: 1px; width: auto; }
                .oid-col { padding: 24px 24px; width: 100%; }
                .oid-tag { padding: 24px 24px 20px; }
                .oid-order-no { font-size: 34px; }
                .oid-status-control { width: 100%; }
                .oid-received-btn { flex: 1; }
                .oid-footer { padding: 16px 24px; }
            }

            @media (max-width: 480px) {
                .oid-root { padding: 32px 12px; }
                .oid-tag { padding: 20px 18px 18px; }
                .oid-tag-row { flex-direction: column; align-items: flex-start; gap: 14px; }
                .oid-order-no { font-size: 30px; }
                .oid-status-control { flex-direction: column; align-items: stretch; gap: 8px; }
                .oid-stamp { justify-content: center; }
                .oid-tracking { flex-direction: column; align-items: flex-start; gap: 8px; }
                .oid-tracking-input-wrapper { width: 100%; }
                .oid-col { padding: 20px 16px; }
                .oid-item-image { width: 56px; height: 56px; }
                .oid-item-name { font-size: 14px; }
                .oid-item-meta { flex-direction: column; gap: 2px; }
                .oid-toast-stack { left: 12px; right: 12px; bottom: 12px; max-width: none; }
            }
        `}</style>
    );
}