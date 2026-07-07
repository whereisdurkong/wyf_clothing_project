import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";

import { Toast } from '../../components/Notification';
import Loading from "../../components/Loading";

export default function AllUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const token = localStorage.getItem('access_token');

    const addNotif = (title, message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/users/get-all-users`);
                setUsers(res.data || []);
            } catch (err) {
                console.log('Unable to fetch all users: ', err);
                addNotif("Error", "Failed to load users.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleRoleChange = async (user, newRole) => {
        const prevUsers = users;

        // optimistic update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        setUpdatingId(user.id);

        try {
            const res = await axios.put(
                `${config.baseApi}/users/update-role/${user.id}`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            addNotif("Success", res.data?.message || "Role updated.", "success");
        } catch (err) {
            // revert on failure
            setUsers(prevUsers);
            addNotif("Error", err.response?.data?.msg || "Failed to update role.", "error");
        } finally {
            setUpdatingId(null);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <Loading />;

    return (
        <div style={styles.page}>
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

            <div style={styles.headerRow}>
                <h1 style={styles.heading}>Users</h1>
                <span style={styles.countTag}>
                    {users.length} {users.length === 1 ? 'entry' : 'entries'}
                </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Role</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                style={styles.tr}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <td style={{ ...styles.td, fontWeight: 600 }}>{user.name}</td>
                                <td style={{ ...styles.td, color: '#555' }}>{user.email}</td>
                                <td style={styles.td}>
                                    <select
                                        value={user.role}
                                        disabled={updatingId === user.id}
                                        onChange={(e) => handleRoleChange(user, e.target.value)}
                                        style={{
                                            ...styles.roleSelect,
                                            background: user.role === 'admin' ? '#111' : '#fff',
                                            color: user.role === 'admin' ? '#fff' : '#111',
                                            opacity: updatingId === user.id ? 0.5 : 1,
                                            cursor: updatingId === user.id ? 'wait' : 'pointer',
                                        }}
                                    >
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td style={{ ...styles.td, textAlign: 'right', color: '#999', fontSize: '13px' }}>
                                    {formatDate(user.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <p style={styles.emptyText}>No users found.</p>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: {
        background: "#fff",
        minHeight: "100vh",
        padding: "60px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        width: "100%",
        boxSizing: "border-box",
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '20px',
        borderBottom: '2px solid #111',
        paddingBottom: '16px',
    },
    heading: {
        fontSize: '28px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        margin: 0,
        textTransform: 'uppercase',
        color: '#111',
    },
    countTag: {
        fontSize: '12px',
        letterSpacing: '0.1em',
        color: '#6f6f6f',
        textTransform: 'uppercase',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#111',
        borderBottom: '2px solid #111',
    },
    tr: {
        borderBottom: '1px solid #e5e5e5',
        transition: 'background-color 0.15s ease',
    },
    td: {
        padding: '16px',
        verticalAlign: 'middle',
        color: '#111',
    },
    roleSelect: {
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '5px 10px',
        border: '1px solid #111',
        borderRadius: '2px',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        padding: '48px 0',
    },
};