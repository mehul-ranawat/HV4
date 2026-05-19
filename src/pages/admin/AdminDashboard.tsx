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
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { firebaseConfig, db, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, Timestamp } from '../../firebase/config'
import { Users, Activity, CheckCircle, Search, Calendar, HeartPulse, Plus, Eye, X, Save, Trash2, AlertCircle, ShieldOff } from 'lucide-react'
import './AdminDashboard.css'

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'patients' | 'doctors' | 'pending'>('patients')
    const [searchTerm, setSearchTerm] = useState('')

    const [patients, setPatients] = useState<any[]>([])
    const [doctors, setDoctors] = useState<any[]>([])
    const [credentials, setCredentials] = useState<Record<string, string>>({})
    const [appointmentsCount, setAppointmentsCount] = useState(0)
    const [allAppointments, setAllAppointments] = useState<any[]>([]) // Needed for Sheets sync
    const [loading, setLoading] = useState(true)

    // Google Sheets Sync State
    const [isSyncing, setIsSyncing] = useState(false)
    const [sheetUrl] = useState(import.meta.env.VITE_GOOGLE_SHEET_URL)
    // Let me update the instruction to just ask the user to provide the docs.google.com URL since I only have the script.google.com URL right now.

    const [isViewingSheet, setIsViewingSheet] = useState(false)
    const [activeSheetGid, setActiveSheetGid] = useState('1601664757') // Default to Patients sheet

    // User Management Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [formData, setFormData] = useState({
        email: '', password: '', displayName: '', age: '', specialization: '', licenseNumber: '', registrationNumber: '', registrationState: ''
    })
    const [modalError, setModalError] = useState('')
    const [modalLoading, setModalLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch all users
                const usersSnap = await getDocs(collection(db, 'users'))
                const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))

                const pts = allUsers.filter((u: any) => u.role === 'patient')
                const docs = allUsers.filter((u: any) => u.role === 'doctor')

                // Fetch credentials
                const credsSnap = await getDocs(collection(db, 'credentials'))
                const credsMap: Record<string, string> = {}
                credsSnap.forEach(d => {
                    credsMap[d.id] = d.data().password
                })

                // Fetch appointments
                const apptsSnap = await getDocs(collection(db, 'appointments'))
                const apptsData = apptsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

                setPatients(pts)
                setDoctors(docs)
                setCredentials(credsMap)
                setAppointmentsCount(apptsSnap.size)
                setAllAppointments(apptsData)
            } catch (err) {
                console.error("Error fetching admin data:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleOpenModal = (mode: 'add' | 'edit', user: any = null) => {
        setModalMode(mode)
        setSelectedUser(user)
        setModalError('')
        if (mode === 'edit' && user) {
            setFormData({
                email: user.email || '',
                password: credentials[user.id] || '',
                displayName: user.displayName || '',
                age: user.age || '',
                specialization: user.specialization || '',
                licenseNumber: user.licenseNumber || '',
                registrationNumber: user.registrationNumber || '',
                registrationState: user.registrationState || ''
            })
        } else {
            setFormData({ email: '', password: '', displayName: '', age: '', specialization: '', licenseNumber: '', registrationNumber: '', registrationState: '' })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedUser(null)
    }

    // --- Google Sheets Sync Logic ---
    const handleSyncToSheets = async () => {
        setIsSyncing(true)
        try {
            // Hardcoded Web App URL from the user
            const WEB_APP_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL


            const payload = {
                patients: patients.map(p => ({
                    ID: p.id,
                    Name: p.displayName || '',
                    Email: p.email || '',
                    Age: p.age || '',
                    BloodGroup: p.bloodGroup || '',
                    Role: p.role || ''
                })),
                doctors: doctors.map(d => ({
                    ID: d.id,
                    Name: d.displayName || '',
                    Email: d.email || '',
                    Specialization: d.specialization || '',
                    License: d.licenseNumber || '',
                    RegistrationNumber: d.registrationNumber || '',
                    RegistrationState: d.registrationState || '',
                    Verified: d.isVerified !== false ? 'Yes' : 'Pending Verification'
                })),
                appointments: allAppointments.map(a => ({
                    ID: a.id,
                    Patient: a.patientName || '',
                    Doctor: a.doctorName || '',
                    Date: a.date || '',
                    Time: a.time || '',
                    Type: a.type || '',
                    Status: a.status || ''
                }))
            }

            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // Bypasses CORS blocks for one-way webhooks
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                }
            })

            // Because "no-cors" returns an opaque response, we assume success if no network error was thrown
            alert("Sent data to Google Sheets! Click 'View in Sheets' to see it.")
        } catch (error) {
            console.error(error)
            alert("An error occurred during sync. Check console.")
        } finally {
            setIsSyncing(false)
        }
    }


    const handleSaveUser = async () => {
        setModalError('')
        if (!formData.email || !formData.password || !formData.displayName) {
            setModalError("Email, Password, and Name are required.")
            return
        }

        setModalLoading(true)
        try {
            if (modalMode === 'add') {
                const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now())
                const secondaryAuth = getAuth(secondaryApp)
                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password)
                const newUid = userCredential.user.uid
                await secondaryAuth.signOut()

                const userData: any = {
                    email: formData.email,
                    displayName: formData.displayName,
                    role: activeTab === 'patients' ? 'patient' : 'doctor',
                    createdAt: Timestamp.now()
                }
                if (activeTab === 'patients') userData.age = formData.age
                if (activeTab === 'doctors' || activeTab === 'pending') {
                    userData.specialization = formData.specialization
                    userData.licenseNumber = formData.licenseNumber
                    userData.registrationNumber = formData.registrationNumber
                    userData.registrationState = formData.registrationState
                    userData.isVerified = true // Admin created doctors are auto-verified
                }

                await setDoc(doc(db, 'users', newUid), userData)
                await setDoc(doc(db, 'credentials', newUid), { password: formData.password })

                const newUserObj = { id: newUid, ...userData }
                if (activeTab === 'patients') setPatients([...patients, newUserObj])
                if (activeTab === 'doctors' || activeTab === 'pending') setDoctors([...doctors, newUserObj])
                setCredentials({ ...credentials, [newUid]: formData.password })

            } else if (modalMode === 'edit' && selectedUser) {
                const uid = selectedUser.id
                const userData: any = {
                    displayName: formData.displayName
                }
                if (activeTab === 'patients') userData.age = formData.age
                if (activeTab === 'doctors' || activeTab === 'pending') {
                    userData.specialization = formData.specialization
                    userData.licenseNumber = formData.licenseNumber
                    userData.registrationNumber = formData.registrationNumber
                    userData.registrationState = formData.registrationState
                }

                await updateDoc(doc(db, 'users', uid), userData)

                if (formData.password && formData.password !== credentials[uid]) {
                    await setDoc(doc(db, 'credentials', uid), { password: formData.password })
                }

                const updatedUser = { ...selectedUser, ...userData }
                if (activeTab === 'patients') {
                    setPatients(patients.map(p => p.id === uid ? updatedUser : p))
                } else {
                    setDoctors(doctors.map(d => d.id === uid ? updatedUser : d))
                }
                setCredentials({ ...credentials, [uid]: formData.password })
            }
            handleCloseModal()
        } catch (err: any) {
            console.error("Error saving user:", err)
            setModalError(err.message || "Failed to save user.")
        } finally {
            setModalLoading(false)
        }
    }

    const handleApproveDoctor = async (doctor: any) => {
        if (!window.confirm(`Approve Dr. ${doctor.displayName} for platform access?`)) return;
        try {
            await updateDoc(doc(db, 'users', doctor.id), { isVerified: true });
            setDoctors(doctors.map(d => d.id === doctor.id ? { ...d, isVerified: true } : d));
        } catch (err) {
            console.error("Failed to approve:", err);
            alert("Failed to approve the doctor.");
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return
        if (!window.confirm(`Are you sure you want to delete ${selectedUser.displayName}? This cannot be undone.`)) return

        setModalLoading(true)
        setModalError('')
        try {
            const uid = selectedUser.id
            await deleteDoc(doc(db, 'users', uid))
            if (credentials[uid]) {
                await deleteDoc(doc(db, 'credentials', uid))
            }

            if (activeTab === 'patients') {
                setPatients(patients.filter(p => p.id !== uid))
            } else {
                setDoctors(doctors.filter(d => d.id !== uid))
            }
            setCredentials(prev => {
                const copy = { ...prev }
                delete copy[uid]
                return copy
            })
            handleCloseModal()
        } catch (err: any) {
            console.error("Error deleting user:", err)
            setModalError(err.message || "Failed to delete.")
        } finally {
            setModalLoading(false)
        }
    }

    const handleRemoveVerification = async () => {
        if (!selectedUser) return
        if (!window.confirm(`Are you sure you want to remove OTP verification for ${selectedUser.displayName}? They will need to verify via OTP again.`)) return

        setModalLoading(true)
        setModalError('')
        try {
            const uid = selectedUser.id
            await updateDoc(doc(db, 'users', uid), { 
                isVerified: false,
                otp: null
            })

            const updatedUser = { ...selectedUser, isVerified: false, otp: null }
            if (activeTab === 'patients') {
                setPatients(patients.map(p => p.id === uid ? updatedUser : p))
            } else {
                setDoctors(doctors.map(d => d.id === uid ? updatedUser : d))
            }
            handleCloseModal()
        } catch (err: any) {
            console.error("Error removing verification:", err)
            setModalError(err.message || "Failed to remove verification.")
        } finally {
            setModalLoading(false)
        }
    }

    const filteredPatients = patients.filter(p =>
        p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const baseDoctors = doctors.filter(d =>
        d.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // A doctor is considered "verified" if isVerified is true OR if the flag doesn't exist (backwards compatibility)
    const filteredDoctors = baseDoctors.filter(d => d.isVerified !== false)
    const pendingDoctors = baseDoctors.filter(d => d.isVerified === false)

    if (loading) return <div className="admin-loading">Loading administrative data...</div>

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Admin Control Panel</h1>
                    <p className="admin-subtitle">System-wide overview of users and records</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleSyncToSheets}
                        disabled={isSyncing}
                        style={{
                            padding: '10px 16px', background: '#e1d5c9', color: '#1e293b',
                            border: 'none', borderRadius: '8px', cursor: isSyncing ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500
                        }}
                    >
                        {isSyncing ? 'Syncing...' : 'Sync to Google Sheets'}
                    </button>
                    {sheetUrl && (
                        <button
                            onClick={() => setIsViewingSheet(true)}
                            style={{
                                padding: '10px 16px', background: '#3b82f6', color: 'white',
                                borderRadius: '8px', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500
                            }}
                        >
                            <Eye size={18} /> View in Sheets
                        </button>
                    )}
                </div>
            </div>

            {/* Google Sheets Iframe Modal */}
            {isViewingSheet && (
                <div className="admin-modal-overlay" onClick={() => setIsViewingSheet(false)}>
                    <div className="admin-modal" style={{ width: '90%', height: '90vh', maxWidth: '1400px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>HealthVault Database (Google Sheets)</h2>
                            <button className="admin-modal-close" onClick={() => setIsViewingSheet(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '0 20px', display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={() => setActiveSheetGid('0')} // We need the real GID for Patients
                                style={{
                                    padding: '8px 16px', background: activeSheetGid === '0' ? '#3b82f6' : '#e2e8f0',
                                    color: activeSheetGid === '0' ? 'white' : '#475569',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '14px'
                                }}
                            >
                                Patients
                            </button>
                            <button
                                onClick={() => setActiveSheetGid('1236258077')} // Need real GID
                                style={{
                                    padding: '8px 16px', background: activeSheetGid === '1236258077' ? '#3b82f6' : '#e2e8f0',
                                    color: activeSheetGid === '1236258077' ? 'white' : '#475569',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '14px'
                                }}
                            >
                                Doctors
                            </button>
                            <button
                                onClick={() => setActiveSheetGid('557451661')} // Need real GID
                                style={{
                                    padding: '8px 16px', background: activeSheetGid === '557451661' ? '#3b82f6' : '#e2e8f0',
                                    color: activeSheetGid === '557451661' ? 'white' : '#475569',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '14px'
                                }}
                            >
                                Appointments
                            </button>
                        </div>
                        <div style={{ flex: 1, padding: '20px' }}>
                            <iframe
                                src={`${sheetUrl}${activeSheetGid}`}
                                width="100%"
                                height="100%"
                                style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                title="Google Sheets Preview"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon blue">
                            <Users size={22} />
                        </div>
                    </div>
                    <div className="admin-stat-value">{patients.length + doctors.length}</div>
                    <div className="admin-stat-label">Total Users</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon green">
                            <HeartPulse size={22} />
                        </div>
                    </div>
                    <div className="admin-stat-value">{patients.length}</div>
                    <div className="admin-stat-label">Patients</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon amber">
                            <Activity size={22} />
                        </div>
                    </div>
                    <div className="admin-stat-value">{doctors.length}</div>
                    <div className="admin-stat-label">Doctors</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-top">
                        <div className="admin-stat-icon purple">
                            <Calendar size={22} />
                        </div>
                    </div>
                    <div className="admin-stat-value">{appointmentsCount}</div>
                    <div className="admin-stat-label">System Appointments</div>
                </div>
            </div>

            <div className="admin-controls">
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'patients' ? 'active' : ''}`}
                        onClick={() => setActiveTab('patients')}
                    >
                        Patients List
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'doctors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('doctors')}
                    >
                        Verified Doctors
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Validations
                    </button>
                </div>

                <div className="admin-actions-right">
                    <div className="admin-search">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="admin-add-btn" onClick={() => handleOpenModal('add')}>
                        <Plus size={18} />
                        Add New {activeTab === 'patients' ? 'Patient' : 'Doctor'}
                    </button>
                </div>
            </div>

            <div className="admin-table-container">
                {activeTab === 'patients' && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Password</th>
                                <th>Doctors</th>
                                <th>Age</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.map(p => (
                                <tr key={p.id}>
                                    <td><strong>{p.displayName}</strong></td>
                                    <td>{p.email}</td>
                                    <td><code className="pwd-cell">{credentials[p.id] || 'N/A'}</code></td>
                                    <td>{p.assignedDoctors?.length || 0}</td>
                                    <td>{p.age || '--'}</td>
                                    <td><span className="status-badge"><CheckCircle size={14} /> Active</span></td>
                                    <td>
                                        <button className="action-btn view" onClick={() => handleOpenModal('edit', p)}>
                                            <Eye size={16} style={{ marginBottom: '-3px', marginRight: '4px' }} /> View/Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredPatients.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No patients found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'doctors' && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Password</th>
                                <th>Specialization</th>
                                <th>Council / Reg. No.</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDoctors.map(d => (
                                <tr key={d.id}>
                                    <td><strong>{d.displayName}</strong></td>
                                    <td>{d.email}</td>
                                    <td><code className="pwd-cell">{credentials[d.id] || 'N/A'}</code></td>
                                    <td><span className="spec-badge">{d.specialization || 'General'}</span></td>
                                    <td><div style={{ fontSize: '0.85rem' }}>{d.registrationState || 'N/A'}<br /><code className="pwd-cell">{d.registrationNumber || d.licenseNumber || 'N/A'}</code></div></td>
                                    <td><span className="status-badge"><CheckCircle size={14} /> Verified</span></td>
                                    <td>
                                        <button className="action-btn view" onClick={() => handleOpenModal('edit', d)}>
                                            <Eye size={16} style={{ marginBottom: '-3px', marginRight: '4px' }} /> View/Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDoctors.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No verified doctors found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'pending' && (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Specialization</th>
                                <th>Council / Reg. No.</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingDoctors.map(d => (
                                <tr key={d.id}>
                                    <td><strong>{d.displayName}</strong></td>
                                    <td>{d.email}</td>
                                    <td><span className="spec-badge">{d.specialization || 'General'}</span></td>
                                    <td><div style={{ fontSize: '0.85rem' }}>{d.registrationState || 'N/A'}<br /><code className="pwd-cell">{d.registrationNumber || d.licenseNumber || 'N/A'}</code></div></td>
                                    <td><span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}><Activity size={14} /> Pending</span></td>
                                    <td>
                                        <button className="action-btn" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', marginRight: '8px' }} onClick={() => handleApproveDoctor(d)}>
                                            <CheckCircle size={16} style={{ marginBottom: '-3px', marginRight: '4px' }} /> Approve
                                        </button>
                                        <button className="action-btn view" onClick={() => handleOpenModal('edit', d)}>
                                            <Eye size={16} style={{ marginBottom: '-3px', marginRight: '4px' }} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pendingDoctors.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No pending verifications.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User Management Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal() }}>
                    <div className="admin-modal">
                        <div className="admin-modal-header">
                            <h2>{modalMode === 'add' ? `Add New ${activeTab === 'patients' ? 'Patient' : 'Doctor'}` : `Edit ${selectedUser?.displayName}`}</h2>
                            <button className="admin-modal-close" onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <div className="admin-modal-body">
                            {modalError && (
                                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                    <AlertCircle size={16} /> {modalError}
                                </div>
                            )}
                            <div className="admin-form-group">
                                <label className="admin-form-label">Email Address {modalMode === 'edit' && '(Cannot be changed)'}</label>
                                <input className="admin-form-input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={modalMode === 'edit'} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Password</label>
                                <input className="admin-form-input" type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Full Name</label>
                                <input className="admin-form-input" type="text" value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                            </div>

                            {activeTab === 'patients' && (
                                <div className="admin-form-group">
                                    <label className="admin-form-label">Age</label>
                                    <input className="admin-form-input" type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                                </div>
                            )}

                            {(activeTab === 'doctors' || activeTab === 'pending') && (
                                <>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Specialization</label>
                                        <input className="admin-form-input" type="text" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Medical Council / State</label>
                                        <input className="admin-form-input" type="text" value={formData.registrationState} onChange={e => setFormData({ ...formData, registrationState: e.target.value })} placeholder="e.g. Delhi Medical Council" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label">Registration Number</label>
                                        <input className="admin-form-input" type="text" value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="e.g. MED-12345" />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="admin-modal-actions">
                            {modalMode === 'edit' && (
                                <div style={{ display: 'flex', gap: '12px', marginRight: 'auto' }}>
                                    <button className="admin-btn delete" style={{ margin: 0 }} onClick={handleDeleteUser} disabled={modalLoading}>
                                        <Trash2 size={16} /> Delete User
                                    </button>
                                    <button 
                                        className="admin-btn" 
                                        style={{ backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '6px', padding: '10px 16px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        onClick={handleRemoveVerification} 
                                        disabled={modalLoading}
                                        type="button"
                                    >
                                        <ShieldOff size={16} style={{ marginRight: '6px' }} /> Remove Verification
                                    </button>
                                </div>
                            )}
                            <button className="admin-btn cancel" onClick={handleCloseModal} disabled={modalLoading}>Cancel</button>
                            <button className="admin-btn save" onClick={handleSaveUser} disabled={modalLoading}>
                                <Save size={16} /> {modalLoading ? 'Saving...' : 'Save User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
