'use client';
import { useState, useEffect } from 'react';

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/assignments')
            .then(r => r.json())
            .then(d => { setAssignments(d.assignments || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const active = assignments.filter(a => a.status === 'active');
    const graded = assignments.filter(a => a.status === 'graded');

    return (
        <>
            <div className="page-header">
                <h1>📄 Assignment & Evaluation</h1>
                <p>Track submissions, evaluate work, and detect plagiarism</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📄</div>
                    <div className="stat-label">Total Assignments</div>
                    <div className="stat-value">{assignments.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-label">Active</div>
                    <div className="stat-value">{active.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">Graded</div>
                    <div className="stat-value">{graded.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-label">Avg Submission Rate</div>
                    <div className="stat-value">
                        {assignments.length > 0 ? Math.round(assignments.reduce((s, a) => s + (a.submission_count / Math.max(a.total_students, 1) * 100), 0) / assignments.length) : 0}%
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>📋 Active Assignments</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {active.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Subject</th><th>Due Date</th><th>Max Marks</th><th>Submissions</th><th>Progress</th></tr></thead>
                            <tbody>
                                {active.map(a => {
                                    const pct = a.total_students > 0 ? Math.round(a.submission_count / a.total_students * 100) : 0;
                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{a.title}</div>
                                                {a.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{a.description.slice(0, 60)}...</div>}
                                            </td>
                                            <td>{a.subject_name}<br /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.subject_code}</span></td>
                                            <td>{a.due_date}</td>
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
                    ) : <div className="empty-state"><div className="empty-icon">📄</div><h3>No active assignments</h3></div>}
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3>✅ Graded Assignments</h3>
                </div>
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
        </>
    );
}
