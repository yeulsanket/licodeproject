export default function AdminPanel() {
    return (
        <div>
            <div className="section-header">
                <h2 className="section-title"><i className="fas fa-user-shield" /> Admin Panel</h2>
                <p className="section-subtitle">System configuration and user management</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' }}>
                {[
                    { icon: 'fas fa-database', color: '#6366f1', title: 'Database', desc: 'MongoDB connected · students, companies, placements, users collections active.', tag: 'Healthy' },
                    { icon: 'fas fa-robot', color: '#14b8a6', title: 'AI Engine', desc: 'Groq LLM integration active. Llama 3.3 70B powering all AI analysis features.', tag: 'Active' },
                    { icon: 'fas fa-users', color: '#8b5cf6', title: 'Auth System', desc: 'JWT-based auth with bcrypt password hashing. Role-based access control enabled.', tag: 'Secure' },
                    { icon: 'fas fa-shield-alt', color: '#f59e0b', title: 'Security', desc: 'All API endpoints protected. Student data isolated per user session.', tag: 'Enabled' },
                ].map(c => (
                    <div key={c.title} className="chart-card" style={{ borderLeft: `3px solid ${c.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                                <i className={c.icon} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{c.title}</div>
                                <span style={{ fontSize: '0.72rem', background: `${c.color}22`, color: c.color, padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>{c.tag}</span>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: 1.6 }}>{c.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
