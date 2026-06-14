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
import { useAuth } from '../../context/AuthContext'
import {
    ArrowRight,
    Play,
    Stethoscope,
    CalendarClock,
    BellRing,
    ShieldCheck,
    X,
    CheckCircle2,
    ChevronDown,
    Activity,
    ScanLine,
    QrCode,
    Radar,
    Youtube
} from 'lucide-react'
import './LandingPage.css'

/* ─── data ─── */
const STEPS = [
    {
        num: '01',
        title: 'Connect your accounts',
        desc: 'Easily integrate with your healthcare providers to automatically pull records.',
    },
    {
        num: '02',
        title: 'Track your health',
        desc: 'Input daily vitals and see trends over time with our intuitive dashboard.',
    },
    {
        num: '03',
        title: 'Manage your care',
        desc: 'Book appointments, set medication reminders, and share reports with doctors.',
    },
]

const FEATURES_TOP = [
    {
        title: 'Smart Dashboard',
        desc: 'See all your health records in one view — medications, appointments, and health metrics.',
    },
    {
        title: 'Health Overview',
        desc: 'Track your daily health metrics and appointments to understand your wellness journey.',
    },
    {
        title: 'Medication Breakdown',
        desc: 'See exactly how your medications are organized across different categories.',
    },
    {
        title: 'Appointment Goals',
        desc: 'Stay focused on your health appointments and follow your care plan progress.',
    },
]

const FEATURES_DETAIL = [
    {
        icon: <CalendarClock size={22} />,
        title: 'Appointment reminders',
        desc: 'Get timely reminders for appointments and medication schedules.',
    },
    {
        icon: <BellRing size={22} />,
        title: 'Health alerts',
        desc: 'Set medication reminders and get notified about important health updates.',
    },
    {
        icon: <ShieldCheck size={22} />,
        title: 'Secure & private',
        desc: 'Your health data is encrypted and never shared — ever.',
    },
]

const OTHERS_LIST = [
    'Scattered data across multiple apps',
    'Hard to track medications',
    'No patient-doctor collaboration',
    'Generic support, slow replies',
]

const HV_LIST = [
    'All-in-one health management',
    'Smart medication tracking & alerts',
    'Patient-friendly, sync records easily',
    'Priority support, fast response',
]

const TESTIMONIALS = [
    {
        quote: 'The medication tracking feature is a lifesaver. I never miss a dose anymore.',
        name: 'Mehul Ranawat',
        role: 'Patient',
    },
    {
        quote: "It feels like HealthVault understands how I think about my health.",
        name: 'Srushti Reddy',
        role: 'Patient',
    },
    {
        quote: "It's the only health management tool I open daily — and enjoy using.",
        name: 'Laxmi Nayakodi',
        role: 'Patient',
    },
]

const FAQS = [
    {
        q: 'Is my data secure?',
        a: 'Absolutely. All health data is encrypted using industry-standard AES-256 encryption and is never shared with third parties.',
    },
    {
        q: 'Is HealthVault mobile-friendly and responsive?',
        a: 'Yes! HealthVault is designed to work seamlessly across all devices — desktop, tablet, and mobile.',
    },
    {
        q: 'Can I use HealthVault without technical skills?',
        a: "Of course. HealthVault is built with a simple, intuitive interface that anyone can use — no technical skills needed.",
    },
    {
        q: 'Will I get access to future updates?',
        a: 'Yes. All users receive free updates and new features as we release them.',
    },
    {
        q: 'Can I use HealthVault for my clinic or hospital?',
        a: 'Yes! HealthVault offers both patient and doctor portals, making it suitable for clinics, hospitals, and private practices.',
    },
    {
        q: 'How can I get support if I run into issues?',
        a: 'Our support team is available via email and live chat. Premium users also get priority support with fast response times.',
    },
]

/* ─── Component ─── */
export default function LandingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const { user, role, loading, logout } = useAuth()
    const navigate = useNavigate()

    const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i)

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    const dashboardPath = role === 'admin' ? '/admin-dashboard' : (role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard')

    return (
        <div className="landing-page">
            {/* ====== 1. NAVBAR ====== */}
            <nav className="navbar">
                <div className="container">
                    <Link to="/" className="nav-logo">
                        <img src="/logo.png" alt="HealthVault Logo" className="logo-img" /> <span>HealthVault</span>
                    </Link>
                    <div className="nav-links">
                        <a href="#how-it-works">How it works</a>
                        <a href="#features">Features</a>
                        <Link to="/medinsight">MedInsight</Link>
                        <Link to="/epitrack">EpiTrack</Link>
                        <Link to="/qr-scanner">QR Scanner</Link>
                        <a href="#faq">FAQ</a>
                    </div>
                    <div className="nav-actions">
                        {!loading && user ? (
                            <>
                                <Link to={dashboardPath} className="btn btn-primary">
                                    My Dashboard <ArrowRight size={15} />
                                </Link>
                                <button onClick={handleLogout} className="btn btn-outline">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-outline">
                                    Login <ArrowRight size={15} />
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Sign Up <ArrowRight size={15} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ====== 2. HERO ====== */}
            <section className="hero">
                <div className="container">
                    <span className="hero-badge">
                        <Stethoscope size={14} /> All-in-One Healthcare Management
                    </span>
                    <h1>Take control of your health — with clarity.</h1>
                    <p>
                        All your health insights, finally in one place — track records,
                        medications, appointments, and reach your wellness goals with ease.
                    </p>
                    <div className="hero-actions">
                        {!loading && user ? (
                            <Link to={dashboardPath} className="btn btn-primary btn-lg">
                                Go To Dashboard <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-primary btn-lg">
                                    Patient Login <ArrowRight size={16} />
                                </Link>
                                <Link to="/login" className="btn btn-outline btn-lg">
                                    Doctor Login <ArrowRight size={16} />
                                </Link>
                            </>
                        )}
                        <a
                            href="https://youtu.be/IESzOJvKvR4?si=UYYjeDMHJgpHIypl"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hero-video-link"
                            style={{ textDecoration: 'none' }}
                        >
                            <span className="hero-video-icon"><Play size={14} /></span>
                            Watch video
                        </a>
                    </div>
                </div>
            </section>

            {/* ====== 3. HOW IT WORKS ====== */}
            <section className="how-it-works" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">How it works</span>
                        <h2 className="section-title">Simple steps for a healthier life</h2>
                        <p className="section-subtitle">
                            Getting started with HealthVault is easy. We've simplified complex
                            health tracking into three easy steps.
                        </p>
                    </div>
                    <div className="steps-grid">
                        {STEPS.map((s) => (
                            <div className="step-card" key={s.num}>
                                <div className="step-number">{s.num}</div>
                                <h3>{s.title}</h3>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== 4. FEATURES — top grid ====== */}
            <section className="features" id="features">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Features</span>
                        <h2 className="section-title">See your health in real time, clearly.</h2>
                        <p className="section-subtitle">
                            HealthVault shows your records, medications, and appointments in simple
                            visuals you can act on — right away.
                        </p>
                    </div>
                    <div className="features-top-grid">
                        {FEATURES_TOP.map((f) => (
                            <div className="feature-card-sm" key={f.title}>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== 5. FEATURES — detail row ====== */}
            <section className="features-detail">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">• Features</span>
                        <h2 className="section-title">Designed for clarity, built for better health decisions</h2>
                    </div>
                    <div className="features-detail-grid">
                        {FEATURES_DETAIL.map((f) => (
                            <div className="feature-detail-card" key={f.title}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== 5.5 MEDINSIGHT PANEL ====== */}
            <section className="medinsight-showcase">
                <div className="container medinsight-container">
                    <div className="medinsight-graphic">
                        <div className="svg-map-placeholder">
                            <Activity size={48} color="#4f46e5" className="pulse-icon" />
                        </div>
                    </div>
                    <div className="medinsight-text">
                        <span className="section-label" style={{ color: '#4f46e5' }}>New Feature</span>
                        <h2 className="section-title">MedInsight Explorer</h2>
                        <p className="medinsight-desc">
                            Search any medication—from everyday pain relievers to advanced prescriptions—and instantly view its FDA-approved profile. Discover active ingredients, manufacturing details, and see an interactive human body diagram highlighting potential side effects.
                        </p>
                        <div className="features-inline">
                            <span>✅ FDA Verified</span>
                            <span>✅ Real-time Updates</span>
                            <span>✅ Interactive Body Map</span>
                        </div>
                        <Link to="/medinsight" className="btn btn-primary btn-lg mt-4">
                            Try MedInsight <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ====== 5.6 EPITRACK PANEL ====== */}
            <section className="epitrack-showcase" id="epitrack">
                <div className="container medinsight-container">
                    <div className="medinsight-text">
                        <span className="section-label" style={{ color: '#ef4444' }}>Outbreak Detection</span>
                        <h2 className="section-title">EpiTrack: Disease Outbreak Intelligence</h2>
                        <p className="medinsight-desc">
                            Our AI-driven EpiTrack system monitors real-time patient data to detect disease clusters. Using advanced DBSCAN clustering, it identifies high-risk zones, allowing healthcare providers and the public to stay informed about spreading illnesses.
                        </p>
                        <div className="features-inline">
                            <span>🚨 Real-time Alerts</span>
                            <span>📍 Precision Mapping</span>
                            <span>🧠 ML-Powered Detection</span>
                        </div>
                        <Link to="/epitrack" className="btn btn-primary btn-lg mt-4" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
                            Explore EpiTrack <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="medinsight-graphic">
                        <div className="svg-map-placeholder epitrack-graphic">
                            <div className="radar-wrapper">
                                <Radar size={64} className="radar-icon" />
                                <div className="radar-sweep" />
                                <div className="danger-dot dot-1" />
                                <div className="danger-dot dot-2" />
                                <div className="danger-dot dot-3" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== NEW - EMERGENCY QR PANEL ====== */}
            <section className="qrscanner-showcase" id="qrscanner">
                <div className="container medinsight-container" style={{ flexDirection: 'row-reverse' }}>
                    <div className="medinsight-graphic qr-graphic">
                        <div className="svg-map-placeholder qr-placeholder">
                            <div className="qr-animated-wrapper">
                                <div className="qr-scan-frame">
                                    <span /><span /><span /><span />
                                </div>
                                <QrCode size={56} color="#dc2626" className="qr-center-icon" />
                                <div className="qr-scan-beam" />
                            </div>
                        </div>
                    </div>
                    <div className="medinsight-text">
                        <span className="section-label" style={{ color: '#dc2626' }}>Life-Saving Feature</span>
                        <h2 className="section-title">Emergency QR Health Card</h2>
                        <p className="medinsight-desc">
                            Every patient gets a unique QR code encoding their critical emergency data. First responders can scan it instantly — no login, no delays — to access blood type, allergies, emergency contacts, medications, and doctor info.
                        </p>
                        <div className="features-inline">
                            <span>🆘 Instant Access</span>
                            <span>🩸 Blood Type &amp; Allergies</span>
                            <span>📱 Works Offline</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                            <Link to="/qr-scanner" className="btn btn-primary btn-lg">
                                <ScanLine size={16} /> Scan a QR Code
                            </Link>
                            <Link to="/login" className="btn btn-outline btn-lg">
                                Get My QR Card <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== 6. WHY HEALTHVAULT ====== */}
            <section className="why-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">• Why HealthVault?</span>
                        <h2 className="section-title">There's a smarter way to manage health</h2>
                        <p className="section-subtitle">
                            HealthVault helps users manage their health better — and stay healthier.
                        </p>
                    </div>
                    <div className="comparison-grid">
                        <div className="comparison-card">
                            <h3>Others</h3>
                            <div className="comparison-list">
                                {OTHERS_LIST.map((item) => (
                                    <div className="comparison-item" key={item}>
                                        <X size={16} className="icon-x" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="comparison-card highlight">
                            <h3>HealthVault</h3>
                            <div className="comparison-list">
                                {HV_LIST.map((item) => (
                                    <div className="comparison-item" key={item}>
                                        <CheckCircle2 size={16} className="icon-check" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== 7. TESTIMONIALS ====== */}
            <section className="testimonials">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Loved by patients and healthcare providers</h2>
                        <p className="section-subtitle">
                            People across healthcare trust HealthVault to manage health records,
                            reduce stress, and make smarter decisions — all in one simple dashboard.
                        </p>
                    </div>
                    <div className="testimonials-grid">
                        {TESTIMONIALS.map((t) => (
                            <div className="testimonial-card" key={t.name}>
                                <div className="quote-mark">"</div>
                                <blockquote>{t.quote}</blockquote>
                                <div className="testimonial-author">
                                    <div className="author-avatar" />
                                    <div className="author-info">
                                        <strong>{t.name}</strong>
                                        <span>{t.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== 8. FAQ ====== */}
            <section className="faq" id="faq">
                <div className="container">
                    <div className="faq-top">
                        <div>
                            <h2 className="section-title">Got questions? We've got answers.</h2>
                        </div>
                        <div className="faq-right">
                            <p>Here's everything you need to know before getting started.</p>
                            <Link to="/contact">Contact us <ArrowRight size={14} /></Link>
                        </div>
                    </div>

                    <div className="faq-list">
                        {FAQS.map((faq, i) => (
                            <div className={`faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
                                <button className="faq-question" onClick={() => toggleFaq(i)}>
                                    <span className="faq-num">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="faq-text">{faq.q}</span>
                                    <ChevronDown size={18} className="faq-chevron" />
                                </button>
                                <div className="faq-answer">
                                    <p>{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ====== 9. BOTTOM CTA ====== */}
            <section className="bottom-cta">
                <div className="container">
                    <div className="cta-card">
                        <h2>Ready to manage your health smarter?</h2>
                        <p>
                            {user
                                ? 'Head to your dashboard to track records, appointments, and more.'
                                : 'Join thousands of patients already taking control of their health — sign up in just 2 minutes.'
                            }
                        </p>
                        {user ? (
                            <Link to={dashboardPath} className="btn btn-primary btn-lg">
                                Go To Dashboard <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Create Your Free Account <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ====== 10. FOOTER ====== */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="nav-logo">
                                <img src="/logo.png" alt="HealthVault Logo" className="logo-img" /> <span>HealthVault</span>
                            </div>
                            <p>
                                Your all-in-one healthcare management tool. Track your records,
                                set goals, and stay on top of your health — effortlessly.
                            </p>
                            <div className="footer-socials">
                                <a href="https://youtu.be/IESzOJvKvR4?si=UYYjeDMHJgpHIypl" target="_blank" rel="noopener noreferrer">
                                    <Youtube size={24} />
                                </a>
                            </div>
                            <div className="copyright">♥ Designed for HealthVault ©2024</div>
                        </div>
                        <div className="footer-col">
                            <h4>Quick Menu</h4>
                            <ul>
                                <li><a href="#how-it-works">How it works</a></li>
                                <li><a href="#features">Features</a></li>
                                <li><a href="#testimonials">Testimonials</a></li>
                                <li><Link to="/login">Patient Portal</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>Information</h4>
                            <ul>
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                                <li><a href="#faq">FAQ</a></li>
                                <li><Link to="/login">Doctor Portal</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
