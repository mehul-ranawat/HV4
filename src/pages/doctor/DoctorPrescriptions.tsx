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
import { db, collection, query, where, getDocs, addDoc } from '../../firebase/config'
import { ClipboardList, Plus, Clock, FileText, Calendar, CheckCircle2, User, Pill, Activity, AlignLeft, CalendarDays } from 'lucide-react'
import './DoctorPrescriptions.css'

interface Patient {
    id: string
    name: string
    email: string
}

interface Prescription {
    id: string
    userId: string
    patientName: string
    name: string
    dosage: string
    frequency: string
    timing: string
    condition: string
    refillStatus: number // Days remaining/supply
    status: 'Active' | 'Paused' | 'Completed'
    prescribingDoctor: string
    startDate: Date
}

export default function DoctorPrescriptions() {
    const { user } = useAuth()
    const [patients, setPatients] = useState<Patient[]>([])
    const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const [patientSearchText, setPatientSearchText] = useState('')
    const [medName, setMedName] = useState('')
    const [dosage, setDosage] = useState('')
    const [frequency, setFrequency] = useState('Once daily')
    const [timing, setTiming] = useState<string[]>(['Morning'])
    const [condition, setCondition] = useState('')
    const [supplyDays, setSupplyDays] = useState('30')

    const doctorName = user?.displayName || 'Your Doctor'

    useEffect(() => {
        if (!user) return

        const fetchPatientsAndHistory = async () => {
            setLoading(true)
            try {
                // 1. Fetch Patients (Same logic as appointments: all users with role 'patient')
                const pQuery = query(collection(db, 'users'), where('role', '==', 'patient'))
                const pSnap = await getDocs(pQuery)
                const fetchedPatients: Patient[] = []
                pSnap.docs.forEach(d => {
                    const data = d.data()
                    fetchedPatients.push({
                        id: d.id,
                        name: data.displayName || 'Unknown Patient',
                        email: data.email || ''
                    })
                })
                setPatients(fetchedPatients)

                // 2. Fetch Recent Prescriptions written by *this* doctor
                // We'll query all medications and filter by prescribingDoctor name string
                // (In a true prod app, we'd query by doctorId for exact precision)
                const mQuery = query(collection(db, 'medications'), where('prescribingDoctor', '==', doctorName))
                const mSnap = await getDocs(mQuery)

                const history: Prescription[] = []
                mSnap.docs.forEach(doc => {
                    const data = doc.data()

                    // Match the userId to get the patient name using our fetched patients list
                    const matchedPatient = fetchedPatients.find(p => p.id === data.userId)

                    history.push({
                        id: doc.id,
                        userId: data.userId,
                        patientName: matchedPatient ? matchedPatient.name : 'Unknown Patient',
                        name: data.name,
                        dosage: data.dosage,
                        frequency: data.frequency,
                        timing: data.timing,
                        condition: data.condition,
                        refillStatus: data.refillStatus,
                        status: data.status,
                        startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(),
                        prescribingDoctor: data.prescribingDoctor
                    })
                })

                // Sort newest first
                history.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                setRecentPrescriptions(history)

            } catch (err) {
                console.error("Error fetching prescribing data:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchPatientsAndHistory()
    }, [user, doctorName])

    const handleIssuePrescription = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !selectedPatientId) {
            alert("Please select a valid patient from the dropdown list.")
            return
        }

        setSubmitting(true)
        try {
            const newPrescription = {
                userId: selectedPatientId,
                name: medName,
                dosage,
                frequency,
                timing: timing.join(', '),
                condition,
                refillStatus: parseInt(supplyDays) || 30,
                status: 'Active',
                prescribingDoctor: doctorName,
                startDate: new Date()
            }

            const docRef = await addDoc(collection(db, 'medications'), newPrescription)

            // Look up patient name to append to the local history state
            const patientName = patients.find(p => p.id === selectedPatientId)?.name || 'Unknown Patient'

            // Add the new script to the history instantly without reloading
            setRecentPrescriptions(prev => [{
                ...newPrescription,
                id: docRef.id,
                patientName: patientName
            } as Prescription, ...prev])

            // Reset form
            setSelectedPatientId('')
            setPatientSearchText('')
            setMedName('')
            setDosage('')
            setCondition('')
            setFrequency('Once daily')
            setTiming(['Morning'])
            setSupplyDays('30')

            alert("Prescription issued to patient successfully!")
        } catch (err) {
            console.error("Error issuing prescription:", err)
            alert("Failed to issue prescription.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="prescriptions-page">
            <div className="dash-header">
                <h1 className="dash-title">Write Prescription</h1>
                <p className="dash-subtitle">Issue digital prescriptions directly to your patients' MedInsight schedules.</p>
            </div>

            <div className="prescriptions-layout">
                {/* Left Side: The Form */}
                <div className="prescription-pad-container">
                    <div className="pad-header">
                        <h2><Plus size={20} color="var(--primary)" /> Prescription Pad</h2>
                    </div>

                    <form className="pad-form" id="prescription-form" onSubmit={handleIssuePrescription}>
                        <div className="form-group">
                            <label>Select Patient</label>
                            <div className="input-with-icon" style={{ position: 'relative' }}>
                                <User className="input-icon" size={18} />
                                <input
                                    type="text"
                                    list="patients-list"
                                    placeholder="Type to search patient name or email..."
                                    value={patientSearchText}
                                    onChange={(e) => {
                                        setPatientSearchText(e.target.value)
                                        const match = patients.find(p => `${p.name} (${p.email})` === e.target.value)
                                        if (match) {
                                            setSelectedPatientId(match.id)
                                        } else {
                                            setSelectedPatientId('')
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const match = patients.find(p => `${p.name} (${p.email})` === e.target.value)
                                        if (!match && e.target.value !== '') {
                                            // Invalid selection typed
                                            setSelectedPatientId('')
                                            setPatientSearchText('')
                                        }
                                    }}
                                    required
                                    disabled={loading || patients.length === 0}
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        borderColor: (patientSearchText && !selectedPatientId) ? '#ef4444' : undefined
                                    }}
                                />
                                {patientSearchText && !selectedPatientId && (
                                    <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>
                                        Please select a patient from the dropdown list.
                                    </div>
                                )}
                                <datalist id="patients-list">
                                    {patients.map(p => (
                                        <option key={p.id} value={`${p.name} (${p.email})`} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Medication Name</label>
                                <div className="input-with-icon">
                                    <Pill className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. Amoxicillin"
                                        value={medName}
                                        onChange={(e) => setMedName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Dosage</label>
                                <div className="input-with-icon">
                                    <Activity className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. 500mg"
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Frequency</label>
                                <select value={frequency} onChange={e => setFrequency(e.target.value)} required>
                                    <option value="Once daily">Once daily</option>
                                    <option value="Twice daily">Twice daily</option>
                                    <option value="Three times daily">Three times daily</option>
                                    <option value="Every 4-6 hours">Every 4-6 hours</option>
                                    <option value="As needed (PRN)">As needed (PRN)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Timing (Select all that apply)</label>
                                <div className="timing-checkbox-grid">
                                    {['Morning', 'Afternoon', 'Evening', 'Night', 'With Meals', 'Before Meals', 'Empty Stomach'].map((t) => (
                                        <label
                                            key={t}
                                            className={timing.includes(t) ? 'checked' : ''}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={timing.includes(t)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setTiming([...timing, t])
                                                    } else {
                                                        setTiming(timing.filter(item => item !== t))
                                                    }
                                                }}
                                            />
                                            {t}
                                        </label>
                                    ))}
                                </div>
                                {timing.length === 0 && (
                                    <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>
                                        Please select at least one timing.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Condition / Indication</label>
                                <div className="input-with-icon">
                                    <AlignLeft className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. Bacterial Infection"
                                        value={condition}
                                        onChange={(e) => setCondition(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Supply (Days)</label>
                                <div className="input-with-icon">
                                    <CalendarDays className="input-icon" size={18} />
                                    <input
                                        type="number"
                                        placeholder="30"
                                        min="1"
                                        max="365"
                                        value={supplyDays}
                                        onChange={(e) => setSupplyDays(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                    </form>

                    <div className="pad-footer">
                        <button
                            type="submit"
                            form="prescription-form"
                            className="btn-issue"
                            disabled={submitting || !selectedPatientId}
                        >
                            {submitting ? 'Issuing...' : (
                                <>
                                    <CheckCircle2 size={18} /> Send to Patient
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Side: History */}
                <div className="history-container">
                    <div className="history-header">
                        <h2><ClipboardList size={20} color="#64748b" /> Recent Scripts</h2>
                    </div>
                    {loading ? (
                        <div className="history-empty pulse-icon">Loading history...</div>
                    ) : recentPrescriptions.length > 0 ? (
                        <ul className="history-list">
                            {recentPrescriptions.map(med => (
                                <li key={med.id} className="history-item">
                                    <div className="history-item-top">
                                        <div>
                                            <div className="history-patient">To: {med.patientName}</div>
                                            <h3 className="history-med-name">{med.name} - {med.dosage}</h3>
                                        </div>
                                        <div className="history-date">
                                            {med.startDate.toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="history-details">
                                        <div className="history-detail-row">
                                            <Clock size={14} /> {med.frequency} ({med.timing})
                                        </div>
                                        <div className="history-detail-row">
                                            <FileText size={14} /> {med.condition}
                                        </div>
                                        <div className="history-detail-row">
                                            <Calendar size={14} /> {med.refillStatus} Days Supply
                                        </div>
                                        <div className="history-detail-row" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                            • Status: {med.status}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="history-empty">
                            No prescriptions issued yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
