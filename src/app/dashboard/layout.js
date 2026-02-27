'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
    {
        section: 'Overview', items: [
            { href: '/dashboard', icon: '📊', label: 'Dashboard' },
        ]
    },
    {
        section: 'Management', items: [
            { href: '/dashboard/students', icon: '👨‍🎓', label: 'Students' },
            { href: '/dashboard/attendance', icon: '📋', label: 'Attendance' },
            { href: '/dashboard/marks', icon: '📝', label: 'Marks & Performance' },
            { href: '/dashboard/assignments', icon: '📄', label: 'Assignments' },
            { href: '/dashboard/timetable', icon: '🗓️', label: 'Timetable' },
            { href: '/dashboard/fees', icon: '💰', label: 'Fee Management' },
        ]
    },
    {
        section: 'AI Intelligence', items: [
            { href: '/dashboard/risk-alerts', icon: '🤖', label: 'Risk Alerts', badge: true },
            { href: '/dashboard/command-center', icon: '🧠', label: 'Command Center' },
        ]
    },
];

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [alertCount, setAlertCount] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(stored));

        fetch('/api/agents/monitor')
            .then(r => r.json())
            .then(d => setAlertCount(d.summary?.critical || 0))
            .catch(() => { });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">🎓</div>
                    <div className="logo-text">
                        <h2>IEMS</h2>
                        <p>AI Academic OS</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((section) => (
                        <div className="nav-section" key={section.section}>
                            <div className="nav-section-title">{section.section}</div>
                            {section.items.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); router.push(item.href); }}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                    {item.badge && alertCount > 0 && (
                                        <span className="badge">{alertCount}</span>
                                    )}
                                </a>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user.name?.[0] || 'A'}</div>
                        <div className="user-details">
                            <div className="user-name">{user.name}</div>
                            <div className="user-role">{user.role}</div>
                        </div>
                    </div>
                    <button className="nav-link" onClick={handleLogout} style={{ marginTop: '8px', color: 'var(--danger)' }}>
                        <span className="nav-icon">🚪</span>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
