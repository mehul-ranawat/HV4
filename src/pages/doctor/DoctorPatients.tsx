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
import { db, collection, query, where, getDocs, doc, getDoc } from '../../firebase/config'
import { Link } from 'react-router-dom'
import { Users, Search } from 'lucide-react'

export default function DoctorPatients() {
    const { user } = useAuth()
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!user) return

        const fetchPatients = async () => {
            setLoading(true)
            try {
                // 1. Fetch Patients assigned directly
                const patientsQ = query(
                    collection(db, 'users'),
                    where('assignedDoctors', 'array-contains', user.uid)
                )
                const patientsSnap = await getDocs(patientsQ)
                const patsData: any[] = patientsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

                // 2. Fetch Appointments to find missing patients
                const apptsQ = query(
                    collection(db, 'appointments'),
                    where('doctorId', '==', user.uid)
                )
                const apptsSnap = await getDocs(apptsQ)
                const allAppts = apptsSnap.docs.map(document => document.data())

                const apptPatientIds = Array.from(new Set(allAppts.map(a => a.patientId).filter(Boolean)))
                const missingPatientIds = apptPatientIds.filter(id => !patsData.some(p => p.id === id))

                if (missingPatientIds.length > 0) {
                    await Promise.all(missingPatientIds.map(async (pid) => {
                        const pDoc = await getDoc(doc(db, 'users', pid as string))
                        if (pDoc.exists()) {
                            patsData.push({ id: pDoc.id, ...pDoc.data() })
                        }
                    }))
                }

                setPatients(patsData)
            } catch (err) {
                console.error("Error fetching patients:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchPatients()
    }, [user])

    const filteredPatients = patients.filter(p =>
        (p.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div style={{ padding: '24px' }}>
            <div className="dash-header" style={{ marginBottom: '24px' }}>
                <h1 className="dash-title">My Patients</h1>
                <p className="dash-subtitle">View and manage all patients under your care.</p>
            </div>

            <div className="dash-card" style={{ marginBottom: '24px' }}>
                <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                    <Search size={20} color="#64748b" />
                    <input
                        type="text"
                        placeholder="Search patients by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent' }}
                    />
                </div>
            </div>

            <div className="dash-content-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {loading ? (
                    <p style={{ color: '#64748b', gridColumn: '1 / -1' }}>Loading patients...</p>
                ) : filteredPatients.length > 0 ? (
                    filteredPatients.map(patient => (
                        <div key={patient.id} className="dash-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600
                                }}>
                                    {(patient.displayName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>{patient.displayName || 'Unknown Patient'}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>{patient.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem', color: 'var(--text-light)', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                                <div><strong>Age:</strong> {patient.age || '--'}</div>
                                <div><strong>Gender:</strong> {patient.gender || '--'}</div>
                                <div><strong>Blood:</strong> {patient.bloodGroup || '--'}</div>
                                <div><strong>Phone:</strong> {patient.phone || '--'}</div>
                            </div>

                            <Link
                                to={`/doctor-dashboard/patient-profile/${patient.id}`}
                                className="dash-quick-btn"
                                style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
                            >
                                View Profile
                            </Link>
                        </div>
                    ))
                ) : (
                    <div className="dash-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
                        <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                        <h3 style={{ margin: '0 0 8px 0', color: '#475569' }}>No Patients Found</h3>
                        <p style={{ margin: 0, color: '#94a3b8' }}>
                            {searchTerm ? 'Try adjusting your search query.' : 'You have no patients assigned yet.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
