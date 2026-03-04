import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
    const { user } = useAuth();
    const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
    const [saving, setSaving] = useState(false);

    async function changePw(e) {
        e.preventDefault();
        if (pw.newPw !== pw.confirm) return toast.error('New passwords do not match.');
        if (pw.newPw.length < 6) return toast.error('Password must be at least 6 characters.');
        setSaving(true);
        try {
            await api.request('/api/auth/change-password', {
                method: 'POST', body: JSON.stringify({ current_password: pw.current, new_password: pw.newPw })
            });
            toast.success('Password changed successfully!');
            setPw({ current: '', newPw: '', confirm: '' });
        } catch (e) { toast.error(e.message || 'Failed to change password.'); }
        finally { setSaving(false); }
    }

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title"><i className="fas fa-cog" /> Settings</h2>
                <p className="section-subtitle">Account and system preferences</p>
            </div>

            <div style={{ maxWidth: 480 }}>
                <div className="chart-card">
                    <div className="chart-title" style={{ marginBottom: '1.5rem' }}><i className="fas fa-lock" style={{ marginRight: 8 }} />Change Password</div>
                    <form onSubmit={changePw}>
                        {[['current', 'Current Password'], ['newPw', 'New Password'], ['confirm', 'Confirm New Password']].map(([k, l]) => (
                            <div key={k} className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">{l}</label>
                                <input className="form-input" type="password" value={pw[k]}
                                    onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))} />
                            </div>
                        ))}
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={saving}>
                            {saving ? <><i className="fas fa-spinner fa-spin" />Saving...</> : <><i className="fas fa-key" />Change Password</>}
                        </button>
                    </form>
                </div>

                <div className="chart-card" style={{ marginTop: '1.25rem' }}>
                    <div className="chart-title"><i className="fas fa-user" style={{ marginRight: 8 }} />Account Info</div>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[['Username', user?.username], ['Role', user?.role], ['Email', user?.email || '—']].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>{k}</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.87rem' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
