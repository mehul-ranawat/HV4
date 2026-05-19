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

import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import './LandingPage.css' // Reusing the landing page container semantics

export default function PrivacyPolicy() {
    return (
        <div className="landing-page" style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '40px' }}>
            {/* Minimal Navbar */}
            <nav className="navbar" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
                <div className="container">
                    <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/logo.png" alt="HealthVault Logo" className="logo-img" style={{ height: '32px' }} />
                        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1f2937' }}>HealthVault</span>
                    </Link>
                    <div className="nav-actions">
                        <Link to="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowLeft size={16} /> Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ marginTop: '60px', maxWidth: '800px', backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <ShieldCheck size={48} color="#4f46e5" style={{ margin: '0 auto 16px' }} />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Privacy Policy</h1>
                    <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Last Updated: March 2026</p>
                </div>

                <div style={{ color: '#374151', lineHeight: 1.8, fontSize: '1.05rem' }}>
                    
                    <h2 style={{ color: '#111827', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>1. Introduction</h2>
                    <p>Welcome to HealthVault. We are committed to protecting your personal data and respecting your privacy.</p>
                    <p>This Privacy Policy applies exclusively to users residing within the <strong>Republic of India</strong>. It outlines how we collect, use, and protect your Sensitive Personal Data or Information (SPDI) in accordance with the <em>Information Technology Act, 2000</em>, and the <em>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</em>.</p>

                    <h2 style={{ color: '#111827', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>2. Information We Collect</h2>
                    <p>When you register for and use HealthVault as a Patient, Doctor, or Administrator, we may collect:</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                        <li><strong>Personal Identification Data:</strong> Full name, email address, phone number.</li>
                        <li><strong>Sensitive Medical Data:</strong> Blood group, existing medical conditions, active prescriptions, and uploaded health records (e.g., PDFs of lab reports).</li>
                        <li><strong>Usage Data:</strong> Application meta-data strictly necessary for security audits and OTP generation.</li>
                    </ul>

                    <h2 style={{ color: '#111827', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>3. How We Use Your Information</h2>
                    <p>We process your data exclusively to:</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                        <li>Authenticate your access via Email/Password and our secure 6-Digit OTP architecture.</li>
                        <li>Facilitate the sharing of your health records exclusively with Doctors explicitly assigned to you on the platform.</li>
                        <li>Generate a dynamic Health Score and issue Medication Refill Alerts.</li>
                        <li>Generate a public Emergency QR Card (only accessible upon physical scan in emergency situations).</li>
                    </ul>
                    <p style={{ fontWeight: 600, color: '#dc2626' }}>We do not and will never sell your personal or medical data to third-party advertisers or data brokers.</p>

                    <h2 style={{ color: '#111827', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>4. Data Storage and Security Architecture</h2>
                    <p>All user data is encrypted at rest using AES-256 standards as provided by our cloud infrastructure provider (Google Firebase). We utilize strict Firebase Firestore Security Rules (Role-Based Access Control) to mathematically guarantee that patients, doctors, and system administrators can only access document collections explicitly permitted to their clearance tier.</p>
                    
                    <h2 style={{ color: '#111827', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>5. Third-Party Integrations</h2>
                    <p>Your data remains isolated within our systems. However, HealthVault leverages the <strong>OpenFDA API</strong> to query medication metadata for our MedInsight Explorer. No personal or identifiable data is ever transmitted to OpenFDA during a search. Authentication and core databases run strictly on Google Firebase.</p>

                    <h2 style={{ color: '#111827', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>6. Your Rights (Grievances & Withdrawal)</h2>
                    <p>Under the IT Act (SPDI Rules 2011), you hold the right to review the information you have provided to us and correct any inaccuracies. You also have the right to withdraw your consent at any time.</p>
                    <p>If you wish to initiate an account deletion or have grievances regarding your data processing, please contact the designated platform Administrator via your dashboard, or email <strong>privacy@healthvault.in</strong>.</p>

                    <h2 style={{ color: '#111827', fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>7. Jurisdiction</h2>
                    <p>This Privacy Policy shall be governed by and construed strictly in accordance with the laws of India. Any disputes arising under this policy shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
                </div>
            </div>

            {/* Simple Footer */}
            <footer style={{ textAlign: 'center', marginTop: '60px', color: '#9ca3af', fontSize: '0.9rem' }}>
                <p>HealthVault - Secure Healthcare Management Platform</p>
                <p>Designed in adherence with Indian IT Act Guidelines</p>
            </footer>
        </div>
    )
}
