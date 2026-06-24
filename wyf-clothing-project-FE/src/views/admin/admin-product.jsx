import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";

export default function AdminAllProduct() {
    const [products, setProducts] = useState([]);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

    useEffect(() => {
        async function fetchData() {
            try {
                const [pRes, vRes] = await Promise.all([
                    axios.get(`${config.baseApi}/product/get-all-products`),
                    axios.get(`${config.baseApi}/product/get-all-product-variant`),
                ]);
                setProducts(pRes.data || []);
                setVariants(vRes.data || []);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getStock = (productId, size) => {
        const v = variants.find(
            v => Number(v.product_id) === Number(productId) && v.product_variant_size === size
        );
        return v ? v.product_variant_quantity : 0;
    };

    // Check if any variant of this product has a sale price
    const isProductOnSale = (productId) => {
        const productVariants = variants.filter(
            v => Number(v.product_id) === Number(productId)
        );
        return productVariants.some(v =>
            v.product_variant_sale_price !== null &&
            v.product_variant_sale_price !== undefined &&
            v.product_variant_sale_price > 0
        );
    };

    const clean = (str) => str?.replace(/^"|"$/g, '') || '—';

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ paddingTop: '100px' }}>
            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead style={{ background: '#f3f4f6' }}>
                    <tr>
                        <th style={{ textAlign: 'left' }}>ID</th>
                        <th style={{ textAlign: 'left' }}>Product</th>
                        <th style={{ textAlign: 'left' }}>Category</th>
                        <th style={{ textAlign: 'left' }}>Collection</th>
                        <th style={{ textAlign: 'center' }}>On Sale</th>
                        {sizes.map(s => <th key={s} style={{ textAlign: 'center' }}>{s}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => {
                        const onSale = isProductOnSale(p.product_id);
                        return (
                            <tr key={p.product_id}>
                                <td>#{p.product_id}</td>
                                <td>{clean(p.product_name)}</td>
                                <td>{p.product_category || '—'}</td>
                                <td>{clean(p.product_collection)}</td>
                                <td style={{ textAlign: 'center' }}>
                                    {onSale ? (
                                        <span style={{
                                            color: 'green',
                                            fontWeight: 'bold'
                                        }}>
                                            ✓ True
                                        </span>
                                    ) : (
                                        <span style={{ color: 'gray' }}>
                                            ✗ False
                                        </span>
                                    )}
                                </td>
                                {sizes.map(s => (
                                    <td key={s} style={{ textAlign: 'center' }}>
                                        {getStock(p.product_id, s) || '—'}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}