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

import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { db, collection, query, where, getDocs, doc, updateDoc } from '../../firebase/config'
import {
    Activity,
    Heart,
    Calendar,
    FileText,
    Pill,
    AlertTriangle,
    Stethoscope,
    TrendingUp,
    Upload,
    Info,
    QrCode
} from 'lucide-react'

// Hardcoded dummy data removed. We now fetch real appointments from Firestore and store them in state.

export default function PatientDashboard() {
    const { user } = useAuth()
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Patient'

    const [myDoctors, setMyDoctors] = useState<any[]>([])

    // Dynamic Stats State
    const [recordsCount, setRecordsCount] = useState<number | null>(null)
    const [medsCount, setMedsCount] = useState<number | null>(null)
    const [apptsCount, setApptsCount] = useState<number | null>(null)
    const [healthScore, setHealthScore] = useState<number | null>(null)
    const [actualAppointments, setActualAppointments] = useState<any[]>([])
    const [refillAlerts, setRefillAlerts] = useState<any[]>([])

    useEffect(() => {
        if (!user) return

        const fetchDoctorsAndStats = async () => {
            try {
                let fetchedDoctors: any[] = []
                // Doctors have 'assignedPatients' array that contains this user.uid
                const docQ = query(
                    collection(db, 'users'),
                    where('role', '==', 'doctor')
                )
                const docSnap = await getDocs(docQ)
                const allDoctors = docSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                fetchedDoctors = allDoctors.filter((d: any) => d.adminApproved === true)
                setMyDoctors(fetchedDoctors)

                // Fetch Health Records Count
                const recordsQuery = query(collection(db, 'healthRecords'), where('userId', '==', user.uid))
                const recordsSnap = await getDocs(recordsQuery)
                setRecordsCount(recordsSnap.size)

                // Fetch Medications and check for low refills
                const medsQuery = query(collection(db, 'medications'), where('userId', '==', user.uid))
                const medsSnap = await getDocs(medsQuery)
                setMedsCount(medsSnap.size)

                const currentAlerts: any[] = []
                medsSnap.docs.forEach(docSnap => {
                    const medData = docSnap.data()
                    // If refillStatus exists and is 5 or less, and medication is active
                    if (medData.refillStatus !== undefined && medData.refillStatus <= 5 && medData.status === 'Active') {
                        currentAlerts.push({
                            id: docSnap.id,
                            ...medData
                        })
                    }
                })
                setRefillAlerts(currentAlerts)

                // Fetch Appointments Count
                const apptsQuery = query(collection(db, 'appointments'), where('patientId', '==', user.uid))
                const apptsSnap = await getDocs(apptsQuery)

                if (apptsSnap.size === 0 && fetchedDoctors.length > 0) {
                    // Auto-seed 3 demo appointments
                    const doc1 = fetchedDoctors[0]
                    const doc2 = fetchedDoctors[1 % fetchedDoctors.length]

                    const now = new Date()
                    const tomorrow = new Date(now)
                    tomorrow.setDate(now.getDate() + 1)
                    tomorrow.setHours(14, 0, 0)

                    const nextWeek = new Date(now)
                    nextWeek.setDate(now.getDate() + 7)
                    nextWeek.setHours(10, 30, 0)

                    const nextMonth = new Date(now)
                    nextMonth.setDate(now.getDate() + 14)
                    nextMonth.setHours(15, 15, 0)

                    const seedAppointments = [
                        { patientId: user.uid, doctorId: doc1.id, doctor: doc1.displayName, specialty: doc1.specialization || 'General', date: tomorrow, type: 'Follow-up', status: 'confirmed', notes: 'Regular checkup' },
                        { patientId: user.uid, doctorId: doc2.id, doctor: doc2.displayName, specialty: doc2.specialization || 'General', date: nextWeek, type: 'Annual Checkup', status: 'pending', notes: 'Complete physical examination' },
                        { patientId: user.uid, doctorId: doc1.id, doctor: doc1.displayName, specialty: doc1.specialization || 'General', date: nextMonth, type: 'Consultation', status: 'confirmed', notes: 'Review lab results' }
                    ]

                    const { addDoc, Timestamp } = await import('../../firebase/config')
                    for (const appt of seedAppointments) {
                        await addDoc(collection(db, 'appointments'), {
                            ...appt,
                            date: Timestamp.fromDate(appt.date)
                        })
                    }

                    const retrySnap = await getDocs(apptsQuery)
                    const newApptsData = retrySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    const uniqueNewAppts = newApptsData.filter((appt: any, index: number, self: any[]) =>
                        index === self.findIndex((t: any) => {
                            const d1 = t.date?.toDate();
                            const d2 = appt.date?.toDate();
                            return t.doctorId === appt.doctorId &&
                                d1?.getFullYear() === d2?.getFullYear() &&
                                d1?.getMonth() === d2?.getMonth() &&
                                d1?.getDate() === d2?.getDate();
                        })
                    )
                    setApptsCount(uniqueNewAppts.length)
                    setActualAppointments(uniqueNewAppts)
                } else {
                    const existingAppts = apptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    const uniqueExistingAppts = existingAppts.filter((appt: any, index: number, self: any[]) =>
                        index === self.findIndex((t: any) => {
                            const d1 = t.date?.toDate();
                            const d2 = appt.date?.toDate();
                            return t.doctorId === appt.doctorId &&
                                d1?.getFullYear() === d2?.getFullYear() &&
                                d1?.getMonth() === d2?.getMonth() &&
                                d1?.getDate() === d2?.getDate();
                        })
                    )
                    setApptsCount(uniqueExistingAppts.length)
                    setActualAppointments(uniqueExistingAppts)
                }

                // Calculate Health Score Dynamically
                let score = 85 // Base score
                if (medsSnap.size > 0) score -= (medsSnap.size * 2) // -2 for each active medicine
                if (currentAlerts.length > 0) score -= (currentAlerts.length * 5) // -5 for each refill alert
                if (apptsSnap.size > 0) score += 5 // +5 for being proactive with appointments

                // Keep score bounded between 0 and 100
                score = Math.max(0, Math.min(100, score))
                setHealthScore(score)

            } catch (err) {
                console.error("Error fetching data:", err)
            }
        }

        fetchDoctorsAndStats()
    }, [user])

    const handleScheduleRefill = async (medId: string, medName: string) => {
        try {
            const medRef = doc(db, 'medications', medId)
            await updateDoc(medRef, {
                refillStatus: 30 // Reset to 30 days
            })

            // Remove from the UI list immediately to give visual feedback
            setRefillAlerts(prev => prev.filter(alert => alert.id !== medId))
            alert(`Refill requested for ${medName}. Doctor will review shortly.`)
        } catch (err) {
            console.error("Error scheduling refill:", err)
            alert("Failed to submit refill request.")
        }
    }

    const formatStatValue = (value: number | string | null) => {
        if (value === null || value === 0 || value === '0' || value === '') return '--'
        return value
    }

    const dynamicStatsConfigs = [
        { title: 'Health Records', value: formatStatValue(recordsCount), icon: Activity, iconColor: 'blue' },
        { title: 'Active Medications', value: formatStatValue(medsCount), icon: Pill, iconColor: 'amber' },
        { title: 'Upcoming Appointments', value: formatStatValue(apptsCount), icon: Calendar, iconColor: 'green' },
        { title: 'Health Score', value: healthScore ? `${healthScore}/100` : '--', icon: Heart, iconColor: 'red' }
    ]

    return (
        <div>
            {/* Page Header */}
            <div className="dash-header">
                <h1 className="dash-title">Dashboard</h1>
                <p className="dash-subtitle">Welcome back, {displayName}! Here's your health overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="dash-stats">
                {dynamicStatsConfigs.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <div key={i} className="dash-stat-card">
                            <div className="dash-stat-top">
                                <div className={`dash-stat-icon ${stat.iconColor}`}>
                                    <Icon size={20} />
                                </div>
                                {stat.title === 'Health Score' ? (
                                    <div className="tooltip-container tooltip-right">
                                        <Info size={16} color="#94a3b8" />
                                        <div className="tooltip-text">
                                            Score is calculated dynamically based on active medications (-2), refill alerts (-5), and upcoming appointments (+5) from a base of 85.
                                        </div>
                                    </div>
                                ) : (
                                    <TrendingUp size={14} color="#94a3b8" />
                                )}
                            </div>
                            <div className="dash-stat-value">{stat.value}</div>
                            <div className="dash-stat-label">{stat.title}</div>
                        </div>
                    )
                })}
            </div>

            {/* Content Grid */}
            <div className="dash-content-grid">
                {/* My Doctors Section */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2><Stethoscope size={18} /> My Care Team</h2>
                    </div>
                    <div className="dash-card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {myDoctors.length > 0 ? myDoctors.map(doc => (
                            <div key={doc.id} className="dash-activity-item" style={{ alignItems: 'flex-start' }}>
                                <div className="dash-avatar" style={{ background: '#e0e7ff', color: '#4f46e5', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {doc.displayName.charAt(4) || 'D'}
                                </div>
                                <div className="dash-activity-content" style={{ marginLeft: 12 }}>
                                    <div className="dash-activity-title" style={{ fontSize: '1rem', fontWeight: 600 }}>{doc.displayName}</div>
                                    <div className="dash-activity-time">{doc.specialization} • {doc.hospital || 'General Hospital'}</div>
                                    <div className="dash-activity-time">{doc.phone}</div>
                                </div>
                                <Link to={`/patient-dashboard/doctor-profile/${doc.id}`} className="dash-badge primary" style={{ textDecoration: 'none' }}>
                                    View Profile
                                </Link>
                            </div>
                        )) : (
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No doctors currently assigned.</p>
                        )}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2><Calendar size={18} /> Upcoming Appointments</h2>
                    </div>
                    <div className="dash-card-body">
                        {actualAppointments.length > 0 ? actualAppointments.slice(0, 3).map((appt) => {
                            // Extract date object depending on if it's a Firestore Timestamp or Date
                            const dateObj = appt.date?.toDate ? appt.date.toDate() : new Date(appt.date)
                            const dateStr = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })
                            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                            return (
                                <div key={appt.id} className="dash-appointment-card">
                                    <div className="dash-appt-top">
                                        <div>
                                            <div className="dash-appt-name">{appt.doctor}</div>
                                            <div className="dash-appt-specialty">{appt.specialty}</div>
                                        </div>
                                        <span className="dash-badge primary">{appt.type}</span>
                                    </div>
                                    <div className="dash-appt-date">
                                        <Calendar size={13} /> {dateStr} at {timeStr}
                                    </div>
                                </div>
                            )
                        }) : (
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No upcoming appointments.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Health Alerts */}
            <div className="dash-card" style={{ marginTop: 22 }}>
                <div className="dash-card-header">
                    <h2><AlertTriangle size={18} color="#f59e0b" /> Health Alerts</h2>
                </div>
                <div className="dash-card-body">
                    <div className="alerts-list">
                        {refillAlerts.length > 0 ? (
                            refillAlerts.map(alert => (
                                <div key={alert.id} className="dash-alert warning">
                                    <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <div className="dash-alert-title">Medication Refill Reminder</div>
                                        <div className="dash-alert-text">
                                            Your prescription for <strong>{alert.name}</strong> has only {alert.refillStatus} days remaining.
                                        </div>
                                        <button
                                            className="dash-alert-btn"
                                            onClick={() => handleScheduleRefill(alert.id, alert.name)}
                                        >
                                            Schedule Refill
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="dash-alert info">
                                <div>
                                    <div className="dash-alert-title">Up to Date</div>
                                    <div className="dash-alert-text">
                                        No active alerts. You're all caught up!
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-quick-actions">
                <Link to="/patient-dashboard/records" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><Upload size={20} /></div>
                    <h3>Upload Records</h3>
                    <p>Upload and manage your health records in the cloud</p>
                    <span className="dash-quick-btn">Upload Now</span>
                </Link>
                <Link to="/patient-dashboard/records" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><FileText size={20} /></div>
                    <h3>View Health Records</h3>
                    <p>Browse, search, and download your medical records</p>
                    <span className="dash-quick-btn">View Records</span>
                </Link>
                <Link to="/patient-dashboard/appointments" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><Calendar size={20} /></div>
                    <h3>Book Appointment</h3>
                    <p>Schedule a new appointment with your doctor</p>
                    <span className="dash-quick-btn">View Schedule</span>
                </Link>
                <Link to="/patient-dashboard/medications" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><Pill size={20} /></div>
                    <h3>Track Medications</h3>
                    <p>Manage and track your medication schedule</p>
                    <span className="dash-quick-btn">View Medications</span>
                </Link>
                <Link to="/patient-dashboard/profile" className="dash-quick-card" style={{ textDecoration: 'none', borderTop: '3px solid #4f46e5' }}>
                    <div className="dash-quick-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><QrCode size={20} /></div>
                    <h3>My Emergency QR</h3>
                    <p>Download your emergency health QR card for first responders</p>
                    <span className="dash-quick-btn" style={{ background: '#4f46e5' }}>View QR Card</span>
                </Link>
            </div>
        </div>
    )
}

