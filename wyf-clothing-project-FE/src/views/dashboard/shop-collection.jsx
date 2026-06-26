import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import { useNavigate } from "react-router-dom";

export default function ShopCollection() {
    const [collections, setCollections] = useState([]);
    const navigate = useNavigate()
    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const res = await axios.get(`${config.baseApi}/product/get-all-collection`);
                const data = res.data || [];
                // get latest 2
                const latest = data.slice(-2).reverse();
                setCollections(latest);
            } catch (err) {
                console.log('Unable to fetch collection data: ', err);
            }
        };
        fetchCollections();
    }, []);

    const baseUrl = config.baseApi.replace('/api', '');

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

                .col-grid {
                    display: grid;
                    grid-template-columns: repeat(${collections.length}, 1fr);
                    width: 100%;
                    height: 55vh;
                    min-height: 480px;
                }

                .col-item {
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }

                .col-item:not(:last-child) {
                    border-right: 2px solid #fff;
                }

                .col-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.6s ease;
                }

                .col-item:hover .col-img {
                    transform: scale(1.04);
                }

               .col-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.35);  /* uniform dark overlay instead of gradient */
}

.col-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px;
    color: #fff;
}
                .col-tag {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.75);
                    margin-bottom: 8px;
                }

                .col-title {
                    font-size: clamp(20px, 2.2vw, 30px);
                    font-weight: 600;
                    line-height: 1.25;
                    margin: 0 0 20px;
                    color: #fff;
                }

                .na-shop-b-btn {
  position: relative;
  display: inline-block;
  padding: 13px 48px;
  background-color: #ffffff;
  color: #141414;
  font-family: 'Georgia', serif;
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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

                @media (max-width: 640px) {
                    .col-grid {
                        grid-template-columns: 1fr;
                        height: auto;
                    }
                    .col-item {
                        height: 60vw;
                        min-height: 280px;
                        border-right: none !important;
                        border-bottom: 2px solid #fff;
                    }
                    .col-content {
                        bottom: 28px;
                        left: 24px;
                        right: 24px;
                    }
                }
            `}</style>

            <div className="col-grid">
                {collections.map((col, i) => (
                    <div className="col-item" key={col.collection_id} onClick={() => navigate('/all-collections?id=' + col.collection_id)}>
                        <img
                            className="col-img"
                            src={`${baseUrl}${col.collection_images}`}
                            alt={col.collection_title}
                            onError={(e) => { e.target.style.background = '#222'; e.target.style.display = 'none'; }}
                        />
                        <div className="col-overlay" />
                        <div className="col-content">
                            <p className="col-tag">
                                {col.collection_subtitle}
                            </p>
                            <p className="col-title">"{col.collection_title}"</p>

                            <button className="na-shop-b-btn"><span>View Collection</span></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}