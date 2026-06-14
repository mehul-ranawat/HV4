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

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff } from 'lucide-react'
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, db, doc, getDoc, setDoc } from '../../firebase/config'
import './Auth.css'

const GoogleIcon = () => (
    <svg className="google-icon" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

export default function RegisterPage() {
    const [showPw, setShowPw] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'patient' | 'doctor'>('patient')
    const [specialization, setSpecialization] = useState('')
    const [licenseNumber, setLicenseNumber] = useState('')
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [registrationState, setRegistrationState] = useState('')
    const [city, setCity] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRegistrationSuccess = async (uid: string, userEmail: string | null, displayName: string | null) => {
        try {
            const userDocRef = doc(db, 'users', uid)
            const userDoc = await getDoc(userDocRef)

            if (!userDoc.exists()) {
                // Generate a random 6-digit OTP
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

                // IMPORTANT: For development/testing purposes, we print the OTP to the console.
                // In production, you would use an email API to send this securely.
                console.log(`\n\n=== [DEVELOPMENT ONLY] ===\nOTP for ${userEmail}: ${generatedOtp}\n==========================\n\n`)

                const userData: any = {
                    uid,
                    email: userEmail,
                    displayName: displayName || userEmail?.split('@')[0],
                    role: role,
                    city: role === 'patient' ? city : '',
                    createdAt: new Date(),
                    isVerified: false,
                    otp: generatedOtp
                }

                if (role === 'doctor') {
                    userData.specialization = specialization
                    userData.licenseNumber = licenseNumber
                    userData.registrationNumber = registrationNumber
                    userData.registrationState = registrationState
                    userData.adminApproved = false // Requires explicit admin approval beyond OTP
                }

                await setDoc(userDocRef, userData)
            }

            // Redirect to the OTP verification page
            navigate('/verify-otp')
        } catch (err) {
            console.error("Error creating user profile:", err)
            setError("Failed to create user profile.")
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPw) {
            setError('Passwords do not match')
            return
        }

        setError('')
        setLoading(true)

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            await handleRegistrationSuccess(userCredential.user.uid, userCredential.user.email, fullName)
        } catch (err: any) {
            console.error("Register error:", err)
            setError(err.message || "Failed to register account.")
            setLoading(false)
        }
    }

    const handleGoogle = async () => {
        setError('')
        setLoading(true)
        try {
            const userCredential = await signInWithPopup(auth, googleProvider)
            await handleRegistrationSuccess(userCredential.user.uid, userCredential.user.email, userCredential.user.displayName)
        } catch (err: any) {
            console.error("Google sign up error:", err)
            setError(err.message || "Failed to sign up with Google.")
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <Heart size={22} /> HealthVault
                    </Link>
                    <h1>Create your account</h1>
                    <p>Start managing your health in minutes</p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}>{error}</div>}

                <button className="google-btn" onClick={handleGoogle} disabled={loading} type="button">
                    <GoogleIcon /> Sign up with Google
                </button>

                <div className="auth-divider"><span>or</span></div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Register as</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => setRole('patient')} style={{
                                flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                                border: role === 'patient' ? '2px solid var(--primary)' : '2px solid var(--border)',
                                backgroundColor: role === 'patient' ? 'var(--primary)' : 'transparent',
                                color: role === 'patient' ? 'white' : 'var(--text)'
                            }}>🧑 Patient</button>
                            <button type="button" onClick={() => setRole('doctor')} style={{
                                flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                                border: role === 'doctor' ? '2px solid var(--primary)' : '2px solid var(--border)',
                                backgroundColor: role === 'doctor' ? 'var(--primary)' : 'transparent',
                                color: role === 'doctor' ? 'white' : 'var(--text)'
                            }}>🩺 Doctor</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            id="fullName"
                            className="form-input"
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            className="form-input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {role === 'patient' && (
                        <div className="form-group">
                            <label htmlFor="city">City</label>
                            <input
                                id="city"
                                className="form-input"
                                type="text"
                                placeholder="Enter your city (e.g. Mumbai, Delhi)"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {role === 'doctor' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="specialization">Specialization</label>
                                <input
                                    id="specialization"
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. Cardiology, Dermatology"
                                    value={specialization}
                                    onChange={e => setSpecialization(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="licenseNumber">Medical License Number</label>
                                <input
                                    id="licenseNumber"
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. MED-123456"
                                    value={licenseNumber}
                                    onChange={e => setLicenseNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="registrationNumber">Medical Registration Number</label>
                                <input
                                    id="registrationNumber"
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. 123456"
                                    value={registrationNumber}
                                    onChange={e => setRegistrationNumber(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="registrationState">Medical Council / State</label>
                                <input
                                    id="registrationState"
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. Delhi Medical Council"
                                    value={registrationState}
                                    onChange={e => setRegistrationState(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="regPassword">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="regPassword"
                                className="form-input"
                                type={showPw ? 'text' : 'password'}
                                placeholder="Create a password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPw">Confirm Password</label>
                        <input
                            id="confirmPw"
                            className="form-input"
                            type="password"
                            placeholder="Re-enter your password"
                            value={confirmPw}
                            onChange={e => setConfirmPw(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>

                <div className="auth-legal-links">
                    <Link to="/privacy-policy">Privacy Policy</Link>
                    <span className="dot">•</span>
                    <Link to="/contact">Contact Us</Link>
                    <span className="dot">•</span>
                    <Link to="/">Home</Link>
                </div>
                
                <p className="auth-legal-notice">
                    © {new Date().getFullYear()} HealthVault. This is a secure medical records portal. 
                    Unauthorized access is strictly prohibited.
                </p>
            </div>
        </div>
    )
}
