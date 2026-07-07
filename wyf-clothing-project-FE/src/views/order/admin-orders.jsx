import axios from "axios";
import config from "../../config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Order() {
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");
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
                setUserOrders(res1.data);
            } catch (err) {
                console.log("Unable to fetch user", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const statusColor = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "delivered" || s === "completed") return "#000";
        if (s === "cancelled") return "#999";
        return "#000";
    };

    // unique statuses present in the data, for dropdown options
    const statusOptions = Array.from(
        new Set(userOrders.map((o) => o.order_status).filter(Boolean))
    );

    const displayedOrders = userOrders.filter((order) => {
        const matchesStatus =
            statusFilter === "all" || order.order_status === statusFilter;

        const q = search.trim().toLowerCase();
        const matchesSearch =
            q === "" ||
            String(order.order_id).toLowerCase().includes(q) ||
            (order.email || "").toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
    });

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <p style={styles.eyebrow}>WYF? / ACCOUNT</p>
                <h2 style={styles.title}>Orders</h2>
                <div style={styles.rule} />
            </div>

            {!loading && userOrders.length > 0 && (
                <div style={styles.filterBar}>
                    <input
                        type="text"
                        placeholder="Search by order ID or email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={styles.statusSelect}
                    >
                        <option value="all">All Statuses</option>
                        {statusOptions.map((status) => (
                            <option key={status} value={status}>
                                {status.replace(/_/g, " ")}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {loading ? (
                <p style={styles.stateText}>Loading orders...</p>
            ) : userOrders.length > 0 ? (
                displayedOrders.length > 0 ? (
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Order ID</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={{ ...styles.th, textAlign: "right" }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedOrders.map((order) => (
                                    <tr
                                        key={order.order_id}
                                        onClick={() => navigate(`/order/order?id=${order.order_id}`)}
                                        style={styles.row}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                        <td style={styles.td}>#{order.order_id}</td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.badge, borderColor: statusColor(order.order_status) }}>
                                                {order.order_status?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td style={{ ...styles.td, color: "#666" }}>{order.email}</td>
                                        <td style={{ ...styles.td, textAlign: "right", fontWeight: 600 }}>
                                            ₱{Number(order.total).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={styles.empty}>
                        <p style={styles.stateText}>No orders match your filters</p>
                    </div>
                )
            ) : (
                <div style={styles.empty}>
                    <p style={styles.stateText}>No orders found</p>
                    <button style={styles.shopBtn} onClick={() => navigate("/shop")}>
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
        gap: "12px",
        marginBottom: "24px",
        flexWrap: "wrap",
    },
    searchInput: {
        flex: "1 1 240px",
        padding: "12px 16px",
        border: "1px solid #000",
        fontSize: "13px",
        fontFamily: "inherit",
        outline: "none",
        background: "#fff",
        color: "#000",
    },
    statusSelect: {
        padding: "12px 16px",
        border: "1px solid #000",
        fontSize: "13px",
        fontFamily: "inherit",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        fontWeight: 600,
        outline: "none",
        background: "#fff",
        color: "#000",
        cursor: "pointer",
    },
    tableWrap: {
        border: "1px solid #000",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        textAlign: "left",
        padding: "16px 20px",
        fontSize: "11px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        borderBottom: "2px solid #000",
        background: "#000",
        color: "#fff",
        fontWeight: 600,
    },
    row: {
        cursor: "pointer",
        borderBottom: "1px solid #e0e0e0",
        transition: "background 0.15s ease",
    },
    td: {
        padding: "18px 20px",
        fontSize: "14px",
    },
    badge: {
        display: "inline-block",
        padding: "4px 12px",
        border: "1px solid #000",
        borderRadius: "20px",
        fontSize: "11px",
        letterSpacing: "1px",
        textTransform: "uppercase",
        fontWeight: 600,
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
    },
};