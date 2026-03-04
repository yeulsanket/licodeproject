import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.student_id) { setLoading(false); return; }
        Promise.all([api.getStudent(user.student_id), api.getStats()])
            .then(([s, st]) => { setStudent(s); setStats(st); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (!student) return <div className="loading-center"><i className="fas fa-user-slash" style={{ fontSize: '2rem', color: '#64748b' }} /><p style={{ color: '#64748b' }}>Profile not found. Contact admin.</p></div>;

    const cgpaColor = student.cgpa >= 8.5 ? '#34d399' : student.cgpa >= 7 ? '#60a5fa' : '#fbbf24';
    const avgCgpa = stats?.avg_cgpa || 7.5;
    const cgpaDiff = (student.cgpa - avgCgpa).toFixed(2);
    const cgpaAbove = parseFloat(cgpaDiff) >= 0;

    function rank() {
        const diff = student.cgpa - avgCgpa;
        if (diff >= 1.5) return 'Top 10%'; if (diff >= 0.8) return 'Top 25%';
        if (diff >= 0) return 'Above Avg'; if (diff >= -0.5) return 'Below Avg';
        return 'Needs Work';
    }

    function CompareBar({ label, value, max, avg, unit = '' }) {
        const pct = Math.min((value / max) * 100, 100);
        const color = value >= avg ? '#34d399' : '#fbbf24';
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#94a3b8' }}>{label}</span>
                    <span style={{ color, fontWeight: 600 }}>{value}{unit}</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <p>Class avg: {avg}{unit}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title"><i className="fas fa-user-circle" /> My Profile</h2>
                <p className="section-subtitle">Your placement journey at a glance</p>
            </div>

            {/* Hero */}
            <div className="profile-hero">
                <div className="profile-avatar">{(student.name || 'S')[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{student.name}</h2>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{student.email} · {student.branch}</div>
                    {student.placed
                        ? <span className="badge badge-placed"><i className="fas fa-check-circle" /> Placed</span>
                        : <span className="badge badge-seeking"><i className="fas fa-clock" /> Seeking Placement</span>}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ '--card-color': cgpaColor }}>
                    <div className="stat-icon" style={{ background: `linear-gradient(135deg,${cgpaColor},${cgpaColor}99)` }}><i className="fas fa-star" /></div>
                    <div className="stat-value" style={{ color: cgpaColor }}>{student.cgpa}</div>
                    <div className="stat-label">CGPA</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: cgpaAbove ? '#34d399' : '#f87171' }}>
                        {cgpaAbove ? `▲ ${cgpaDiff} above avg` : `▼ ${Math.abs(cgpaDiff)} below avg`}
                    </div>
                </div>
                <div className="stat-card" style={{ '--card-color': '#60a5fa' }}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)' }}><i className="fas fa-code" /></div>
                    <div className="stat-value">{student.projects || 0}</div>
                    <div className="stat-label">Projects</div>
                </div>
                <div className="stat-card" style={{ '--card-color': '#a78bfa' }}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' }}><i className="fas fa-briefcase" /></div>
                    <div className="stat-value">{student.internships || 0}</div>
                    <div className="stat-label">Internships</div>
                </div>
                <div className="stat-card" style={{ '--card-color': '#34d399' }}>
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#34d399,#10b981)' }}><i className="fas fa-medal" /></div>
                    <div className="stat-value" style={{ fontSize: '1.2rem' }}>{rank()}</div>
                    <div className="stat-label">Batch Rank</div>
                </div>
            </div>

            {/* Skills */}
            <div className="chart-card" style={{ marginBottom: '1.25rem' }}>
                <div className="chart-title"><i className="fas fa-code" style={{ color: 'var(--accent-indigo)', marginRight: '0.5rem' }} />My Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {(student.skills || []).length
                        ? student.skills.map(sk => <span key={sk} className="skill-tag">{sk}</span>)
                        : <span style={{ color: '#64748b' }}>No skills listed yet.</span>}
                </div>
            </div>

            {/* Comparison */}
            <div className="chart-card" style={{ marginBottom: '1.25rem' }}>
                <div className="chart-title"><i className="fas fa-chart-bar" style={{ color: 'var(--accent-teal)', marginRight: '0.5rem' }} />How You Compare</div>
                <div className="compare-bar-wrap" style={{ marginTop: '1rem' }}>
                    <CompareBar label="CGPA" value={student.cgpa} max={10} avg={avgCgpa} />
                    <CompareBar label="Projects" value={student.projects || 0} max={10} avg={3} />
                    <CompareBar label="Internships" value={student.internships || 0} max={5} avg={1.5} />
                    <CompareBar label="Placement Rate" value={stats?.placement_rate || 0} max={100} avg={100} unit="%" />
                </div>
            </div>

            {/* AI CTA */}
            <div style={{
                background: 'linear-gradient(135deg,rgba(20,184,166,0.1),rgba(16,185,129,0.07))',
                border: '1px solid rgba(20,184,166,0.25)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center'
            }}>
                <i className="fas fa-robot" style={{ fontSize: '2rem', color: '#14b8a6', marginBottom: '0.75rem', display: 'block' }} />
                <h4 style={{ margin: '0 0 0.5rem', color: '#f0f4ff' }}>Unlock AI Career Insights</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Get personalized skill gap analysis, salary prediction, career roadmap &amp; job matches.</p>
                <a href="#" onClick={e => { e.preventDefault(); document.querySelector('.nav-item[data-tab="ai-analysis"]')?.click(); }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 2rem',
                        background: 'linear-gradient(135deg,#14b8a6,#10b981)', borderRadius: '8px',
                        color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem'
                    }}>
                    <i className="fas fa-magic" /> Go to AI Analysis
                </a>
            </div>
        </div>
    );
}
