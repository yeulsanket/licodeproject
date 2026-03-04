import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TABS = ['Resume Analyzer', 'Skill Gap', 'Salary Predictor', 'Career Roadmap', 'Job Match', 'AI Chat'];

export default function AIAnalysis() {
    const [tab, setTab] = useState(0);
    const [students, setStudents] = useState([]);
    const { user, isStudent } = useAuth();
    const studentId = isStudent() ? user?.student_id : null;

    // Load student list for dropdowns (admins see all, students don't need)
    useEffect(() => {
        if (!isStudent()) {
            api.getStudents({ per_page: 500 })
                .then(d => setStudents(d.students || []))
                .catch(console.error);
        }
    }, [isStudent]);

    // Pre-fill student's own data
    const [studentData, setStudentData] = useState(null);
    useEffect(() => {
        if (studentId) {
            api.getStudent(studentId).then(setStudentData).catch(console.error);
        }
    }, [studentId]);

    const panels = [
        <ResumePanel key="resume" />,
        <SkillGapPanel key="sg" students={students} lockedId={studentId} studentData={studentData} />,
        <SalaryPanel key="sal" studentData={studentData} />,
        <RoadmapPanel key="rm" students={students} lockedId={studentId} />,
        <JobMatchPanel key="jm" students={students} lockedId={studentId} />,
        <ChatPanel key="chat" />,
    ];

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title"><i className="fas fa-robot" /> AI Analysis</h2>
                <p className="section-subtitle">AI-powered career guidance and insights</p>
            </div>
            <div className="ai-tabs">
                {TABS.map((t, i) => (
                    <button key={t} className={`ai-tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
                ))}
            </div>
            <div className="ai-panel">{panels[tab]}</div>
        </div>
    );
}

/* ── Resume Analyzer ─────────────────────────────────────────────── */
function ResumePanel() {
    const [text, setText] = useState('');
    const [role, setRole] = useState('Software Engineer');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function analyze() {
        if (!text) return toast.error('Please paste your resume text.');
        setLoading(true);
        try { setResult(await api.analyzeResume({ resume_text: text, target_role: role })); }
        catch (e) { toast.error(e.message || 'Analysis failed.'); }
        finally { setLoading(false); }
    }

    return (
        <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}><i className="fas fa-file-alt" style={{ color: 'var(--accent-indigo)', marginRight: 8 }} />Resume Analyzer</h4>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Target Role</label>
                <input className="form-input" value={role} onChange={e => setRole(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Paste Resume Text</label>
                <textarea className="form-textarea" style={{ minHeight: 160 }} value={text} onChange={e => setText(e.target.value)} placeholder="Paste your full resume here..." />
            </div>
            <button className="btn btn-primary" onClick={analyze} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin" />Analyzing...</> : <><i className="fas fa-search" />Analyze Resume</>}
            </button>
            {result && <ResultBox title="Resume Analysis">
                <ScoreMeter label="Match Score" value={result.match_score} />
                <TagCloud label="Skills Found" tags={result.skills_found} />
                <ListSection title="Strengths" icon="fa-check-circle" color="var(--accent-emerald)" items={result.strengths} />
                <ListSection title="Weaknesses" icon="fa-exclamation-circle" color="var(--accent-rose)" items={result.weaknesses} />
                <ListSection title="Recommendations" icon="fa-lightbulb" color="var(--accent-amber)" items={result.recommendations} />
            </ResultBox>}
        </div>
    );
}

/* ── Skill Gap ───────────────────────────────────────────────────── */
function SkillGapPanel({ students, lockedId, studentData }) {
    const [sid, setSid] = useState(lockedId || '');
    const [role, setRole] = useState('Software Engineer');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function analyze() {
        if (!sid) return toast.error('Select a student.');
        setLoading(true);
        try { setResult(await api.skillGap({ student_id: sid, target_role: role })); }
        catch (e) { toast.error(e.message || 'Analysis failed.'); }
        finally { setLoading(false); }
    }

    return (
        <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}><i className="fas fa-bullseye" style={{ color: 'var(--accent-teal)', marginRight: 8 }} />Skill Gap Analysis</h4>
            <StudentDropdown students={students} lockedId={lockedId} value={sid} onChange={setSid} />
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Target Role</label>
                <input className="form-input" value={role} onChange={e => setRole(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={analyze} disabled={loading || !sid}>
                {loading ? <><i className="fas fa-spinner fa-spin" />Analyzing...</> : <><i className="fas fa-chart-bar" />Analyze</>}
            </button>
            {result && <ResultBox title="Skill Gap Results">
                <ScoreMeter label="Match %" value={result.match_percentage} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.5rem 0' }}>Time to ready: <strong style={{ color: 'var(--text-primary)' }}>{result.estimated_time_to_ready}</strong></p>
                <TagCloud label="Missing Skills" tags={result.missing_skills} color="rgba(251,113,133,0.12)" textColor="var(--accent-rose)" border="rgba(251,113,133,0.2)" />
                <TagCloud label="Improve" tags={result.skills_to_improve} color="rgba(251,191,36,0.12)" textColor="var(--accent-amber)" border="rgba(251,191,36,0.2)" />
                {result.learning_path && <div><h4 style={{ color: 'var(--accent-teal)', margin: '1rem 0 0.5rem' }}><i className="fas fa-graduation-cap" />  Learning Path</h4>
                    <ul className="result-list">{result.learning_path.map((lp, i) => <li key={i}><i className="fas fa-book" style={{ color: 'var(--accent-teal)' }} /><span><strong>{lp.skill}</strong> — {lp.resource} <span style={{ color: 'var(--text-muted)' }}>({lp.duration}, {lp.priority} priority)</span></span></li>)}</ul></div>}
            </ResultBox>}
        </div>
    );
}

/* ── Salary Predictor ────────────────────────────────────────────── */
function SalaryPanel({ studentData }) {
    const [form, setForm] = useState({ cgpa: studentData?.cgpa || '', branch: studentData?.branch || 'Computer Science', projects: studentData?.projects || 0, internships: studentData?.internships || 0, skills: (studentData?.skills || []).join(', ') });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (studentData) setForm({ cgpa: studentData.cgpa || '', branch: studentData.branch || 'Computer Science', projects: studentData.projects || 0, internships: studentData.internships || 0, skills: (studentData.skills || []).join(', ') });
    }, [studentData]);

    async function predict() {
        setLoading(true);
        try { setResult(await api.predictSalary({ ...form, cgpa: parseFloat(form.cgpa), projects: parseInt(form.projects), internships: parseInt(form.internships), skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) })); }
        catch (e) { toast.error(e.message || 'Prediction failed.'); }
        finally { setLoading(false); }
    }

    const f = (k, l, t = 'number') => (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">{l}</label>
            <input className="form-input" type={t} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
        </div>
    );

    return (
        <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}><i className="fas fa-rupee-sign" style={{ color: 'var(--accent-emerald)', marginRight: 8 }} />Salary Predictor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
                {f('cgpa', 'CGPA')} {f('projects', 'Projects')} {f('internships', 'Internships')}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Branch</label>
                    <input className="form-input" type="text" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} />
                </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Skills (comma-separated)</label>
                <input className="form-input" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={predict} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin" />Predicting...</> : <><i className="fas fa-chart-line" />Predict Salary</>}
            </button>
            {result && <ResultBox title="">
                <div className="salary-range">
                    <div className="range-label">Predicted Salary Range</div>
                    <div className="amount">₹{result.predicted_min_lpa} – {result.predicted_max_lpa} LPA</div>
                    <div className="range-label">Avg: ₹{result.predicted_avg_lpa} LPA · Confidence: {result.confidence}</div>
                </div>
                <ListSection title="Impact Factors" icon="fa-chart-pie" color="var(--accent-indigo)" items={(result.factors || []).map(f => `${f.factor}: ${f.detail}`)} />
                <ListSection title="Tips to Increase" icon="fa-rocket" color="var(--accent-teal)" items={result.recommendations_to_increase} />
            </ResultBox>}
        </div>
    );
}

/* ── Career Roadmap ──────────────────────────────────────────────── */
function RoadmapPanel({ students, lockedId }) {
    const [sid, setSid] = useState(lockedId || '');
    const [goal, setGoal] = useState('Software Engineer');
    const [pkg, setPkg] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function generate() {
        if (!sid) return toast.error('Select a student.');
        setLoading(true);
        try { setResult(await api.generateRoadmap({ student_id: sid, career_goal: goal, target_package: pkg ? parseFloat(pkg) : null })); }
        catch (e) { toast.error(e.message || 'Failed.'); }
        finally { setLoading(false); }
    }

    return (
        <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}><i className="fas fa-map-signs" style={{ color: 'var(--accent-purple)', marginRight: 8 }} />Career Roadmap</h4>
            <StudentDropdown students={students} lockedId={lockedId} value={sid} onChange={setSid} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group"><label className="form-label">Career Goal</label><input className="form-input" value={goal} onChange={e => setGoal(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Target Package (LPA)</label><input className="form-input" type="number" value={pkg} onChange={e => setPkg(e.target.value)} /></div>
            </div>
            <button className="btn btn-primary" onClick={generate} disabled={loading || !sid}>
                {loading ? <><i className="fas fa-spinner fa-spin" />Generating...</> : <><i className="fas fa-route" />Generate Roadmap</>}
            </button>
            {result && <ResultBox title={`Roadmap: ${result.career_goal}`}>
                <ScoreMeter label="Current Readiness" value={result.current_readiness} />
                <div className="roadmap-timeline" style={{ marginTop: '1rem' }}>
                    {(result.months || []).map(m => (
                        <div key={m.month} className="roadmap-month">
                            <h5>Month {m.month}: {m.title}</h5>
                            {m.focus_areas && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Focus: {m.focus_areas.join(', ')}</p>}
                            {m.skills_to_learn && <div style={{ marginBottom: '0.4rem' }}>{m.skills_to_learn.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>}
                            {m.milestones?.length > 0 && <p style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}><i className="fas fa-check" style={{ marginRight: 4 }} />{m.milestones.join(', ')}</p>}
                        </div>
                    ))}
                </div>
                {result.tips?.length > 0 && <ListSection title="Pro Tips" icon="fa-star" color="var(--accent-amber)" items={result.tips} />}
            </ResultBox>}
        </div>
    );
}

/* ── Job Match ───────────────────────────────────────────────────── */
function JobMatchPanel({ students, lockedId }) {
    const [sid, setSid] = useState(lockedId || '');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function match() {
        if (!sid) return toast.error('Select a student.');
        setLoading(true);
        try { setResult(await api.getJobRecommendations(sid)); }
        catch (e) { toast.error(e.message || 'Failed.'); }
        finally { setLoading(false); }
    }

    return (
        <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}><i className="fas fa-briefcase" style={{ color: 'var(--accent-teal)', marginRight: 8 }} />Job Recommendations</h4>
            <StudentDropdown students={students} lockedId={lockedId} value={sid} onChange={setSid} />
            <button className="btn btn-primary" onClick={match} disabled={loading || !sid}>
                {loading ? <><i className="fas fa-spinner fa-spin" />Finding...</> : <><i className="fas fa-search" />Find Jobs</>}
            </button>
            {result?.matches && (
                <div style={{ marginTop: '1.5rem' }}>
                    {result.matches.map((m, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div><div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-teal)' }}>{m.company}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.role} · {m.industry}</div></div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{m.match_score}% Match</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{m.package} LPA</div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{m.reason}</p>
                            <div>{(m.matched_skills || []).map(s => <span key={s} className="skill-tag" style={{ fontSize: '0.72rem' }}>{s}</span>)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── AI Chat ─────────────────────────────────────────────────────── */
function ChatPanel() {
    const [msgs, setMsgs] = useState([{ role: 'assistant', content: "👋 Hi! I'm your AI placement assistant. Ask me anything about career guidance, interview prep, or placement tips!" }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    async function send() {
        if (!input.trim()) return;
        const userMsg = { role: 'user', content: input };
        setMsgs(m => [...m, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res = await api.chatWithAI({ message: input, history: msgs });
            setMsgs(m => [...m, { role: 'assistant', content: res.response }]);
        } catch (e) { setMsgs(m => [...m, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }]); }
        finally { setLoading(false); }
    }

    return (
        <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}><i className="fas fa-comments" style={{ color: 'var(--accent-indigo)', marginRight: 8 }} />AI Placement Assistant</h4>
            <div className="chat-messages">
                {msgs.map((m, i) => <div key={i} className={`chat-msg ${m.role === 'assistant' ? 'ai' : 'user'}`}>{m.content}</div>)}
                {loading && <div className="chat-msg ai"><i className="fas fa-spinner fa-spin" style={{ color: 'var(--text-muted)' }} /> Thinking...</div>}
            </div>
            <div className="chat-input-wrap">
                <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && send()} placeholder="Ask about careers, interview tips, placements..." />
                <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}><i className="fas fa-paper-plane" /></button>
            </div>
        </div>
    );
}

/* ── Reusable sub-components ─────────────────────────────────────── */
function StudentDropdown({ students, lockedId, value, onChange }) {
    if (lockedId) return (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Student</label>
            <select className="form-select" value={value} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                <option value={value}>{students.find(s => s.id === value)?.name || 'Your Profile'}</option>
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Analysis is locked to your profile.</p>
        </div>
    );
    return (
        <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Select Student</label>
            <select className="form-select" value={value} onChange={e => onChange(e.target.value)}>
                <option value="">-- Select Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
            </select>
        </div>
    );
}

function ResultBox({ title, children }) {
    return <div className="result-box">{title && <h4>{title}</h4>}{children}</div>;
}

function ScoreMeter({ label, value }) {
    const color = value >= 70 ? 'var(--accent-emerald)' : value >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)';
    return (
        <div className="result-grid" style={{ marginBottom: '1rem' }}>
            <div className="result-item"><div className="label">{label}</div>
                <div className="value" style={{ color }}>{value}%</div>
                <div className="score-meter"><div className="fill" style={{ width: `${value}%` }} /></div></div>
        </div>
    );
}

function TagCloud({ label, tags = [], color = 'rgba(99,102,241,0.12)', textColor = '#a5b4fc', border = 'rgba(99,102,241,0.2)' }) {
    if (!tags.length) return null;
    return (<div style={{ marginBottom: '1rem' }}><h4><i className="fas fa-tags" style={{ marginRight: 6 }} />{label}</h4>
        <div style={{ marginTop: '0.5rem' }}>{tags.map(t => <span key={t} className="skill-tag" style={{ background: color, color: textColor, borderColor: border }}>{t}</span>)}</div></div>);
}

function ListSection({ title, icon, color, items = [] }) {
    if (!items.length) return null;
    return (<div><h4 style={{ color }}><i className={`fas ${icon}`} style={{ marginRight: 6 }} />{title}</h4>
        <ul className="result-list">{items.map((it, i) => <li key={i}><i className="fas fa-arrow-right" style={{ color }} />{it}</li>)}</ul></div>);
}
