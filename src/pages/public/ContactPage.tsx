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
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Youtube
} from 'lucide-react'
import './ContactPage.css'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call to support endpoint
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' })

      // Clear success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    }, 1500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="contact-page">
      {/* Navigation */}
      <nav className="contact-nav">
        <div className="container">
          <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
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

      {/* Hero Section */}
      <section className="contact-hero">
        <h1>Get in Touch</h1>
        <p>Whether you have a question about our platforms, need technical support, or want to partner with us, our team is ready to answer.</p>
      </section>

      {/* Split-Card Wrapper */}
      <section className="container" style={{ padding: '0 24px' }}>
        <div className="contact-wrapper">

          {/* Left Side: Info Panel */}
          <div className="contact-info-panel">
            <h3>Contact Information</h3>
            <p className="sub-text">
              Fill out the form and our team will get back to you within 24 hours.
            </p>

            <div className="info-items">
              <div className="info-item">
                <Mail className="info-icon" size={24} />
                <div className="info-content">
                  <h4>Email Support</h4>
                  <p>finalyp26@gmail.com</p>
                </div>
              </div>

              <div className="info-item">
                <Phone className="info-icon" size={24} />
                <div className="info-content">
                  <h4>Phone Number</h4>
                  <p>+91 12345 67890</p>
                  <p>Mon - Fri, 9am to 6pm IST</p>
                </div>
              </div>

              <div className="info-item">
                <MapPin className="info-icon" size={24} />
                <div className="info-content">
                  <h4>Corporate Office</h4>
                  <p>HealthVault Team</p>
                  <p>SLAM STUDIO ORGANIZATION - GITHUB</p>
                </div>
              </div>

              <div className="info-item">
                <Clock className="info-icon" size={24} />
                <div className="info-content">
                  <h4>Technical Support Hours</h4>
                  <p>24/7 for Premium Clinics</p>
                </div>
              </div>

              <div className="info-item">
                <Youtube className="info-icon" size={24} style={{ color: '#ef4444' }} />
                <div className="info-content">
                  <h4>Watch Our Story</h4>
                  <p><a href="https://youtu.be/IESzOJvKvR4?si=UYYjeDMHJgpHIypl" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none' }}>HealthVault YouTube Channel</a></p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Form Panel */}
          <div className="contact-form-panel">
            <h3>Send us a message</h3>

            {isSuccess && (
              <div className="success-message">
                <CheckCircle2 size={24} />
                <span>Your message has been sent successfully! We will reach out shortly.</span>
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Patient Support">Patient Portal Support</option>
                  <option value="Doctor Support">Doctor Portal Support</option>
                  <option value="Clinic Partnership">Clinic Partnership</option>
                  <option value="Bug Report">Technical Bug Report</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : (
                  <>Send Message <Send size={18} /></>
                )}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* Simple Footer */}
      <footer style={{ textAlign: 'center', marginTop: '80px', color: '#9ca3af', fontSize: '0.9rem' }}>
        <p>HealthVault - Secure Healthcare Management Platform</p>
      </footer>
    </div>
  )
}
