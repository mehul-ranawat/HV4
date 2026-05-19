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
import { db, doc, getDoc, setDoc, collection, getDocs } from '../../firebase/config'
import { Settings, Database, Save, AlertTriangle, ShieldCheck, DownloadCloud, AlertCircle, FileText } from 'lucide-react'
import './AdminSettings.css'

export default function AdminSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    // System Config State
    const [config, setConfig] = useState({
        maintenanceMode: false,
        allowRegistrations: true,
        defaultHealthScore: 85,
        maxAppointmentsPerDay: 40
    })

    // Database Stats
    const [stats, setStats] = useState({
        patients: 0,
        doctors: 0,
        appointments: 0
    })

    const [dbLoading, setDbLoading] = useState(false)

    useEffect(() => {
        const fetchConfigAndStats = async () => {
            setLoading(true)
            try {
                // Fetch config
                const configDoc = await getDoc(doc(db, 'system', 'config'))
                if (configDoc.exists()) {
                    setConfig({ ...config, ...configDoc.data() })
                } else {
                    // Initialize if doesn't exist
                    await setDoc(doc(db, 'system', 'config'), config)
                }

                // Fetch stats
                const usersSnap = await getDocs(collection(db, 'users'))
                let pCount = 0, dCount = 0
                usersSnap.docs.forEach(d => {
                    const r = d.data().role
                    if (r === 'patient') pCount++
                    if (r === 'doctor') dCount++
                })

                const apptsSnap = await getDocs(collection(db, 'appointments'))

                setStats({
                    patients: pCount,
                    doctors: dCount,
                    appointments: apptsSnap.size
                })

            } catch (err) {
                console.error("Error fetching settings:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchConfigAndStats()
    }, [])

    const handleSaveConfig = async () => {
        setSaving(true)
        setMessage('')
        try {
            await setDoc(doc(db, 'system', 'config'), config)
            setMessage('✓ Configuration saved successfully.')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            console.error("Error saving config:", err)
            setMessage('⨯ Failed to save configuration.')
        } finally {
            setSaving(false)
        }
    }

    const handleSimulateBackup = () => {
        setDbLoading(true)
        setMessage('')
        setTimeout(() => {
            setDbLoading(false)
            setMessage('✓ Database backup generated successfully (Simulated).')
            setTimeout(() => setMessage(''), 3000)
        }, 1500)
    }

    const handleClearOldRecords = () => {
        if (!window.confirm("Are you sure you want to clear simulated old records?")) return
        setDbLoading(true)
        setMessage('')
        setTimeout(() => {
            setDbLoading(false)
            setMessage('✓ Old records cleared successfully (Simulated).')
            setTimeout(() => setMessage(''), 3000)
        }, 1200)
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading System Settings...</div>

    return (
        <div className="admin-settings-container">
            <div className="admin-header">
                <h1 className="admin-title">System Settings</h1>
                <p className="admin-subtitle">Manage application configuration and database operations</p>
            </div>

            {message && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    backgroundColor: message.includes('✓') ? '#dcfce7' : '#fef2f2',
                    color: message.includes('✓') ? '#16a34a' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 500
                }}>
                    {message.includes('✓') ? <CheckIcon size={18} /> : <AlertCircle size={18} />}
                    {message}
                </div>
            )}

            <div className="settings-grid">
                {/* Application Configuration Card */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-icon blue">
                            <Settings size={20} />
                        </div>
                        <h2>Application Configuration</h2>
                    </div>
                    <div className="settings-card-body">

                        <div className="settings-group row">
                            <div>
                                <label className="settings-label"><AlertTriangle size={16} color="#eab308" /> Maintenance Mode</label>
                                <div className="settings-help">Show under-maintenance page to users</div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={config.maintenanceMode} onChange={e => setConfig({ ...config, maintenanceMode: e.target.checked })} />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="settings-group row">
                            <div>
                                <label className="settings-label"><ShieldCheck size={16} color="#10b981" /> Allow Registrations</label>
                                <div className="settings-help">Let new patients register accounts</div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={config.allowRegistrations} onChange={e => setConfig({ ...config, allowRegistrations: e.target.checked })} />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

                        <div className="settings-group">
                            <label className="settings-label">Default Patient Health Score</label>
                            <input
                                className="settings-input"
                                type="number"
                                value={config.defaultHealthScore}
                                onChange={e => setConfig({ ...config, defaultHealthScore: Number(e.target.value) })}
                            />
                            <div className="settings-help">Base score before modifiers applied.</div>
                        </div>

                        <div className="settings-group">
                            <label className="settings-label">Max Appointments / Day</label>
                            <input
                                className="settings-input"
                                type="number"
                                value={config.maxAppointmentsPerDay}
                                onChange={e => setConfig({ ...config, maxAppointmentsPerDay: Number(e.target.value) })}
                            />
                            <div className="settings-help">Global limit across all clinics.</div>
                        </div>

                    </div>
                    <div className="settings-card-footer">
                        <button className="settings-btn save" onClick={handleSaveConfig} disabled={saving}>
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>

                {/* Database Management Card */}
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-icon purple">
                            <Database size={20} />
                        </div>
                        <h2>Database Management</h2>
                    </div>
                    <div className="settings-card-body">

                        <div className="settings-group">
                            <label className="settings-label" style={{ marginBottom: '8px' }}><FileText size={16} /> Current Statistics</label>
                            <div className="stats-row">
                                <span className="stat-label">Total Patients:</span>
                                <span className="stat-value">{stats.patients}</span>
                            </div>
                            <div className="stats-row">
                                <span className="stat-label">Total Doctors:</span>
                                <span className="stat-value">{stats.doctors}</span>
                            </div>
                            <div className="stats-row">
                                <span className="stat-label">Total Appointments:</span>
                                <span className="stat-value">{stats.appointments}</span>
                            </div>
                        </div>

                        <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />

                        <div className="settings-group" style={{ gap: '16px' }}>
                            <button className="settings-btn outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSimulateBackup} disabled={dbLoading}>
                                <DownloadCloud size={16} /> Generate Manual Backup
                            </button>

                            <button className="settings-btn danger" onClick={handleClearOldRecords} disabled={dbLoading}>
                                <TrashIcon size={16} /> Clear Old Appointments (&gt; 1 Year)
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

function CheckIcon({ size }: { size: number }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={size} height={size}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    )
}

function TrashIcon({ size }: { size: number }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={size} height={size}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
}
