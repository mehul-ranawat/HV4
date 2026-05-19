// License: Proprietary / Internal Use
// HealthVault (HV4) - All rights reserved.
// Designed and developed by the HealthVault Team.
// Unauthorized copying, distribution, or modification is strictly prohibited.
//
// Contributors:
//   - Mehul Ranawat       (Lead Developer & Architect)
//   - Laxmi Nayakodi      (UI/UX Design)
//   - Srushti Reddy       (Security)
//   - Sanket Deshmukh     (Data Engineering)

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Home,
    FileText,
    Pill,
    Calendar,
    User,
    LogOut,
    Users,
    ClipboardList,
    Menu,
    X,
    Shield,
    Settings
} from 'lucide-react'
import { useState } from 'react'
import './DashboardLayout.css'

// Navigation definitions moved inside or handled with useMemo for dynamic values

const doctorNav = [
    { name: 'Dashboard', href: '/doctor-dashboard', icon: Home },
    { name: 'Patients', href: '/doctor-dashboard/patients', icon: Users },
    { name: 'Appointments', href: '/doctor-dashboard/appointments', icon: Calendar },
    { name: 'Prescriptions', href: '/doctor-dashboard/prescriptions', icon: ClipboardList },
    { name: 'Profile', href: '/doctor-dashboard/profile', icon: User },
]

const adminNav = [
    { name: 'Control Panel', href: '/admin-dashboard', icon: Shield },
    { name: 'System Settings', href: '/admin-dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, role, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)

    const portalLabel = role === 'admin' ? 'Admin Portal' : (role === 'doctor' ? 'Doctor Portal' : 'Patient Portal')

    const navigation = role === 'admin' ? adminNav : (role === 'doctor' ? doctorNav : [
        { name: 'Dashboard', href: '/patient-dashboard', icon: Home },
        { name: 'Health Records', href: '/patient-dashboard/records', icon: FileText },
        { name: 'Medications', href: '/patient-dashboard/medications', icon: Pill },
        { name: 'Appointments', href: '/patient-dashboard/appointments', icon: Calendar },
        { name: 'Profile', href: '/patient-dashboard/profile', icon: User },
    ])

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'

    return (
        <div className={`dashboard-app ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Top Nav */}
            <nav className="dashboard-nav">
                <div className="dashboard-nav-container">
                    <div className="dashboard-nav-left">
                        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <button className="desktop-toggle" onClick={() => setIsCollapsed(!isCollapsed)} title="Toggle Sidebar">
                            <Menu size={20} />
                        </button>
                        <Link to="/" className="dashboard-brand">
                            <img src="/logo.png" alt="HealthVault Logo" className="dashboard-logo-img" />
                            <span>HealthVault</span>
                            <span className="portal-badge">{portalLabel}</span>
                        </Link>
                    </div>
                    <div className="dashboard-nav-right">
                        <Link to="/" className="nav-home-link">
                            Home
                        </Link>
                        <div className="dashboard-user-info">
                            <div className="dashboard-avatar">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="dashboard-username">{displayName}</span>
                        </div>
                        <button className="dashboard-logout-btn" onClick={handleLogout}>
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-body">
                {/* Sidebar */}
                <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                    <nav className="sidebar-nav-list">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                    title={isCollapsed ? item.name : undefined}
                                >
                                    <Icon size={18} />
                                    <span className="sidebar-link-text">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="sidebar-bottom">
                        <div className="sidebar-user-card" title={isCollapsed ? displayName : undefined}>
                            <div className="dashboard-avatar small">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="sidebar-user-details">
                                <span className="sidebar-user-name">{displayName}</span>
                                <span className="sidebar-user-role">
                                    {role === 'admin' ? 'Administrator' : (role === 'doctor' ? 'Doctor' : 'Patient')}
                                </span>
                            </div>
                        </div>
                        <button className="sidebar-logout-btn" onClick={handleLogout} title={isCollapsed ? 'Logout' : undefined}>
                            <LogOut size={16} />
                            <span className="sidebar-link-text">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

                {/* Main Content */}
                <main className="dashboard-main">
                    {children}
                </main>
            </div>
        </div>
    )
}
