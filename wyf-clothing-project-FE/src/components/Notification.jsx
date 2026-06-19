const config = {
    error: { color: "#E24B4A", icon: "!" },
    warning: { color: "#EF9F27", icon: "!" },
    success: { color: "#639922", icon: "✓" },
    info: { color: "#378ADD", icon: "i" },
};

export function Toast({ id, title, message, type, onDismiss }) {
    const c = config[type];
    return (
        <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            background: "#fff",
            border: "0.5px solid #e1e3e5",
            borderLeft: `2.5px solid ${c.color}`,
            borderRadius: "0 12px 12px 0",
            padding: "12px 14px",
            marginBottom: 8,
            fontFamily: "inherit",
            animation: "slideIn 0.2s ease",
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{
                        width: 16, height: 16, borderRadius: 3,
                        background: "#202223", color: "#fff",
                        fontSize: 9, fontWeight: 500,
                        textAlign: "center", lineHeight: "16px",
                        flexShrink: 0,
                    }}>
                        {c.icon}
                    </span>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 13, color: "#202223" }}>
                        {title}
                    </p>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#6d7175" }}>{message}</p>
            </div>
            <button
                onClick={() => onDismiss(id)}
                aria-label="Dismiss"
                style={{
                    background: "none", border: "none",
                    cursor: "pointer", color: "#8c9196",
                    fontSize: 16, lineHeight: 1,
                    padding: 0, flexShrink: 0,
                }}
            >
                ×
            </button>
        </div>
    );
}