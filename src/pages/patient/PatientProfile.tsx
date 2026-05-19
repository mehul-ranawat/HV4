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

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from '../../firebase/config'
import { User, Activity, FileText, ArrowLeft, Upload, X, Download, Eye } from 'lucide-react'
import './HealthRecords.css'

export default function PatientProfile() {
    const { id } = useParams()
    const [patient, setPatient] = useState<any>(null)
    const [records, setRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Upload state
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadCategory, setUploadCategory] = useState('Prescription')
    const [uploadDescription, setUploadDescription] = useState('')
    const [uploadError, setUploadError] = useState('')

    const [previewData, setPreviewData] = useState<{ data: string; type: string } | null>(null)

    const navigate = useNavigate()

    const fetchPatientData = useCallback(async () => {
        if (!id) return
        setLoading(true)
        try {
            const docRef = await getDoc(doc(db, 'users', id))
            if (docRef.exists()) {
                setPatient({ id: docRef.id, ...docRef.data() })
            }
            // Fetch records
            const q = query(
                collection(db, 'healthRecords'),
                where('userId', '==', id)
            )
            const snap = await getDocs(q)
            const recs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
            // Sort manually if no index exists, though we built one
            recs.sort((a: any, b: any) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis())
            setRecords(recs)
        } catch (err) {
            console.error("Error fetching patient profile:", err)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchPatientData()
    }, [fetchPatientData])

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const handleUpload = async () => {
        if (!uploadFile || !id) return
        setUploadError('')
        setUploading(true)

        if (uploadFile.size > 1 * 1024 * 1024) {
            setUploadError('File size must be under 1 MB.')
            setUploading(false)
            return
        }

        try {
            const fileData = await fileToBase64(uploadFile)
            await addDoc(collection(db, 'healthRecords'), {
                userId: id, // Target the patient
                fileName: uploadFile.name,
                fileType: uploadFile.type,
                fileSize: uploadFile.size,
                category: uploadCategory,
                description: uploadDescription,
                uploadedAt: Timestamp.now(),
                fileData,
            })
            setShowUploadModal(false)
            setUploadFile(null)
            setUploadCategory('Prescription')
            setUploadDescription('')
            await fetchPatientData()
        } catch (err: any) {
            console.error('Upload error:', err)
            setUploadError(err.message || 'Failed to upload.')
        } finally {
            setUploading(false)
        }
    }

    const downloadBase64 = (data: string, filename: string) => {
        const link = document.createElement('a')
        link.href = data
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) return <div style={{ padding: 20 }}>Loading patient profile...</div>
    if (!patient) return <div style={{ padding: 20 }}>Patient not found</div>

    return (
        <div>
            <div className="dash-header" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <button
                    onClick={() => navigate(-1)}
                    className="dash-badge primary"
                    style={{ textDecoration: 'none', border: 'none', cursor: 'pointer', background: 'var(--primary)', color: 'white' }}
                >
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> Back
                </button>
                <div>
                    <h1 className="dash-title">Patient Profile</h1>
                </div>
            </div>

            <div className="dash-content-grid">
                <div className="dash-card">
                    <div className="dash-card-header"><h2><User size={18} /> Personal Info</h2></div>
                    <div className="dash-card-body" style={{ display: 'flex', gap: 20 }}>
                        <div style={{ background: '#fef3c7', color: '#d97706', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {patient.displayName.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: 10 }}>{patient.displayName}</h2>
                            <p><strong>Age:</strong> {patient.age} &nbsp;|&nbsp; <strong>Gender:</strong> {patient.gender} &nbsp;|&nbsp; <strong>Blood Group:</strong> {patient.bloodGroup}</p>
                            <p style={{ marginTop: 8 }}><strong>Phone:</strong> {patient.phone}</p>
                            <p style={{ marginTop: 8 }}><strong>Address:</strong> {patient.address}</p>
                        </div>
                    </div>
                </div>

                <div className="dash-card">
                    <div className="dash-card-header"><h2><Activity size={18} /> Quick Actions</h2></div>
                    <div className="dash-card-body">
                        <button className="dash-quick-btn" style={{ width: '100%', marginBottom: 10, display: 'flex', justifyContent: 'center', gap: 8 }} onClick={() => setShowUploadModal(true)}>
                            <Upload size={18} /> Upload Record for Patient
                        </button>
                    </div>
                </div>
            </div>

            <div className="dash-card" style={{ marginTop: 20 }}>
                <div className="dash-card-header">
                    <h2><FileText size={18} /> Patient's Health Records</h2>
                </div>
                <div className="dash-card-body">
                    {records.length > 0 ? (
                        <div className="records-grid">
                            {records.map(record => (
                                <div key={record.id} className="record-card">
                                    <div className="record-card-top">
                                        <span className="record-file-icon">📄</span>
                                        <span className="record-category-badge">{record.category}</span>
                                    </div>
                                    <div className="record-card-body">
                                        <h3 className="record-name" title={record.fileName}>{record.fileName}</h3>
                                        {record.description && <p className="record-desc">{record.description}</p>}
                                        <div className="record-meta">
                                            <span>{new Date(record.uploadedAt.toMillis()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="record-card-actions">
                                        {(record.fileType.startsWith('image/') || record.fileType === 'application/pdf') && (
                                            <button className="record-action-btn view" title="Preview" onClick={() => setPreviewData({ data: record.fileData, type: record.fileType })}>
                                                <Eye size={15} />
                                            </button>
                                        )}
                                        <button className="record-action-btn download" title="Download" onClick={() => downloadBase64(record.fileData, record.fileName)}>
                                            <Download size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748b' }}>No records found for this patient.</p>
                    )}
                </div>
            </div>

            {showUploadModal && (
                <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload Record for {patient.displayName}</h2>
                            <button className="modal-close" onClick={() => !uploading && setShowUploadModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {uploadError && <div className="upload-error">{uploadError}</div>}
                            <div className="upload-dropzone">
                                {uploadFile ? (
                                    <div className="upload-file-preview">
                                        <div>
                                            <strong>{uploadFile.name}</strong>
                                        </div>
                                        <button onClick={() => setUploadFile(null)} className="remove-file-btn"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={32} />
                                        <label className="upload-browse-btn">
                                            Browse Files
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt" onChange={e => setUploadFile(e.target.files?.[0] || null)} hidden />
                                        </label>
                                        <span className="upload-hint">Up to 1 MB</span>
                                    </>
                                )}
                            </div>

                            <div className="upload-form-group">
                                <label>Category</label>
                                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                                    <option value="Prescription">Prescription</option>
                                    <option value="Lab Report">Lab Report</option>
                                    <option value="Discharge Summary">Discharge Summary</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="upload-form-group">
                                <label>Description (optional)</label>
                                <input type="text" placeholder="Notes for patient" value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel-btn" onClick={() => setShowUploadModal(false)} disabled={uploading}>Cancel</button>
                            <button className="modal-upload-btn" onClick={handleUpload} disabled={!uploadFile || uploading}>
                                {uploading ? 'Uploading...' : 'Upload Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewData && (
                <div className="modal-overlay" onClick={() => setPreviewData(null)}>
                    <div className="preview-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close preview-close" onClick={() => setPreviewData(null)}>
                            <X size={22} />
                        </button>
                        {previewData.type === 'application/pdf' ? (
                            <iframe src={previewData.data} title="Preview" className="preview-iframe" />
                        ) : (
                            <img src={previewData.data} alt="Record preview" className="preview-image" />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
