'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308'];

export default function AttendancePage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mark Attendance state
    const [showMarkPanel, setShowMarkPanel] = useState(false);
    const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const fetchData = () => {
        setLoading(true);
        fetch('/api/attendance')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    // Fetch subjects for the mark panel
    useEffect(() => {
        if (showMarkPanel && subjects.length === 0) {
            fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects || d || []));
        }
    }, [showMarkPanel]);

    // Fetch students when subject is selected
    useEffect(() => {
        if (!selectedSubject) return;
        setLoadingStudents(true);
        const sub = subjects.find(s => s.id === parseInt(selectedSubject));
        const dept = sub?.department || '';
        fetch(`/api/students?department=${encodeURIComponent(dept)}&limit=100`)
            .then(r => r.json())
            .then(d => {
                const studentList = d.students || [];
                setStudents(studentList);
                const map = {};
                studentList.forEach(s => { map[s.id] = 'present'; });
                setAttendanceMap(map);
                setLoadingStudents(false);
            })
            .catch(() => setLoadingStudents(false));
    }, [selectedSubject]);

    const toggleStatus = (studentId) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'present' ? 'absent' : prev[studentId] === 'absent' ? 'late' : 'present'
        }));
    };

    const markAll = (status) => {
        const map = {};
        students.forEach(s => { map[s.id] = status; });
        setAttendanceMap(map);
    };

    const submitAttendance = async () => {
        if (!selectedSubject || !markDate) return;
        setSaving(true);
        try {
            const records = students.map(s => ({
                student_id: s.id,
                subject_id: parseInt(selectedSubject),
                date: markDate,
                status: attendanceMap[s.id] || 'absent'
            }));
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records })
            });
            if (!res.ok) throw new Error('Failed to save');
            setSuccess(`Attendance saved for ${records.length} students!`);
            setTimeout(() => setSuccess(''), 4000);
            setShowMarkPanel(false);
            fetchData();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
    const absentCount = Object.values(attendanceMap).filter(v => v === 'absent').length;
    const lateCount = Object.values(attendanceMap).filter(v => v === 'late').length;

    if (loading) return <div className="loading"><div className="spinner"></div><span className="loading-text">Loading attendance data...</span></div>;
    if (!data) return <div className="loading"><span>Failed to load data</span></div>;

    const { stats, deptStats, trend, lowAttendance } = data;

    return (
        <>
            {success && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px 24px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 8px 32px rgba(34,197,94,0.4)', fontWeight: 600, animation: 'slideIn 0.3s ease' }}>
                    ✅ {success}
                </div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>📋 Attendance Management</h1>
                    <p>Track, analyze, and monitor student attendance patterns</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowMarkPanel(!showMarkPanel)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showMarkPanel ? '← Back to Stats' : '✏️ Mark Attendance'}
                </button>
            </div>

            {/* ======== Mark Attendance Panel ======== */}
            {showMarkPanel ? (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>✏️ Mark Attendance</h3>
                        {students.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ {presentCount}</span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>❌ {absentCount}</span>
                                <span style={{ color: '#eab308', fontWeight: 600 }}>⏰ {lateCount}</span>
                            </div>
                        )}
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</label>
                                <input type="date" value={markDate} onChange={e => setMarkDate(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</label>
                                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {loadingStudents && <div className="loading"><div className="spinner"></div></div>}

                        {!loadingStudents && students.length > 0 && (
                            <>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    <button className="btn btn-sm" onClick={() => markAll('present')} style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>✅ All Present</button>
                                    <button className="btn btn-sm" onClick={() => markAll('absent')} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>❌ All Absent</button>
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <table className="data-table">
                                        <thead><tr><th>#</th><th>Student</th><th>Enrollment</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {students.map((s, i) => {
                                                const st = attendanceMap[s.id] || 'absent';
                                                return (
                                                    <tr key={s.id} onClick={() => toggleStatus(s.id)} style={{ cursor: 'pointer' }}>
                                                        <td>{i + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                        <td>{s.enrollment_no}</td>
                                                        <td>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                                                background: st === 'present' ? 'rgba(34,197,94,0.15)' : st === 'absent' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                                                                color: st === 'present' ? '#22c55e' : st === 'absent' ? '#ef4444' : '#eab308',
                                                                border: `1px solid ${st === 'present' ? 'rgba(34,197,94,0.3)' : st === 'absent' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`
                                                            }}>
                                                                {st === 'present' ? '✅ Present' : st === 'absent' ? '❌ Absent' : '⏰ Late'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button className="btn btn-primary" onClick={submitAttendance} disabled={saving} style={{ padding: '12px 32px', fontSize: '15px' }}>
                                        {saving ? '⏳ Saving...' : `💾 Save Attendance (${students.length} students)`}
                                    </button>
                                </div>
                            </>
                        )}

                        {!loadingStudents && selectedSubject && students.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No students found for this subject's department</div>
                        )}
                        {!selectedSubject && (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>👆 Select a subject to load students</div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-label">Avg Attendance</div><div className="stat-value">{stats?.avg_attendance || 0}%</div></div>
                        <div className="stat-card"><div className="stat-icon">📅</div><div className="stat-label">Total Working Days</div><div className="stat-value">{stats?.total_days || 0}</div></div>
                        <div className="stat-card"><div className="stat-icon">👨‍🎓</div><div className="stat-label">Students Tracked</div><div className="stat-value">{stats?.total_students || 0}</div></div>
                        <div className="stat-card"><div className="stat-icon">⚠️</div><div className="stat-label">Below 75%</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{lowAttendance?.length || 0}</div></div>
                    </div>

                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header"><h3>📈 Daily Attendance Trend</h3></div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={trend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e8f0' }} formatter={v => [`${v}%`, 'Attendance']} />
                                        <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3>🏫 Department-wise Attendance</h3></div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={deptStats} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
                                        <YAxis type="category" dataKey="department" tick={{ fill: '#6b7280', fontSize: 11 }} width={120} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e8f0' }} formatter={v => [`${v}%`, 'Attendance']} />
                                        <Bar dataKey="avg_attendance" radius={[0, 4, 4, 0]}>
                                            {deptStats?.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h3>⚠️ Low Attendance Students (Below 75%)</h3>
                            <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{lowAttendance?.length || 0} students flagged</span>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Enrollment</th><th>Department</th><th>Attendance</th><th>Status</th></tr></thead>
                                <tbody>
                                    {lowAttendance?.map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                                            <td>{s.enrollment_no}</td>
                                            <td>{s.department}</td>
                                            <td style={{ fontWeight: 700 }}>{s.percentage}%</td>
                                            <td><span className={`badge-risk badge-${s.percentage < 50 ? 'critical' : s.percentage < 60 ? 'high' : s.percentage < 70 ? 'medium' : 'low'}`}>
                                                {s.percentage < 50 ? 'Critical' : s.percentage < 60 ? 'Very Low' : s.percentage < 70 ? 'Low' : 'Warning'}
                                            </span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`@keyframes slideIn { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }`}</style>
        </>
    );
}
