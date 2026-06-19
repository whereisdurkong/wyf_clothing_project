import { useState } from "react";
import ShopCatalog from "./shop-catalog";
import ShopCollection from "./shop-collection";
import ShopSetupProduct from "./shop-setupProduct";
import ShopBlogThree from "./shop-blog-three";
import ShopDashboard from "./shop-dashboard";

export default function Dashboard() {

    const empInfo = JSON.parse(localStorage.getItem('user')) || {};
    const userInfo = empInfo.user
    console.log(empInfo.user)
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Hero section — full viewport height */}
            <section style={{ position: 'relative', height: '100vh', flexShrink: 0 }}>
                <ShopDashboard />
            </section>

            <section>
                <ShopCatalog />
            </section>

            <section>
                <ShopCollection />
            </section>

            <section>
                <ShopSetupProduct />
            </section>

            <section>
                <ShopBlogThree />
            </section>
        </div>
    );
}