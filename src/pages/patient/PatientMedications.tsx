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
import { db, collection, query, where, getDocs, doc, updateDoc } from '../../firebase/config'
import {
    Clock, Calendar, User, FileText, AlertTriangle, ShieldAlert,
    CheckCircle2, Plus, Download, Sunrise, Sun, Sunset, Moon, Bell, Edit
} from 'lucide-react'
import './PatientMedications.css'

interface Medication {
    id: string
    name: string
    dosage: string
    frequency: string
    timing: string
    startDate: any
    endDate?: any
    prescribingDoctor: string
    condition: string
    refillStatus: number
    status: 'Active' | 'Paused' | 'Completed'
    userId: string
}

export default function PatientMedications() {
    const { user } = useAuth()
    const [medications, setMedications] = useState<Medication[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'schedule' | 'active' | 'add' | 'history' | 'emergency'>('schedule')
    const [editingMed, setEditingMed] = useState<Medication | null>(null)

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingMed) return

        try {
            const medRef = doc(db, 'medications', editingMed.id)
            await updateDoc(medRef, {
                name: editingMed.name,
                dosage: editingMed.dosage,
                frequency: editingMed.frequency,
                timing: editingMed.timing,
                condition: editingMed.condition,
                prescribingDoctor: editingMed.prescribingDoctor,
                refillStatus: Number(editingMed.refillStatus),
            })

            setMedications(prev => prev.map(m => m.id === editingMed.id ? editingMed : m))
            setEditingMed(null)
        } catch (err) {
            console.error("Error updating medication:", err)
            alert("Failed to update medication.")
        }
    }

    useEffect(() => {
        const fetchMedications = async () => {
            if (!user) return
            try {
                const q = query(collection(db, 'medications'), where('userId', '==', user.uid))
                const snap = await getDocs(q)
                const meds = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication))
                setMedications(meds)
            } catch (err) {
                console.error("Error fetching medications:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchMedications()
    }, [user])

    const [snoozedMeds, setSnoozedMeds] = useState<Set<string>>(new Set())
    const [takenMeds, setTakenMeds] = useState<Set<string>>(new Set())

    const handleSnooze = (id: string) => {
        setSnoozedMeds(prev => new Set(prev).add(id))
    }

    const handleTake = (id: string) => {
        setTakenMeds(prev => new Set(prev).add(id))
    }

    const activeMeds = medications.filter(m => m.status === 'Active')
    const historyMeds = medications.filter(m => m.status === 'Completed' || m.status === 'Paused')

    // Fix: Ensure "Night" or "Evening" does not get swept into "Morning" just because of "twice daily"
    const morningMeds = activeMeds.filter(m => {
        const t = m.timing.toLowerCase()
        const f = m.frequency.toLowerCase()
        if (t.includes('night') || t.includes('evening')) return false
        return t.includes('morning') || f.includes('twice') || f.includes('daily')
    })

    const nightMeds = activeMeds.filter(m => {
        const t = m.timing.toLowerCase()
        const f = m.frequency.toLowerCase()
        return t.includes('night') || t.includes('evening') || f.includes('twice')
    })

    const getTimingIcon = (timing: string) => {
        const t = timing.toLowerCase()
        if (t.includes('morning')) return <Sunrise size={16} />
        if (t.includes('afternoon') || t.includes('day')) return <Sun size={16} />
        if (t.includes('evening')) return <Sunset size={16} />
        if (t.includes('night')) return <Moon size={16} />
        return <Clock size={16} />
    }

    return (
        <div className="medications-page">
            <div className="medications-header">
                <h1>Medication Management</h1>
                <p className="medications-subtitle">Track, schedule, and manage your prescriptions</p>
            </div>

            {/* Critical Safety Alerts Section (Mocked) */}
            <div className="med-alerts-container">
                <div className="med-alert critical">
                    <ShieldAlert className="med-alert-icon" size={20} />
                    <div className="med-alert-content">
                        <h4>Allergy Warning</h4>
                        <p>Patient record indicates allergy to <strong>Penicillin</strong>. Please cross-check new prescriptions.</p>
                    </div>
                </div>
                {activeMeds.length > 2 && (
                    <div className="med-alert warning">
                        <AlertTriangle className="med-alert-icon" size={20} />
                        <div className="med-alert-content">
                            <h4>Potential Interaction Alert</h4>
                            <p>Possible interaction detected between <strong>{activeMeds[0]?.name.split(' ')[0]}</strong> and <strong>{activeMeds[1]?.name.split(' ')[0]}</strong>. Consult your doctor.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="med-tabs">
                <button className={`med-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>Daily Schedule</button>
                <button className={`med-tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Medications ({activeMeds.length})</button>
                <button className={`med-tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>+ Add Medication</button>
                <button className={`med-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
                <button className={`med-tab-btn ${activeTab === 'emergency' ? 'active' : ''}`} onClick={() => setActiveTab('emergency')}>Emergency Info</button>
            </div>

            {loading ? (
                <p>Loading medications...</p>
            ) : (
                <div className="med-tab-content">
                    {/* --- TAB: ACTIVE MEDICATIONS --- */}
                    {activeTab === 'active' && (
                        <div>
                            <h2 className="med-section-title">Current Prescriptions</h2>
                            <div className="med-grid">
                                {activeMeds.map(med => (
                                    <div key={med.id} className="med-card">
                                        {editingMed?.id === med.id ? (
                                            <form onSubmit={handleSaveEdit} className="med-edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Edit Medication</h4>
                                                <input type="text" value={editingMed.name} onChange={e => setEditingMed({ ...editingMed, name: e.target.value })} placeholder="Name" required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                <input type="text" value={editingMed.dosage} onChange={e => setEditingMed({ ...editingMed, dosage: e.target.value })} placeholder="Dosage" required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                <input type="text" value={editingMed.frequency} onChange={e => setEditingMed({ ...editingMed, frequency: e.target.value })} placeholder="Frequency" required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                <input type="text" value={editingMed.timing} onChange={e => setEditingMed({ ...editingMed, timing: e.target.value })} placeholder="Timing" required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                <input type="text" value={editingMed.condition} onChange={e => setEditingMed({ ...editingMed, condition: e.target.value })} placeholder="Condition" required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                <input type="text" value={editingMed.prescribingDoctor} onChange={e => setEditingMed({ ...editingMed, prescribingDoctor: e.target.value })} placeholder="Prescribing Doctor" required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                <input type="number" value={editingMed.refillStatus} onChange={e => setEditingMed({ ...editingMed, refillStatus: parseInt(e.target.value) || 0 })} placeholder="Refills remaining" required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                                <div className="med-actions" style={{ marginTop: '8px' }}>
                                                    <button type="button" className="med-btn" onClick={() => setEditingMed(null)}>Cancel</button>
                                                    <button type="submit" className="med-btn primary">Save</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <div className="med-card-top">
                                                    <div>
                                                        <h3 className="med-name">{med.name}</h3>
                                                        <div className="med-dosage">{med.dosage} • {med.frequency}</div>
                                                    </div>
                                                    <span className={`med-status-badge ${med.status.toLowerCase()}`}>{med.status}</span>
                                                </div>

                                                <div className="med-details">
                                                    <div className="med-detail-item">
                                                        {getTimingIcon(med.timing)}
                                                        <span>Timing: <strong>{med.timing}</strong></span>
                                                    </div>
                                                    <div className="med-detail-item">
                                                        <User className="icon" size={16} />
                                                        <span>Prescribed by: {med.prescribingDoctor}</span>
                                                    </div>
                                                    <div className="med-detail-item">
                                                        <FileText className="icon" size={16} />
                                                        <span>For: {med.condition}</span>
                                                    </div>
                                                </div>

                                                <div className="med-refill">
                                                    <span>Refills: <strong className={med.refillStatus <= 5 ? 'refill-warn' : 'refill-ok'}>
                                                        {med.refillStatus} days remaining
                                                    </strong></span>
                                                </div>

                                                <div className="med-actions">
                                                    <button className="med-btn" onClick={() => setEditingMed(med)}><Edit size={14} /> Edit</button>
                                                    <button className="med-btn primary"><CheckCircle2 size={14} /> Mark Complete</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {activeMeds.length === 0 && <p>No active medications found.</p>}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: DAILY SCHEDULE --- */}
                    {activeTab === 'schedule' && (
                        <div className="schedule-container">
                            <h2 className="med-section-title">Today's Schedule</h2>

                            <div className="schedule-slot">
                                <div className="slot-header morning">
                                    <Sunrise className="icon" size={20} />
                                    <h3>Morning</h3>
                                </div>
                                <div className="slot-body">
                                    {morningMeds.map(med => {
                                        const isTaken = takenMeds.has(med.id)
                                        const isSnoozed = snoozedMeds.has(med.id)
                                        return (
                                            <div key={med.id} className="slot-item" style={{ opacity: isTaken ? 0.6 : 1 }}>
                                                <div className="slot-item-info">
                                                    <span className="slot-med-name" style={{ textDecoration: isTaken ? 'line-through' : 'none' }}>{med.name} ({med.dosage})</span>
                                                    <span className="slot-med-desc">{isSnoozed && !isTaken ? 'Snoozed for 15 mins • ' : ''}{med.timing}</span>
                                                </div>
                                                <div className="slot-actions">
                                                    {!isTaken && <button className="btn-snooze" onClick={() => handleSnooze(med.id)} disabled={isSnoozed}><Bell size={14} /> {isSnoozed ? 'Snoozed' : 'Snooze'}</button>}
                                                    <button className="btn-take" onClick={() => handleTake(med.id)} disabled={isTaken} style={{ background: isTaken ? '#cbd5e1' : undefined, color: isTaken ? '#475569' : undefined }}>
                                                        <CheckCircle2 size={14} /> {isTaken ? 'Taken' : 'Mark Taken'}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {morningMeds.length === 0 && <p className="slot-med-desc">No medications scheduled for morning.</p>}
                                </div>
                            </div>

                            <div className="schedule-slot">
                                <div className="slot-header night">
                                    <Moon className="icon" size={20} />
                                    <h3>Night</h3>
                                </div>
                                <div className="slot-body">
                                    {nightMeds.map(med => {
                                        const isTaken = takenMeds.has(med.id + '_night')
                                        const isSnoozed = snoozedMeds.has(med.id + '_night')
                                        return (
                                            <div key={med.id + '_night'} className="slot-item" style={{ opacity: isTaken ? 0.6 : 1 }}>
                                                <div className="slot-item-info">
                                                    <span className="slot-med-name" style={{ textDecoration: isTaken ? 'line-through' : 'none' }}>{med.name} ({med.dosage})</span>
                                                    <span className="slot-med-desc">{isSnoozed && !isTaken ? 'Snoozed for 15 mins • ' : ''}{med.timing}</span>
                                                </div>
                                                <div className="slot-actions">
                                                    {!isTaken && <button className="btn-snooze" onClick={() => handleSnooze(med.id + '_night')} disabled={isSnoozed}><Bell size={14} /> {isSnoozed ? 'Snoozed' : 'Snooze'}</button>}
                                                    <button className="btn-take" onClick={() => handleTake(med.id + '_night')} disabled={isTaken} style={{ background: isTaken ? '#cbd5e1' : undefined, color: isTaken ? '#475569' : undefined }}>
                                                        <CheckCircle2 size={14} /> {isTaken ? 'Taken' : 'Mark Taken'}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {nightMeds.length === 0 && <p className="slot-med-desc">No medications scheduled for night.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: ADD MEDICATION --- */}
                    {activeTab === 'add' && (
                        <div className="add-med-container">
                            <Plus size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
                            <h2>Add New Medication</h2>
                            <p>Manually enter details or scan your prescription to auto-fill.</p>
                            <button className="add-btn-large"><Plus size={18} /> Add Medication Manually</button>
                            <br /><br />
                            <p style={{ fontSize: '0.85rem' }}>* AI Scan feature coming soon.</p>
                        </div>
                    )}

                    {/* --- TAB: HISTORY --- */}
                    {activeTab === 'history' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h2 className="med-section-title" style={{ margin: 0 }}>Medication History</h2>
                                <button className="med-btn primary" style={{ width: 'auto', padding: '8px 16px' }}>
                                    <Download size={16} /> Export PDF
                                </button>
                            </div>
                            <div className="med-grid">
                                {historyMeds.map(med => (
                                    <div key={med.id} className="med-card">
                                        <div className="med-card-top">
                                            <div>
                                                <h3 className="med-name">{med.name}</h3>
                                                <div className="med-dosage">{med.dosage}</div>
                                            </div>
                                            <span className={`med-status-badge ${med.status.toLowerCase()}`}>{med.status}</span>
                                        </div>
                                        <div className="med-details">
                                            <div className="med-detail-item">
                                                <Calendar className="icon" size={16} />
                                                <span>Ended on: {med.endDate?.toDate ? med.endDate.toDate().toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {historyMeds.length === 0 && <p>No historical medications.</p>}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: EMERGENCY INFO --- */}
                    {activeTab === 'emergency' && (
                        <div className="emergency-box">
                            <h2 style={{ color: '#9f1239', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={24} /> Emergency Medical Information
                            </h2>
                            <p style={{ color: '#be123c' }}>This section is intended for first responders and emergency medical personnel.</p>

                            <h3 style={{ marginTop: 24, fontSize: '1.1rem' }}>Critical Active Medications</h3>
                            <ul className="emergency-list">
                                {activeMeds.slice(0, 3).map(med => (
                                    <li key={med.id}>
                                        <div>
                                            <strong>{med.name}</strong>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Dosage: {med.dosage}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 500 }}>{med.condition}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Dr. {med.prescribingDoctor}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <h3 style={{ marginTop: 24, fontSize: '1.1rem' }}>Known Allergies</h3>
                            <ul className="emergency-list">
                                <li>
                                    <strong style={{ color: '#ef4444' }}>Penicillin</strong>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Severe reaction (Anaphylaxis)</div>
                                </li>
                            </ul>

                            <button className="add-btn-large" style={{ background: '#ef4444' }}>
                                <Download size={18} /> Download Emergency Medical Summary
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
