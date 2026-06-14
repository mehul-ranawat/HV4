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
import { useAuth } from '../../context/AuthContext'
import { db, doc, getDoc, updateDoc } from '../../firebase/config'
import { User, Phone, MapPin, Mail, AlertTriangle, Edit2, Shield, Camera, Save, X, Activity, Award, QrCode, Download, ExternalLink } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { Link } from 'react-router-dom'
import './MyProfile.css'

export default function MyProfile() {
    const { user, role } = useAuth()
    const [profileData, setProfileData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Edit states
    const [isEditingPersonal, setIsEditingPersonal] = useState(false)
    const [isEditingMedical, setIsEditingMedical] = useState(false)
    const [isEditingEmergency, setIsEditingEmergency] = useState(false)
    const [isEditingProfessional, setIsEditingProfessional] = useState(false)

    // Form data copies
    const [formData, setFormData] = useState<any>({})
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return
            try {
                const docRef = await getDoc(doc(db, 'users', user.uid))
                if (docRef.exists()) {
                    setProfileData(docRef.data())
                    setFormData(docRef.data())
                }
            } catch (err) {
                console.error("Error fetching profile:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [user])

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    const saveSection = async (section: 'personal' | 'medical' | 'emergency' | 'professional') => {
        if (!user) return
        try {
            const userRef = doc(db, 'users', user.uid)
            let updatePayload = {}

            if (section === 'personal') {
                updatePayload = {
                    displayName: formData.displayName || '',
                    age: formData.age !== undefined && formData.age !== '' ? parseInt(formData.age, 10) : '',
                    gender: formData.gender || '',
                    phone: formData.phone || '',
                    city: formData.city || '',
                    address: formData.address || '',
                    insuranceProvider: formData.insuranceProvider || '',
                    insuranceId: formData.insuranceId || '',
                }
            } else if (section === 'medical') {
                updatePayload = {
                    allergies: formData.allergies || '',
                    medicalHistory: formData.medicalHistory || '',
                    bloodGroup: formData.bloodGroup || '',
                }
            } else if (section === 'emergency') {
                updatePayload = {
                    emergencyContactName: formData.emergencyContactName || '',
                    emergencyContactRelation: formData.emergencyContactRelation || '',
                    emergencyContactPhone: formData.emergencyContactPhone || '',
                }
            } else if (section === 'professional') {
                updatePayload = {
                    specialization: formData.specialization || '',
                    qualification: formData.qualification || '',
                    experience: formData.experience || '',
                    hospital: formData.hospital || '',
                    registrationNumber: formData.registrationNumber || '',
                    registrationState: formData.registrationState || '',
                }
            }

            await updateDoc(userRef, updatePayload)
            setProfileData((prev: any) => ({ ...prev, ...updatePayload }))

            if (section === 'personal') setIsEditingPersonal(false)
            if (section === 'medical') setIsEditingMedical(false)
            if (section === 'emergency') setIsEditingEmergency(false)
            if (section === 'professional') setIsEditingProfessional(false)

        } catch (err) {
            console.error("Error saving profile:", err)
            alert("Failed to save changes.")
        }
    }

    const cancelEdit = (section: 'personal' | 'medical' | 'emergency' | 'professional') => {
        setFormData(profileData) // Reset to original
        if (section === 'personal') setIsEditingPersonal(false)
        if (section === 'medical') setIsEditingMedical(false)
        if (section === 'emergency') setIsEditingEmergency(false)
        if (section === 'professional') setIsEditingProfessional(false)
    }

    const compressImageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const size = 150
                    canvas.width = size
                    canvas.height = size
                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                        resolve(event.target?.result as string)
                        return
                    }
                    const minDim = Math.min(img.width, img.height)
                    const sx = (img.width - minDim) / 2
                    const sy = (img.height - minDim) / 2
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                    resolve(dataUrl)
                }
                img.onerror = (err) => reject(err)
            }
            reader.onerror = (err) => reject(err)
        })
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.')
            return
        }

        setUploadingPhoto(true)
        try {
            const photoUrl = await compressImageToBase64(file)
            const userRef = doc(db, 'users', user.uid)
            await updateDoc(userRef, { photoUrl })
            setProfileData((prev: any) => ({ ...prev, photoUrl }))
        } catch (err) {
            console.error("Error uploading photo:", err)
            alert('Failed to upload photo.')
        } finally {
            setUploadingPhoto(false)
        }
    }

    if (loading) return <div style={{ padding: 24 }}>Loading profile...</div>
    if (!profileData) return <div style={{ padding: 24 }}>Profile not found.</div>

    return (
        <div className="my-profile-page">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p className="profile-subtitle">Manage your personal and medical information</p>
            </div>

            <div className="profile-grid">
                {/* Left Column: Identity & Personal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Identity Card */}
                    <div className="profile-card">
                        <div className="profile-card-body identity-section">
                            <div className="profile-photo-container" onClick={() => fileInputRef.current?.click()}>
                                {uploadingPhoto ? (
                                    <div style={{ color: '#64748b' }}>Uploading...</div>
                                ) : profileData.photoUrl ? (
                                    <img src={profileData.photoUrl} alt="Profile" />
                                ) : (
                                    <User size={64} color="#94a3b8" />
                                )}
                                <div className="photo-upload-overlay">
                                    <Camera size={14} /> Change
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="photo-upload-input"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            </div>
                            <h2 className="identity-name">{profileData.displayName}</h2>
                            <div className="identity-basic">
                                {profileData.age ? `${profileData.age} years old` : 'Age not set'} • {profileData.gender || 'Gender not set'}
                            </div>
                            {profileData.bloodGroup && (
                                <div className="blood-group-badge" title="Blood Group">
                                    {profileData.bloodGroup}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Personal Details Card */}
                    <div className="profile-card">
                        <div className="profile-card-header">
                            <h2><User size={18} /> Personal Details</h2>
                            {!isEditingPersonal && (
                                <button className="edit-btn" onClick={() => setIsEditingPersonal(true)}>
                                    <Edit2 size={14} /> Edit
                                </button>
                            )}
                        </div>
                        <div className="profile-card-body">
                            {isEditingPersonal ? (
                                <div>
                                    <div className="profile-form-group">
                                        <label>Full Name</label>
                                        <input type="text" value={formData.displayName || ''} onChange={e => handleInputChange('displayName', e.target.value)} />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Age</label>
                                        <input type="number" min="0" max="120" value={formData.age || ''} onChange={e => handleInputChange('age', e.target.value)} />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Gender</label>
                                        <select
                                            value={formData.gender || ''}
                                            onChange={e => handleInputChange('gender', e.target.value)}
                                            style={{ padding: '8px 12px', borderColor: '#cbd5e1', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
                                        >
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Phone Number</label>
                                        <input type="text" value={formData.phone || ''} onChange={e => handleInputChange('phone', e.target.value)} />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>City</label>
                                        <input type="text" value={formData.city || ''} onChange={e => handleInputChange('city', e.target.value)} placeholder="e.g. Mumbai" />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Address</label>
                                        <textarea value={formData.address || ''} onChange={e => handleInputChange('address', e.target.value)} />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Insurance Provider</label>
                                        <input type="text" value={formData.insuranceProvider || ''} onChange={e => handleInputChange('insuranceProvider', e.target.value)} placeholder="e.g., BlueCross" />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Insurance ID / Policy Number</label>
                                        <input type="text" value={formData.insuranceId || ''} onChange={e => handleInputChange('insuranceId', e.target.value)} />
                                    </div>
                                    <div className="form-actions">
                                        <button className="btn-cancel" onClick={() => cancelEdit('personal')}><X size={14} /> Cancel</button>
                                        <button className="btn-save" onClick={() => saveSection('personal')}><Save size={14} /> Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="detail-list">
                                    <div className="detail-item">
                                        <span className="detail-label"><Mail size={12} style={{ marginRight: 4, display: 'inline-block' }} /> Email</span>
                                        <span className="detail-value">{user?.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label"><Phone size={12} style={{ marginRight: 4, display: 'inline-block' }} /> Phone</span>
                                        <span className="detail-value">{profileData.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label"><MapPin size={12} style={{ marginRight: 4, display: 'inline-block' }} /> City</span>
                                        <span className="detail-value">{profileData.city || 'Not provided'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label"><MapPin size={12} style={{ marginRight: 4, display: 'inline-block' }} /> Address</span>
                                        <span className="detail-value">{profileData.address || 'Not provided'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label"><Shield size={12} style={{ marginRight: 4, display: 'inline-block' }} /> Insurance</span>
                                        <span className="detail-value">
                                            {profileData.insuranceProvider ? `${profileData.insuranceProvider} (ID: ${profileData.insuranceId || 'N/A'})` : 'Not provided'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Medical & Emergency & Professional */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {role === 'doctor' && (
                        <div className="profile-card">
                            <div className="profile-card-header">
                                <h2><Award size={18} /> Professional Details</h2>
                                {!isEditingProfessional && (
                                    <button className="edit-btn" onClick={() => setIsEditingProfessional(true)}>
                                        <Edit2 size={14} /> Edit
                                    </button>
                                )}
                            </div>
                            <div className="profile-card-body">
                                {isEditingProfessional ? (
                                    <div>
                                        <div className="profile-form-group">
                                            <label>Specialization</label>
                                            <input type="text" placeholder="e.g., Cardiologist" value={formData.specialization || ''} onChange={e => handleInputChange('specialization', e.target.value)} />
                                        </div>
                                        <div className="profile-form-group">
                                            <label>Qualifications</label>
                                            <input type="text" placeholder="e.g., MD, FACC" value={formData.qualification || ''} onChange={e => handleInputChange('qualification', e.target.value)} />
                                        </div>
                                        <div className="profile-form-group">
                                            <label>Experience</label>
                                            <input type="text" placeholder="e.g., 10+ Years" value={formData.experience || ''} onChange={e => handleInputChange('experience', e.target.value)} />
                                        </div>
                                        <div className="profile-form-group">
                                            <label>Hospital Affiliation</label>
                                            <input type="text" placeholder="e.g., General Hospital" value={formData.hospital || ''} onChange={e => handleInputChange('hospital', e.target.value)} />
                                        </div>
                                        <div className="profile-form-group">
                                            <label>Registration Number</label>
                                            <input type="text" placeholder="e.g., MED-123456" value={formData.registrationNumber || ''} onChange={e => handleInputChange('registrationNumber', e.target.value)} />
                                        </div>
                                        <div className="profile-form-group">
                                            <label>Registration State / Council</label>
                                            <input type="text" placeholder="e.g., Delhi Medical Council" value={formData.registrationState || ''} onChange={e => handleInputChange('registrationState', e.target.value)} />
                                        </div>
                                        <div className="form-actions">
                                            <button className="btn-cancel" onClick={() => cancelEdit('professional')}><X size={14} /> Cancel</button>
                                            <button className="btn-save" onClick={() => saveSection('professional')}><Save size={14} /> Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="detail-list">
                                        <div className="detail-item">
                                            <span className="detail-label">Specialization</span>
                                            <span className="detail-value">{profileData.specialization || 'Not specified'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Qualifications</span>
                                            <span className="detail-value">{profileData.qualification || 'Not specified'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Experience</span>
                                            <span className="detail-value">{profileData.experience || 'Not specified'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Hospital Affiliation</span>
                                            <span className="detail-value">{profileData.hospital || 'Not specified'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Registration Number</span>
                                            <span className="detail-value">{profileData.registrationNumber || 'Not specified'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Medical Council / State</span>
                                            <span className="detail-value">{profileData.registrationState || 'Not specified'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {role !== 'doctor' && (
                        <>
                            {/* Medical Details Card */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2><Activity size={18} /> Medical Details</h2>
                                    {!isEditingMedical && (
                                        <button className="edit-btn" onClick={() => setIsEditingMedical(true)}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                    )}
                                </div>
                                <div className="profile-card-body">
                                    {isEditingMedical ? (
                                        <div>
                                            <div className="profile-form-group">
                                                <label>Blood Group</label>
                                                <select
                                                    value={formData.bloodGroup || ''}
                                                    onChange={e => handleInputChange('bloodGroup', e.target.value)}
                                                    style={{ padding: '8px 12px', borderColor: '#cbd5e1', borderRadius: '6px' }}
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="A+">A+</option><option value="A-">A-</option>
                                                    <option value="B+">B+</option><option value="B-">B-</option>
                                                    <option value="O+">O+</option><option value="O-">O-</option>
                                                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                                </select>
                                            </div>
                                            <div className="profile-form-group">
                                                <label>Allergies</label>
                                                <textarea
                                                    placeholder="e.g., Penicillin, Peanuts, Latex"
                                                    value={formData.allergies || ''}
                                                    onChange={e => handleInputChange('allergies', e.target.value)}
                                                />
                                            </div>
                                            <div className="profile-form-group">
                                                <label>Chronic Conditions / Medical History</label>
                                                <textarea
                                                    placeholder="e.g., Hypertension, Type 2 Diabetes, Asthma"
                                                    value={formData.medicalHistory || ''}
                                                    onChange={e => handleInputChange('medicalHistory', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-actions">
                                                <button className="btn-cancel" onClick={() => cancelEdit('medical')}><X size={14} /> Cancel</button>
                                                <button className="btn-save" onClick={() => saveSection('medical')}><Save size={14} /> Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="detail-list">
                                            <div className="detail-item">
                                                <span className="detail-label">Allergies</span>
                                                <span className="detail-value">
                                                    {profileData.allergies ? (
                                                        <span style={{ color: '#b91c1c', fontWeight: 500 }}>{profileData.allergies}</span>
                                                    ) : (
                                                        'None reported'
                                                    )}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Medical History / Conditions</span>
                                                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                                                    {profileData.medicalHistory || 'None reported'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Emergency Contacts Card */}
                            <div className="profile-card emergency">
                                <div className="profile-card-header">
                                    <h2><AlertTriangle size={18} /> Emergency Contact</h2>
                                    {!isEditingEmergency && (
                                        <button className="edit-btn" onClick={() => setIsEditingEmergency(true)} style={{ color: '#b91c1c' }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                    )}
                                </div>
                                <div className="profile-card-body">
                                    {isEditingEmergency ? (
                                        <div>
                                            <div className="profile-form-group">
                                                <label>Primary Contact Name</label>
                                                <input type="text" value={formData.emergencyContactName || ''} onChange={e => handleInputChange('emergencyContactName', e.target.value)} />
                                            </div>
                                            <div className="profile-form-group">
                                                <label>Relationship to Patient</label>
                                                <input type="text" placeholder="e.g., Spouse, Parent, Child" value={formData.emergencyContactRelation || ''} onChange={e => handleInputChange('emergencyContactRelation', e.target.value)} />
                                            </div>
                                            <div className="profile-form-group">
                                                <label>Contact Phone Number</label>
                                                <input type="text" value={formData.emergencyContactPhone || ''} onChange={e => handleInputChange('emergencyContactPhone', e.target.value)} />
                                            </div>
                                            <div className="form-actions">
                                                <button className="btn-cancel" onClick={() => cancelEdit('emergency')}><X size={14} /> Cancel</button>
                                                <button className="btn-save" onClick={() => saveSection('emergency')} style={{ background: '#dc2626' }}><Save size={14} /> Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="detail-list">
                                            {profileData.emergencyContactName ? (
                                                <>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Name</span>
                                                        <span className="detail-value font-medium">{profileData.emergencyContactName}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Relationship</span>
                                                        <span className="detail-value">{profileData.emergencyContactRelation || 'Not specified'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Phone Number</span>
                                                        <span className="detail-value font-medium" style={{ fontSize: '1.2rem', color: '#b91c1c' }}>
                                                            {profileData.emergencyContactPhone || 'Not provided'}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <p style={{ color: '#64748b', margin: 0 }}>No emergency contact configured. Please add one.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Emergency QR Card Section */}
                            <div className="profile-card" style={{ borderTop: '3px solid #4f46e5', overflow: 'hidden' }}>
                                <div className="profile-card-header" style={{ background: 'linear-gradient(135deg, #1e3a5f, #4f46e5)', borderRadius: 0, margin: '-1px -1px 0', padding: '16px 20px' }}>
                                    <h2 style={{ color: 'white' }}><QrCode size={18} /> Emergency QR Card</h2>
                                </div>
                                <div className="profile-card-body">
                                    <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 20, lineHeight: 1.6 }}>
                                        Your personal emergency QR code. First responders can scan this to instantly access your critical health information — no login required.
                                    </p>

                                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                        {/* QR Code */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ padding: 12, background: 'white', borderRadius: 12, border: '2px solid #1e3a5f', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                <QRCodeCanvas
                                                    value={`${window.location.origin}/emergency-card/${user?.uid}`}
                                                    size={140}
                                                    bgColor="#ffffff"
                                                    fgColor="#1e3a5f"
                                                    id="profile-qr-canvas"
                                                />
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#94a3b8' }}>Scan with any camera</div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 160 }}>
                                            <button
                                                className="btn-save"
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '10px 16px' }}
                                                onClick={() => {
                                                    const canvas = document.querySelector<HTMLCanvasElement>('#profile-qr-canvas')
                                                    if (!canvas) return
                                                    const link = document.createElement('a')
                                                    link.download = `${profileData.displayName || 'patient'}-emergency-qr.png`
                                                    link.href = canvas.toDataURL('image/png')
                                                    link.click()
                                                }}
                                            >
                                                <Download size={15} /> Download QR Code
                                            </button>
                                            <Link
                                                to={`/emergency-card/${user?.uid}`}
                                                target="_blank"
                                                className="btn-cancel"
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', textDecoration: 'none', padding: '10px 16px' }}
                                            >
                                                <ExternalLink size={15} /> View Emergency Card
                                            </Link>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                                <strong style={{ color: '#64748b' }}>Card URL:</strong><br />
                                                <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                    {window.location.origin}/emergency-card/{user?.uid?.slice(0, 12)}...
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    )
}
