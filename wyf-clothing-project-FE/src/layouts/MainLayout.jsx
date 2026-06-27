// import { Outlet } from 'react-router-dom';
// import Navbar from './Navbar';
// import Footer from './footer';

// export default function MainLayout() {
//     return (
//         <div >
//             <Navbar />

//             <Outlet />
//             <Footer />
//         </div>
//     );
// }


import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './footer';
import Cart from '../views/cart/cart';
import { CartProvider, useCart } from './CartContext';
import { CartFlyProvider } from '../components/CartFlyContext';

function LayoutInner() {
    const { cartOpen, closeCart } = useCart();

    return (
        <div>
            <Navbar />
            <Outlet />
            <Footer />

            {/* Cart renders once here — available on every page */}
            {cartOpen && <Cart onClose={closeCart} />}
        </div>
    );
}

export default function MainLayout() {
    return (
        <CartFlyProvider>


            <CartProvider>
                <LayoutInner />
            </CartProvider>
        </CartFlyProvider>
    );
}