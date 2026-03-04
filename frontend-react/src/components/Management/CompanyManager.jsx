import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', industry: '', location: '', website: '', description: '' };

export default function CompanyManager() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        api.getCompanies({ per_page: 200 })
            .then(d => setCompanies(d.companies || d || []))
            .catch(() => toast.error('Failed to load companies'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    function openAdd() { setForm(EMPTY); setModal({ mode: 'add' }); }
    function openEdit(c) { setForm({ name: c.name || '', industry: c.industry || '', location: c.location || '', website: c.website || '', description: c.description || '' }); setModal({ mode: 'edit', id: c.id || c._id }); }

    async function save() {
        if (!form.name) return toast.error('Company name is required.');
        setSaving(true);
        try {
            if (modal.mode === 'add') { await api.addCompany(form); toast.success('Company added!'); }
            else { await api.updateCompany(modal.id, form); toast.success('Company updated!'); }
            setModal(null); load();
        } catch (e) { toast.error(e.message || 'Save failed.'); }
        finally { setSaving(false); }
    }

    async function del(id, name) {
        if (!confirm(`Delete ${name}?`)) return;
        try { await api.deleteCompany(id); toast.success('Deleted.'); load(); }
        catch (e) { toast.error(e.message || 'Delete failed.'); }
    }

    return (
        <>
            <div className="table-wrapper">
                <div className="table-header">
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Companies</span>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus" />Add Company</button>
                </div>
                <table>
                    <thead><tr><th>Company</th><th>Industry</th><th>Location</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                            : companies.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No companies yet. Add one!</td></tr>
                                : companies.map(c => (
                                    <tr key={c.id || c._id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                                        <td>{c.industry || '—'}</td>
                                        <td>{c.location || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }} onClick={() => openEdit(c)}><i className="fas fa-edit" /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => del(c.id || c._id, c.name)}><i className="fas fa-trash" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            {modal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <span className="modal-title">{modal.mode === 'add' ? 'Add Company' : 'Edit Company'}</span>
                            <button className="modal-close" onClick={() => setModal(null)}><i className="fas fa-times" /></button>
                        </div>
                        <div className="form-grid">
                            {[['name', 'Company Name'], ['industry', 'Industry'], ['location', 'Location'], ['website', 'Website']].map(([k, l]) => (
                                <div key={k} className="form-group">
                                    <label className="form-label">{l}</label>
                                    <input className="form-input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                                </div>
                            ))}
                            <div className="form-group full">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }} onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={save} disabled={saving}>
                                {saving ? <><i className="fas fa-spinner fa-spin" />Saving...</> : <><i className="fas fa-save" />Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
