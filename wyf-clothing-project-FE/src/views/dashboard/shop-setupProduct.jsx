import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";

const CATEGORIES = [
    { key: "shirt", label: "Shirts" },
    { key: "hoodie", label: "Hoodies" },
    { key: "bottoms", label: "Bottoms" },
    { key: "footwear", label: "Footwear" },
];

const btnStyle = `
    .na-shop-b-btn {
        position: relative;
        display: inline-block;
        padding: 13px 48px;
        background-color: #ffffff;
        color: #141414;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 3px;
        text-transform: uppercase;
        border: 2px solid #ffffff;
        cursor: pointer;
        overflow: hidden;
        white-space: nowrap;
        transition: color 0.4s ease, border-color 0.4s ease;
    }
    .na-shop-b-btn::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background-color: #ffffff;
        transform: translateX(0%);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
    }
    .na-shop-b-btn span {
        position: relative;
        z-index: 1;
        font-family: "Roboto", sans-serif;
    }
    .na-shop-b-btn:hover::before {
        transform: translateX(105%);
    }
    .na-shop-b-btn:hover {
        color: #ffffff;
        border-color: #ffffff;
        background-color: transparent;
    }
`;

export default function ShopSetupProduct() {
    const [setupData, setSetupData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/product/get-all-setup`);
                const data = res.data?.[0] || null;
                setSetupData(data);
            } catch (err) {
                console.log("Unable to fetch product setup images");
            }
        };
        fetch();
    }, []);

    return (
        <>
            <style>{btnStyle}</style>
            <section style={styles.section}>
                <h2 style={styles.heading}>PRODUCTS</h2>

                <div style={styles.grid}>
                    {CATEGORIES.map(({ key, label }) => (
                        <div key={key} style={styles.card}>
                            <div
                                style={{
                                    ...styles.imageLayer,
                                    backgroundImage: setupData
                                        ? `url(${config.baseApi.replace('/api', '')}${setupData[key]})`
                                        : "none",
                                    backgroundColor: setupData ? "transparent" : "#222",
                                }}
                            />
                            <div style={styles.overlay} />
                            <div style={styles.cardContent}>
                                <span style={styles.label}>{label}</span>
                                <button className="na-shop-b-btn">
                                    <span>View products</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}

const styles = {
    section: {
        width: "100%",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        padding: "40px 0",
        backgroundColor: "#fff",
    },
    heading: {
        textAlign: "center",
        fontWeight: "700",
        fontSize: "18px",
        letterSpacing: "0.05em",
        marginBottom: "24px",
        color: "#000",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0",
        width: "100%",
    },
    card: {
        position: "relative",
        height: "70vh",
        overflow: "hidden",

        cursor: "pointer",
    },
    imageLayer: {
        position: "absolute",
        inset: 0,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        transition: "transform 0.4s ease",
    },
    overlay: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
    },
    cardContent: {
        position: "absolute",
        bottom: "50px",
        left: "50px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    label: {
        color: "#fff",
        fontWeight: "700",
        fontSize: "18px",
        letterSpacing: "0.01em",
        textShadow: "0 1px 4px rgba(0,0,0,0.4)",
    },
};