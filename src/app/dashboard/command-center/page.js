'use client';
import { useState } from 'react';

const SUGGESTIONS = [
    'Show students with attendance below 70%',
    'Show students likely to fail this semester',
    'Show top 10 performers',
    'Show fee defaulters',
    'How many students are there?',
    'Show department wise statistics',
    'Show pending assignments',
    'Show faculty list',
];

export default function CommandCenterPage() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    const executeQuery = async (q) => {
        const text = q || query;
        if (!text.trim()) return;
        setLoading(true);
        setQuery(text);

        try {
            const res = await fetch('/api/agents/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });
            const data = await res.json();
            setResult(data);
            setHistory(prev => [{ query: text, result: data, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
        } catch (e) {
            setResult({ type: 'error', title: 'Error', description: 'Failed to process query' });
        }
        setLoading(false);
    };

    return (
        <>
            <div className="page-header">
                <h1>🧠 Institutional Command Center</h1>
                <p>Natural language queries — Ask anything about your institution</p>
            </div>

            <div className="command-input-wrapper">
                <span className="command-icon">🔍</span>
                <input
                    className="command-input"
                    placeholder='Try: "Show students likely to fail this semester" or "attendance below 60%"'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && executeQuery()}
                />
            </div>

            <div className="query-suggestions">
                {SUGGESTIONS.map((s, i) => (
                    <button key={i} className="suggestion-chip" onClick={() => executeQuery(s)}>{s}</button>
                ))}
            </div>

            {loading && (
                <div className="loading">
                    <div className="spinner"></div>
                    <span className="loading-text">AI Agent processing your query...</span>
                </div>
            )}

            {result && !loading && (
                <div className="query-result">
                    <div className="card">
                        <div className="card-header">
                            <h3>{result.title}</h3>
                            {result.description && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{result.description}</span>}
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {result.type === 'table' && result.data && (
                                <table className="data-table">
                                    <thead>
                                        <tr>{result.columns?.map((c, i) => <th key={i}>{c}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {result.data.map((row, i) => (
                                            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {result.type === 'stat' && (
                                <div style={{ padding: '32px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent-primary-light)' }}>{result.value}</div>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{result.description}</p>
                                    {result.breakdown && (
                                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                                            {result.breakdown.map((b, i) => (
                                                <div key={i} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{b.count}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.department}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {result.type === 'info' && (
                                <div style={{ padding: '24px' }}>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{result.description}</p>
                                    {result.suggestions && (
                                        <div className="query-suggestions">
                                            {result.suggestions.map((s, i) => (
                                                <button key={i} className="suggestion-chip" onClick={() => executeQuery(s)}>{s}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {result.sqlGenerated && (
                            <div className="result-meta">
                                <span style={{ color: 'var(--text-muted)' }}>SQL Generated: </span>
                                <code style={{ color: 'var(--accent-primary-light)' }}>{result.sqlGenerated}</code>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {history.length > 0 && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <div className="card-header"><h3>📜 Query History</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {history.map((h, i) => (
                            <div key={i} className="alert-item" style={{ cursor: 'pointer' }} onClick={() => executeQuery(h.query)}>
                                <div className="alert-icon">🔍</div>
                                <div className="alert-content">
                                    <div className="alert-title">{h.query}</div>
                                    <div className="alert-message">{h.result?.title} — {h.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
