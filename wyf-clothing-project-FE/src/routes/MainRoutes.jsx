import { lazy, Suspense } from 'react';
import MainLayout from '../layouts/MainLayout';

//Dashboard
const Dashboard = lazy(() => import('../views/dashboard'));
const ShopCatalog = lazy(() => import('../views/dashboard/shop-catalog'))
const ShopCollection = lazy(() => import('../views/dashboard/shop-collection'))
const ShopSetupProduct = lazy(() => import('../views/dashboard/shop-setupProduct'))
const ShopBlogThree = lazy(() => import('../views/dashboard/shop-blog-three'))
const ShopDashboard = lazy(() => import('../views/dashboard/shop-dashboard'))

const ShopBlog = lazy(() => import('../views/dashboard/shop-blog'));

//Admin
const AddProduct = lazy(() => import('../views/admin/add-product'));
const AddCollection = lazy(() => import('../views/admin/add-collection'))
const AddSetup = lazy(() => import('../views/admin/add-setup'));
const AddBlog = lazy(() => import('../views/admin/add-blog'));
const AddDashboard = lazy(() => import('../views/admin/add-dashboard'))

//Shop
const AllProduct = lazy(() => import('../views/shop/all-products'));


const LoadingSpinner = <div>Loading...</div>;
const withSpinner = (Component) => <Suspense fallback={LoadingSpinner}>{Component}</Suspense>;

const MainRoutes = {
    path: '/',
    element: <MainLayout />,
    children: [
        {
            path: '/',
            element: withSpinner(<Dashboard />)
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
            element: withSpinner(<AddProduct />)
        },
        {
            path: '/admin-add-collection',
            element: withSpinner(<AddCollection />)
        },
        {
            path: '/admin-add-setup',
            element: withSpinner(<AddSetup />)
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
            element: withSpinner(<AddBlog />)
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
            element: withSpinner(<AddDashboard />)
        },
        {
            path: '/shop-dashboard',
            element: withSpinner(<ShopDashboard />)
        },
        {
            path: '/all-product',
            element: withSpinner(<AllProduct />)
        }
    ]
};

export default MainRoutes;