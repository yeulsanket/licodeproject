import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'MBA', 'MCA', 'Other'];
const EMPTY = { name: '', email: '', branch: 'Computer Science', cgpa: '', gender: 'Male', skills: '', projects: 0, internships: 0, placed: false, company: '', package: '' };

export default function StudentManager() {
    const [students, setStudents] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [placedFilter, setPlacedFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null); // null | { mode:'add'|'edit', data }
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(EMPTY);

    const load = useCallback(() => {
        setLoading(true);
        const params = { page, per_page: 20, ...(search && { search }), ...(branchFilter && { branch: branchFilter }), ...(placedFilter !== '' && { placed: placedFilter }) };
        api.getStudents(params)
            .then(d => { setStudents(d.students || []); setTotal(d.total || 0); setPages(d.pages || 1); })
            .catch(() => toast.error('Failed to load students'))
            .finally(() => setLoading(false));
    }, [page, search, branchFilter, placedFilter]);

    useEffect(() => { load(); }, [load]);

    function openAdd() { setForm(EMPTY); setModal({ mode: 'add' }); }
    function openEdit(s) {
        setForm({
            name: s.name || '', email: s.email || '', branch: s.branch || 'Computer Science',
            cgpa: s.cgpa || '', gender: s.gender || 'Male', skills: (s.skills || []).join(', '),
            projects: s.projects || 0, internships: s.internships || 0,
            placed: s.placed || false, company: s.company || '', package: s.package || ''
        }); setModal({ mode: 'edit', id: s.id });
    }

    async function save() {
        if (!form.name || !form.email || !form.cgpa) return toast.error('Name, email and CGPA are required.');
        setSaving(true);
        const payload = {
            ...form, cgpa: parseFloat(form.cgpa), projects: parseInt(form.projects), internships: parseInt(form.internships),
            skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            package: form.package ? parseFloat(form.package) : undefined
        };
        try {
            if (modal.mode === 'add') { await api.addStudent(payload); toast.success('Student added!'); }
            else { await api.updateStudent(modal.id, payload); toast.success('Student updated!'); }
            setModal(null); load();
        } catch (e) { toast.error(e.message || 'Save failed.'); }
        finally { setSaving(false); }
    }

    async function del(id, name) {
        if (!confirm(`Delete ${name}?`)) return;
        try { await api.deleteStudent(id); toast.success('Deleted.'); load(); }
        catch (e) { toast.error(e.message || 'Delete failed.'); }
    }

    return (
        <>
            <div className="table-wrapper">
                <div className="table-header">
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Students <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>({total} total)</span>
                    </span>
                    <div className="table-controls">
                        <input className="search-input" placeholder="Search name or email..." value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        <select className="filter-select" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }}>
                            <option value="">All Branches</option>
                            {BRANCHES.map(b => <option key={b}>{b}</option>)}
                        </select>
                        <select className="filter-select" value={placedFilter} onChange={e => { setPlacedFilter(e.target.value); setPage(1); }}>
                            <option value="">All Status</option>
                            <option value="true">Placed</option>
                            <option value="false">Not Placed</option>
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus" />Add Student</button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead><tr>
                            <th>Name</th><th>Email</th><th>Branch</th><th>CGPA</th>
                            <th>Skills</th><th>Status</th><th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    <div className="spinner" style={{ margin: '0 auto' }} />
                                </td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No students found.</td></tr>
                            ) : students.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{s.email}</td>
                                    <td>{s.branch}</td>
                                    <td style={{ fontWeight: 700, color: s.cgpa >= 8 ? '#34d399' : s.cgpa >= 7 ? '#60a5fa' : '#fbbf24' }}>{s.cgpa}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{(s.skills || []).slice(0, 3).join(', ')}{(s.skills || []).length > 3 ? '…' : ''}</td>
                                    <td><span className={`badge ${s.placed ? 'badge-placed' : 'badge-seeking'}`}>{s.placed ? 'Placed' : 'Seeking'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }} onClick={() => openEdit(s)}>
                                                <i className="fas fa-edit" />
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => del(s.id, s.name)}>
                                                <i className="fas fa-trash" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {page} of {pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            </div>

            {modal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <span className="modal-title">{modal.mode === 'add' ? 'Add Student' : 'Edit Student'}</span>
                            <button className="modal-close" onClick={() => setModal(null)}><i className="fas fa-times" /></button>
                        </div>
                        <div className="form-grid">
                            {[['name', 'Name', 'text'], ['email', 'Email', 'email'], ['cgpa', 'CGPA', 'number']].map(([k, l, t]) => (
                                <div key={k} className="form-group">
                                    <label className="form-label">{l}</label>
                                    <input className="form-input" type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                                </div>
                            ))}
                            <div className="form-group">
                                <label className="form-label">Branch</label>
                                <select className="form-select" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>
                                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={form.placed} onChange={e => setForm(f => ({ ...f, placed: e.target.value === 'true' }))}>
                                    <option value="false">Not Placed</option><option value="true">Placed</option>
                                </select>
                            </div>
                            {[['projects', 'Projects', 'number'], ['internships', 'Internships', 'number']].map(([k, l, t]) => (
                                <div key={k} className="form-group">
                                    <label className="form-label">{l}</label>
                                    <input className="form-input" type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                                </div>
                            ))}
                            {form.placed && <>
                                <div className="form-group">
                                    <label className="form-label">Company</label>
                                    <input className="form-input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Package (LPA)</label>
                                    <input className="form-input" type="number" value={form.package} onChange={e => setForm(f => ({ ...f, package: e.target.value }))} />
                                </div>
                            </>}
                            <div className="form-group full">
                                <label className="form-label">Skills (comma-separated)</label>
                                <input className="form-input" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="Python, React, SQL..." />
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
