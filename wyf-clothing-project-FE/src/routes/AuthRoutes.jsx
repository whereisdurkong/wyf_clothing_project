import { lazy, Suspense } from 'react';

const Login = lazy(() => import('../views/auth/Login'));
const Register = lazy(() => import('../views/auth/Register'));

const LoadingSpinner = <div>Loading...</div>;
const withSpinner = (Component) => <Suspense fallback={LoadingSpinner}>{Component}</Suspense>;

const AuthRoutes = {
    path: '/auth',
    children: [
        {
            path: '/auth/login',
            element: withSpinner(<Login />)
        },
        {
            path: '/auth/register',
            element: withSpinner(<Register />)
        }
    ]
};

export default AuthRoutes;