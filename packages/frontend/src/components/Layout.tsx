import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-mesh text-slate-800 flex-col lg:flex-row">
            {/* Mobile Header */}
            <Header
                onMenuClick={() => setIsSidebarOpen(true)}
                sidebarOpen={isSidebarOpen}
            />

            {/* Responsive Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen relative">
                <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Layout;
