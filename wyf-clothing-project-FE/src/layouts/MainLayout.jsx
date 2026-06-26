import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './footer';

export default function MainLayout() {
    return (
        <div >
            <Navbar />

            <Outlet />
            <Footer />
        </div>
    );
}