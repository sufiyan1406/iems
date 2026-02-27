'use client';
import { useState, useEffect } from 'react';

export default function FeesPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/fees')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!data) return <div className="loading"><span>Failed to load data</span></div>;

    const { stats, defaulters } = data;

    return (
        <>
            <div className="page-header">
                <h1>💰 Fee Management</h1>
                <p>Track fee collection, pending payments, and defaulters</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-label">Total Fee Amount</div>
                    <div className="stat-value">₹{((stats?.total_amount || 0) / 100000).toFixed(1)}L</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-label">Total Collected</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>₹{((stats?.total_paid || 0) / 100000).toFixed(1)}L</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-label">Pending Amount</div>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>₹{((stats?.total_pending || 0) / 1000).toFixed(0)}K</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">Collection Rate</div>
                    <div className="stat-value">
                        {stats?.total_amount > 0 ? Math.round(stats.total_paid / stats.total_amount * 100) : 0}%
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>📊 Fee Status Distribution</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>{stats?.paid_count || 0}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paid</div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f97316' }}>{stats?.partial_count || 0}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Partial</div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--danger)' }}>{stats?.overdue_count || 0}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue</div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning)' }}>{stats?.pending_count || 0}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>📈 Collection Progress</h3></div>
                    <div className="card-body">
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overall Collection</span>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{stats?.total_amount > 0 ? Math.round(stats.total_paid / stats.total_amount * 100) : 0}%</span>
                            </div>
                            <div className="progress-bar" style={{ height: '12px' }}>
                                <div className="progress-fill" style={{ width: `${stats?.total_amount > 0 ? (stats.total_paid / stats.total_amount * 100) : 0}%`, background: 'var(--gradient-primary)' }}></div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total Records</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats?.total_records || 0}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Paid Records</span>
                                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{stats?.paid_count || 0}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Outstanding Records</span>
                                <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{(stats?.partial_count || 0) + (stats?.overdue_count || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3>⚠️ Fee Defaulters</h3>
                    <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{defaulters?.length || 0} students</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {defaulters?.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Student</th><th>Enrollment</th><th>Department</th><th>Pending Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                {defaulters.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                                        <td>{d.enrollment_no}</td>
                                        <td>{d.department}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{d.pending_amount?.toLocaleString()}</td>
                                        <td><span className="badge-risk badge-high">Defaulter</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <div className="empty-state"><div className="empty-icon">✅</div><h3>No fee defaulters</h3><p>All students are up to date with payments</p></div>}
                </div>
            </div>
        </>
    );
}
