'use client';
import { useState, useEffect } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
    { period: 1, time: '09:00 - 09:50' },
    { period: 2, time: '09:50 - 10:40' },
    { period: 3, time: '11:00 - 11:50' },
    { period: 4, time: '11:50 - 12:40' },
    { period: 5, time: '14:00 - 14:50' },
    { period: 6, time: '14:50 - 15:40' },
];

export default function TimetablePage() {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [department, setDepartment] = useState('Computer Science');
    const [semester, setSemester] = useState('3');
    const [generating, setGenerating] = useState(false);

    const fetchTimetable = () => {
        setLoading(true);
        fetch(`/api/timetable?department=${department}&semester=${semester}`)
            .then(r => r.json())
            .then(d => { setTimetable(d.timetable || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchTimetable(); }, [department, semester]);

    const generateTimetable = async () => {
        setGenerating(true);
        try {
            await fetch('/api/timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', department, semester: parseInt(semester) })
            });
            fetchTimetable();
        } catch (e) {
            console.error(e);
        }
        setGenerating(false);
    };

    const getCell = (day, period) => {
        return timetable.find(t => t.day === day && t.period === period);
    };

    return (
        <>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>🗓️ Timetable Management</h1>
                    <p>AI-powered autonomous schedule generation</p>
                </div>
                <button className="btn btn-primary" onClick={generateTimetable} disabled={generating}>
                    {generating ? '⏳ Generating...' : '🤖 Auto-Generate Timetable'}
                </button>
            </div>

            <div className="search-bar">
                <select className="filter-select" value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                </select>
                <select className="filter-select" value={semester} onChange={e => setSemester(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : timetable.length === 0 ? (
                <div className="card">
                    <div className="card-body">
                        <div className="empty-state">
                            <div className="empty-icon">🗓️</div>
                            <h3>No timetable available</h3>
                            <p>Click "Auto-Generate Timetable" to create a schedule for {department} Semester {semester}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3>📅 {department} — Semester {semester}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{timetable.length} slots scheduled</span>
                    </div>
                    <div className="card-body" style={{ padding: '12px', overflow: 'auto' }}>
                        <div className="timetable-grid">
                            <div className="tt-header">Period</div>
                            {DAYS.map(d => <div key={d} className="tt-header">{d}</div>)}

                            {PERIODS.map(p => (
                                <>
                                    <div key={`p${p.period}`} className="tt-period">
                                        <strong>P{p.period}</strong>
                                        <span style={{ fontSize: '9px' }}>{p.time}</span>
                                    </div>
                                    {DAYS.map(day => {
                                        const cell = getCell(day, p.period);
                                        return (
                                            <div key={`${day}-${p.period}`} className="tt-cell">
                                                {cell ? (
                                                    <>
                                                        <div className="subject-name">{cell.subject_name || cell.subject_code}</div>
                                                        <div className="room-name">📍 {cell.room}</div>
                                                        {cell.teacher_name && <div className="teacher-name">👨‍🏫 {cell.teacher_name}</div>}
                                                    </>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>—</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
