'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
    { period: 1, time: '09:00-09:50' },
    { period: 2, time: '09:50-10:40' },
    { period: 3, time: '11:00-11:50' },
    { period: 4, time: '11:50-12:40' },
    { period: 5, time: '14:00-14:50' },
    { period: 6, time: '14:50-15:40' },
];

export default function StudentPortal() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push('/'); return; }

        const u = JSON.parse(stored);
        if (u.role !== 'student' || !u.studentId) { router.push('/'); return; }
        setUser(u);

        fetch(`/api/student-portal?student_id=${u.studentId}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [router]);

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) return (
        <div className="loading" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div className="spinner"></div>
            <span className="loading-text">Loading your academic profile...</span>
        </div>
    );

    if (!data || !data.student) return (
        <div className="loading" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <span>Failed to load profile</span>
        </div>
    );

    const { student, attendance, subjectAttendance, marks, subjectPerformance, assignments, fees, feeSummary, riskAnalysis, alerts, timetable } = data;
    const avgMarks = marks.length > 0 ? (marks.reduce((s, m) => s + (m.obtained_marks / m.max_marks * 100), 0) / marks.length).toFixed(1) : 0;
    const submitted = assignments.filter(a => a.submission_id).length;
    const getTTCell = (day, period) => timetable.find(t => t.day === day && t.period === period);

    const tabs = [
        { id: 'overview', label: '📊 Overview', icon: '📊' },
        { id: 'attendance', label: '📋 Attendance', icon: '📋' },
        { id: 'marks', label: '📝 Marks', icon: '📝' },
        { id: 'assignments', label: '📄 Assignments', icon: '📄' },
        { id: 'timetable', label: '🗓️ Timetable', icon: '🗓️' },
        { id: 'fees', label: '💰 Fees', icon: '💰' },
    ];

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            {/* Student Header */}
            <header style={{
                background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
                padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '40px', height: '40px', background: 'var(--gradient-primary)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>🎓</div>
                    <div>
                        <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>IEMS Student Portal</h1>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Welcome, {student.name}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{student.enrollment_no}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.department} • Sem {student.semester}</div>
                    </div>
                    <div style={{
                        width: '36px', height: '36px', background: 'var(--gradient-primary)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700, color: 'white'
                    }}>{student.name[0]}</div>
                    <button onClick={handleLogout} className="btn btn-secondary btn-sm">Sign Out</button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div style={{ padding: '0 32px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
                    {tabs.map(t => (
                        <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* ===== OVERVIEW TAB ===== */}
                {tab === 'overview' && (
                    <>
                        {/* Profile Header */}
                        <div className="profile-header">
                            <div className="profile-avatar">{student.name[0]}</div>
                            <div className="profile-info">
                                <h2>{student.name}</h2>
                                <div className="profile-meta">
                                    <span>🆔 {student.enrollment_no}</span>
                                    <span>🏫 {student.department}</span>
                                    <span>📅 Semester {student.semester}</span>
                                    <span>📧 {student.email}</span>
                                </div>
                            </div>
                            <div className="profile-risk-score">
                                <div className="risk-circle" style={{ background: riskAnalysis.riskColor, color: 'white' }}>
                                    {riskAnalysis.riskScore}
                                </div>
                                <div className="risk-label" style={{ color: riskAnalysis.riskColor }}>
                                    {riskAnalysis.riskLevel} risk
                                </div>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📋</div>
                                <div className="stat-label">Attendance</div>
                                <div className="stat-value">{attendance.percentage || 0}%</div>
                                <div className={`stat-change ${(attendance.percentage || 0) >= 75 ? 'positive' : 'negative'}`}>
                                    {attendance.present}/{attendance.total_classes} classes
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-label">Avg Marks</div>
                                <div className="stat-value">{avgMarks}%</div>
                                <div className={`stat-change ${avgMarks >= 50 ? 'positive' : 'negative'}`}>
                                    Across all exams
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📄</div>
                                <div className="stat-label">Assignments</div>
                                <div className="stat-value">{submitted}/{assignments.length}</div>
                                <div className="stat-change">Submitted</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-label">Fee Status</div>
                                <div className="stat-value">
                                    {feeSummary.total_pending <= 0 ? '✅ Clear' : `₹${(feeSummary.total_pending / 1000).toFixed(0)}K`}
                                </div>
                                <div className={`stat-change ${feeSummary.total_pending <= 0 ? 'positive' : 'negative'}`}>
                                    {feeSummary.total_pending <= 0 ? 'All paid' : 'Pending'}
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        {alerts.length > 0 && (
                            <div className="card" style={{ marginBottom: '20px' }}>
                                <div className="card-header"><h3>🔔 Notifications</h3></div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    {alerts.map(a => (
                                        <div key={a.id} className="alert-item">
                                            <div className="alert-icon">
                                                {a.type === 'attendance' ? '📉' : a.type === 'academic' ? '📚' : a.type === 'fee' ? '💰' : '📝'}
                                            </div>
                                            <div className="alert-content">
                                                <div className="alert-title">{a.title}</div>
                                                <div className="alert-message">{a.message}</div>
                                            </div>
                                            <span className={`badge-risk badge-${a.severity}`}>{a.severity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Subject Performance */}
                        {subjectPerformance.length > 0 && (
                            <div className="card">
                                <div className="card-header"><h3>📈 Subject Performance</h3></div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={subjectPerformance}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="subject_code" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
                                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e8f0' }} formatter={v => [`${v}%`, 'Score']} />
                                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                                {subjectPerformance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ===== ATTENDANCE TAB ===== */}
                {tab === 'attendance' && (
                    <>
                        <div className="page-header"><h1>📋 My Attendance</h1><p>Subject-wise attendance breakdown</p></div>
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="stat-card">
                                <div className="stat-label">Overall Attendance</div>
                                <div className="stat-value">{attendance.percentage || 0}%</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Classes Attended</div>
                                <div className="stat-value">{attendance.present}/{attendance.total_classes}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Classes Missed</div>
                                <div className="stat-value" style={{ color: 'var(--danger)' }}>{attendance.absent}</div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3>📊 Subject-wise Attendance</h3></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead><tr><th>Subject</th><th>Code</th><th>Present</th><th>Total</th><th>Percentage</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {subjectAttendance.map(sa => (
                                            <tr key={sa.subject_code}>
                                                <td style={{ fontWeight: 600 }}>{sa.subject_name}</td>
                                                <td>{sa.subject_code}</td>
                                                <td>{sa.present}</td>
                                                <td>{sa.total}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div className="progress-bar" style={{ flex: 1, maxWidth: '80px' }}>
                                                            <div className="progress-fill" style={{ width: `${sa.percentage}%`, background: sa.percentage >= 75 ? 'var(--success)' : sa.percentage >= 60 ? 'var(--warning)' : 'var(--danger)' }}></div>
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{sa.percentage}%</span>
                                                    </div>
                                                </td>
                                                <td><span className={`badge-risk badge-${sa.percentage >= 75 ? 'low' : sa.percentage >= 60 ? 'medium' : 'critical'}`}>
                                                    {sa.percentage >= 75 ? 'Good' : sa.percentage >= 60 ? 'Warning' : 'Critical'}
                                                </span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== MARKS TAB ===== */}
                {tab === 'marks' && (
                    <>
                        <div className="page-header"><h1>📝 My Marks & Performance</h1><p>Exam scores and academic analysis</p></div>
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="stat-card"><div className="stat-label">Average Marks</div><div className="stat-value">{avgMarks}%</div></div>
                            <div className="stat-card"><div className="stat-label">Exams Taken</div><div className="stat-value">{marks.length}</div></div>
                            <div className="stat-card"><div className="stat-label">Subjects</div><div className="stat-value">{subjectPerformance.length}</div></div>
                        </div>

                        {subjectPerformance.length > 0 && (
                            <div className="card" style={{ marginBottom: '20px' }}>
                                <div className="card-header"><h3>📈 Subject-wise Performance</h3></div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={subjectPerformance}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="subject_code" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
                                            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e8f0' }} formatter={v => [`${v}%`, 'Score']} />
                                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                                {subjectPerformance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <div className="card-header"><h3>📋 Detailed Exam Marks</h3></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead><tr><th>Subject</th><th>Exam Type</th><th>Obtained</th><th>Maximum</th><th>Percentage</th><th>Grade</th></tr></thead>
                                    <tbody>
                                        {marks.map((m, i) => {
                                            const pct = (m.obtained_marks / m.max_marks * 100);
                                            return (
                                                <tr key={i}>
                                                    <td><div style={{ fontWeight: 600 }}>{m.subject_name}</div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.subject_code}</span></td>
                                                    <td style={{ textTransform: 'capitalize' }}>{m.exam_type.replace('_', ' ')}</td>
                                                    <td style={{ fontWeight: 600 }}>{m.obtained_marks}</td>
                                                    <td>{m.max_marks}</td>
                                                    <td>{pct.toFixed(1)}%</td>
                                                    <td><span className={`badge-risk badge-${pct >= 60 ? 'low' : pct >= 40 ? 'medium' : 'critical'}`}>
                                                        {pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'}
                                                    </span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== ASSIGNMENTS TAB ===== */}
                {tab === 'assignments' && (
                    <>
                        <div className="page-header"><h1>📄 My Assignments</h1><p>Track submissions and view feedback</p></div>
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{assignments.length}</div></div>
                            <div className="stat-card"><div className="stat-label">Submitted</div><div className="stat-value" style={{ color: 'var(--success)' }}>{submitted}</div></div>
                            <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{assignments.length - submitted}</div></div>
                        </div>
                        <div className="card">
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead><tr><th>Assignment</th><th>Subject</th><th>Due Date</th><th>Status</th><th>Marks</th><th>Feedback</th></tr></thead>
                                    <tbody>
                                        {assignments.map(a => (
                                            <tr key={a.id}>
                                                <td><div style={{ fontWeight: 600 }}>{a.title}</div>{a.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.description.slice(0, 50)}</div>}</td>
                                                <td>{a.subject_name}</td>
                                                <td>{a.due_date}</td>
                                                <td>
                                                    {a.submission_id ? (
                                                        <span className={`badge-status badge-${a.submission_status === 'evaluated' ? 'active' : 'pending'}`}>
                                                            {a.submission_status === 'evaluated' ? '✅ Evaluated' : '📤 Submitted'}
                                                        </span>
                                                    ) : (
                                                        <span className="badge-status badge-overdue">❌ Not Submitted</span>
                                                    )}
                                                </td>
                                                <td>{a.marks_obtained !== null ? `${a.marks_obtained}/${a.max_marks}` : '—'}</td>
                                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>{a.feedback || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== TIMETABLE TAB ===== */}
                {tab === 'timetable' && (
                    <>
                        <div className="page-header"><h1>🗓️ My Timetable</h1><p>{student.department} — Semester {student.semester}</p></div>
                        {timetable.length > 0 ? (
                            <div className="card">
                                <div className="card-body" style={{ padding: '12px', overflow: 'auto' }}>
                                    <div className="timetable-grid">
                                        <div className="tt-header">Period</div>
                                        {DAYS.map(d => <div key={d} className="tt-header">{d}</div>)}
                                        {PERIODS.map(p => (
                                            <>
                                                <div key={`p${p.period}`} className="tt-period"><strong>P{p.period}</strong><span style={{ fontSize: '9px' }}>{p.time}</span></div>
                                                {DAYS.map(day => {
                                                    const cell = getTTCell(day, p.period);
                                                    return (
                                                        <div key={`${day}-${p.period}`} className="tt-cell">
                                                            {cell ? (
                                                                <><div className="subject-name">{cell.subject_name || cell.subject_code}</div>
                                                                    <div className="room-name">📍 {cell.room}</div>
                                                                    {cell.teacher_name && <div className="teacher-name">👨‍🏫 {cell.teacher_name}</div>}</>
                                                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card"><div className="card-body"><div className="empty-state"><div className="empty-icon">🗓️</div><h3>No timetable available</h3><p>Timetable has not been generated for your department/semester yet.</p></div></div></div>
                        )}
                    </>
                )}

                {/* ===== FEES TAB ===== */}
                {tab === 'fees' && (
                    <>
                        <div className="page-header"><h1>💰 My Fee Details</h1><p>Payment history and pending dues</p></div>
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <div className="stat-card"><div className="stat-label">Total Fees</div><div className="stat-value">₹{feeSummary.total_amount?.toLocaleString()}</div></div>
                            <div className="stat-card"><div className="stat-label">Paid</div><div className="stat-value" style={{ color: 'var(--success)' }}>₹{feeSummary.total_paid?.toLocaleString()}</div></div>
                            <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: feeSummary.total_pending > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{feeSummary.total_pending?.toLocaleString()}</div></div>
                        </div>
                        <div className="card">
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead><tr><th>Fee Type</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {fees.map(f => (
                                            <tr key={f.id}>
                                                <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{f.fee_type}</td>
                                                <td>₹{f.amount?.toLocaleString()}</td>
                                                <td style={{ color: 'var(--success)' }}>₹{f.paid?.toLocaleString()}</td>
                                                <td style={{ color: (f.amount - f.paid) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>₹{(f.amount - f.paid)?.toLocaleString()}</td>
                                                <td>{f.due_date}</td>
                                                <td><span className={`badge-status badge-${f.status}`}>{f.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
