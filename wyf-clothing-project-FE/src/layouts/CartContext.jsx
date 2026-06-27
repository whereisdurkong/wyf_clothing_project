import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartOpen, setCartOpen] = useState(false);

    return (
        <CartContext.Provider
            value={{
                cartOpen,
                openCart: () => setCartOpen(true),
                closeCart: () => setCartOpen(false),
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);