// src/components/CartFlyContext.jsx
import { createContext, useContext, useRef, useState, useCallback } from "react";

const CartFlyCtx = createContext(null);

export function CartFlyProvider({ children }) {
    const cartIconRef = useRef(null);          // ref attached to the bag button in Navbar
    const [flyItems, setFlyItems] = useState([]); // [{id, src, startX, startY}]
    const [bounce, setBounce] = useState(false);

    const flyToCart = useCallback((src, buttonEl) => {
        if (!cartIconRef.current || !buttonEl) return;

        const fromRect = buttonEl.getBoundingClientRect();
        const toRect = cartIconRef.current.getBoundingClientRect();

        const id = Date.now();
        setFlyItems(prev => [...prev, {
            id,
            src,
            startX: fromRect.left + fromRect.width / 2,
            startY: fromRect.top + fromRect.height / 2,
            endX: toRect.left + toRect.width / 2,
            endY: toRect.top + toRect.height / 2,
        }]);

        // bounce the icon after the fly lands (~700 ms)
        setTimeout(() => {
            setBounce(true);
            setTimeout(() => setBounce(false), 600);
            setFlyItems(prev => prev.filter(f => f.id !== id));
        }, 700);
    }, []);

    return (
        <CartFlyCtx.Provider value={{ cartIconRef, flyItems, flyToCart, bounce }}>
            {children}

            {/* Portal-level flying dots */}
            <style>{`
                @keyframes cartFly {
                    0%   { transform: translate(0,0) scale(1);   opacity: 1; }
                    80%  { opacity: 1; }
                    100% { transform: translate(var(--dx), var(--dy)) scale(0.15); opacity: 0; }
                }
            `}</style>

            {flyItems.map(f => (
                <img
                    key={f.id}
                    src={f.src}
                    alt=""
                    style={{
                        position: "fixed",
                        left: f.startX - 32,
                        top: f.startY - 32,
                        width: 64,
                        height: 64,
                        objectFit: "cover",
                        borderRadius: "50%",
                        border: "2px solid #111",
                        pointerEvents: "none",
                        zIndex: 99999,
                        "--dx": `${f.endX - f.startX}px`,
                        "--dy": `${f.endY - f.startY}px`,
                        animation: "cartFly 0.72s cubic-bezier(.25,.8,.25,1) forwards",
                    }}
                />
            ))}
        </CartFlyCtx.Provider>
    );
}

export const useCartFly = () => useContext(CartFlyCtx);