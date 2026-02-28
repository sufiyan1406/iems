'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];
const EXAM_TYPES = [
    { value: 'internal_1', label: 'Internal 1', max: 50 },
    { value: 'internal_2', label: 'Internal 2', max: 50 },
    { value: 'midterm', label: 'Midterm', max: 100 },
    { value: 'final', label: 'Final', max: 100 },
    { value: 'assignment', label: 'Assignment', max: 50 },
    { value: 'quiz', label: 'Quiz', max: 25 },
];

export default function MarksPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Enter Marks state
    const [showEntryPanel, setShowEntryPanel] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedExam, setSelectedExam] = useState('internal_1');
    const [maxMarks, setMaxMarks] = useState(50);
    const [semester, setSemester] = useState(3);
    const [students, setStudents] = useState([]);
    const [marksMap, setMarksMap] = useState({});
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const fetchData = () => {
        setLoading(true);
        fetch('/api/marks').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (showEntryPanel && subjects.length === 0)
            fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects || d || []));
    }, [showEntryPanel]);

    useEffect(() => {
        if (!selectedSubject) return;
        setLoadingStudents(true);
        const sub = subjects.find(s => s.id === parseInt(selectedSubject));
        fetch(`/api/students?department=${encodeURIComponent(sub?.department || '')}&limit=100`)
            .then(r => r.json())
            .then(d => {
                const list = d.students || [];
                setStudents(list);
                const map = {};
                list.forEach(s => { map[s.id] = ''; });
                setMarksMap(map);
                setLoadingStudents(false);
            })
            .catch(() => setLoadingStudents(false));
    }, [selectedSubject]);

    useEffect(() => {
        const exam = EXAM_TYPES.find(e => e.value === selectedExam);
        if (exam) setMaxMarks(exam.max);
    }, [selectedExam]);

    const submitMarks = async () => {
        const records = students
            .filter(s => marksMap[s.id] !== '' && marksMap[s.id] !== undefined)
            .map(s => ({
                student_id: s.id,
                subject_id: parseInt(selectedSubject),
                exam_type: selectedExam,
                max_marks: maxMarks,
                obtained_marks: parseFloat(marksMap[s.id]) || 0,
                semester
            }));
        if (records.length === 0) return alert('Enter marks for at least one student');
        setSaving(true);
        try {
            const res = await fetch('/api/marks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records }) });
            if (!res.ok) throw new Error('Failed');
            setSuccess(`Marks saved for ${records.length} students!`);
            setTimeout(() => setSuccess(''), 4000);
            setShowEntryPanel(false);
            fetchData();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div><span className="loading-text">Loading performance data...</span></div>;
    if (!data) return <div className="loading"><span>Failed to load data</span></div>;
    const { overallStats, subjectPerformance, topPerformers } = data;

    return (
        <>
            {success && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px 24px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 8px 32px rgba(34,197,94,0.4)', fontWeight: 600 }}>✅ {success}</div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1>📝 Marks & Performance</h1><p>Academic performance analysis and subject-wise breakdown</p></div>
                <button className="btn btn-primary" onClick={() => setShowEntryPanel(!showEntryPanel)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showEntryPanel ? '← Back to Stats' : '📝 Enter Marks'}
                </button>
            </div>

            {showEntryPanel ? (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div className="card-header"><h3>📝 Enter Marks</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</label>
                                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exam Type</label>
                                <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    {EXAM_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Marks</label>
                                <input type="number" value={maxMarks} onChange={e => setMaxMarks(parseInt(e.target.value) || 0)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semester</label>
                                <select value={semester} onChange={e => setSemester(parseInt(e.target.value))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                </select>
                            </div>
                        </div>

                        {loadingStudents && <div className="loading"><div className="spinner"></div></div>}

                        {!loadingStudents && students.length > 0 && (
                            <>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <table className="data-table">
                                        <thead><tr><th>#</th><th>Student</th><th>Enrollment</th><th style={{ width: '120px' }}>Marks (/{maxMarks})</th><th>%</th></tr></thead>
                                        <tbody>
                                            {students.map((s, i) => {
                                                const val = marksMap[s.id];
                                                const pct = val !== '' && maxMarks > 0 ? ((parseFloat(val) || 0) / maxMarks * 100).toFixed(0) : '-';
                                                return (
                                                    <tr key={s.id}>
                                                        <td>{i + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                        <td>{s.enrollment_no}</td>
                                                        <td>
                                                            <input type="number" min="0" max={maxMarks} value={val} placeholder="0"
                                                                onChange={e => setMarksMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                                style={{ width: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px', textAlign: 'center' }} />
                                                        </td>
                                                        <td><span className={`badge-risk badge-${pct === '-' ? 'low' : pct >= 60 ? 'low' : pct >= 40 ? 'medium' : 'critical'}`}>{pct === '-' ? '-' : `${pct}%`}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button className="btn btn-primary" onClick={submitMarks} disabled={saving} style={{ padding: '12px 32px', fontSize: '15px' }}>
                                        {saving ? '⏳ Saving...' : `💾 Save Marks`}
                                    </button>
                                </div>
                            </>
                        )}
                        {!selectedSubject && <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>👆 Select a subject to load students</div>}
                    </div>
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-label">Avg Performance</div><div className="stat-value">{overallStats?.avg_percentage || 0}%</div></div>
                        <div className="stat-card"><div className="stat-icon">👨‍🎓</div><div className="stat-label">Students Evaluated</div><div className="stat-value">{overallStats?.total_students || 0}</div></div>
                        <div className="stat-card"><div className="stat-icon">⚠️</div><div className="stat-label">Failing Students</div><div className="stat-value" style={{ color: 'var(--danger)' }}>{overallStats?.failing_count || 0}</div></div>
                    </div>

                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header"><h3>📈 Subject Performance</h3></div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={subjectPerformance} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
                                        <YAxis type="category" dataKey="code" tick={{ fill: '#6b7280', fontSize: 11 }} width={60} />
                                        <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e8f0' }} formatter={v => [`${v}%`, 'Average']} />
                                        <Bar dataKey="avg_percentage" radius={[0, 4, 4, 0]}>{subjectPerformance?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3>🏆 Top Performers</h3></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead><tr><th>#</th><th>Student</th><th>Department</th><th>Avg %</th></tr></thead>
                                    <tbody>
                                        {topPerformers?.map((s, i) => (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 700, color: i < 3 ? '#eab308' : 'var(--text-muted)' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                                                <td><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.enrollment_no}</div></td>
                                                <td>{s.department}</td>
                                                <td><span className="badge-risk badge-low">{s.avg_percentage}%</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header"><h3>📋 Subject-wise Detailed Analysis</h3></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Subject</th><th>Code</th><th>Students</th><th>Average</th><th>Highest</th><th>Lowest</th><th>Status</th></tr></thead>
                                <tbody>
                                    {subjectPerformance?.map(s => (
                                        <tr key={s.code}>
                                            <td style={{ fontWeight: 600 }}>{s.subject_name}</td>
                                            <td>{s.code}</td><td>{s.student_count}</td>
                                            <td>{s.avg_percentage}%</td>
                                            <td style={{ color: 'var(--success)' }}>{Math.round(s.highest)}%</td>
                                            <td style={{ color: 'var(--danger)' }}>{Math.round(s.lowest)}%</td>
                                            <td><span className={`badge-risk badge-${s.avg_percentage >= 60 ? 'low' : s.avg_percentage >= 45 ? 'medium' : 'critical'}`}>{s.avg_percentage >= 60 ? 'Good' : s.avg_percentage >= 45 ? 'Average' : 'Concerning'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
