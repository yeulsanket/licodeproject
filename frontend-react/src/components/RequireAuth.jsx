import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#080c16', flexDirection: 'column', gap: '1rem'
            }}>
                <div className="spinner" style={{
                    width: 40, height: 40, border: '3px solid rgba(99,102,241,0.3)',
                    borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Verifying session...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
}
