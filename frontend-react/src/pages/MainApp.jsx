import { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const AdminDashboard = lazy(() => import('../components/Dashboard/AdminDashboard'));
const StudentDashboard = lazy(() => import('../components/Dashboard/StudentDashboard'));
const Management = lazy(() => import('../components/Management/Management'));
const AIAnalysis = lazy(() => import('../components/AIAnalysis/AIAnalysis'));
const AdminPanel = lazy(() => import('../components/Admin/AdminPanel'));
const Settings = lazy(() => import('../components/Settings/Settings'));
const MockTest = lazy(() => import('../components/MockTest/MockTest'));

import { useAuth } from '../context/AuthContext';

const Spinner = () => (
    <div className="loading-center"><div className="spinner" /></div>
);

export default function MainApp() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { user } = useAuth();

    // Keep-alive ping every 10 minutes to prevent Render sleep
    useEffect(() => {
        const ping = () => api.ping().catch(() => { });
        ping();
        const id = setInterval(ping, 10 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    function renderTab() {
        switch (activeTab) {
            case 'dashboard':
                return user?.role === 'student'
                    ? <StudentDashboard />
                    : <AdminDashboard />;
            case 'management': return <Management />;
            case 'ai-analysis': return <AIAnalysis />;
            case 'admin': return <AdminPanel />;
            case 'settings': return <Settings />;
            case 'mock-test': return <MockTest />;
            default: return null;
        }
    }

    return (
        <div className="app-layout">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">
                <Suspense fallback={<Spinner />}>
                    {renderTab()}
                </Suspense>
            </main>
        </div>
    );
}
