'use client';
import { useState, useEffect } from 'react';

export default function RiskAlertsPage() {
    const [data, setData] = useState(null);
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('alerts');

    useEffect(() => {
        Promise.all([
            fetch('/api/agents/monitor').then(r => r.json()),
            fetch('/api/agents/risk').then(r => r.json())
        ]).then(([monitor, risk]) => {
            setData(monitor);
            setRiskData(risk);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div><span className="loading-text">AI Agent analyzing student data...</span></div>;

    return (
        <>
            <div className="page-header">
                <h1>🤖 AI Risk Alerts & Monitoring</h1>
                <p>Autonomous academic monitoring powered by AI agents</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                    <div className="stat-icon">🔴</div>
                    <div className="stat-label">Critical Alerts</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>{data?.summary?.critical || riskData?.summary?.critical || 0}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid #f97316' }}>
                    <div className="stat-icon">🟠</div>
                    <div className="stat-label">High Priority</div>
                    <div className="stat-value" style={{ color: '#f97316' }}>{data?.summary?.high || riskData?.summary?.high || 0}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
                    <div className="stat-icon">🟡</div>
                    <div className="stat-label">Medium</div>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>{data?.summary?.medium || riskData?.summary?.medium || 0}</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
                    <div className="stat-icon">🟢</div>
                    <div className="stat-label">Low Risk</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{riskData?.summary?.low || 0}</div>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>🔔 Monitoring Alerts ({data?.summary?.total || 0})</button>
                <button className={`tab ${tab === 'risk' ? 'active' : ''}`} onClick={() => setTab('risk')}>📊 Risk Scores (All Students)</button>
            </div>

            {tab === 'alerts' && (
                <div className="card">
                    <div className="card-header">
                        <h3>🔔 AI-Generated Alerts</h3>
                        <div className="tag-list">
                            <span className="tag">📉 Attendance: {data?.summary?.byType?.attendance || 0}</span>
                            <span className="tag">📚 Academic: {data?.summary?.byType?.academic || 0}</span>
                            <span className="tag">📝 Assignment: {data?.summary?.byType?.assignment || 0}</span>
                            <span className="tag">💰 Fee: {data?.summary?.byType?.fee || 0}</span>
                        </div>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {data?.alerts?.map((alert, i) => (
                            <div key={i} className="alert-item">
                                <div className="alert-icon">{alert.icon}</div>
                                <div className="alert-content">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <div className="alert-title">{alert.title}</div>
                                        <span className={`badge-risk badge-${alert.severity}`}>{alert.severity}</span>
                                    </div>
                                    <div className="alert-message">{alert.message}</div>
                                    <div className="alert-suggestion">💡 {alert.suggestion}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'risk' && (
                <div className="card">
                    <div className="card-header">
                        <h3>📊 Student Risk Scores</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Formula: 0.5 × Attendance + 0.3 × Marks + 0.2 × Assignments
                        </span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Student</th><th>Department</th><th>Risk Score</th><th>Attendance</th><th>Marks</th><th>Assignments</th><th>Level</th><th>Interventions</th></tr>
                            </thead>
                            <tbody>
                                {riskData?.students?.slice(0, 30).map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.enrollment_no}</div>
                                        </td>
                                        <td>{s.department}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="progress-bar" style={{ width: '60px' }}>
                                                    <div className="progress-fill" style={{ width: `${s.riskScore}%`, background: s.riskColor }}></div>
                                                </div>
                                                <span style={{ fontWeight: 700, color: s.riskColor }}>{s.riskScore}</span>
                                            </div>
                                        </td>
                                        <td>{s.factors?.attendance?.value}%</td>
                                        <td>{s.factors?.marks?.value}%</td>
                                        <td>{s.factors?.assignments?.value}%</td>
                                        <td><span className={`badge-risk badge-${s.riskLevel}`}>{s.riskLevel}</span></td>
                                        <td>{s.interventions?.length || 0} actions</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
