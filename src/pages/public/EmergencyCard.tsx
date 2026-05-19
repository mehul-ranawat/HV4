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

import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db, doc, getDoc, collection, query, where, getDocs } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import {
    Heart, Phone, AlertTriangle, Droplets, User, ShieldCheck,
    Pill, Stethoscope, Building2, Clock, Download, QrCode, Printer
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import html2canvas from 'html2canvas'
import './EmergencyCard.css'

interface PatientEmergencyData {
    displayName?: string
    age?: string
    gender?: string
    bloodGroup?: string
    allergies?: string
    medicalHistory?: string
    phone?: string
    emergencyContactName?: string
    emergencyContactRelation?: string
    emergencyContactPhone?: string
    insuranceProvider?: string
    insuranceId?: string
    photoUrl?: string
    updatedAt?: any
}

export default function EmergencyCard() {
    const { uid } = useParams<{ uid: string }>()
    const { user } = useAuth()
    const [patient, setPatient] = useState<PatientEmergencyData | null>(null)
    const [medications, setMedications] = useState<any[]>([])
    const [doctor, setDoctor] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchData = async () => {
            if (!uid) { setNotFound(true); setLoading(false); return }
            try {
                // Fetch patient profile
                const userDoc = await getDoc(doc(db, 'users', uid))
                if (!userDoc.exists() || userDoc.data()?.role !== 'patient') {
                    setNotFound(true); setLoading(false); return
                }
                setPatient(userDoc.data() as PatientEmergencyData)

                // Fetch active medications
                const medsQ = query(collection(db, 'medications'), where('userId', '==', uid), where('status', '==', 'Active'))
                const medsSnap = await getDocs(medsQ)
                setMedications(medsSnap.docs.map(d => d.data()))

                // Fetch assigned doctor
                const docQ = query(collection(db, 'users'), where('assignedPatients', 'array-contains', uid))
                const docSnap = await getDocs(docQ)
                if (!docSnap.empty) setDoctor({ id: docSnap.docs[0].id, ...docSnap.docs[0].data() })

            } catch (err) {
                console.error('EmergencyCard fetch error:', err)
                setNotFound(true)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [uid])

    const handleDownloadQR = () => {
        const canvas = document.querySelector<HTMLCanvasElement>('#ec-qr-large canvas')
        if (!canvas) return
        const link = document.createElement('a')
        link.download = `${patient?.displayName || 'patient'}-emergency-qr.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    const handleDownloadPhysicalCard = async () => {
        const frontElement = document.getElementById('id-card-front')
        const backElement = document.getElementById('id-card-back')

        if (!frontElement || !backElement) return

        try {
            // Generate Front
            const frontCanvas = await html2canvas(frontElement, { scale: 2, useCORS: true })
            const frontLink = document.createElement('a')
            frontLink.download = `${patient?.displayName || 'patient'}-emergency-card-front.png`
            frontLink.href = frontCanvas.toDataURL('image/png')
            frontLink.click()

            // Generate Back
            const backCanvas = await html2canvas(backElement, { scale: 2, useCORS: true })
            const backLink = document.createElement('a')
            backLink.download = `${patient?.displayName || 'patient'}-emergency-card-back.png`
            backLink.href = backCanvas.toDataURL('image/png')
            backLink.click()
        } catch (err) {
            console.error('Error generating ID card:', err)
        }
    }

    const cardUrl = `${window.location.origin}/emergency-card/${uid}`
    const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    if (loading) return (
        <div className="ec-wrapper">
            <nav className="ec-nav"><div className="container"><Link to="/" className="nav-logo"><Heart size={22} /> HealthVault</Link></div></nav>
            <div className="ec-loading"><div className="ec-spinner" /><p>Loading Emergency Card...</p></div>
        </div>
    )

    if (notFound) return (
        <div className="ec-wrapper">
            <nav className="ec-nav"><div className="container"><Link to="/" className="nav-logo"><Heart size={22} /> HealthVault</Link></div></nav>
            <div className="ec-not-found">
                <AlertTriangle size={48} color="#ef4444" />
                <h2>Card Not Found</h2>
                <p>This emergency card does not exist or the link may be invalid.</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
        </div>
    )

    if (!patient) return null

    return (
        <div className="ec-wrapper">
            {/* Nav */}
            <nav className="ec-nav">
                <div className="container">
                    <Link to="/" className="nav-logo"><Heart size={22} /> HealthVault</Link>
                    <div className="ec-nav-right">
                        <span className="ec-emergency-badge"><AlertTriangle size={14} /> Emergency Card</span>
                        <Link to="/" className="back-link">Back to Home</Link>
                    </div>
                </div>
            </nav>

            <div className="ec-page container">
                <div className="ec-page-header">
                    <div className="ec-header-icon"><AlertTriangle size={28} /></div>
                    <div>
                        <h1>Emergency Health Card</h1>
                        <p>For use by medical personnel and first responders only</p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="ec-card-outer" ref={cardRef}>
                    {/* Credit-Card Style Header */}
                    <div className="ec-card-hero">
                        <div className="ec-card-hero-bg" />
                        <div className="ec-card-hero-content">
                            <div className="ec-patient-identity">
                                <div className="ec-avatar">
                                    {patient.photoUrl
                                        ? <img src={patient.photoUrl} alt={patient.displayName} />
                                        : <User size={40} color="#fff" />}
                                </div>
                                <div>
                                    <h2 className="ec-patient-name">{patient.displayName || 'Unknown Patient'}</h2>
                                    <div className="ec-patient-meta">
                                        {patient.age && <span>{patient.age} yrs</span>}
                                        {patient.gender && <span>• {patient.gender}</span>}
                                        {patient.phone && <span>• {patient.phone}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="ec-blood-badge">
                                <Droplets size={18} />
                                <span>{patient.bloodGroup || 'N/A'}</span>
                                <small>Blood Type</small>
                            </div>
                        </div>
                        <div className="ec-card-strip">
                            <ShieldCheck size={14} /> HealthVault Verified Emergency Card
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="ec-info-grid">

                        {/* Allergies - Critical */}
                        <div className="ec-info-block critical">
                            <div className="ec-block-label"><AlertTriangle size={15} /> Allergies</div>
                            <div className="ec-block-value critical-text">
                                {patient.allergies || 'None reported'}
                            </div>
                        </div>

                        {/* Medical History */}
                        <div className="ec-info-block">
                            <div className="ec-block-label"><Stethoscope size={15} /> Conditions / Medical History</div>
                            <div className="ec-block-value">{patient.medicalHistory || 'None reported'}</div>
                        </div>

                        {/* Active Medications */}
                        <div className="ec-info-block">
                            <div className="ec-block-label"><Pill size={15} /> Active Medications</div>
                            <div className="ec-block-value">
                                {medications.length > 0
                                    ? <div className="ec-med-tags">
                                        {medications.slice(0, 6).map((m, i) => (
                                            <span key={i} className="ec-med-tag">{m.name}</span>
                                        ))}
                                        {medications.length > 6 && <span className="ec-med-tag muted">+{medications.length - 6} more</span>}
                                    </div>
                                    : 'No active medications'}
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="ec-info-block emergency-contact">
                            <div className="ec-block-label"><Phone size={15} /> Emergency Contact</div>
                            {patient.emergencyContactName ? (
                                <div>
                                    <div className="ec-contact-name">{patient.emergencyContactName}</div>
                                    <div className="ec-contact-meta">
                                        {patient.emergencyContactRelation && <span>{patient.emergencyContactRelation}</span>}
                                    </div>
                                    <div className="ec-contact-phone">{patient.emergencyContactPhone || 'No phone'}</div>
                                </div>
                            ) : <div className="ec-block-value">Not provided</div>}
                        </div>

                        {/* Doctor */}
                        <div className="ec-info-block">
                            <div className="ec-block-label"><Stethoscope size={15} /> Primary Doctor</div>
                            {doctor ? (
                                <div>
                                    <div className="ec-contact-name">{doctor.displayName}</div>
                                    <div className="ec-contact-meta">{doctor.specialization || 'General'} • {doctor.hospital || 'N/A'}</div>
                                    <div className="ec-contact-phone">{doctor.phone || 'N/A'}</div>
                                </div>
                            ) : <div className="ec-block-value">Not assigned</div>}
                        </div>

                        {/* Insurance */}
                        <div className="ec-info-block">
                            <div className="ec-block-label"><Building2 size={15} /> Insurance</div>
                            <div className="ec-block-value">
                                {patient.insuranceProvider
                                    ? <>{patient.insuranceProvider}<br /><span style={{ fontSize: '0.85rem', opacity: 0.7 }}>ID: {patient.insuranceId || 'N/A'}</span></>
                                    : 'Not provided'}
                            </div>
                        </div>

                    </div>

                    {/* Prominent QR Code Panel */}
                    <div className="ec-qr-panel">
                        <div className="ec-qr-panel-left">
                            <div className="ec-qr-large-wrap" id="ec-qr-large">
                                <QRCodeCanvas
                                    value={cardUrl}
                                    size={180}
                                    bgColor="#ffffff"
                                    fgColor="#1e3a5f"
                                    level="H"
                                />
                            </div>
                            <div className="ec-qr-label">
                                <QrCode size={14} /> Scan to open this card
                            </div>
                        </div>
                        <div className="ec-qr-panel-info">
                            <div className="ec-footer-brand"><Heart size={14} /> HealthVault Emergency Card</div>
                            <div className="ec-footer-updated"><Clock size={12} /> Generated: {now}</div>
                            <div className="ec-footer-uid">UID: {uid?.slice(0, 12)}...</div>
                            <div className="ec-qr-url">{cardUrl}</div>
                            <div className="ec-qr-actions">
                                <button className="ec-download-btn" onClick={handleDownloadQR}>
                                    <Download size={15} /> Download QR
                                </button>
                                {user && (
                                    <>
                                        <button className="ec-download-btn" onClick={handleDownloadPhysicalCard}>
                                            <Download size={15} /> Download Official ID Card
                                        </button>
                                        <button className="ec-download-btn ec-print-btn" onClick={() => window.print()}>
                                            <Printer size={18} /> Print View
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="ec-disclaimer">
                    <ShieldCheck size={16} />
                    <p>This card contains real-time health data from HealthVault. Information is provided for emergency medical purposes only and is verified by the patient.</p>
                </div>

                {/* Scan QR Section */}
                <div className="ec-scan-another">
                    <QrCode size={20} />
                    <span>Need to scan another QR code?</span>
                    <Link to="/qr-scanner" className="btn btn-outline">Open Scanner</Link>
                </div>
            </div>

            {/* ── Official Physical ID Card (Hidden from screen, used by html2canvas) ── */}
            <div className="id-card-export-wrapper">
                {/* ID FRONT */}
                <div id="id-card-front" className="id-card-cr80 id-front">
                    <div className="id-card-header">
                        <div className="id-brand">
                            <Heart size={24} fill="#ef4444" color="#ef4444" />
                            <span>HealthVault</span>
                        </div>
                        <div className="id-title">EMERGENCY MEDICAL ID</div>
                    </div>
                    
                    <div className="id-body">
                        <div className="id-photo-area">
                            <div className="id-photo">
                                {patient.photoUrl 
                                    ? <img src={patient.photoUrl} alt="" /> 
                                    : <User size={60} color="#cbd5e1" />}
                            </div>
                            <div className="id-blood-type">
                                <small>BLOOD TYPE</small>
                                <strong>{patient.bloodGroup || 'N/A'}</strong>
                            </div>
                        </div>
                        
                        <div className="id-details">
                            <div className="id-field">
                                <label>PATIENT NAME</label>
                                <div className="id-value name">{patient.displayName || 'Unknown'}</div>
                            </div>
                            <div className="id-detail-row">
                                <div className="id-field">
                                    <label>GENDER</label>
                                    <div className="id-value">{patient.gender || 'N/A'}</div>
                                </div>
                                <div className="id-field">
                                    <label>AGE</label>
                                    <div className="id-value">{patient.age || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="id-field">
                                <label>EMERGENCY CONTACT</label>
                                <div className="id-value contact">{patient.emergencyContactPhone || 'NO CONTACT'}</div>
                            </div>
                            <div className="id-field">
                                <label>ID NUMBER</label>
                                <div className="id-value uid">{uid?.slice(0, 16).toUpperCase()}</div>
                            </div>
                        </div>

                        <div className="id-qr-area">
                            <QRCodeCanvas value={cardUrl} size={90} level="H" />
                            <small>SCAN FOR FULL PROFILE</small>
                        </div>
                    </div>

                    <div className="id-footer">
                        <ShieldCheck size={12} /> VERIFIED BY HEALTHVAULT MEDICAL NETWORK
                    </div>
                </div>

                {/* ID BACK */}
                <div id="id-card-back" className="id-card-cr80 id-back">
                    <div className="id-back-grid">
                        <div className="id-back-section critical">
                            <div className="id-back-label"><AlertTriangle size={12} /> CRITICAL ALLERGIES</div>
                            <div className="id-back-content">
                                {patient.allergies || 'NONE REPORTED'}
                            </div>
                        </div>

                        <div className="id-back-section">
                            <div className="id-back-label"><Stethoscope size={12} /> MEDICAL HISTORY</div>
                            <div className="id-back-content">
                                {patient.medicalHistory || 'NONE REPORTED'}
                            </div>
                        </div>

                        <div className="id-back-section">
                            <div className="id-back-label"><Pill size={12} /> CURRENT MEDICATIONS</div>
                            <div className="id-back-content">
                                {medications.length > 0 
                                    ? medications.map(m => m.name).join(', ') 
                                    : 'NONE'}
                            </div>
                        </div>

                        <div className="id-back-row">
                            <div className="id-back-section">
                                <div className="id-back-label"><Phone size={12} /> PRIMARY DOCTOR</div>
                                <div className="id-back-content small">
                                    {doctor ? `${doctor.displayName} (${doctor.phone || 'N/A'})` : 'NOT ASSIGNED'}
                                </div>
                            </div>
                            <div className="id-back-section">
                                <div className="id-back-label"><Building2 size={12} /> INSURANCE</div>
                                <div className="id-back-content small">
                                    {patient.insuranceProvider ? `${patient.insuranceProvider} (${patient.insuranceId || 'N/A'})` : 'NOT PROVIDED'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="id-back-secondary-footer">
                        <div className="instructions">Instructions for First Responders:</div>
                        <p>1. Scan QR code on the front for full medical profile and insurance details.<br/>
                           2. Contact emergency relative listed on the front.<br/>
                           3. Card is non-transferable and issued by HealthVault.</p>
                        <div className="id-corp">healthvault.web.app</div>
                        <div className="id-secure-badge">OFFICIAL MEDICAL DOCUMENT</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
