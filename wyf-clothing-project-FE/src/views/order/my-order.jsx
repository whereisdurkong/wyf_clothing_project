import axios from "axios";
import config from "../../config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyOrder() {
    const [userOrders, setUserOrders] = useState([]);
    const [productDetails, setProductDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const res = await axios.get(`${config.baseApi}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userData = res.data.user;

                const res1 = await axios.get(`${config.baseApi}/order/get-all-orders`);
                const filteredOrders = res1.data.filter(order => order.user_id === userData.id);
                setUserOrders(filteredOrders);

                const res2 = await axios.get(`${config.baseApi}/product/get-all-products`);
                setProductDetails(res2.data);
            } catch (err) {
                console.log("Unable to fetch user", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const parseItems = (order) => {
        try {
            return JSON.parse(order.items || "[]");
        } catch {
            return [];
        }
    };

    const getProductItemsForOrder = (order) => {
        const items = parseItems(order);
        return items.map((item) => {
            const product = productDetails.find(
                (p) => String(p.product_id) === String(item.product_id)
            );

            let image = product?.product_image_front || product?.product_image || product?.image || product?.thumbnail || null;
            if (Array.isArray(image)) {
                image = image[0] || null;
            }

            return {
                name: product?.product_name || `Product #${item.product_id}`,
                image,
                quantity: item.quantity,
                unit_price: item.unit_price,
                line_total: item.line_total,
            };
        });
    };

    const statusLabel = (status) => (status || "").replace(/_/g, " ");
    // Count of orders per status, plus total for "All"
    const statusCounts = userOrders.reduce((acc, order) => {
        const status = order.order_status;
        if (status) acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const isActiveStatus = (status) => {
        const s = (status || "").toLowerCase();
        return s !== "delivered" && s !== "completed" && s !== "cancelled";
    };

    // Unique statuses present in the user's orders, used to build filter tabs
    const availableStatuses = Array.from(
        new Set(userOrders.map((o) => o.order_status).filter(Boolean))
    );

    const filteredOrders = statusFilter === "all"
        ? userOrders
        : userOrders.filter((o) => o.order_status === statusFilter);

    return (
        <div style={styles.page}>
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseDot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
                @keyframes ruleGrow {
                    from { width: 0; }
                    to { width: 60px; }
                }

                .wyf-order-card {
                    opacity: 0;
                    animation: fadeSlideUp 0.5s ease forwards;
                }
                .wyf-order-card:hover {
                    border-color: #000;
                    box-shadow: 6px 6px 0px #000;
                    transform: translate(-3px, -3px);
                }
                .wyf-order-card:active {
                    transform: translate(0px, 0px);
                    box-shadow: 0px 0px 0px #000;
                }

                .wyf-item-row img {
    transition: transform 0.4s ease;
}
.wyf-item-row:hover img {
    transform: scale(1.08);
}
}

                .wyf-shop-btn {
                    position: relative;
                    overflow: hidden;
                }
                .wyf-shop-btn::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: rgba(255,255,255,0.15);
                    transition: left 0.4s ease;
                }
                .wyf-shop-btn:hover::after {
                    left: 100%;
                }
                .wyf-shop-btn:hover {
                    letter-spacing: 2px;
                }

                .wyf-rule {
                    animation: ruleGrow 0.6s ease forwards;
                }

                .wyf-pulse-dot {
                    animation: pulseDot 1.6s ease-in-out infinite;
                }

                .wyf-filter-tab {
                    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
                }
                .wyf-filter-tab:hover {
                    border-color: #000 !important;
                }
            `}</style>

            <div style={styles.header}>
                <p style={styles.eyebrow}>WYF? / ACCOUNT</p>
                <h2 style={styles.title}>My Purchase</h2>
                <div className="wyf-rule" style={styles.rule} />
            </div>

            <div style={styles.filterBar}>
                <button
                    className="wyf-filter-tab"
                    style={{
                        ...styles.filterTab,
                        ...(statusFilter === "all" ? styles.filterTabActive : {}),
                    }}
                    onClick={() => setStatusFilter("all")}
                >
                    All ({userOrders.length})
                </button>
                {availableStatuses.map((status) => (
                    <button
                        key={status}
                        className="wyf-filter-tab"
                        style={{
                            ...styles.filterTab,
                            ...(statusFilter === status ? styles.filterTabActive : {}),
                        }}
                        onClick={() => setStatusFilter(status)}
                    >
                        {statusLabel(status)} ({statusCounts[status]})
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={styles.stateText}>Loading orders...</p>
            ) : filteredOrders.length > 0 ? (
                <div style={styles.orderList}>
                    {filteredOrders.map((order, orderIdx) => {
                        const items = getProductItemsForOrder(order);
                        return (
                            <div
                                key={order.order_id}
                                className="wyf-order-card"
                                style={{ ...styles.orderCard, animationDelay: `${orderIdx * 0.08}s` }}
                                onClick={() => navigate(`/my-order/order?id=${order.order_id}`)}
                            >
                                <div style={styles.orderCardHeader}>
                                    <span style={styles.orderIdText}>ORDER WYF{order.order_id}</span>
                                    <span style={styles.badge}>
                                        {isActiveStatus(order.order_status) && (
                                            <span className="wyf-pulse-dot" style={styles.dot} />
                                        )}
                                        {statusLabel(order.order_status)}
                                    </span>
                                </div>

                                <div style={styles.itemList}>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="wyf-item-row" style={styles.itemRow}>
                                            {item.image ? (
                                                <div style={styles.itemImageWrap}>
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        style={styles.itemImage}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{ ...styles.itemImageWrap, ...styles.thumbFallback }} />
                                            )}
                                            <div style={styles.itemInfo}>
                                                <p style={styles.itemName}>{item.name}</p>
                                                <p style={styles.itemQty}>QTY {item.quantity}</p>
                                            </div>
                                            <p style={styles.itemPrice}>
                                                ₱{Number(item.line_total ?? item.unit_price).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.orderCardFooter}>
                                    <span style={styles.totalLabel}>Order Total</span>
                                    <span style={styles.totalValue}>
                                        ₱{Number(order.total).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={styles.empty}>
                    <p style={styles.stateText}>No orders found</p>
                    <button className="wyf-shop-btn" style={styles.shopBtn} onClick={() => navigate("/shop")}>
                        Start Shopping →
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        padding: "120px 8vw 80px",
        minHeight: "100vh",
        background: "#fff",
        color: "#000",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
    },
    header: { marginBottom: "48px" },
    eyebrow: {
        fontSize: "11px",
        letterSpacing: "3px",
        color: "#999",
        marginBottom: "8px",
        fontWeight: 600,
    },
    title: {
        fontSize: "42px",
        fontWeight: 800,
        letterSpacing: "-1px",
        margin: 0,
        textTransform: "uppercase",
    },
    rule: {
        width: "60px",
        height: "3px",
        background: "#000",
        marginTop: "16px",
    },
    filterBar: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "36px",
    },
    filterTab: {
        padding: "9px 18px",
        border: "1px solid #ccc",
        background: "#fff",
        color: "#000",
        fontSize: "11px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        fontWeight: 600,
        cursor: "pointer",
        borderRadius: "20px",
    },
    filterTabActive: {
        background: "#000",
        color: "#fff",
        borderColor: "#000",
    },
    orderList: {
        display: "flex",
        flexDirection: "column",
        gap: "28px",
    },
    orderCard: {
        border: "1.5px solid #000",
        padding: "24px 28px",
        cursor: "pointer",
        background: "#fff",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    },
    orderCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #000",
        paddingBottom: "16px",
        marginBottom: "16px",
    },
    orderIdText: {
        fontSize: "13px",
        fontWeight: 800,
        letterSpacing: "1.5px",
    },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 14px",
        border: "1px solid #000",
        borderRadius: "20px",
        fontSize: "10px",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        fontWeight: 700,
        background: "#000",
        color: "#fff",
    },
    dot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#fff",
        display: "inline-block",
    },
    itemList: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },
    itemRow: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
    },
    itemImageWrap: {
        width: "68px",
        height: "68px",
        overflow: "hidden",
        border: "1px solid #000",
        flexShrink: 0,
    },
    itemImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    thumbFallback: {
        background: "#f0f0f0",
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: "14px",
        margin: 0,
        marginBottom: "5px",
        fontWeight: 500,
    },
    itemQty: {
        fontSize: "11px",
        color: "#999",
        margin: 0,
        letterSpacing: "1px",
    },
    itemPrice: {
        fontSize: "14px",
        fontWeight: 700,
        whiteSpace: "nowrap",
    },
    orderCardFooter: {
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "baseline",
        gap: "10px",
        borderTop: "1px solid #000",
        paddingTop: "16px",
        marginTop: "18px",
    },
    totalLabel: {
        fontSize: "11px",
        color: "#999",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
    },
    totalValue: {
        fontSize: "20px",
        fontWeight: 800,
        letterSpacing: "-0.5px",
    },
    stateText: {
        fontSize: "15px",
        color: "#666",
    },
    empty: {
        textAlign: "center",
        padding: "80px 0",
        border: "1px dashed #ccc",
    },
    shopBtn: {
        marginTop: "20px",
        padding: "14px 32px",
        background: "#000",
        color: "#fff",
        border: "none",
        fontSize: "13px",
        letterSpacing: "1px",
        textTransform: "uppercase",
        cursor: "pointer",
        fontWeight: 600,
        transition: "letter-spacing 0.3s ease",
    },
};