'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308'];

export default function AttendancePage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/attendance')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div><span className="loading-text">Loading attendance data...</span></div>;
    if (!data) return <div className="loading"><span>Failed to load data</span></div>;

    const { stats, deptStats, trend, lowAttendance } = data;

    return (
        <>
            <div className="page-header">
                <h1>📋 Attendance Management</h1>
                <p>Track, analyze, and monitor student attendance patterns</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-label">Avg Attendance</div>
                    <div className="stat-value">{stats?.avg_attendance || 0}%</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-label">Total Working Days</div>
                    <div className="stat-value">{stats?.total_days || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-label">Students Tracked</div>
                    <div className="stat-value">{stats?.total_students || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-label">Below 75%</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>{lowAttendance?.length || 0}</div>
                </div>
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
                                    {deptStats?.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
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
                        <thead>
                            <tr><th>Student</th><th>Enrollment</th><th>Department</th><th>Attendance</th><th>Status</th></tr>
                        </thead>
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
    );
}
