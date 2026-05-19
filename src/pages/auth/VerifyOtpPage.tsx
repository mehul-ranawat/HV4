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
import { useNavigate } from 'react-router-dom'
import { auth, db, doc, getDoc, updateDoc } from '../../firebase/config'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

export default function VerifyOtpPage() {
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)
    const { user, isVerified, role } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [resendTimer])

    useEffect(() => {
        // If they are already verified, kick them to the dashboard
        if (isVerified && role) {
            navigate(`/${role}-dashboard`)
        }
    }, [isVerified, role, navigate])

    useEffect(() => {
        // If no user is logged in, kick them to login
        if (!user) {
            navigate('/login')
        }
    }, [user, navigate])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!user) {
            setError('No user found. Please log in again.')
            setLoading(false)
            return
        }

        try {
            const userDocRef = doc(db, 'users', user.uid)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
                const data = userDoc.data()
                // Accept the generated OTP OR the master bypass '123456' for dummy testing
                if (data.otp === otp || otp === '123456') {
                    // OTP matches, mark as verified and clear OTP
                    await updateDoc(userDocRef, {
                        isVerified: true,
                        otp: null // Clear the OTP so it can't be reused
                    })

                    // Force a reload of the app or rely on the auth context listener picking up the firestore change
                    // The easiest way is to reload the window to ensure the context updates immediately from Firestore
                    window.location.href = `/${data.role || 'patient'}-dashboard`
                } else {
                    setError('Incorrect verification code. Please try again.')
                }
            } else {
                setError('User profile not found.')
            }
        } catch (err) {
            console.error('Verification error:', err)
            setError('Failed to verify code. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (!user || resendTimer > 0) return
        
        setLoading(true)
        setError('')
        setSuccessMsg('')
        
        try {
            const userDocRef = doc(db, 'users', user.uid)
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
            
            console.log(`\n\n=== [DEVELOPMENT ONLY] ===\nNEW OTP for ${user.email}: ${generatedOtp}\n==========================\n\n`)
            
            await updateDoc(userDocRef, {
                otp: generatedOtp
            })
            
            setSuccessMsg('New verification code sent!')
            setResendTimer(30)
        } catch (err) {
            console.error('Error resending OTP:', err)
            setError('Failed to resend code. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <img src="/logo.png" alt="HealthVault Logo" className="logo-img" style={{ height: '40px', marginBottom: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                    <h1 style={{ textAlign: 'center' }}>Verify Your Account</h1>
                    <p style={{ textAlign: 'center' }}>
                        We've generated a 6-digit verification code. <br />
                        <small style={{ color: 'var(--text-muted)' }}>
                            (For development: check your browser console for the code)
                        </small>
                    </p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px' }}>{error}</div>}
                {successMsg && <div style={{ color: '#10b981', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', backgroundColor: '#d1fae5', padding: '10px', borderRadius: '6px' }}>{successMsg}</div>}

                <form className="auth-form" onSubmit={handleVerify}>
                    <div className="form-group">
                        <label htmlFor="otp" style={{ textAlign: 'center', display: 'block' }}>Enter Verification Code</label>
                        <input
                            id="otp"
                            className="form-input"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            maxLength={6}
                            style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', padding: '12px' }}
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading || otp.length < 6}>
                        {loading ? 'Verifying...' : 'Verify Account'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Didn't receive a code? </span>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendTimer > 0 || loading}
                            style={{
                                background: 'none', border: 'none', color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--primary)',
                                cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', fontWeight: 600, padding: 0
                            }}
                        >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => auth.signOut()}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', width: '100%', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    )
}
