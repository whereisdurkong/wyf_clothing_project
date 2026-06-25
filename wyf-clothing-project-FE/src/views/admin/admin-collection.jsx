import axios from "axios";
import config from "../../config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminCollection() {
    const [collections, setCollections] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/product/get-all-collection`);
                setCollections(res.data || []);
            } catch (err) {
                console.log("Unable to fetch data: ", err);
            }
        };
        fetch();
    }, []);

    const baseUrl = config.baseApi.replace("/api", "");

    return (
        <div style={styles.grid}>
            {collections.map((col) => (
                <div key={col.collection_id} style={styles.card} onClick={() => navigate('/admin/admin-collection-view?id=' + col.collection_id)}>
                    <img
                        src={`${baseUrl}${col.collection_images}`}
                        alt={col.collection_title}
                        style={styles.image}
                    />
                    <span style={styles.year}>
                        {new Date(col.created_at).getFullYear()}
                    </span>
                </div>
            ))}
        </div>
    );
}

const styles = {
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "30px",         // ← increase this
        backgroundColor: "#fff",
        padding: "50px",     // ← add padding so edges don't clip
        paddingTop: '150px'
    },
    card: {
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        aspectRatio: "1 / 1",  // ← square
        backgroundColor: "#eee",
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
    },
    year: {
        position: "absolute",
        bottom: "30px",
        left: "50px",
        color: "#fff",
        fontSize: "25px",
        fontWeight: "600",
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.02em",
        textShadow: "0 1px 4px rgba(0,0,0,0.4)",
    },
};