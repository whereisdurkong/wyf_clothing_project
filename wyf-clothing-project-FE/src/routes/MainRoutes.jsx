import { lazy, Suspense } from 'react';
import MainLayout from '../layouts/MainLayout';
import Loading from '../components/Loading';
import RequireToken from './RequireToken';

//Dashboard
const Dashboard = lazy(() => import('../views/dashboard'));
const ShopCatalog = lazy(() => import('../views/dashboard/shop-catalog'))
const ShopCollection = lazy(() => import('../views/dashboard/shop-collection'))
const ShopSetupProduct = lazy(() => import('../views/dashboard/shop-setupProduct'))
const ShopBlogThree = lazy(() => import('../views/dashboard/shop-blog-three'))
const ShopDashboard = lazy(() => import('../views/dashboard/shop-dashboard'))

const ShopBlog = lazy(() => import('../views/dashboard/shop-blog'));
const BlogView = lazy(() => import('../views/dashboard/blog-view'));

//Admin
const AddProduct = lazy(() => import('../views/admin/add-product'));
const AdminAllProduct = lazy(() => import('../views/admin/admin-product'));
const AdminProductView = lazy(() => import('../views/admin/admin-product-view'))

const AddSetup = lazy(() => import('../views/admin/add-setup'));

const AddCollection = lazy(() => import('../views/admin/add-collection'))
const AdminCollection = lazy(() => import('../views/admin/admin-collection'));
const AdminCollectionView = lazy(() => import('../views/admin/admin-collection-view'));

const AddBlog = lazy(() => import('../views/admin/add-blog'));
const AdminBlog = lazy(() => import('../views/admin/admin-blog'));
const AdminBlogView = lazy(() => import('../views/admin/admin-blog-view'));

const AddDashboard = lazy(() => import('../views/admin/add-dashboard'))
const AdminDashboard = lazy(() => import('../views/admin/admin-dashboard'));

const Allusers = lazy(() => import('../views/auth/all-users'))

const Admin = lazy(() => import('../views/admin/admin'));

//Shop
const AllProduct = lazy(() => import('../views/shop/all-products'));
const Product = lazy(() => import('../views/shop/product'));

const Collection = lazy(() => import('../views/shop/collection'))
const AllProductCollection = lazy(() => import('../views/shop/all-product-collection'));

//Cart
const Cart = lazy(() => import('../views/cart/cart'))
const CartCheckout = lazy(() => import('../views/cart/cart-checkout'));
const CheckoutLoading = lazy(() => import('../views/cart/checkout-loading'));

//AUTH
const Verify = lazy(() => import('../views/auth/verify'))
const RequireAuth = lazy(() => import('../views/auth/RequireAuth'));
const AdminRegister = lazy(() => import('../views/auth/Adminregister'))

const Profile = lazy(() => import('../views/auth/profile'))

//ORDER

const Order = lazy(() => import('../views/order/admin-orders'))
const AdminOrderByID = lazy(() => import('../views/order/admin-orderbyid'))

const TrackingOrder = lazy(() => import('../views/order/trackingorder'))

const MyOrder = lazy(() => import('../views/order/my-order'))
const OrderById = lazy(() => import('../views/order/orderbyid'))


const LoadingSpinner = <Loading />;
const withSpinner = (Component) => <Suspense fallback={LoadingSpinner}>{Component}</Suspense>;

const withAuth = (Component) => (
    <RequireToken>
        <Suspense fallback={LoadingSpinner}>{Component}</Suspense>
    </RequireToken>
);


const MainRoutes = {
    path: '/',
    element: <MainLayout />,
    children: [
        {
            path: '/',
            element: withSpinner(<Dashboard />)
        },
        {
            path: '/admin-register',
            element: withAuth(<AdminRegister />)
        },
        {
            path: '/dashboard',
            element: withSpinner(<Dashboard />)
        },
        {
            path: '/shop-catalog',
            element: withSpinner(<ShopCatalog />)
        },
        {
            path: '/admin-add-product',
            element: withAuth(<AddProduct />)
        },
        {
            path: '/admin-add-collection',
            element: withAuth(<AddCollection />)
        },
        {
            path: '/admin-add-setup',
            element: withAuth(<AddSetup />)
        },
        {
            path: '/collection',
            element: withSpinner(<ShopCollection />)
        },
        {
            path: '/setup',
            element: withSpinner(<ShopSetupProduct />)
        },
        {
            path: '/admin-add-blog',
            element: withAuth(<AddBlog />)
        },
        {
            path: '/shop-blog',
            element: withSpinner(<ShopBlog />)
        },
        {
            path: '/shop-blog-three',
            element: withSpinner(<ShopBlogThree />)
        },
        {
            path: '/admin-add-dashboard',
            element: withAuth(<AddDashboard />)
        },
        {
            path: '/shop-dashboard',
            element: withSpinner(<ShopDashboard />)
        },
        {
            path: '/all-product',
            element: withSpinner(<AllProduct />)
        },
        {
            path: '/product',
            element: withSpinner(<Product />)
        },
        {
            path: '/admin-panel',
            element: withAuth(<Admin />)
        },
        {
            path: '/admin/admin-all-product',
            element: withAuth(<AdminAllProduct />)
        },
        {
            path: '/admin/admin-product-view',
            element: withAuth(<AdminProductView />)
        },
        {
            path: '/admin/admin-collection',
            element: withAuth(<AdminCollection />)
        },
        {
            path: '/collections',
            element: withSpinner(<Collection />)
        },
        {
            path: '/admin/admin-collection-view',
            element: withAuth(<AdminCollectionView />)
        },
        {
            path: '/admin/admin-blog',
            element: withAuth(<AdminBlog />)
        },
        {
            path: '/admin/admin-blog-view',
            element: withAuth(<AdminBlogView />)
        },
        {
            path: '/all-collections',
            element: withSpinner(<AllProductCollection />)
        },
        {
            path: '/blog-view',
            element: withSpinner(<BlogView />)
        },
        {
            path: '/admin/admin-dashboard',
            element: withAuth(<AdminDashboard />)
        },
        {
            path: '/auth/verify',
            element: withSpinner(<Verify />)
        },
        {
            path: '/cart-checkout',
            element: withSpinner(<CartCheckout />)
        },
        {
            path: '/checkout-loading',
            element: withSpinner(<CheckoutLoading />)
        },
        {
            path: '/orders',
            element: withAuth(<Order />)
        },
        {
            path: '/order/order',
            element: withAuth(<AdminOrderByID />)
        },
        {
            path: '/tracking-order',
            element: withSpinner(<TrackingOrder />)
        },
        {
            path: '/my-orders',
            element: withAuth(<MyOrder />)
        },
        {
            path: '/my-order/order',
            element: withAuth(<OrderById />)
        },
        {
            path: '/profile',
            element: withAuth(<Profile />)
        },
        {
            path: '/all-users',
            element: withAuth(<Allusers />)
        }





    ]
};

export default MainRoutes;