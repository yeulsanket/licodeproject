import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
    const [tab, setTab] = useState('admin');
    const [adminForm, setAdminForm] = useState({ username: '', password: '' });
    const [studentForm, setStudentForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showAdminPw, setShowAdminPw] = useState(false);
    const [showStudentPw, setShowStudentPw] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Already logged in → go to dashboard
    useEffect(() => { if (user) navigate('/', { replace: true }); }, [user, navigate]);

    async function handleAdminLogin(e) {
        e.preventDefault();
        if (!adminForm.username || !adminForm.password)
            return toast.error('Please enter username and password.');
        setLoading(true);
        try {
            const res = await api.login(adminForm);
            login(res.token, { username: res.username, role: res.role });
            toast.success('Welcome, Admin!');
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Invalid credentials.');
        } finally { setLoading(false); }
    }

    async function handleStudentLogin(e) {
        e.preventDefault();
        if (!studentForm.email || !studentForm.password)
            return toast.error('Please enter your email and password.');
        if (studentForm.password.length < 6)
            return toast.error('Password must be at least 6 characters.');
        setLoading(true);
        try {
            const res = await api.studentLogin(studentForm);
            login(res.token, {
                username: res.username, role: res.role,
                student_id: res.student_id, email: res.email
            });
            if (res.is_new) toast.success('Account created! Welcome 🎉');
            else toast.success(`Welcome back, ${res.username}!`);
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Login failed. Check your credentials.');
        } finally { setLoading(false); }
    }

    return (
        <div className="login-page">
            <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

            <div className="login-wrapper">
                <div className="login-card">
                    {/* Header */}
                    <div className="login-header">
                        <div className="logo-icon"><i className="fas fa-graduation-cap" /></div>
                        <h1>Student<span>Analyzer</span></h1>
                        <p>Placement Intelligence Platform</p>
                    </div>

                    {/* Role Tabs */}
                    <div className="role-tabs">
                        <button className={`role-tab admin-tab ${tab === 'admin' ? 'active' : ''}`}
                            onClick={() => setTab('admin')}>
                            <i className="fas fa-shield-alt" /> Admin Login
                        </button>
                        <button className={`role-tab student-tab ${tab === 'student' ? 'active' : ''}`}
                            onClick={() => setTab('student')}>
                            <i className="fas fa-user-graduate" /> Student Login
                        </button>
                    </div>

                    {/* Admin Panel */}
                    {tab === 'admin' && (
                        <form onSubmit={handleAdminLogin}>
                            <div className="form-group">
                                <label>Username</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-user input-icon" />
                                    <input type="text" placeholder="Enter admin username" autoComplete="username"
                                        value={adminForm.username} onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-lock input-icon" />
                                    <input type={showAdminPw ? 'text' : 'password'} placeholder="Enter password"
                                        autoComplete="current-password" value={adminForm.password}
                                        onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} />
                                    <button type="button" className="toggle-pw" onClick={() => setShowAdminPw(p => !p)}>
                                        <i className={`fas fa-eye${showAdminPw ? '-slash' : ''}`} />
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn-login btn-admin" disabled={loading}>
                                {loading ? <><i className="fas fa-spinner fa-spin" /> Signing In...</>
                                    : <><i className="fas fa-sign-in-alt" /> Sign In as Admin</>}
                            </button>
                            <div className="divider"><span>Default Credentials</span></div>
                            <div className="hint-box">
                                <i className="fas fa-info-circle" />
                                <p>Username: <code>admin</code>&nbsp;|&nbsp;Password: <code>admin123</code><br />
                                    <small style={{ opacity: 0.7 }}>Change password in Settings after first login.</small></p>
                            </div>
                        </form>
                    )}

                    {/* Student Panel */}
                    {tab === 'student' && (
                        <form onSubmit={handleStudentLogin} className="student-panel">
                            <div className="form-group">
                                <label>Student Email</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-envelope input-icon" />
                                    <input type="email" placeholder="Enter your college-registered email"
                                        value={studentForm.email} onChange={e => setStudentForm(f => ({ ...f, email: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-lock input-icon" />
                                    <input type={showStudentPw ? 'text' : 'password'}
                                        placeholder="Enter or create your password (min 6 chars)"
                                        value={studentForm.password}
                                        onChange={e => setStudentForm(f => ({ ...f, password: e.target.value }))} />
                                    <button type="button" className="toggle-pw" onClick={() => setShowStudentPw(p => !p)}>
                                        <i className={`fas fa-eye${showStudentPw ? '-slash' : ''}`} />
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn-login btn-student" disabled={loading}>
                                {loading ? <><i className="fas fa-spinner fa-spin" /> Please wait...</>
                                    : <><i className="fas fa-sign-in-alt" /> Sign In / Create Account</>}
                            </button>
                            <div className="hint-box teal" style={{ marginTop: '1rem' }}>
                                <i className="fas fa-info-circle" />
                                <p><strong>First time?</strong> Enter your college email and <strong>set any password</strong> — your account is created automatically.<br />
                                    <strong>Returning?</strong> Just enter email + existing password.</p>
                            </div>
                        </form>
                    )}

                    <div className="login-footer">© 2025 StudentAnalyzer — All rights reserved</div>
                </div>
            </div>
        </div>
    );
}
