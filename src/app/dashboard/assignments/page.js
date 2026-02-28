'use client';
import { useState, useEffect } from 'react';

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Assignment modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', max_marks: 50 });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const fetchAssignments = () => {
        setLoading(true);
        fetch('/api/assignments').then(r => r.json()).then(d => { setAssignments(d.assignments || []); setLoading(false); }).catch(() => setLoading(false));
    };
    useEffect(() => { fetchAssignments(); }, []);

    const openCreate = () => {
        if (subjects.length === 0) fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects || d || []));
        setForm({ title: '', description: '', subject_id: '', due_date: '', max_marks: 50 });
        setShowCreateModal(true);
    };

    const submitCreate = async () => {
        if (!form.title || !form.subject_id || !form.due_date) return alert('Title, Subject, and Due Date are required');
        setSaving(true);
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, subject_id: parseInt(form.subject_id), max_marks: parseFloat(form.max_marks), status: 'active', created_by: 1 })
            });
            if (!res.ok) throw new Error('Failed');
            setSuccess('Assignment created successfully!');
            setTimeout(() => setSuccess(''), 4000);
            setShowCreateModal(false);
            fetchAssignments();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const active = assignments.filter(a => a.status === 'active');
    const graded = assignments.filter(a => a.status === 'graded');
    const closed = assignments.filter(a => a.status === 'closed');

    return (
        <>
            {success && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px 24px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 8px 32px rgba(34,197,94,0.4)', fontWeight: 600 }}>✅ {success}</div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1>📄 Assignment & Evaluation</h1><p>Track submissions, evaluate work, and manage assignments</p></div>
                <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>+</span> Create Assignment
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon">📄</div><div className="stat-label">Total Assignments</div><div className="stat-value">{assignments.length}</div></div>
                <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-label">Active</div><div className="stat-value" style={{ color: 'var(--success)' }}>{active.length}</div></div>
                <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-label">Graded</div><div className="stat-value">{graded.length}</div></div>
                <div className="stat-card"><div className="stat-icon">📝</div><div className="stat-label">Avg Submission Rate</div>
                    <div className="stat-value">{assignments.length > 0 ? Math.round(assignments.reduce((s, a) => s + (a.submission_count / Math.max(a.total_students, 1) * 100), 0) / assignments.length) : 0}%</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>✅ Active Assignments</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {active.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Subject</th><th>Due Date</th><th>Max Marks</th><th>Submissions</th><th>Progress</th></tr></thead>
                            <tbody>
                                {active.map(a => {
                                    const pct = a.total_students > 0 ? Math.round(a.submission_count / a.total_students * 100) : 0;
                                    const isOverdue = new Date(a.due_date) < new Date();
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{a.title}</div>
                                                {a.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{a.description.slice(0, 60)}...</div>}
                                            </td>
                                            <td>{a.subject_name}<br /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.subject_code}</span></td>
                                            <td>
                                                <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                                                    {a.due_date} {isOverdue && '⚠️'}
                                                </span>
                                            </td>
                                            <td>{a.max_marks}</td>
                                            <td>{a.submission_count} / {a.total_students}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="progress-bar" style={{ flex: 1, minWidth: '60px' }}>
                                                        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : <div className="empty-state"><div className="empty-icon">📄</div><h3>No active assignments</h3><p>Create a new assignment to get started</p></div>}
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header"><h3>✅ Graded Assignments</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {graded.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Subject</th><th>Submissions</th><th>Max Marks</th><th>Status</th></tr></thead>
                            <tbody>
                                {graded.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontWeight: 600 }}>{a.title}</td>
                                        <td>{a.subject_name}</td>
                                        <td>{a.submission_count}</td>
                                        <td>{a.max_marks}</td>
                                        <td><span className="badge-status badge-active">Graded ✓</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state"><p>No graded assignments yet</p></div>}
                </div>
            </div>

            {/* ======== Create Assignment Modal ======== */}
            {showCreateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowCreateModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '90%', maxWidth: '520px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>➕ Create Assignment</h2>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Assignment description and instructions..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px', resize: 'vertical' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject *</label>
                                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date *</label>
                                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Marks</label>
                                <input type="number" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={submitCreate} disabled={saving}>{saving ? '⏳ Saving...' : '➕ Create Assignment'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
