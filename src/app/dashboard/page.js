'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div><span className="loading-text">Loading dashboard...</span></div>;
    if (!data) return <div className="loading"><span>Failed to load dashboard</span></div>;

    const { stats, recentAlerts, atRiskStudents, departmentStats, attendanceTrend, performanceDistribution } = data;

    return (
        <>
            <div className="page-header">
                <h1>📊 Dashboard Overview</h1>
                <p>Real-time institutional intelligence and analytics</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{stats.totalStudents}</div>
                    <div className="stat-change positive">Active & enrolled</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👨‍🏫</div>
                    <div className="stat-label">Total Faculty</div>
                    <div className="stat-value">{stats.totalTeachers}</div>
                    <div className="stat-change positive">Across departments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-label">Avg Attendance</div>
                    <div className="stat-value">{stats.avgAttendance}%</div>
                    <div className={`stat-change ${stats.avgAttendance >= 75 ? 'positive' : 'negative'}`}>
                        {stats.avgAttendance >= 75 ? '↑ Above threshold' : '↓ Below threshold'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-label">Avg Performance</div>
                    <div className="stat-value">{stats.avgPerformance}%</div>
                    <div className="stat-change positive">Overall average marks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-label">Fee Collected</div>
                    <div className="stat-value">₹{(stats.totalFeeCollected / 100000).toFixed(1)}L</div>
                    <div className="stat-change negative">₹{(stats.totalFeePending / 1000).toFixed(0)}K pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-label">Active Alerts</div>
                    <div className="stat-value">{stats.activeAlerts}</div>
                    <div className="stat-change negative">Require attention</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3>📈 Attendance Trend (14 Days)</h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={attendanceTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e8f0' }}
                                        formatter={(v) => [`${v}%`, 'Attendance']}
                                    />
                                    <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>📊 Grade Distribution</h3>
                    </div>
                    <div className="card-body">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={performanceDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="grade" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e8e8f0' }}
                                    />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                        {performanceDistribution?.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: '20px' }}>
                <div className="card">
                    <div className="card-header">
                        <h3>🚨 At-Risk Students</h3>
                        <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{atRiskStudents?.length || 0} students</span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {atRiskStudents?.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Department</th>
                                        <th>Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atRiskStudents.slice(0, 8).map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.enrollment_no}</div>
                                            </td>
                                            <td>{s.department}</td>
                                            <td>
                                                <span className={`badge-risk badge-${s.attendance_pct < 60 ? 'critical' : 'high'}`}>
                                                    {s.attendance_pct}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state"><p>No at-risk students detected</p></div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>🔔 Recent Alerts</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {recentAlerts?.slice(0, 6).map((alert) => (
                            <div className="alert-item" key={alert.id}>
                                <div className="alert-icon">
                                    {alert.type === 'attendance' ? '📉' : alert.type === 'academic' ? '📚' : alert.type === 'fee' ? '💰' : '📝'}
                                </div>
                                <div className="alert-content">
                                    <div className="alert-title">{alert.title}</div>
                                    <div className="alert-message">{alert.message}</div>
                                </div>
                                <span className={`badge-risk badge-${alert.severity}`}>{alert.severity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3>🏫 Department Overview</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Students</th>
                                <th>Avg Attendance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentStats?.map((dept) => (
                                <tr key={dept.department}>
                                    <td style={{ fontWeight: 600 }}>{dept.department}</td>
                                    <td>{dept.student_count}</td>
                                    <td>{dept.avg_attendance || 'N/A'}%</td>
                                    <td>
                                        <span className={`badge-risk badge-${(dept.avg_attendance || 0) >= 75 ? 'low' : (dept.avg_attendance || 0) >= 60 ? 'medium' : 'high'}`}>
                                            {(dept.avg_attendance || 0) >= 75 ? 'Good' : (dept.avg_attendance || 0) >= 60 ? 'Attention' : 'Critical'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
