'use client';
import { useState, useEffect } from 'react';

const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Mathematics'];
const EMPTY_FORM = { enrollment_no: '', name: '', email: '', phone: '', department: 'Computer Science', semester: 1, batch: '2024-28', gender: 'M', guardian_name: '', guardian_phone: '', address: '', status: 'active' };

export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [studentDetail, setStudentDetail] = useState(null);
    const [riskData, setRiskData] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);

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

    const openAdd = () => {
        setEditingStudent(null);
        setForm(EMPTY_FORM);
        setError('');
        setShowModal(true);
    };

    const openEdit = (student) => {
        setEditingStudent(student);
        setForm({
            enrollment_no: student.enrollment_no || '',
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            department: student.department || 'Computer Science',
            semester: student.semester || 1,
            batch: student.batch || '2024-28',
            gender: student.gender || 'M',
            guardian_name: student.guardian_name || '',
            guardian_phone: student.guardian_phone || '',
            address: student.address || '',
            status: student.status || 'active'
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.enrollment_no || !form.department) {
            setError('Name, Enrollment No, and Department are required');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
            const method = editingStudent ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            setShowModal(false);
            setSuccess(editingStudent ? 'Student updated successfully!' : 'Student added successfully!');
            setTimeout(() => setSuccess(''), 3000);
            fetchStudents();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (student) => {
        try {
            const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setDeleteTarget(null);
            setSuccess('Student deleted successfully!');
            setTimeout(() => setSuccess(''), 3000);
            fetchStudents();
        } catch (err) {
            setError(err.message);
        }
    };

    const loadDetail = async (id) => {
        setSelected(id);
        const [detail, risk] = await Promise.all([
            fetch(`/api/students/${id}`).then(r => r.json()),
            fetch(`/api/agents/risk?student_id=${id}`).then(r => r.json())
        ]);
        setStudentDetail(detail);
        setRiskData(risk);
    };

    // ============ Detail View ============
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
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelected(null); setStudentDetail(null); openEdit(student); }}>✏️ Edit</button>
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
                            <div className="risk-circle" style={{ background: riskData.riskColor, color: 'white' }}>{riskData.riskScore}</div>
                            <div className="risk-label" style={{ color: riskData.riskColor }}>{riskData.riskLevel} risk</div>
                        </div>
                    )}
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-label">Attendance</div>
                        <div className="stat-value">{attendance?.percentage || 0}%</div>
                        <div className={`stat-change ${(attendance?.percentage || 0) >= 75 ? 'positive' : 'negative'}`}>{attendance?.present || 0} / {attendance?.total_classes || 0} classes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-label">Avg Marks</div>
                        <div className="stat-value">{marks?.length > 0 ? (marks.reduce((s, m) => s + (m.obtained_marks / m.max_marks * 100), 0) / marks.length).toFixed(1) : 0}%</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-label">Fee Status</div>
                        <div className="stat-value">{fees?.every(f => f.status === 'paid') ? '✅ Clear' : '⚠️ Pending'}</div>
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
                            {[
                                { label: '📋 Attendance Factor (50% weight)', value: riskData.factors.attendance.value, good: v => parseFloat(v) >= 75 },
                                { label: '📊 Academic Performance (30% weight)', value: riskData.factors.marks.value, good: v => parseFloat(v) >= 50 },
                                { label: '📄 Assignment Completion (20% weight)', value: riskData.factors.assignments.value, good: v => parseFloat(v) >= 60 }
                            ].map((f, i) => (
                                <div key={i} className="factor-item">
                                    <div className="factor-header">
                                        <span className="factor-name">{f.label}</span>
                                        <span className="factor-value">{f.value}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${f.value}%`, background: f.good(f.value) ? 'var(--success)' : 'var(--danger)' }}></div>
                                    </div>
                                </div>
                            ))}
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
                                    {subjectAttendance?.map(sa => (
                                        <tr key={sa.subject_code}>
                                            <td>{sa.subject_name}<br /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sa.subject_code}</span></td>
                                            <td>{sa.present}</td><td>{sa.total}</td>
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
                                            <td><span className={`badge-risk badge-${(m.obtained_marks / m.max_marks * 100) >= 60 ? 'low' : (m.obtained_marks / m.max_marks * 100) >= 40 ? 'medium' : 'critical'}`}>{(m.obtained_marks / m.max_marks * 100).toFixed(0)}%</span></td>
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

    // ============ List View ============
    return (
        <>
            {/* Success toast */}
            {success && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px 24px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)', fontWeight: 600, animation: 'slideIn 0.3s ease' }}>
                    ✅ {success}
                </div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>👨‍🎓 Student Intelligence</h1>
                    <p>Centralized student profiles with AI-powered analysis</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>+</span> Add Student
                </button>
            </div>

            <div className="search-bar">
                <input className="search-input" placeholder="Search students by name, enrollment no..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchStudents()} />
                <select className="filter-select" value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={fetchStudents}>Search</button>
            </div>

            <div className="card">
                <div className="card-header"><h3>👥 Students ({total})</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="loading"><div className="spinner"></div></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>Student</th><th>Enrollment</th><th>Department</th><th>Semester</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => loadDetail(s.id)}>{s.name}</td>
                                        <td>{s.enrollment_no}</td>
                                        <td>{s.department}</td>
                                        <td>Sem {s.semester}</td>
                                        <td><span className={`badge-status badge-${s.status}`}>{s.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => loadDetail(s.id)} title="View">👁️</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)} title="Edit">✏️</button>
                                                <button className="btn btn-sm" onClick={() => setDeleteTarget(s)} title="Delete" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ======== Add/Edit Modal ======== */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{editingStudent ? '✏️ Edit Student' : '➕ Add New Student'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>⚠️ {error}</div>}

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Enrollment No *</label>
                                    <input className="form-input" value={form.enrollment_no} onChange={e => setForm({ ...form, enrollment_no: e.target.value })} placeholder="EN2024001" disabled={!!editingStudent} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@iems.edu" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department *</label>
                                    <select className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Semester</label>
                                    <select className="form-input" value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select className="form-input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Batch</label>
                                    <input className="form-input" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} placeholder="2024-28" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Guardian Name</label>
                                    <input className="form-input" value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} placeholder="Guardian's name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Guardian Phone</label>
                                    <input className="form-input" value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} placeholder="9876543210" />
                                </div>
                                {editingStudent && (
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="graduated">Graduated</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                )}
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Address</label>
                                    <textarea className="form-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? '⏳ Saving...' : editingStudent ? '💾 Update Student' : '➕ Add Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======== Delete Confirmation ======== */}
            {deleteTarget && (
                <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
                        <div className="modal-header"><h2>⚠️ Delete Student</h2></div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '8px' }}>Are you sure you want to delete this student?</p>
                            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ fontWeight: 700 }}>{deleteTarget.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{deleteTarget.enrollment_no} · {deleteTarget.department}</div>
                            </div>
                            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '12px' }}>This action cannot be undone. All related records will also be affected.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button className="btn" onClick={() => handleDelete(deleteTarget)} style={{ background: '#ef4444', color: 'white' }}>🗑️ Delete Student</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999; }
                .modal-content { background:var(--card-bg, #1a1a2e); border:1px solid rgba(255,255,255,0.1); border-radius:16px; width:90%; box-shadow:0 24px 48px rgba(0,0,0,0.4); }
                .modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid rgba(255,255,255,0.08); }
                .modal-header h2 { margin:0; font-size:18px; }
                .modal-close { background:none; border:none; color:var(--text-muted); font-size:24px; cursor:pointer; padding:0 4px; }
                .modal-close:hover { color:white; }
                .modal-body { padding:24px; max-height:60vh; overflow-y:auto; }
                .modal-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px; border-top:1px solid rgba(255,255,255,0.08); }
                .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
                .form-group { display:flex; flex-direction:column; gap:4px; }
                .form-label { font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; }
                .form-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:10px 12px; color:var(--text-primary, #e8e8f0); font-size:14px; outline:none; transition:border-color 0.2s; }
                .form-input:focus { border-color:#6366f1; }
                .form-input:disabled { opacity:0.5; cursor:not-allowed; }
                @keyframes slideIn { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
                @media (max-width: 640px) { .form-grid { grid-template-columns:1fr; } }
            `}</style>
        </>
    );
}
