'use client';
import { useState, useEffect } from 'react';

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [studentDetail, setStudentDetail] = useState(null);
    const [riskData, setRiskData] = useState(null);

    const fetchStudents = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (department) params.set('department', department);
        fetch(`/api/students?${params}`)
            .then(r => r.json())
            .then(d => { setStudents(d.students || []); setTotal(d.total || 0); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchStudents(); }, [department]);

    const loadDetail = async (id) => {
        setSelected(id);
        const [detail, risk] = await Promise.all([
            fetch(`/api/students/${id}`).then(r => r.json()),
            fetch(`/api/agents/risk?student_id=${id}`).then(r => r.json())
        ]);
        setStudentDetail(detail);
        setRiskData(risk);
    };

    if (selected && studentDetail) {
        const { student, attendance, subjectAttendance, marks, fees, alerts } = studentDetail;
        return (
            <>
                <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSelected(null); setStudentDetail(null); setRiskData(null); }}>← Back</button>
                    <div>
                        <h1>Student Profile</h1>
                        <p>Comprehensive intelligence view</p>
                    </div>
                </div>

                <div className="profile-header">
                    <div className="profile-avatar">{student.name[0]}</div>
                    <div className="profile-info">
                        <h2>{student.name}</h2>
                        <div className="profile-meta">
                            <span>🆔 {student.enrollment_no}</span>
                            <span>🏫 {student.department}</span>
                            <span>📅 Sem {student.semester}</span>
                            <span>📧 {student.email}</span>
                        </div>
                    </div>
                    {riskData && (
                        <div className="profile-risk-score">
                            <div className="risk-circle" style={{ background: riskData.riskColor, color: 'white' }}>
                                {riskData.riskScore}
                            </div>
                            <div className="risk-label" style={{ color: riskData.riskColor }}>{riskData.riskLevel} risk</div>
                        </div>
                    )}
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-label">Attendance</div>
                        <div className="stat-value">{attendance?.percentage || 0}%</div>
                        <div className={`stat-change ${(attendance?.percentage || 0) >= 75 ? 'positive' : 'negative'}`}>
                            {attendance?.present || 0} / {attendance?.total_classes || 0} classes
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-label">Avg Marks</div>
                        <div className="stat-value">
                            {marks?.length > 0 ? (marks.reduce((s, m) => s + (m.obtained_marks / m.max_marks * 100), 0) / marks.length).toFixed(1) : 0}%
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-label">Fee Status</div>
                        <div className="stat-value">
                            {fees?.every(f => f.status === 'paid') ? '✅ Clear' : '⚠️ Pending'}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🚨</div>
                        <div className="stat-label">Alerts</div>
                        <div className="stat-value">{alerts?.length || 0}</div>
                    </div>
                </div>

                {riskData?.factors && (
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header"><h3>🎯 Risk Analysis Breakdown</h3></div>
                        <div className="card-body">
                            <div className="factor-item">
                                <div className="factor-header">
                                    <span className="factor-name">📋 Attendance Factor (50% weight)</span>
                                    <span className="factor-value">{riskData.factors.attendance.value}% attendance</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${riskData.factors.attendance.value}%`, background: parseFloat(riskData.factors.attendance.value) >= 75 ? 'var(--success)' : 'var(--danger)' }}></div>
                                </div>
                            </div>
                            <div className="factor-item">
                                <div className="factor-header">
                                    <span className="factor-name">📊 Academic Performance (30% weight)</span>
                                    <span className="factor-value">{riskData.factors.marks.value}% average</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${riskData.factors.marks.value}%`, background: parseFloat(riskData.factors.marks.value) >= 50 ? 'var(--success)' : 'var(--warning)' }}></div>
                                </div>
                            </div>
                            <div className="factor-item">
                                <div className="factor-header">
                                    <span className="factor-name">📄 Assignment Completion (20% weight)</span>
                                    <span className="factor-value">{riskData.factors.assignments.value}% submitted</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${riskData.factors.assignments.value}%`, background: parseFloat(riskData.factors.assignments.value) >= 60 ? 'var(--success)' : 'var(--warning)' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {riskData?.interventions?.length > 0 && (
                    <div className="card" style={{ marginBottom: '20px' }}>
                        <div className="card-header"><h3>💡 AI Intervention Suggestions</h3></div>
                        <div className="card-body">
                            {riskData.interventions.map((int, i) => (
                                <div key={i} className={`intervention-card ${int.priority}`}>
                                    <div className="intervention-type">{int.type} — {int.priority}</div>
                                    <div className="intervention-message">{int.message}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid-2">
                    <div className="card">
                        <div className="card-header"><h3>📋 Subject Attendance</h3></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Subject</th><th>Present</th><th>Total</th><th>%</th></tr></thead>
                                <tbody>
                                    {subjectAttendance?.map((sa) => (
                                        <tr key={sa.subject_code}>
                                            <td>{sa.subject_name}<br /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sa.subject_code}</span></td>
                                            <td>{sa.present}</td>
                                            <td>{sa.total}</td>
                                            <td><span className={`badge-risk badge-${sa.percentage >= 75 ? 'low' : sa.percentage >= 60 ? 'medium' : 'critical'}`}>{sa.percentage}%</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3>📊 Exam Marks</h3></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Subject</th><th>Exam</th><th>Marks</th><th>%</th></tr></thead>
                                <tbody>
                                    {marks?.slice(0, 12).map((m, i) => (
                                        <tr key={i}>
                                            <td>{m.subject_name}<br /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.subject_code}</span></td>
                                            <td style={{ textTransform: 'capitalize' }}>{m.exam_type.replace('_', ' ')}</td>
                                            <td>{m.obtained_marks}/{m.max_marks}</td>
                                            <td><span className={`badge-risk badge-${(m.obtained_marks / m.max_marks * 100) >= 60 ? 'low' : (m.obtained_marks / m.max_marks * 100) >= 40 ? 'medium' : 'critical'}`}>
                                                {(m.obtained_marks / m.max_marks * 100).toFixed(0)}%
                                            </span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1>👨‍🎓 Student Intelligence</h1>
                <p>Centralized student profiles with AI-powered analysis</p>
            </div>

            <div className="search-bar">
                <input
                    className="search-input"
                    placeholder="Search students by name, enrollment no..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
                />
                <select className="filter-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Mathematics">Mathematics</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={fetchStudents}>Search</button>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>👥 Students ({total})</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="loading"><div className="spinner"></div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Enrollment</th>
                                    <th>Department</th>
                                    <th>Semester</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id} className="clickable" onClick={() => loadDetail(s.id)}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.enrollment_no}</td>
                                        <td>{s.department}</td>
                                        <td>Sem {s.semester}</td>
                                        <td><span className={`badge-status badge-${s.status}`}>{s.status}</span></td>
                                        <td><button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); loadDetail(s.id); }}>View Profile →</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
