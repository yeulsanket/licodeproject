import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie', roles: ['admin', 'student'] },
    { id: 'management', label: 'Management', icon: 'fas fa-users-cog', roles: ['admin'] },
    { id: 'ai-analysis', label: 'AI Analysis', icon: 'fas fa-robot', roles: ['admin', 'student'] },
    { id: 'mock-test', label: 'Mock Test', icon: 'fas fa-vial', roles: ['student'] },
    { id: 'admin', label: 'Admin Panel', icon: 'fas fa-user-shield', roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog', roles: ['admin'] },
];

export default function Sidebar({ activeTab, setActiveTab }) {
    const { user, logout, isAdmin, isStudent } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    const visibleNav = NAV.filter(n => n.roles.includes(user?.role || 'student'));

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon"><i className="fas fa-graduation-cap" /></div>
                <div className="brand-text">
                    <h2>Student<span style={{ color: '#6366f1' }}>Analyzer</span></h2>
                    <span>Placement Intelligence</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {visibleNav.map(n => (
                    <button
                        key={n.id}
                        className={`nav-item ${activeTab === n.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(n.id)}
                    >
                        <i className={n.icon} />
                        {n.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-card">
                    <div className="user-avatar">{(user?.username || 'U')[0].toUpperCase()}</div>
                    <div className="user-info">
                        <div className="user-name">{user?.username || 'User'}</div>
                        <div className={`user-role ${user?.role}`}>{user?.role}</div>
                    </div>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt" /> Logout
                </button>
            </div>
        </aside>
    );
}
