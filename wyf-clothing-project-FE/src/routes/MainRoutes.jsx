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

const Admin = lazy(() => import('../views/admin/admin'));

//Shop
const AllProduct = lazy(() => import('../views/shop/all-products'));
const Product = lazy(() => import('../views/shop/product'));

const Collection = lazy(() => import('../views/shop/collection'))
const AllProductCollection = lazy(() => import('../views/shop/all-product-collection'));

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
        },
        {
            path: '/product',
            element: withSpinner(<Product />)
        },
        {
            path: '/admin-panel',
            element: withSpinner(<Admin />)
        },
        {
            path: '/admin/admin-all-product',
            element: withSpinner(<AdminAllProduct />)
        },
        {
            path: '/admin/admin-product-view',
            element: withSpinner(<AdminProductView />)
        },
        {
            path: '/admin/admin-collection',
            element: withSpinner(<AdminCollection />)
        },
        {
            path: '/collections',
            element: withSpinner(<Collection />)
        },
        {
            path: '/admin/admin-collection-view',
            element: withSpinner(<AdminCollectionView />)
        },
        {
            path: '/admin/admin-blog',
            element: withSpinner(<AdminBlog />)
        },
        {
            path: '/admin/admin-blog-view',
            element: withSpinner(<AdminBlogView />)
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
            path: '/admin-dashboard',
            element: withSpinner(<AdminDashboard />)
        }



    ]
};

export default MainRoutes;