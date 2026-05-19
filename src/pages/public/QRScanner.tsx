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
import { Link, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { Heart, Camera, Upload, QrCode, ScanLine, AlertTriangle, X, CheckCircle2, ArrowRight } from 'lucide-react'
import './QRScanner.css'

type Tab = 'camera' | 'upload'

export default function QRScanner() {
    const [activeTab, setActiveTab] = useState<Tab>('camera')
    const [scanning, setScanning] = useState(false)
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [scanError, setScanError] = useState<string | null>(null)
    const [uploadResult, setUploadResult] = useState<string | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const scannerRef = useRef<Html5Qrcode | null>(null)
    const navigate = useNavigate()

    // Extract UID from scanned URL
    const extractUid = (text: string): string | null => {
        try {
            const match = text.match(/\/emergency-card\/([a-zA-Z0-9_-]+)/)
            if (match) return match[1]
            // Also handle raw UID input
            if (/^[a-zA-Z0-9]{20,}$/.test(text.trim())) return text.trim()
        } catch { }
        return null
    }

    const handleScanSuccess = (decodedText: string) => {
        setScanResult(decodedText)
        stopCamera()
        const uid = extractUid(decodedText)
        if (uid) {
            setTimeout(() => navigate(`/emergency-card/${uid}`), 1200)
        } else {
            setScanError('QR code is not a valid HealthVault emergency card.')
        }
    }

    const startCamera = async () => {
        setScanError(null)
        setScanResult(null)
        setScanning(true)
        try {
            const scanner = new Html5Qrcode('qr-reader')
            scannerRef.current = scanner
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 260, height: 260 } },
                handleScanSuccess,
                () => { } // ignore ongoing errors
            )
        } catch (err: any) {
            setScanError('Could not access camera. Please allow camera permissions and try again.')
            setScanning(false)
        }
    }

    const stopCamera = async () => {
        try {
            if (scannerRef.current && scannerRef.current.isScanning) {
                await scannerRef.current.stop()
                scannerRef.current.clear()
                scannerRef.current = null
            }
        } catch { }
        setScanning(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadResult(null)
        setUploadError(null)
        setUploading(true)

        try {
            const scanner = new Html5Qrcode('qr-file-reader')
            const result = await scanner.scanFile(file, false)
            scanner.clear()
            setUploadResult(result)

            const uid = extractUid(result)
            if (uid) {
                setTimeout(() => navigate(`/emergency-card/${uid}`), 1200)
            } else {
                setUploadError('This QR code is not a valid HealthVault emergency card.')
            }
        } catch {
            setUploadError('No QR code found in image. Please try a clearer image.')
        } finally {
            setUploading(false)
        }
    }

    // Cleanup camera on unmount or tab switch
    useEffect(() => {
        return () => { stopCamera() }
    }, [])

    const switchTab = (tab: Tab) => {
        stopCamera()
        setScanResult(null)
        setScanError(null)
        setUploadResult(null)
        setUploadError(null)
        setActiveTab(tab)
    }

    return (
        <div className="qrs-wrapper">
            {/* Nav */}
            <nav className="qrs-nav">
                <div className="container">
                    <Link to="/" className="nav-logo"><Heart size={22} /> HealthVault</Link>
                    <Link to="/" className="back-link">Back to Home</Link>
                </div>
            </nav>

            <div className="qrs-page container">
                {/* Header */}
                <div className="qrs-header">
                    <div className="qrs-header-icon">
                        <ScanLine size={28} />
                    </div>
                    <div>
                        <h1>Emergency QR Scanner</h1>
                        <p>Scan a patient's HealthVault QR code to instantly view their emergency health information</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="qrs-tabs">
                    <button
                        className={`qrs-tab ${activeTab === 'camera' ? 'active' : ''}`}
                        onClick={() => switchTab('camera')}
                    >
                        <Camera size={16} /> Camera Scan
                    </button>
                    <button
                        className={`qrs-tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => switchTab('upload')}
                    >
                        <Upload size={16} /> Upload Image
                    </button>
                </div>

                <div className="qrs-content">
                    {/* ── CAMERA TAB ── */}
                    {activeTab === 'camera' && (
                        <div className="qrs-camera-panel">
                            {/* Scanner viewport */}
                            <div className={`qrs-camera-box ${scanning ? 'active' : ''}`}>
                                <div id="qr-reader" className="qrs-reader-el" />
                                {!scanning && !scanResult && (
                                    <div className="qrs-camera-idle">
                                        <div className="qrs-idle-icon">
                                            <QrCode size={52} />
                                        </div>
                                        <div className="qrs-scan-corners">
                                            <span /><span /><span /><span />
                                        </div>
                                        <p>Camera not started yet</p>
                                    </div>
                                )}
                                {scanning && (
                                    <div className="qrs-scan-overlay">
                                        <div className="qrs-scan-corners">
                                            <span /><span /><span /><span />
                                        </div>
                                        <div className="qrs-scan-line" />
                                    </div>
                                )}
                                {scanResult && (
                                    <div className="qrs-success-overlay">
                                        <CheckCircle2 size={48} />
                                        <p>QR Code Detected!</p>
                                        <small>Redirecting to emergency card...</small>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            {!scanning ? (
                                <button className="qrs-btn-primary" onClick={startCamera}>
                                    <Camera size={18} /> Start Camera
                                </button>
                            ) : (
                                <button className="qrs-btn-stop" onClick={stopCamera}>
                                    <X size={18} /> Stop Camera
                                </button>
                            )}

                            {scanError && (
                                <div className="qrs-error">
                                    <AlertTriangle size={16} /> {scanError}
                                </div>
                            )}

                            <div className="qrs-instructions">
                                <h4>How to scan:</h4>
                                <ol>
                                    <li>Click <strong>Start Camera</strong> and allow access</li>
                                    <li>Hold the patient's QR code in front of the camera</li>
                                    <li>Keep steady — the card opens automatically</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* ── UPLOAD TAB ── */}
                    {activeTab === 'upload' && (
                        <div className="qrs-upload-panel">
                            {/* Hidden file reader */}
                            <div id="qr-file-reader" style={{ display: 'none' }} />

                            <label className="qrs-dropzone">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                />
                                <div className="qrs-dropzone-inner">
                                    {uploading ? (
                                        <>
                                            <div className="qrs-spinner" />
                                            <p>Detecting QR code...</p>
                                        </>
                                    ) : uploadResult ? (
                                        <>
                                            <CheckCircle2 size={48} className="qrs-success-icon" />
                                            <p>QR Code Found!</p>
                                            <small>Redirecting to emergency card...</small>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={48} />
                                            <p>Click or drag an image here</p>
                                            <small>Supports PNG, JPG, WebP</small>
                                        </>
                                    )}
                                </div>
                            </label>

                            {uploadError && (
                                <div className="qrs-error">
                                    <AlertTriangle size={16} /> {uploadError}
                                </div>
                            )}

                            <div className="qrs-instructions">
                                <h4>Upload tips:</h4>
                                <ol>
                                    <li>Use a clear, well-lit photo of the QR code</li>
                                    <li>The QR can be from the patient's profile or printed card</li>
                                    <li>We'll automatically decode it and open the emergency card</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="qrs-info-grid">
                    <div className="qrs-info-card">
                        <div className="qrs-info-icon red"><AlertTriangle size={20} /></div>
                        <h3>Emergency Use</h3>
                        <p>Designed for first responders to access critical patient info instantly, even without internet data.</p>
                    </div>
                    <div className="qrs-info-card">
                        <div className="qrs-info-icon blue"><CheckCircle2 size={20} /></div>
                        <h3>Up-to-date Data</h3>
                        <p>Each scan fetches live data from HealthVault — always reflects the patient's latest information.</p>
                    </div>
                    <div className="qrs-info-card">
                        <div className="qrs-info-icon green"><QrCode size={20} /></div>
                        <h3>No Login Needed</h3>
                        <p>Emergency cards are publicly accessible. No account required to view emergency health data.</p>
                    </div>
                </div>

                <div className="qrs-cta">
                    <span>Are you a patient? Get your Emergency QR Code from your</span>
                    <Link to="/patient-dashboard/profile" className="btn btn-primary">
                        My Profile <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    )
}
