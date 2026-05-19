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
import { useAuth } from '../../context/AuthContext'
import {
    db,
    collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, Timestamp,
} from '../../firebase/config'
import {
    Upload, FileText, Trash2, Download, Eye, X, Plus, Search, Filter, Loader2
} from 'lucide-react'
import './HealthRecords.css'

interface HealthRecord {
    id: string
    fileName: string
    fileType: string
    fileSize: number
    category: string
    description: string
    uploadedAt: Date
    fileData: string // base64
}

const CATEGORIES = [
    'Lab Report',
    'Prescription',
    'X-Ray / Imaging',
    'Discharge Summary',
    'Insurance',
    'Vaccination',
    'Other'
]

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

function downloadBase64(data: string, filename: string) {
    const link = document.createElement('a')
    link.href = data
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export default function HealthRecords() {
    const { user } = useAuth()
    const [records, setRecords] = useState<HealthRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [previewData, setPreviewData] = useState<{ data: string; type: string } | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('All')

    // Upload form state
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadCategory, setUploadCategory] = useState('Lab Report')
    const [uploadDescription, setUploadDescription] = useState('')
    const [uploadError, setUploadError] = useState('')

    const fetchRecords = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const q = query(
                collection(db, 'healthRecords'),
                where('userId', '==', user.uid),
                orderBy('uploadedAt', 'desc')
            )
            const snap = await getDocs(q)
            const data: HealthRecord[] = snap.docs.map(d => {
                const docData = d.data()
                return {
                    id: d.id,
                    fileName: docData.fileName,
                    fileType: docData.fileType,
                    fileSize: docData.fileSize,
                    category: docData.category,
                    description: docData.description,
                    uploadedAt: docData.uploadedAt?.toDate?.() || new Date(),
                    fileData: docData.fileData,
                }
            })
            setRecords(data)
        } catch (err) {
            console.error('Error fetching records:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => { fetchRecords() }, [fetchRecords])

    const handleUpload = async () => {
        if (!uploadFile || !user) return
        setUploadError('')
        setUploading(true)

        // 1 MB limit for Firestore document storage
        if (uploadFile.size > 1 * 1024 * 1024) {
            setUploadError('File size must be under 1 MB for cloud storage. Compress your file or upload a smaller version.')
            setUploading(false)
            return
        }

        try {
            const fileData = await fileToBase64(uploadFile)

            await addDoc(collection(db, 'healthRecords'), {
                userId: user.uid,
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
            setUploadCategory('Lab Report')
            setUploadDescription('')
            await fetchRecords()
        } catch (err: any) {
            console.error('Upload error:', err)
            setUploadError(err.message || 'Failed to upload file.')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (record: HealthRecord) => {
        if (!confirm(`Delete "${record.fileName}"? This cannot be undone.`)) return
        try {
            await deleteDoc(doc(db, 'healthRecords', record.id))
            setRecords(prev => prev.filter(r => r.id !== record.id))
        } catch (err) {
            console.error('Delete error:', err)
            alert('Failed to delete record.')
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return '🖼️'
        if (fileType === 'application/pdf') return '📄'
        if (fileType.includes('word') || fileType.includes('document')) return '📝'
        return '📎'
    }

    const filteredRecords = records.filter(r => {
        const matchesSearch = r.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterCategory === 'All' || r.category === filterCategory
        return matchesSearch && matchesFilter
    })

    return (
        <div>
            {/* Header */}
            <div className="records-header">
                <div>
                    <h1 className="dash-title">Health Records</h1>
                    <p className="dash-subtitle">Upload, view, and manage your medical records securely in the cloud.</p>
                </div>
                <button className="records-upload-btn" onClick={() => setShowUploadModal(true)}>
                    <Plus size={18} /> Upload Record
                </button>
            </div>

            {/* Search & Filter */}
            <div className="records-toolbar">
                <div className="records-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="records-filter">
                    <Filter size={16} />
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        <option value="All">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Records list */}
            {loading ? (
                <div className="records-loading">
                    <Loader2 size={28} className="spin" />
                    <p>Loading your records...</p>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="records-empty">
                    <FileText size={48} />
                    <h3>No records found</h3>
                    <p>{records.length === 0 ? 'Upload your first health record to get started.' : 'Try adjusting your search or filter.'}</p>
                    {records.length === 0 && (
                        <button className="records-upload-btn" onClick={() => setShowUploadModal(true)}>
                            <Upload size={16} /> Upload Your First Record
                        </button>
                    )}
                </div>
            ) : (
                <div className="records-grid">
                    {filteredRecords.map(record => (
                        <div key={record.id} className="record-card">
                            <div className="record-card-top">
                                <span className="record-file-icon">{getFileIcon(record.fileType)}</span>
                                <span className="record-category-badge">{record.category}</span>
                            </div>
                            <div className="record-card-body">
                                <h3 className="record-name" title={record.fileName}>{record.fileName}</h3>
                                {record.description && <p className="record-desc">{record.description}</p>}
                                <div className="record-meta">
                                    <span>{formatSize(record.fileSize)}</span>
                                    <span>•</span>
                                    <span>{formatDate(record.uploadedAt)}</span>
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
                                <button className="record-action-btn delete" title="Delete" onClick={() => handleDelete(record)}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload Health Record</h2>
                            <button className="modal-close" onClick={() => !uploading && setShowUploadModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {uploadError && (
                                <div className="upload-error">{uploadError}</div>
                            )}
                            <div className="upload-dropzone"
                                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover') }}
                                onDragLeave={e => { e.currentTarget.classList.remove('dragover') }}
                                onDrop={e => {
                                    e.preventDefault()
                                    e.currentTarget.classList.remove('dragover')
                                    if (e.dataTransfer.files[0]) setUploadFile(e.dataTransfer.files[0])
                                }}
                            >
                                {uploadFile ? (
                                    <div className="upload-file-preview">
                                        <span className="record-file-icon">{getFileIcon(uploadFile.type)}</span>
                                        <div>
                                            <strong>{uploadFile.name}</strong>
                                            <span>{formatSize(uploadFile.size)}</span>
                                        </div>
                                        <button onClick={() => setUploadFile(null)} className="remove-file-btn"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={32} />
                                        <p><strong>Drag & drop</strong> your file here, or</p>
                                        <label className="upload-browse-btn">
                                            Browse Files
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                                                onChange={e => e.target.files?.[0] && setUploadFile(e.target.files[0])}
                                                hidden
                                            />
                                        </label>
                                        <span className="upload-hint">PDF, Images, Documents up to 1 MB</span>
                                    </>
                                )}
                            </div>

                            <div className="upload-form-group">
                                <label>Category</label>
                                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="upload-form-group">
                                <label>Description (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Blood test results from Dr. Smith"
                                    value={uploadDescription}
                                    onChange={e => setUploadDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel-btn" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                                Cancel
                            </button>
                            <button className="modal-upload-btn" onClick={handleUpload} disabled={!uploadFile || uploading}>
                                {uploading ? <><Loader2 size={16} className="spin" /> Uploading...</> : <><Upload size={16} /> Upload Record</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
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
