import axios from "axios";
import config from "../../config";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Toast } from '../../components/Notification';
import Loading from "../../components/Loading";

export default function AdminOrderByID() {
    const [searchParams] = useSearchParams();
    const order_id = searchParams.get("id");

    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [notifications, setNotifications] = useState([]);

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    // Only these are manually selectable by staff. "to_receive" and "received"
    // are system/customer-driven statuses — visible, but not choosable here.
    const STATUS_OPTIONS = ["pending", "to_ship"];
    const LOCKED_STATUSES = ["to_receive", "received"];

    // Display label for a status value, e.g. "to_ship" -> "TO SHIP"
    const formatStatus = (status) =>
        (status || "").replace(/_/g, " ").toUpperCase();

    const [selectedStatus, setSelectedStatus] = useState("");
    const [savingStatus, setSavingStatus] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [trackingTouched, setTrackingTouched] = useState(false);
    const [savingTracking, setSavingTracking] = useState(false);

    // Live tracking status/checkpoints for the order's saved tracking number
    const [trackingStatus, setTrackingStatus] = useState(null);
    const [trackingStatusLoading, setTrackingStatusLoading] = useState(false);
    const [trackingStatusError, setTrackingStatusError] = useState(null);

    // Shipment progress is collapsed by default — only the latest checkpoint
    // shows until the staff member expands the full timeline.
    const [timelineExpanded, setTimelineExpanded] = useState(false);

    const isTrackingValid = trackingNumber.length > 0;
    const trackingHasError = trackingTouched && !isTrackingValid;



    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/order/get-order-by-id`, {
                    params: { id: order_id }
                });
                console.log('Order fetched successfully', res.data);
                setOrder(res.data);
                setSelectedStatus(res.data.order_status);
                // don't auto-generate a tracking number — leave blank until the
                // staff member enters/confirms one
                setTrackingNumber(res.data.tracking_number || "");

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

    // Whenever the order has a saved tracking number, pull its live
    // // status/checkpoints — same endpoint/shape used on the public
    // // TrackingOrder page.
    // useEffect(() => {
    //     if (!order?.tracking_number) {
    //         setTrackingStatus(null);
    //         setTrackingStatusError(null);
    //         return;
    //     }

    //     let cancelled = false;

    //     const fetchTrackingStatus = async () => {
    //         setTrackingStatusLoading(true);
    //         setTrackingStatusError(null);
    //         try {
    //             const res = await axios.get(`${config.baseApi}/order/get-tracking-status-by-number`, {
    //                 params: { number: order.tracking_number },
    //             });
    //             if (!cancelled) {
    //                 console.log('Tracking status fetched successfully', res.data);
    //                 setTrackingStatus(res.data);
    //                 setTimelineExpanded(false);
    //             }
    //         } catch (err) {
    //             if (!cancelled) {
    //                 console.log("Unable to fetch tracking status", err);
    //                 setTrackingStatusError("Couldn't load tracking status.");
    //             }
    //         } finally {
    //             if (!cancelled) setTrackingStatusLoading(false);
    //         }
    //     };

    //     fetchTrackingStatus();

    //     return () => {
    //         cancelled = true;
    //     };
    // }, [order?.tracking_number]);

    const handleStatusChange = (e) => {
        const value = e.target.value;
        setSelectedStatus(value);
        // no auto-fill — the tracking field stays exactly as the staff member left it
    };

    const handleTrackingChange = (e) => {
        setTrackingNumber(e.target.value.toUpperCase());
        if (!trackingTouched) setTrackingTouched(true);
    };

    // Status save is now independent of tracking number.
    const handleSaveStatus = async () => {
        setSavingStatus(true);
        try {
            await axios.post(`${config.baseApi}/order/update-status`, {
                order_id: order.order_id,
                order_status: selectedStatus,
            });

            addNotif("Status updated", `Order marked as ${formatStatus(selectedStatus)}.`, "success");

            window.location.reload();
        } catch (err) {
            console.log("Unable to update order status", err);
            addNotif("Error", "Couldn't update order status. Please try again.", "error");
        } finally {
            setSavingStatus(false);
        }
    };

    // Separate handler that only saves the tracking number.
    const handleSaveTracking = async () => {
        if (!isTrackingValid) {
            setTrackingTouched(true);
            addNotif("Invalid tracking number", "Enter a 12-digit tracking number before saving.", "error");
            return;
        }
        if (order.order_status !== "to_ship") {
            addNotif("Cannot save tracking", "Tracking number can only be saved when order status is 'TO SHIP'.", "error");
            return;
        }

        setSavingTracking(true);
        try {
            await axios.post(`${config.baseApi}/order/update-tracking`, {
                order_id: order.order_id,
                tracking_number: trackingNumber,
            });

            await axios.post(`${config.baseApi}/order/update-status-to-receive`, {
                order_id: order.order_id,

            });


            window.location.reload();

            addNotif("Tracking saved", "Tracking number updated.", "success");
        } catch (err) {
            console.log("Unable to update tracking number", err);
            addNotif("Error", "Couldn't update tracking number. Please try again.", "error");
        } finally {
            setSavingTracking(false);
        }
    };

    const handleUpdateTracking = async () => {
        if (!isTrackingValid) {
            setTrackingTouched(true);
            addNotif("Invalid tracking number", "Enter a 12-digit tracking number before updating.", "error");
            return;
        }
        if (order.order_status !== "to_ship") {
            addNotif("Cannot update tracking", "Tracking number can only be updated when order status is 'TO SHIP'.", "error");
            return;
        }

        setSavingTracking(true);
        try {
            await axios.post(`${config.baseApi}/order/update-tracking`, {
                order_id: order.order_id,
                tracking_number: trackingNumber,
            });

            window.location.reload();

            addNotif("Tracking updated", "Tracking number updated.", "success");
        } catch (err) {
            console.log("Unable to update tracking number", err);
            addNotif("Error", "Couldn't update tracking number. Please try again.", "error");
        } finally {
            setSavingTracking(false);
        }
    };

    const isStatusLocked = order && LOCKED_STATUSES.includes(order.order_status);

    const statusChanged = order && selectedStatus !== order.order_status;
    const trackingChanged = order && trackingNumber !== (order.tracking_number || "");

    const showSaveStatusButton = statusChanged && !isStatusLocked;
    const showSaveTrackingButton = trackingChanged && isTrackingValid;

    const isUpdatingTracking = Boolean(order?.tracking_number);
    const isTrackingEditable = order?.order_status === "to_ship";
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

    // Checkpoints, newest first — used for both the collapsed "latest only"
    // view and the expanded full timeline.
    const sortedCheckpoints = trackingStatus?.checkpoints
        ? [...trackingStatus.checkpoints].sort((a, b) => new Date(b.time) - new Date(a.time))
        : [];
    const visibleCheckpoints = timelineExpanded ? sortedCheckpoints : sortedCheckpoints.slice(0, 1);

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

            <div className="oid-page">
                {/* ORIGIN STAMP — brand signature */}
                <div className="oid-origin-stamp oid-anim oid-anim--stamp" style={{ animationDelay: "520ms" }} aria-hidden="true">
                    <svg viewBox="0 0 120 120" className="oid-origin-ring">
                        <defs>
                            <path id="oid-ring-path" d="M 60,60 m -46,0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0" />
                        </defs>
                        <circle cx="60" cy="60" r="56" className="oid-origin-outer" />
                        <circle cx="60" cy="60" r="46" className="oid-origin-inner" />
                        <text className="oid-origin-text">
                            <textPath href="#oid-ring-path" startOffset="0%">
                                • ORIGIN VERIFIED • WHERE YOU FROM
                            </textPath>
                        </text>
                    </svg>
                    <span className="oid-origin-core">WYF</span>
                </div>

                {/* HANG TAG HEADER */}
                <header className="oid-tag oid-anim oid-anim--tag">
                    <span className="oid-tag-hole" aria-hidden="true" />
                    <p className="oid-brandline oid-anim oid-anim--rise" style={{ animationDelay: "40ms" }}>
                        Where You From? <span className="oid-brandline-dim">— Manifest of Goods</span>
                    </p>
                    <div className="oid-tag-row">
                        <div>
                            <p className="oid-eyebrow oid-anim oid-anim--rise" style={{ animationDelay: "80ms" }}>
                                Order Confirmation
                            </p>
                            <h1 className="oid-order-no oid-anim oid-anim--rise" style={{ animationDelay: "160ms" }}>
                                № {order.order_id}
                            </h1>
                            <p className="oid-order-code oid-anim oid-anim--rise" style={{ animationDelay: "200ms" }}>
                                WYF-{zip}-PH
                            </p>
                        </div>
                        <div className="oid-status-control">
                            <div
                                className="oid-stamp oid-anim oid-anim--stampin"
                                style={{ animationDelay: "420ms" }}
                            >
                                <select
                                    className="oid-stamp-select"
                                    value={selectedStatus}
                                    onChange={handleStatusChange}
                                    disabled={isStatusLocked}
                                    aria-label="Order status"
                                >
                                    {(STATUS_OPTIONS.includes(order.order_status)
                                        ? STATUS_OPTIONS
                                        : [order.order_status, ...STATUS_OPTIONS]
                                    ).map((opt) => (
                                        <option key={opt} value={opt}>{formatStatus(opt)}</option>
                                    ))}
                                </select>
                                <span className="oid-stamp-caret" aria-hidden="true" />
                            </div>

                            {showSaveStatusButton && (
                                <button
                                    type="button"
                                    className="oid-save-btn"
                                    onClick={handleSaveStatus}
                                    disabled={savingStatus}
                                >
                                    {savingStatus ? "Saving…" : "Save"}
                                </button>
                            )}
                        </div>
                    </div>

                    {(order.order_status === "to_ship" || LOCKED_STATUSES.includes(order.order_status)) && (
                        <div className="oid-tracking oid-anim oid-anim--rise" style={{ animationDelay: "460ms" }}>
                            <label htmlFor="oid-tracking-input" className="oid-tracking-label">
                                Tracking Number
                            </label>
                            <div className="oid-tracking-field">
                                <div className="oid-tracking-input-wrapper">
                                    <div
                                        className={
                                            "oid-tracking-wrap" +
                                            (trackingHasError ? " oid-tracking-wrap--error" : "") +
                                            (isTrackingValid ? " oid-tracking-wrap--valid" : "")
                                        }
                                    >
                                        <input
                                            id="oid-tracking-input"
                                            type="text"
                                            inputMode="text"
                                            autoComplete="off"
                                            placeholder="Enter tracking number"
                                            className="oid-tracking-input"
                                            value={trackingNumber}
                                            onChange={handleTrackingChange}
                                            onBlur={() => setTrackingTouched(true)}
                                            aria-invalid={trackingHasError}
                                            aria-describedby="oid-tracking-hint"
                                        />
                                        {isTrackingValid && (
                                            <span className="oid-tracking-check" aria-hidden="true">✓</span>
                                        )}
                                    </div>
                                    {order.tracking_number && (
                                        <a
                                            href={`https://www.jtexpress.ph/track-and-trace?waybillNo=${trackingNumber}&flag=1`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="oid-track-btn"
                                        >
                                            Track
                                        </a>
                                    )}
                                    {showSaveTrackingButton && (
                                        <button
                                            type="button"
                                            className="oid-save-btn oid-save-btn--tracking"
                                            onClick={isUpdatingTracking ? handleUpdateTracking : handleSaveTracking}
                                            disabled={savingTracking}
                                        >
                                            {savingTracking
                                                ? (isUpdatingTracking ? "Updating…" : "Saving…")
                                                : (isUpdatingTracking ? "Update Tracking Number" : "Save Tracking")}
                                        </button>
                                    )}
                                </div>
                                <span
                                    id="oid-tracking-hint"
                                    className={"oid-tracking-count" + (trackingHasError ? " oid-tracking-count--error" : "")}
                                >
                                    {trackingHasError ? "Enter a tracking number" : `${trackingNumber.length} character${trackingNumber.length === 1 ? "" : "s"}`}
                                </span>
                            </div>


                        </div>
                    )}

                    {/* SHIPMENT PROGRESS — collapsed to the latest checkpoint by default */}
                    {/* {order.tracking_number && (
                        <section className="oid-tracking-status oid-anim oid-anim--rise" style={{ animationDelay: "480ms" }}>
                            <div className="oid-tracking-status-head">
                                <h4 className="oid-label"><span className="oid-label-tick" />Shipment Progress</h4>
                                <span className="oid-tracking-status-number">{order.tracking_number}</span>
                            </div>

                            {trackingStatusLoading && (
                                <p className="oid-tracking-status-empty">Fetching latest status…</p>
                            )}

                            {!trackingStatusLoading && trackingStatusError && (
                                <p className="oid-tracking-status-empty oid-tracking-status-empty--error">
                                    {trackingStatusError}
                                </p>
                            )}

                            {!trackingStatusLoading && !trackingStatusError && trackingStatus && (
                                <>
                                    <div className="oid-status-row">
                                        <span className={`oid-status-pill oid-status-pill--${(trackingStatus.status || "unknown").toLowerCase()}`}>
                                            {formatStatus(trackingStatus.status || "unknown")}
                                        </span>
                                        {trackingStatus.subStatus && (
                                            <span className="oid-status-sub">{trackingStatus.subStatus}</span>
                                        )}
                                        {trackingStatus.estimatedDelivery && (
                                            <span className="oid-status-eta">ETA {trackingStatus.estimatedDelivery}</span>
                                        )}
                                    </div>

                                    {sortedCheckpoints.length > 0 ? (
                                        <>
                                            <ol className={"oid-timeline" + (timelineExpanded ? "" : " oid-timeline--collapsed")}>
                                                {visibleCheckpoints.map((cp, i) => (
                                                    <li key={i} className="oid-timeline-item">
                                                        <span className="oid-timeline-dot" />
                                                        <div>
                                                            <p className="oid-timeline-msg">{cp.message}</p>
                                                            <p className="oid-timeline-meta">
                                                                {cp.location ? `${cp.location} · ` : ""}
                                                                {cp.time ? formatDate(cp.time) : ""}
                                                            </p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ol>

                                            {sortedCheckpoints.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="oid-timeline-toggle"
                                                    onClick={() => setTimelineExpanded((v) => !v)}
                                                    aria-expanded={timelineExpanded}
                                                >
                                                    <span className={"oid-timeline-toggle-caret" + (timelineExpanded ? " oid-timeline-toggle-caret--up" : "")} aria-hidden="true" />
                                                    {timelineExpanded
                                                        ? "Show latest only"
                                                        : `View all ${sortedCheckpoints.length} checkpoints`}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <p className="oid-tracking-status-empty">
                                            No checkpoints yet — the carrier hasn't scanned this parcel.
                                        </p>
                                    )}
                                </>
                            )}
                        </section>
                    )} */}

                    <p className="oid-date oid-anim oid-anim--rise" style={{ animationDelay: "220ms" }}>
                        Placed {formatDate(order.created_at)}
                    </p>
                </header>

                <div className="oid-body">
                    {/* LEFT: order details */}
                    <div className="oid-col oid-col--left">
                        <section className="oid-section oid-anim oid-anim--rise" style={{ animationDelay: "260ms" }}>
                            <h4 className="oid-label"><span className="oid-label-tick" />Recipient</h4>
                            <p className="oid-text oid-text--strong">
                                {order.first_name} {order.last_name}
                            </p>
                            <p className="oid-text oid-text--muted">{order.email}</p>
                            <p className="oid-text oid-text--muted">{order.phone_number}</p>
                        </section>

                        <section className="oid-section oid-anim oid-anim--rise" style={{ animationDelay: "320ms" }}>
                            <h4 className="oid-label"><span className="oid-label-tick" />Ship To</h4>
                            <p className="oid-text">{order.street_address}</p>
                            <p className="oid-text">{order.barangay}, {order.city}</p>
                            <p className="oid-text">{order.region}, {order.postal_code}</p>
                            <p className="oid-text oid-text--upper oid-text--strong">{order.country}</p>
                        </section>

                        <section className="oid-section oid-anim oid-anim--rise" style={{ animationDelay: "380ms" }}>
                            <h4 className="oid-label"><span className="oid-label-tick" />Payment</h4>
                            <span className="oid-payment-chip">{order.payment_method}</span>
                        </section>
                    </div>

                    {/* DIVIDER */}
                    <div className="oid-divider oid-anim oid-anim--draw" aria-hidden="true">
                        <span className="oid-divider-label oid-anim oid-anim--fade" style={{ animationDelay: "600ms" }}>
                            Manifest
                        </span>
                    </div>

                    {/* RIGHT: items + total */}
                    <div className="oid-col oid-col--right">
                        <div className="oid-items-head oid-anim oid-anim--rise" style={{ animationDelay: "260ms" }}>
                            <h4 className="oid-label"><span className="oid-label-tick" />Items</h4>
                            <span className="oid-items-count">{orderItems.length} PC{orderItems.length === 1 ? "" : "S"}</span>
                        </div>

                        <div className="oid-items">
                            {orderItems.map((item, index) => (
                                <div
                                    key={`${item.product_id}-${item.product_variant_id}-${index}`}
                                    className="oid-item oid-anim oid-anim--slide"
                                    style={{ animationDelay: `${340 + index * 90}ms` }}
                                >
                                    <span className="oid-item-index">{String(index + 1).padStart(2, "0")}</span>

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

                        <div
                            className="oid-totals oid-anim oid-anim--rise"
                            style={{ animationDelay: `${340 + orderItems.length * 90 + 80}ms` }}
                        >
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

                <footer className="oid-footer oid-anim oid-anim--fade" style={{ animationDelay: "700ms" }}>
                    <span>From the block, to yours — thank you.</span>
                    <span className="oid-footer-barcode" aria-hidden="true" />
                </footer>
            </div >
        </div >
    );
}

function StyleSheet() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..700&family=Anton&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

            .oid-root {
                --ink: #0B0B0A;
                --paper: #F4F3EF;
                --mid: #85837A;
                --line: #0B0B0A;
                --hair: #D9D7CD;
                --panel: #EBE9E1;
                --error: #A3392C;
                --valid: #3E6B4F;
                background:
                    radial-gradient(ellipse 900px 600px at 50% 0%, rgba(11,11,10,0.05), transparent 60%),
                    repeating-linear-gradient(135deg, rgba(11,11,10,0.05) 0 1px, transparent 1px 15px),
                    repeating-linear-gradient(0deg, rgba(11,11,10,0.035) 0 1px, transparent 1px 26px),
                    repeating-linear-gradient(90deg, rgba(11,11,10,0.035) 0 1px, transparent 1px 26px),
                    radial-gradient(ellipse 1400px 900px at 50% -10%, #FAFAF6, var(--paper) 65%),
                    var(--paper);
                background-attachment: fixed;
                position: relative;
                min-height: 100vh;
                color: var(--ink);
                font-family: 'Inter', sans-serif;
                padding: 120px 20px 60px;
                box-sizing: border-box;
            }

            .oid-root * { box-sizing: border-box; }

            .oid-root::before {
                content: '';
                position: fixed;
                inset: 0;
                z-index: 0;
                pointer-events: none;
                opacity: 0.045;
                mix-blend-mode: multiply;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='230' height='170'%3E%3Ctext x='-10' y='100' font-family='Anton, sans-serif' font-size='40' fill='%230B0B0A' transform='rotate(-18 110 85)'%3EWYF%3F%3C/text%3E%3C/svg%3E");
                background-repeat: repeat;
            }

            .oid-page { position: relative; z-index: 1; }

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

            /* ---------- Entrance animation system ---------- */
            .oid-anim { opacity: 0; }
            .oid-anim--tag {
                animation: oid-tag-in 640ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                transform-origin: top center;
            }
            .oid-anim--rise { animation: oid-rise-in 560ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            .oid-anim--fade { animation: oid-fade-in 560ms ease forwards; }
            .oid-anim--slide { animation: oid-slide-in 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            .oid-anim--stampin { animation: oid-stamp-in 560ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            .oid-anim--stamp { animation: oid-origin-in 760ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            .oid-anim--draw {
                animation: oid-draw-in 700ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
                animation-delay: 200ms;
                transform-origin: top center;
                opacity: 1;
            }

            @keyframes oid-tag-in {
                from { opacity: 0; transform: translateY(-16px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes oid-rise-in {
                from { opacity: 0; transform: translateY(14px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes oid-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes oid-slide-in {
                from { opacity: 0; transform: translateX(-16px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes oid-stamp-in {
                0% { opacity: 0; transform: rotate(-3deg) scale(2); }
                60% { opacity: 1; transform: rotate(-3deg) scale(0.94); }
                100% { opacity: 1; transform: rotate(-3deg) scale(1); }
            }
            @keyframes oid-origin-in {
                0% { opacity: 0; transform: rotate(14deg) scale(1.6); }
                55% { opacity: 1; }
                100% { opacity: 1; transform: rotate(-9deg) scale(1); }
            }
            @keyframes oid-draw-in {
                from { transform: scaleY(0); }
                to { transform: scaleY(1); }
            }

            @media (prefers-reduced-motion: reduce) {
                .oid-anim, .oid-anim--tag, .oid-anim--rise, .oid-anim--fade,
                .oid-anim--slide, .oid-anim--stampin, .oid-anim--stamp, .oid-anim--draw {
                    animation: none !important;
                    opacity: 1 !important;
                    transform: none !important;
                }
                .oid-origin-stamp { transform: rotate(-9deg) !important; }
                .oid-footer-barcode::after { animation: none !important; display: none; }
                .oid-item, .oid-item-image img, .oid-stamp, .oid-save-btn {
                    transition: none !important;
                }
                .oid-save-btn { animation: none !important; }
            }

            .oid-page {
                max-width: 1180px;
                margin: 0 auto;
                background: #FAFAF7;
                border: 1px solid var(--line);
                position: relative;
                box-shadow:
                    0 40px 80px -32px rgba(11,11,10,0.4),
                    0 2px 0 rgba(11,11,10,0.06);
            }

            .oid-empty {
                max-width: 1180px;
                margin: 140px auto;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 14px;
                font-family: 'Inter', sans-serif;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                font-size: 12px;
                color: var(--mid);
            }
            .oid-empty-mark {
                width: 22px;
                height: 22px;
                border: 1px solid var(--ink);
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
                background: var(--ink);
                transform-origin: center;
            }
            .oid-empty-mark::before { transform: translate(-50%, -50%) rotate(45deg); }
            .oid-empty-mark::after { transform: translate(-50%, -50%) rotate(-45deg); }

            /* ---------- Origin stamp (signature element) ---------- */
            .oid-origin-stamp {
                position: absolute;
                top: 22px;
                right: 34px;
                width: 92px;
                height: 92px;
                transform: rotate(-9deg);
                mix-blend-mode: multiply;
                opacity: 0.92;
                pointer-events: none;
                z-index: 2;
            }
            .oid-origin-ring { width: 100%; height: 100%; overflow: visible; }
            .oid-origin-outer, .oid-origin-inner {
                fill: none;
                stroke: var(--ink);
            }
            .oid-origin-outer { stroke-width: 1.6; }
            .oid-origin-inner { stroke-width: 1; stroke-dasharray: 2 3; }
            .oid-origin-text {
                font-family: 'Anton', sans-serif;
                font-size: 8.6px;
                letter-spacing: 0.05em;
                fill: var(--ink);
            }
            .oid-origin-core {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Anton', sans-serif;
                font-size: 22px;
                letter-spacing: 0.02em;
            }

            /* Hang tag header */
            .oid-tag {
                border-bottom: 1px solid var(--line);
                padding: 28px 40px 22px 52px;
                position: relative;
            }
            .oid-tag-hole {
                position: absolute;
                left: 22px;
                top: 32px;
                width: 12px;
                height: 12px;
                border: 1.5px solid var(--ink);
                border-radius: 50%;
                background: var(--paper);
            }
            .oid-tag-hole::after {
                content: '';
                position: absolute;
                left: -9px;
                top: 5px;
                width: 8px;
                height: 1px;
                background: var(--hair);
                box-shadow: 0 -18px 0 var(--hair), 0 18px 0 var(--hair);
            }
            .oid-brandline {
                margin: 0 0 16px;
                font-family: 'Anton', sans-serif;
                font-size: 13px;
                letter-spacing: 0.04em;
                text-transform: uppercase;
            }
            .oid-brandline-dim {
                font-family: 'Space Mono', monospace;
                font-weight: 400;
                letter-spacing: 0.08em;
                color: var(--mid);
                text-transform: none;
                font-size: 11px;
            }
            .oid-tag-row {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 20px;
                flex-wrap: wrap;
                padding-right: 100px;
            }
            .oid-eyebrow {
                margin: 0 0 6px;
                font-size: 11px;
                letter-spacing: 0.24em;
                text-transform: uppercase;
                color: var(--mid);
            }
            .oid-order-no {
                margin: 0;
                font-family: 'Bodoni Moda', serif;
                font-weight: 500;
                font-size: 40px;
                letter-spacing: -0.01em;
                line-height: 1;
            }
            .oid-order-code {
                margin: 8px 0 0;
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                letter-spacing: 0.1em;
                color: var(--mid);
            }
            .oid-date {
                margin: 14px 0 0;
                font-family: 'Space Mono', monospace;
                font-size: 12px;
                color: var(--mid);
            }
            .oid-tracking {
                margin-top: 18px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                flex-wrap: wrap;
            }
            .oid-tracking-label {
                font-family: 'Anton', sans-serif;
                font-size: 11px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: var(--mid);
                padding-top: 10px;
            }
            .oid-tracking-field {
                display: flex;
                flex-direction: column;
                gap: 5px;
                flex: 1 1 220px;
            }
            .oid-tracking-wrap {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: var(--paper);
                border: 1.5px solid var(--ink);
                padding: 8px 12px;
                transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
                flex: 1;
                min-width: 0;
            }
            .oid-tracking-wrap:focus-within {
                background: var(--panel);
                box-shadow: 0 0 0 3px rgba(11,11,10,0.06);
            }
            .oid-tracking-wrap--valid {
                border-color: var(--valid);
            }
            .oid-tracking-wrap--valid:focus-within {
                box-shadow: 0 0 0 3px rgba(62,107,79,0.12);
            }
            .oid-tracking-wrap--error {
                border-color: var(--error);
            }
            .oid-tracking-wrap--error:focus-within {
                box-shadow: 0 0 0 3px rgba(163,57,44,0.1);
            }
            .oid-tracking-input {
                background: transparent;
                border: none;
                outline: none;
                font-family: 'Space Mono', monospace;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.16em;
                color: var(--ink);
                padding: 2px 0;
                width: 100%;
                min-width: 0;
            }
            .oid-tracking-input::placeholder {
                color: var(--hair);
                letter-spacing: 0.16em;
            }
            .oid-tracking-check {
                color: var(--valid);
                font-size: 14px;
                font-weight: 700;
                flex-shrink: 0;
            }
            .oid-tracking-count {
                font-family: 'Space Mono', monospace;
                font-size: 10.5px;
                letter-spacing: 0.06em;
                color: var(--mid);
                padding-left: 2px;
            }
            .oid-tracking-count--error {
                color: var(--error);
            }

            /* ---------- Shipment progress / tracking checkpoints ---------- */
            .oid-tracking-status {
                margin: 20px 0 0;
                padding: 16px 18px;
                border-top: 1px dashed var(--hair);
                background: var(--panel);
                border: 1px solid var(--hair);
                border-radius: 2px;
            }
            .oid-tracking-status-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 10px;
            }
            .oid-tracking-status-number {
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                letter-spacing: 0.1em;
                color: var(--mid);
            }
            .oid-tracking-status-empty {
                font-size: 12.5px;
                color: var(--mid);
                line-height: 1.5;
                margin: 4px 0 0;
            }
            .oid-tracking-status-empty--error {
                color: var(--error);
            }
            .oid-status-row {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 4px;
            }
            .oid-status-pill {
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                padding: 4px 10px;
                border: 1.5px solid var(--ink);
                background: var(--paper);
            }
            .oid-status-pill--delivered {
                background: var(--valid);
                color: #fff;
                border-color: var(--valid);
            }
            .oid-status-pill--exception,
            .oid-status-pill--failed_attempt,
            .oid-status-pill--expired {
                background: var(--error);
                color: #fff;
                border-color: var(--error);
            }
            .oid-status-sub,
            .oid-status-eta {
                font-family: 'Space Mono', monospace;
                font-size: 12px;
                color: var(--mid);
            }
            .oid-timeline {
                list-style: none;
                margin: 14px 0 0;
                padding: 0;
                overflow: hidden;
                transition: max-height 320ms ease;
            }
            .oid-timeline-item {
                display: flex;
                gap: 12px;
                padding-bottom: 14px;
                position: relative;
            }
            .oid-timeline--collapsed .oid-timeline-item {
                padding-bottom: 0;
            }
            .oid-timeline-item:not(:last-child)::before {
                content: '';
                position: absolute;
                left: 3px;
                top: 12px;
                bottom: -2px;
                width: 1.5px;
                background: var(--hair);
            }
            .oid-timeline-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: var(--ink);
                margin-top: 5px;
                flex-shrink: 0;
            }
            .oid-timeline-msg {
                margin: 0;
                font-size: 13px;
                line-height: 1.4;
            }
            .oid-timeline-meta {
                margin: 2px 0 0;
                font-family: 'Space Mono', monospace;
                font-size: 10.5px;
                color: var(--mid);
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }
            .oid-timeline-toggle {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 6px;
                background: none;
                border: none;
                padding: 4px 0;
                cursor: pointer;
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--ink);
                border-bottom: 1px solid var(--ink);
            }
            .oid-timeline-toggle:hover { color: var(--mid); border-color: var(--mid); }
            .oid-timeline-toggle-caret {
                width: 6px;
                height: 6px;
                border-right: 1.5px solid currentColor;
                border-bottom: 1.5px solid currentColor;
                transform: rotate(45deg);
                transition: transform 200ms ease;
            }
            .oid-timeline-toggle-caret--up { transform: rotate(-135deg); }

            .oid-status-control {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                position: relative;
            }

            .oid-stamp {
                border: 1.5px solid var(--ink);
                padding: 0;
                font-family: 'Anton', sans-serif;
                font-size: 11px;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                white-space: nowrap;
                transition: transform 220ms ease, background 220ms ease, color 220ms ease;
                position: relative;
                display: inline-flex;
                align-items: center;
                background: var(--paper);
                color: var(--ink);
            }
            .oid-stamp:hover {
                transform: rotate(-3deg) scale(1.06);
            }
            .oid-stamp:has(.oid-stamp-select:disabled) {
                opacity: 0.6;
            }
            .oid-stamp:has(.oid-stamp-select:disabled):hover {
                transform: none;
            }
            .oid-stamp-select:disabled {
                cursor: not-allowed;
            }
            .oid-stamp-select {
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                background: transparent;
                border: none;
                outline: none;
                color: inherit;
                font-family: inherit;
                font-size: inherit;
                font-weight: inherit;
                letter-spacing: inherit;
                text-transform: inherit;
                cursor: pointer;
                padding: 8px 30px 8px 16px;
                margin: 0;
                width: 100%;
            }
            .oid-stamp-select option {
                background: var(--paper);
                color: var(--ink);
                letter-spacing: 0.04em;
                font-family: 'Inter', sans-serif;
            }
            .oid-stamp-caret {
                position: absolute;
                right: 14px;
                top: 50%;
                width: 7px;
                height: 7px;
                border-right: 1.5px solid currentColor;
                border-bottom: 1.5px solid currentColor;
                transform: translateY(-65%) rotate(45deg);
                pointer-events: none;
            }

            .oid-save-btn {
                border: 1.5px solid var(--ink);
                background: var(--ink);
                color: var(--paper);
                padding: 8px 18px;
                font-family: 'Anton', sans-serif;
                font-size: 11px;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                cursor: pointer;
                animation: oid-save-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                transition: transform 180ms ease, background 180ms ease, color 180ms ease;
            }
            .oid-save-btn:hover:not(:disabled) {
                background: var(--paper);
                color: var(--ink);
                transform: translateY(-1px);
            }
            .oid-save-btn:active:not(:disabled) {
                transform: translateY(0);
            }
            .oid-save-btn:disabled {
                cursor: default;
                opacity: 0.55;
            }
            @keyframes oid-save-in {
                from { opacity: 0; transform: scale(0.7); }
                to { opacity: 1; transform: scale(1); }
            }

            .oid-body {
                display: flex;
                align-items: flex-start;
            }

            .oid-col { padding: 36px 40px; }
            .oid-col--left { flex: 1 1 300px; min-width: 260px; }
            .oid-col--right { flex: 1.3 1 460px; min-width: 320px; }

            .oid-divider {
                align-self: stretch;
                width: 1px;
                background-image: linear-gradient(to bottom, var(--line) 0 6px, transparent 6px 12px);
                background-size: 1px 12px;
                position: relative;
                min-height: 100%;
            }
            .oid-divider-label {
                position: absolute;
                top: 40px;
                left: 50%;
                transform: translateX(-50%) rotate(90deg);
                transform-origin: left top;
                font-family: 'Anton', sans-serif;
                font-size: 10px;
                letter-spacing: 0.26em;
                text-transform: uppercase;
                color: var(--mid);
                white-space: nowrap;
            }

            .oid-section { margin-bottom: 26px; }
            .oid-section:last-child { margin-bottom: 0; }

            .oid-label {
                font-family: 'Anton', sans-serif;
                font-size: 11px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: var(--mid);
                margin: 0 0 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .oid-label-tick {
                width: 6px;
                height: 6px;
                background: var(--ink);
                flex-shrink: 0;
            }

            .oid-text { margin: 3px 0; font-size: 14px; line-height: 1.5; }
            .oid-text--strong { font-weight: 600; }
            .oid-text--muted { color: var(--mid); }
            .oid-text--upper { text-transform: uppercase; letter-spacing: 0.04em; }

            .oid-payment-chip {
                display: inline-block;
                border: 1.5px solid var(--ink);
                padding: 6px 14px;
                font-family: 'Space Mono', monospace;
                font-size: 12px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                font-weight: 700;
            }

            .oid-items-head {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            .oid-items-count {
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                color: var(--mid);
                letter-spacing: 0.08em;
            }

            .oid-items { display: flex; flex-direction: column; }

            .oid-item {
                display: flex;
                gap: 14px;
                align-items: center;
                padding: 18px 10px;
                margin: 0 -10px;
                border-bottom: 1px solid var(--hair);
                transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), background 260ms ease;
            }
            .oid-item:first-child { padding-top: 0; margin-top: 0; }
            .oid-item:hover {
                background: var(--panel);
                transform: translateX(6px);
            }

            .oid-item-index {
                font-family: 'Space Mono', monospace;
                font-size: 11px;
                color: var(--mid);
                width: 16px;
                flex-shrink: 0;
            }

            .oid-item-image {
                width: 76px;
                height: 76px;
                border: 1px solid var(--ink);
                flex-shrink: 0;
                overflow: hidden;
            }
            .oid-item-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: grayscale(100%) contrast(1.05);
                transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1), filter 500ms ease;
            }
            .oid-item:hover .oid-item-image img {
                transform: scale(1.1);
                filter: grayscale(0%) contrast(1.05);
            }
            .oid-item-image--empty { width: 100%; height: 100%; background: var(--panel); }

            .oid-item-info { flex: 1; min-width: 0; }
            .oid-item-name {
                font-family: 'Bodoni Moda', serif;
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 2px;
            }
            .oid-item-size {
                font-size: 12px;
                color: var(--mid);
                text-transform: uppercase;
                letter-spacing: 0.06em;
                margin-bottom: 6px;
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
                margin-top: 22px;
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
                color: var(--ink);
                font-weight: 700;
                font-size: 18px;
                margin-top: 8px;
                padding-top: 10px;
                border-top: 1px dashed var(--hair);
                font-family: 'Anton', sans-serif;
                letter-spacing: 0.02em;
            }

            .oid-footer {
                border-top: 1px solid var(--line);
                padding: 16px 40px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: var(--mid);
            }
            .oid-footer-barcode {
                width: 90px;
                height: 18px;
                position: relative;
                overflow: hidden;
                background: repeating-linear-gradient(
                    90deg,
                    var(--ink) 0 1px,
                    transparent 1px 3px,
                    var(--ink) 3px 4px,
                    transparent 4px 8px,
                    var(--ink) 8px 10px,
                    transparent 10px 12px
                );
            }
            .oid-footer-barcode::after {
                content: '';
                position: absolute;
                top: 0;
                left: -40%;
                width: 40%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(244,243,239,0.9), transparent);
                animation: oid-scan 3.2s ease-in-out infinite;
                animation-delay: 1.2s;
            }
            @keyframes oid-scan {
                0% { left: -40%; }
                45% { left: 100%; }
                100% { left: 100%; }
            }

            /* ---------- Responsive ---------- */
            @media (max-width: 980px) {
                .oid-root { padding: 100px 16px 48px; }
                .oid-col { padding: 32px 32px; }
            }

            @media (max-width: 720px) {
                .oid-body { flex-direction: column; }
                .oid-divider { display: none; }
                .oid-col { padding: 24px 20px; width: 100%; }
                .oid-tag { padding: 22px 20px 18px 40px; }
                .oid-order-no { font-size: 28px; }
                .oid-tag-row { padding-right: 0; }
                .oid-origin-stamp { width: 62px; height: 62px; top: 14px; right: 14px; }
                .oid-origin-core { font-size: 15px; }
                .oid-origin-text { font-size: 6.5px; }
                .oid-footer { flex-direction: column; gap: 10px; align-items: flex-start; padding: 16px 20px; }
                .oid-tracking { flex-direction: column; gap: 8px; }
                .oid-tracking-label { padding-top: 0; }
                .oid-tracking-field { width: 100%; flex: 1 1 auto; }
                .oid-status-control { width: 100%; justify-content: space-between; }
                .oid-stamp { flex: 1 1 auto; }
                .oid-stamp-select { width: 100%; text-align: left; }
                .oid-save-btn { flex-shrink: 0; }
                .oid-tracking-status { padding: 14px; }
            }

            @media (max-width: 480px) {
                .oid-root { padding: 88px 10px 36px; }
                .oid-brandline { font-size: 11px; }
                .oid-brandline-dim { display: block; margin-top: 2px; font-size: 10px; }
                .oid-eyebrow { font-size: 10px; }
                .oid-order-no { font-size: 24px; }
                .oid-order-code { font-size: 10px; }
                .oid-date { font-size: 11px; }
                .oid-tag { padding: 18px 16px 16px 36px; }
                .oid-tag-hole { left: 16px; top: 26px; }
                .oid-origin-stamp { width: 50px; height: 50px; top: 10px; right: 10px; opacity: 0.7; }
                .oid-origin-text { display: none; }
                .oid-origin-outer { display: none; }
                .oid-origin-core { font-size: 13px; }

                .oid-col { padding: 20px 16px; }
                .oid-label { font-size: 10px; letter-spacing: 0.14em; }
                .oid-text { font-size: 13px; }

                .oid-item { gap: 10px; padding: 14px 6px; margin: 0 -6px; }
                .oid-item-index { display: none; }
                .oid-item-image { width: 58px; height: 58px; }
                .oid-item-name { font-size: 14px; }
                .oid-item-meta { flex-direction: column; gap: 2px; }
                .oid-item-total { font-size: 12.5px; }

                .oid-totals-row--grand { font-size: 16px; }

                .oid-tracking-status-head { flex-direction: column; align-items: flex-start; gap: 4px; }
                .oid-tracking-status-number { font-size: 10px; }
                .oid-status-row { gap: 6px; }
                .oid-status-pill { font-size: 10px; padding: 3px 8px; }
                .oid-status-sub, .oid-status-eta { font-size: 11px; }
                .oid-timeline-msg { font-size: 12.5px; }

                .oid-tracking-input { font-size: 13px; }

                .oid-payment-chip { font-size: 11px; padding: 5px 12px; }

                .oid-footer { font-size: 10px; }
                .oid-footer-barcode { width: 70px; height: 14px; }

               .oid-toast-stack { left: 12px; right: 12px; bottom: 12px; max-width: none; }
            }

            .oid-tracking-input-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
            }

            .oid-track-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 8px 18px;
                background: var(--ink);
                color: var(--paper);
                border: 1.5px solid var(--ink);
                font-family: 'Anton', sans-serif;
                font-size: 11px;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                text-decoration: none;
                white-space: nowrap;
                transition: all 180ms ease;
                flex-shrink: 0;
            }

            .oid-track-btn:hover {
                background: var(--paper);
                color: var(--ink);
                transform: translateY(-1px);
            }

            .oid-track-btn:active {
                transform: translateY(0);
            }

            .oid-save-btn--tracking {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0;
}

            @media (max-width: 480px) {
    .oid-tracking-input-wrapper {
        flex-direction: column;
        gap: 8px;
    }

    .oid-tracking-wrap {
        width: 100%;
    }

    .oid-track-btn {
        width: 100%;
        justify-content: center;
        padding: 10px 18px;
    }

    .oid-save-btn--tracking {
        width: 100%;
    }
}
        `}</style>
    );
}