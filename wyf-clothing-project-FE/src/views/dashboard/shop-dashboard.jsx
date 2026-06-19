import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";

export default function ShopDashboard() {
    const [images, setImages] = useState([]);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/blog/get-all-dashboard`);
                const data = res.data || [];

                // Flatten all images from all dashboard rows into one array
                const allImages = data.flatMap((item) =>
                    JSON.parse(item.images || "[]")
                );

                setImages(allImages);
            } catch (err) {
                console.log("Unable to fetch all dashboard images: ", err);
            }
        };
        fetch();
    }, []);

    // Auto-slide every 3 seconds
    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [images]);

    const baseUrl = config.baseApi.replace("/api", "");

    return (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>

            {/* Slides */}
            {images.map((imgPath, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `url('${baseUrl}/${imgPath}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        opacity: i === current ? 1 : 0,
                        transition: "opacity 0.8s ease-in-out",
                    }}
                />
            ))}

            {/* Dot indicators */}
            {images.length > 1 && (
                <div style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "8px",
                    zIndex: 2,
                }}>
                    {images.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setCurrent(i)}
                            style={{
                                width: i === current ? "24px" : "8px",
                                height: "8px",
                                borderRadius: "4px",
                                background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Shop Now button */}
            <div style={{
                position: "absolute",
                bottom: "60px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 2,
            }}>
                <button className="shop-now-btn">
                    <span>Shop Now</span>
                </button>
            </div>
        </div>
    );
}