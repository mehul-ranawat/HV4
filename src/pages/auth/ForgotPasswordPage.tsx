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
import { Heart, CheckCircle2 } from 'lucide-react'
import { auth, googleProvider, signInWithPopup, sendPasswordResetEmail, db, doc, getDoc, setDoc } from '../../firebase/config'
import './Auth.css'

const GoogleIcon = () => (
    <svg className="google-icon" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'email' | 'done'>('email')
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setError('')
        setLoading(true)
        try {
            await sendPasswordResetEmail(auth, email)
            setStep('done')
        } catch (err: any) {
            console.error("Reset password error:", err)
            setError(err.message || "Failed to send reset link.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogle = async () => {
        setError('')
        setLoading(true)
        try {
            const userCredential = await signInWithPopup(auth, googleProvider)

            // Check role and create profile if needed
            const userDocRef = doc(db, 'users', userCredential.user.uid)
            const userDoc = await getDoc(userDocRef)

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
                    role: 'patient',
                    createdAt: new Date()
                })
            }

            // Navigate to landing page — navbar will reflect logged-in state
            navigate('/')
        } catch (err: any) {
            console.error("Google sign in error:", err)
            setError(err.message || "Failed to sign in with Google.")
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
                    <h1>{step === 'done' ? 'Check your email' : 'Reset your password'}</h1>
                    <p>
                        {step === 'email' && 'Enter your email to receive a password reset link.'}
                        {step === 'done' && `We sent a reset link to ${email}. Check your inbox and click the link to reset your password.`}
                    </p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}>{error}</div>}

                {step === 'done' ? (
                    <>
                        <div className="auth-success" style={{ marginBottom: 20 }}>
                            <CheckCircle2 size={18} /> Link sent successfully!
                        </div>
                        <Link to="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                            Back to Login
                        </Link>
                    </>
                ) : (
                    <>
                        <form className="auth-form" onSubmit={handleSendLink}>
                            <div className="form-group">
                                <label htmlFor="fpEmail">Email Address</label>
                                <input
                                    id="fpEmail"
                                    className="form-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="auth-submit" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="auth-divider"><span>or</span></div>

                        <button className="google-btn" onClick={handleGoogle} disabled={loading} type="button">
                            <GoogleIcon /> Sign in with Google
                        </button>
                    </>
                )}

                <div className="auth-footer">
                    Remember your password? <Link to="/login">Sign in</Link>
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
