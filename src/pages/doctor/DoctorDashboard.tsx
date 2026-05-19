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
import { db, collection, query, where, getDocs, doc, getDoc } from '../../firebase/config'
import { ShieldAlert } from 'lucide-react'
import {
    Users,
    Calendar,
    FileText,
    Pill,
    TrendingUp,
    AlertTriangle,
    Clock,
} from 'lucide-react'

interface DashboardStats {
    totalPatients: number | null
    todayAppointments: number | null
    pendingPrescriptions: number | null // Hardcoded for now as per remaining mock logic or implement later
    recordsUpdated: number | null // Hardcoded for now
}

interface Appointment {
    id: string
    patient: string
    time: string
    type: string
    status: string
    notes: string
    date: Date
    priority: string
}

interface ActionItem {
    id: string
    message: string
    priority: string
    time: string
}

export default function DoctorDashboard() {
    const { user } = useAuth()
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'Doctor'

    const [myPatients, setMyPatients] = useState<any[]>([])
    const [isVerified, setIsVerified] = useState<boolean | null>(null)
    const [statsData, setStatsData] = useState<DashboardStats>({
        totalPatients: null,
        todayAppointments: null,
        pendingPrescriptions: null,
        recordsUpdated: null
    })
    const [todayApptsList, setTodayApptsList] = useState<Appointment[]>([])
    const [actionItems, setActionItems] = useState<ActionItem[]>([])

    useEffect(() => {
        if (!user) return

        // Check doctor verification status
        const checkVerification = async () => {
            try {
                const userDocRef = doc(db, 'users', user.uid)
                const userDocSnap = await getDoc(userDocRef)
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data()
                    // Backwards compat: if isVerified doesn't exist, treat as verified
                    setIsVerified(data.isVerified !== false)
                } else {
                    setIsVerified(true)
                }
            } catch (err) {
                console.error("Error checking verification:", err)
                setIsVerified(true) // Don't block if check fails
            }
        }
        checkVerification()
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch Patients assigned directly
                const patientsQ = query(
                    collection(db, 'users'),
                    where('assignedDoctors', 'array-contains', user.uid)
                )
                const patientsSnap = await getDocs(patientsQ)
                const patsData: any[] = patientsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

                // 2. Fetch Appointments
                const apptsQ = query(
                    collection(db, 'appointments'),
                    where('doctorId', '==', user.uid)
                )
                const apptsSnap = await getDocs(apptsQ)
                const allAppts = apptsSnap.docs.map(document => {
                    const data = document.data()
                    return {
                        id: document.id,
                        patient: data.patientName || data.patientId,
                        time: data.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: data.type || 'Consultation',
                        status: data.status || 'pending',
                        notes: data.notes || '',
                        date: data.date.toDate(),
                        priority: data.status === 'urgent' ? 'high' : (data.status === 'pending' ? 'medium' : 'low'),
                        patientId: data.patientId
                    }
                })

                // 3. Find missing patients from appointments
                const apptPatientIds = Array.from(new Set(allAppts.map(a => a.patientId).filter(Boolean)))
                const missingPatientIds = apptPatientIds.filter(id => !patsData.some(p => p.id === id))

                if (missingPatientIds.length > 0) {
                    await Promise.all(missingPatientIds.map(async (pid) => {
                        const pDoc = await getDoc(doc(db, 'users', pid))
                        if (pDoc.exists()) {
                            patsData.push({ id: pDoc.id, ...pDoc.data() })
                        }
                    }))
                }

                setMyPatients(patsData)

                // Enhance appointments with patient display names if possible
                const enhancedAppts = allAppts.map(appt => {
                    const patInfo = patsData.find(p => p.id === appt.patientId)
                    const tempPatientName = patInfo ? patInfo.displayName : "Unknown Patient"
                    return {
                        ...appt,
                        patient: tempPatientName
                    }
                })

                const now = new Date()
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000)

                const todaysAppointments = enhancedAppts.filter(a => a.date >= todayMidnight && a.date < tomorrowMidnight)

                // Sort today's appointments by time
                todaysAppointments.sort((a, b) => a.date.getTime() - b.date.getTime())
                setTodayApptsList(todaysAppointments)

                const pendingAppts = enhancedAppts.filter(a => a.status === 'pending' && a.date >= todayMidnight)

                // Build action items from pending appointments
                const generatedActionItems = pendingAppts.slice(0, 5).map(appt => ({
                    id: appt.id,
                    message: `Pending ${appt.type} with ${appt.patient}`,
                    priority: appt.date < now ? 'high' : 'medium',
                    time: appt.date.toLocaleDateString() + ' ' + appt.time
                }))

                if (generatedActionItems.length === 0) {
                    generatedActionItems.push({
                        id: 'no-actions',
                        message: 'No pending action items at this time.',
                        priority: 'low',
                        time: 'Just now'
                    })
                }

                setActionItems(generatedActionItems)

                // 4. Fetch dynamic stats (pending prescriptions & health records)
                let pendingRxCount = 0
                let recordsCount = 0

                await Promise.all(patsData.map(async (p) => {
                    // Fetch meds
                    try {
                        const mQ = query(collection(db, 'medications'), where('userId', '==', p.id))
                        const mSnap = await getDocs(mQ)
                        mSnap.forEach(d => {
                            const m = d.data()
                            if (m.refillStatus !== undefined && m.refillStatus <= 5 && m.status === 'Active') {
                                pendingRxCount++
                            }
                        })
                    } catch (e) {
                        console.error("Error fetching meds", e)
                    }

                    // Fetch records
                    try {
                        const rQ = query(collection(db, 'healthRecords'), where('userId', '==', p.id))
                        const rSnap = await getDocs(rQ)
                        recordsCount += rSnap.size
                    } catch (e) {
                        console.error("Error fetching records", e)
                    }
                }))

                setStatsData({
                    totalPatients: patsData.length,
                    todayAppointments: todaysAppointments.length,
                    pendingPrescriptions: pendingRxCount,
                    recordsUpdated: recordsCount
                })

            } catch (err) {
                console.error("Error fetching dashboard data:", err)
            }
        }
        fetchDashboardData()
    }, [user])

    // Show pending screen for unverified doctors
    if (isVerified === null) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
    }

    if (isVerified === false) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <div style={{
                    background: 'white', borderRadius: '20px', padding: '48px 40px', maxWidth: '520px', width: '100%',
                    textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', background: '#fef3c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                    }}>
                        <ShieldAlert size={36} color="#b45309" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                        Verification Pending
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px' }}>
                        Your medical credentials are currently being reviewed by our admin team.
                        You'll gain full access to the Doctor Dashboard once your license has been verified.
                    </p>
                    <div style={{
                        background: '#f8fafc', borderRadius: '12px', padding: '16px', fontSize: '0.9rem',
                        color: '#475569', border: '1px solid #e2e8f0'
                    }}>
                        <strong>What happens next?</strong><br />
                        An administrator will verify your Medical License Number against official registries.
                        This usually takes 1-2 business days.
                    </div>
                </div>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return 'success'
            case 'pending': return 'warning'
            case 'urgent': return 'error'
            case 'stable': return 'success'
            case 'improving': return 'primary'
            case 'monitoring': return 'warning'
            default: return 'primary'
        }
    }

    const getAlertType = (priority: string) => {
        switch (priority) {
            case 'high': return 'error'
            case 'medium': return 'warning'
            case 'low': return 'info'
            default: return 'info'
        }
    }

    return (
        <div>
            {/* Page Header */}
            <div className="dash-header">
                <h1 className="dash-title">Doctor Dashboard</h1>
                <p className="dash-subtitle">Welcome back, Dr. {displayName}. Here's your practice overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="dash-stats">
                {/* Total Patients */}
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon blue">
                            <Users size={20} />
                        </div>
                        <TrendingUp size={14} color="#94a3b8" />
                    </div>
                    <div className="dash-stat-value">{statsData.totalPatients !== null ? statsData.totalPatients : '--'}</div>
                    <div className="dash-stat-label">Total Patients</div>
                </div>

                {/* Today's Appointments */}
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon amber">
                            <Calendar size={20} />
                        </div>
                    </div>
                    <div className="dash-stat-value">{statsData.todayAppointments !== null ? statsData.todayAppointments : '--'}</div>
                    <div className="dash-stat-label">Today's Appointments</div>
                </div>

                {/* Pending Prescriptions (Mocked for now) */}
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon red">
                            <Pill size={20} />
                        </div>
                    </div>
                    <div className="dash-stat-value">--</div>
                    <div className="dash-stat-label">Pending Prescriptions</div>
                </div>

                {/* Records Updated (Mocked for now) */}
                <div className="dash-stat-card">
                    <div className="dash-stat-top">
                        <div className="dash-stat-icon green">
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="dash-stat-value">--</div>
                    <div className="dash-stat-label">Records Updated</div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="dash-content-grid">
                {/* Today's Appointments */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2><Calendar size={18} /> Today's Appointments</h2>
                    </div>
                    <div className="dash-card-body">
                        {todayApptsList.length > 0 ? todayApptsList.map((appt) => (
                            <div key={appt.id} className={`dash-appointment-card ${appt.status === 'urgent' ? 'urgent-card' : ''}`}>
                                <div className="dash-appt-top">
                                    <div>
                                        <div className="dash-appt-name">{appt.patient}</div>
                                        <div className="dash-appt-specialty">{appt.type}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{appt.time}</div>
                                        <span className={`dash-badge ${getStatusBadge(appt.status)}`}>{appt.status}</span>
                                    </div>
                                </div>
                                <div className="dash-appt-notes">{appt.notes || 'No notes provided'}</div>
                            </div>
                        )) : (
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No appointments scheduled for today.</p>
                        )}
                    </div>
                </div>

                {/* Recent Patients */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2><Users size={18} /> My Patients</h2>
                    </div>
                    <div className="dash-card-body">
                        {myPatients.length > 0 ? myPatients.map((patient) => (
                            <div key={patient.id} className="dash-patient-card" style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '10px' }}>
                                <div className="dash-patient-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div className="dash-patient-name" style={{ fontWeight: 600 }}>{patient.displayName}</div>
                                        <div className="dash-patient-info" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Age: {patient.age} • Gender: {patient.gender}</div>
                                        <div className="dash-patient-info" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Blood: {patient.bloodGroup}</div>
                                    </div>
                                    <Link to={`/doctor-dashboard/patient-profile/${patient.id}`} className="dash-badge primary" style={{ textDecoration: 'none' }}>
                                        View File
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No patients currently assigned.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className="dash-card" style={{ marginTop: 22 }}>
                <div className="dash-card-header">
                    <h2><AlertTriangle size={18} color="#f59e0b" /> Action Items</h2>
                </div>
                <div className="dash-card-body">
                    {actionItems.map((alert) => (
                        <div key={alert.id} className={`dash-alert ${getAlertType(alert.priority)}`}>
                            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                                <div className="dash-alert-title">{alert.message}</div>
                                <div className="dash-alert-text">
                                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                                    {alert.time}
                                </div>
                            </div>
                            {alert.id !== 'no-actions' && (
                                <span className={`dash-badge ${getAlertType(alert.priority)}`}>{alert.priority} priority</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-quick-actions">
                <Link to="/doctor-dashboard/patients" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><Users size={20} /></div>
                    <h3>Add New Patient</h3>
                    <p>Register a new patient in the system</p>
                    <span className="dash-quick-btn">Add Patient</span>
                </Link>
                <Link to="/doctor-dashboard/appointments" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><Calendar size={20} /></div>
                    <h3>Schedule Appointment</h3>
                    <p>Book a new appointment</p>
                    <span className="dash-quick-btn">Schedule</span>
                </Link>
                <Link to="/doctor-dashboard/prescriptions" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><Pill size={20} /></div>
                    <h3>Write Prescription</h3>
                    <p>Create a new prescription</p>
                    <span className="dash-quick-btn">Prescribe</span>
                </Link>
                <Link to="/doctor-dashboard/patients" className="dash-quick-card" style={{ textDecoration: 'none' }}>
                    <div className="dash-quick-icon"><FileText size={20} /></div>
                    <h3>Update Records</h3>
                    <p>Add medical notes and records</p>
                    <span className="dash-quick-btn">Update</span>
                </Link>
            </div>
        </div>
    )
}
