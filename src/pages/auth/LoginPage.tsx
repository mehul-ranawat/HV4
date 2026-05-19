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
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, db, doc, getDoc, setDoc } from '../../firebase/config'
import './Auth.css'

const GoogleIcon = () => (
    <svg className="google-icon" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

export default function LoginPage() {
    const [showPw, setShowPw] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleRoleRedirection = async (uid: string, userEmail: string | null, displayName: string | null) => {
        try {
            const userDocRef = doc(db, 'users', uid)
            const userDoc = await getDoc(userDocRef)
            
            let isVerified = true;

            if (!userDoc.exists()) {
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
                console.log(`\n\n=== [DEVELOPMENT ONLY] ===\nOTP for ${userEmail}: ${generatedOtp}\n==========================\n\n`)

                await setDoc(userDocRef, {
                    uid,
                    email: userEmail,
                    displayName: displayName || userEmail?.split('@')[0],
                    role: 'patient',
                    createdAt: new Date(),
                    isVerified: false,
                    otp: generatedOtp
                })
                isVerified = false;
            } else {
                const userData = userDoc.data();
                isVerified = userData.isVerified !== false;
            }

            if (!isVerified) {
                navigate('/verify-otp')
            } else {
                navigate('/')
            }
        } catch (err) {
            console.error("Error fetching user role:", err)
            setError("Failed to fetch user data.")
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) return

        setLoading(true)
        setError('')
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            await handleRoleRedirection(userCredential.user.uid, userCredential.user.email, userCredential.user.displayName)
        } catch (err: any) {
            console.error("Login email error:", err)
            setError(err.message || "Failed to log in with email.")
            setLoading(false)
        }
    }

    const handleGoogle = async () => {
        setLoading(true)
        setError('')
        try {
            const userCredential = await signInWithPopup(auth, googleProvider)
            await handleRoleRedirection(userCredential.user.uid, userCredential.user.email, userCredential.user.displayName)
        } catch (err: any) {
            console.error("Login Google error:", err)
            setError(err.message || "Failed to log in with Google.")
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
                    <h1>Welcome back</h1>
                    <p>Sign in to access your health dashboard</p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}>{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            className="form-input"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                className="form-input"
                                type={showPw ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
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

                    <div className="form-row">
                        <span />
                        <Link to="/forgot-password" className="form-link">Forgot password?</Link>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <button className="google-btn" onClick={handleGoogle} disabled={loading}>
                    <GoogleIcon /> Sign in with Google
                </button>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
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
