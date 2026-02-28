'use client';
import { useState, useEffect } from 'react';

export default function FeesPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Record Payment modal
    const [showPayModal, setShowPayModal] = useState(false);
    const [payTarget, setPayTarget] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    // Add fee modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [students, setStudents] = useState([]);
    const [feeForm, setFeeForm] = useState({ student_id: '', fee_type: 'tuition', amount: '', due_date: '', semester: 3, academic_year: '2025-26' });

    const fetchData = () => {
        setLoading(true);
        fetch('/api/fees').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    };
    useEffect(() => { fetchData(); }, []);

    const openPayModal = (defaulter) => {
        setPayTarget(defaulter);
        setPayAmount(defaulter.pending_amount || '');
        setShowPayModal(true);
    };

    const submitPayment = async () => {
        if (!payAmount || !payTarget) return;
        setSaving(true);
        try {
            // Get the student's pending fees
            const res = await fetch(`/api/fees?student_id=${payTarget.id}`);
            const feesData = await res.json();
            const pendingFees = (feesData.fees || []).filter(f => f.status !== 'paid');

            if (pendingFees.length === 0) throw new Error('No pending fees');

            let remaining = parseFloat(payAmount);
            for (const fee of pendingFees) {
                if (remaining <= 0) break;
                const pendingForThisFee = fee.amount - fee.paid;
                const payForThis = Math.min(remaining, pendingForThisFee);
                const newPaid = fee.paid + payForThis;
                const newStatus = newPaid >= fee.amount ? 'paid' : 'partial';

                await fetch('/api/fees', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: fee.id, paid: newPaid, status: newStatus })
                });
                remaining -= payForThis;
            }

            setSuccess(`Payment of ₹${parseFloat(payAmount).toLocaleString()} recorded for ${payTarget.name}!`);
            setTimeout(() => setSuccess(''), 4000);
            setShowPayModal(false);
            fetchData();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const openAddFee = () => {
        if (students.length === 0) fetch('/api/students?limit=100').then(r => r.json()).then(d => setStudents(d.students || []));
        setFeeForm({ student_id: '', fee_type: 'tuition', amount: '', due_date: new Date().toISOString().split('T')[0], semester: 3, academic_year: '2025-26' });
        setShowAddModal(true);
    };

    const submitAddFee = async () => {
        if (!feeForm.student_id || !feeForm.amount) return alert('Student and Amount are required');
        setSaving(true);
        try {
            const res = await fetch('/api/fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...feeForm, amount: parseFloat(feeForm.amount), status: 'pending' }) });
            if (!res.ok) throw new Error('Failed');
            setSuccess('Fee record created!');
            setTimeout(() => setSuccess(''), 4000);
            setShowAddModal(false);
            fetchData();
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div><span className="loading-text">Loading fee data...</span></div>;
    if (!data) return <div className="loading"><span>Failed to load data</span></div>;

    const { stats, defaulters } = data;
    const collectionRate = stats?.total_amount > 0 ? ((stats.total_paid / stats.total_amount) * 100).toFixed(1) : 0;

    return (
        <>
            {success && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', padding: '14px 24px', borderRadius: '12px', zIndex: 10000, boxShadow: '0 8px 32px rgba(34,197,94,0.4)', fontWeight: 600 }}>✅ {success}</div>
            )}

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h1>💰 Fee Management</h1><p>Track fee collection, defaulters, and record payments</p></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={openAddFee}>+ Add Fee</button>
                    <button className="btn btn-primary" onClick={() => { }} disabled>📊 Export Report</button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-label">Total Fee</div><div className="stat-value">₹{(stats?.total_amount || 0).toLocaleString()}</div></div>
                <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-label">Collected</div><div className="stat-value" style={{ color: 'var(--success)' }}>₹{(stats?.total_paid || 0).toLocaleString()}</div></div>
                <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-label">Pending</div><div className="stat-value" style={{ color: 'var(--warning)' }}>₹{(stats?.total_pending || 0).toLocaleString()}</div></div>
                <div className="stat-card"><div className="stat-icon">📈</div><div className="stat-label">Collection Rate</div><div className="stat-value">{collectionRate}%</div></div>
            </div>

            <div className="grid-2" style={{ marginTop: '20px' }}>
                <div className="card">
                    <div className="card-header"><h3>📊 Fee Status Overview</h3></div>
                    <div className="card-body">
                        {[
                            { label: 'Paid', count: stats?.paid_count || 0, color: '#22c55e' },
                            { label: 'Partial', count: stats?.partial_count || 0, color: '#eab308' },
                            { label: 'Overdue', count: stats?.overdue_count || 0, color: '#ef4444' },
                            { label: 'Pending', count: stats?.pending_count || 0, color: '#6366f1' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
                                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                                </div>
                                <span style={{ fontWeight: 700, color: item.color, fontSize: '18px' }}>{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>⚠️ Fee Defaulters</h3>
                        <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{defaulters?.length || 0} students</span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead><tr><th>Student</th><th>Department</th><th>Pending</th><th>Action</th></tr></thead>
                            <tbody>
                                {defaulters?.map(d => (
                                    <tr key={d.id}>
                                        <td><div style={{ fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.enrollment_no}</div></td>
                                        <td>{d.department}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{d.pending_amount?.toLocaleString()}</td>
                                        <td><button className="btn btn-primary btn-sm" onClick={() => openPayModal(d)}>💳 Record Payment</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ======== Record Payment Modal ======== */}
            {showPayModal && payTarget && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowPayModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '90%', maxWidth: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>💳 Record Payment</h2>
                            <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ background: 'rgba(99,102,241,0.1)', padding: '14px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                <div style={{ fontWeight: 700, fontSize: '16px' }}>{payTarget.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{payTarget.enrollment_no} · {payTarget.department}</div>
                                <div style={{ fontSize: '14px', marginTop: '8px' }}>Pending: <span style={{ color: '#ef4444', fontWeight: 700 }}>₹{payTarget.pending_amount?.toLocaleString()}</span></div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Amount (₹)</label>
                                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text-primary, #e8e8f0)', fontSize: '18px', fontWeight: 700 }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={submitPayment} disabled={saving}>{saving ? '⏳ Processing...' : '💳 Record Payment'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======== Add Fee Modal ======== */}
            {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowAddModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}><h2 style={{ margin: 0, fontSize: '18px' }}>➕ Add Fee Record</h2></div>
                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student</label>
                                <select value={feeForm.student_id} onChange={e => setFeeForm({ ...feeForm, student_id: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    <option value="">Select Student</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollment_no})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Fee Type</label>
                                <select value={feeForm.fee_type} onChange={e => setFeeForm({ ...feeForm, fee_type: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    {['tuition', 'exam', 'library', 'hostel', 'transport', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Amount (₹)</label>
                                <input type="number" value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }} placeholder="50000" />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Due Date</label>
                                <input type="date" value={feeForm.due_date} onChange={e => setFeeForm({ ...feeForm, due_date: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Semester</label>
                                <select value={feeForm.semester} onChange={e => setFeeForm({ ...feeForm, semester: parseInt(e.target.value) })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, #e8e8f0)', fontSize: '14px' }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={submitAddFee} disabled={saving}>{saving ? '⏳ Saving...' : '➕ Add Fee'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
