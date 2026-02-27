'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];

export default function MarksPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/marks')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div><span className="loading-text">Loading performance data...</span></div>;
    if (!data) return <div className="loading"><span>Failed to load data</span></div>;

    const { overallStats, subjectPerformance, topPerformers } = data;

    return (
        <>
            <div className="page-header">
                <h1>📝 Marks & Performance</h1>
                <p>Academic performance analysis and subject-wise breakdown</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">Avg Performance</div>
                    <div className="stat-value">{overallStats?.avg_percentage || 0}%</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-label">Students Evaluated</div>
                    <div className="stat-value">{overallStats?.total_students || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-label">Failing Students</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>{overallStats?.failing_count || 0}</div>
                </div>
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
                                <Bar dataKey="avg_percentage" radius={[0, 4, 4, 0]}>
                                    {subjectPerformance?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
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
                                    <td>{s.code}</td>
                                    <td>{s.student_count}</td>
                                    <td>{s.avg_percentage}%</td>
                                    <td style={{ color: 'var(--success)' }}>{Math.round(s.highest)}%</td>
                                    <td style={{ color: 'var(--danger)' }}>{Math.round(s.lowest)}%</td>
                                    <td><span className={`badge-risk badge-${s.avg_percentage >= 60 ? 'low' : s.avg_percentage >= 45 ? 'medium' : 'critical'}`}>
                                        {s.avg_percentage >= 60 ? 'Good' : s.avg_percentage >= 45 ? 'Average' : 'Concerning'}
                                    </span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
