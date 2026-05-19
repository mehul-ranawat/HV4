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
import { useParams, Link } from 'react-router-dom'
import { db, doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp, orderBy } from '../../firebase/config'
import { Calendar, MapPin, Award, ArrowLeft, Star, MessageSquare, Shield, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function DoctorProfile() {
    const { id } = useParams()
    const { user } = useAuth()
    const [doctor, setDoctor] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Review States
    const [hasTreatmentHistory, setHasTreatmentHistory] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewComment, setReviewComment] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)
    const [reviews, setReviews] = useState<any[]>([])

    // Refactored to external function so it can be called after submitting a new review
    const fetchReviews = async (docId: string) => {
        try {
            const revQ = query(
                collection(db, 'reviews'),
                where('doctorId', '==', docId),
                orderBy('timestamp', 'desc')
            )
            const revSnap = await getDocs(revQ)
            const loadedReviews = revSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setReviews(loadedReviews)
        } catch (err) {
            console.error("Error fetching reviews:", err)
        }
    }

    useEffect(() => {
        const fetchDoctorData = async () => {
            if (!id) return
            try {
                // Fetch Doctor Profile
                const docRef = await getDoc(doc(db, 'users', id))
                if (docRef.exists()) {
                    setDoctor({ id: docRef.id, ...docRef.data() })
                }

                // Fetch existing reviews
                await fetchReviews(id)

                // Check Treatment History (Has the patient ever had an appointment with them?)
                if (user) {
                    const apptQ = query(
                        collection(db, 'appointments'),
                        where('patientId', '==', user.uid),
                        where('doctorId', '==', id)
                    )
                    const apptSnap = await getDocs(apptQ)
                    setHasTreatmentHistory(!apptSnap.empty)
                }

            } catch (err) {
                console.error("Error fetching doctor profile data:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchDoctorData()
    }, [id, user])

    const handleSubmitReview = async () => {
        if (!user || !id) return
        if (!reviewComment.trim()) {
            alert('Please provide a comment with your review.')
            return
        }

        setSubmittingReview(true)
        try {
            await addDoc(collection(db, 'reviews'), {
                doctorId: id,
                patientId: user.uid,
                patientName: user.displayName || user.email?.split('@')[0] || 'Patient',
                rating: reviewRating,
                comment: reviewComment,
                timestamp: Timestamp.now()
            })
            setShowReviewModal(false)
            setReviewComment('')
            setReviewRating(5)
            alert('Review submitted successfully!')
            await fetchReviews(id)
        } catch (err) {
            console.error('Error submitting review:', err)
            alert('Failed to submit review.')
        } finally {
            setSubmittingReview(false)
        }
    }

    if (loading) return <div style={{ padding: 20 }}>Loading profile...</div>
    if (!doctor) return <div style={{ padding: 20 }}>Doctor not found</div>

    return (
        <div>
            <div className="dash-header" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <Link to="/patient-dashboard" className="dash-badge primary" style={{ textDecoration: 'none' }}>
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> Back to Dashboard
                </Link>
                <div>
                    <h1 className="dash-title">Doctor Profile</h1>
                </div>
            </div>

            <div className="dash-content-grid">
                {/* Doctor Avatar and Basic Info */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2>Personal Info</h2>
                    </div>
                    <div className="dash-card-body" style={{ display: 'flex', gap: 20 }}>
                        <div style={{ background: '#e0e7ff', color: '#4f46e5', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', flexShrink: 0 }}>
                            {doctor?.displayName?.charAt(0) || 'D'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.3rem', marginBottom: 5 }}>{doctor?.displayName || 'Unknown Doctor'}</h2>
                            <p style={{ color: 'var(--text-light)', fontSize: '1rem', marginBottom: 10 }}>
                                {doctor?.specialization || 'General Practitioner'}
                            </p>
                            <p style={{ marginTop: 8 }}><strong>Phone:</strong> {doctor?.phone || 'Not provided'}</p>
                            <p style={{ marginTop: 8 }}><strong>Email:</strong> {doctor?.email || 'Not provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <h2>Quick Actions</h2>
                    </div>
                    <div className="dash-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button className="dash-quick-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}>
                            <Calendar size={18} /> Book Appointment
                        </button>
                        {hasTreatmentHistory && (
                            <button
                                className="dash-quick-btn primary"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, background: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
                                onClick={() => setShowReviewModal(true)}
                            >
                                <Star size={18} fill="white" /> Give Review
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Experience & Qualifications */}
            <div className="dash-card" style={{ marginTop: 20 }}>
                <div className="dash-card-header">
                    <h2><Award size={18} /> Experience & Qualifications</h2>
                </div>
                <div className="dash-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                            <Award size={24} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4 }}>Qualifications</div>
                            <div style={{ fontWeight: 500 }}>{doctor?.qualification || 'Not specified'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                            <Calendar size={24} color="#10b981" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4 }}>Experience</div>
                            <div style={{ fontWeight: 500 }}>{doctor?.experience || 'Not specified'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                            <MapPin size={24} color="#f59e0b" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4 }}>Hospital Affiliation</div>
                            <div style={{ fontWeight: 500 }}>{doctor?.hospital || 'General Hospital'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                            <Shield size={24} color="#8b5cf6" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4 }}>Registration Number</div>
                            <div style={{ fontWeight: 500 }}>{doctor?.registrationNumber || 'Not specified'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                            <FileText size={24} color="#ec4899" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 4 }}>Medical Council / State</div>
                            <div style={{ fontWeight: 500 }}>{doctor?.registrationState || 'Not specified'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Reviews Section */}
            <div className="dash-card" style={{ marginTop: 20 }}>
                <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2><MessageSquare size={18} /> Patient Reviews ({reviews.length})</h2>
                </div>
                <div className="dash-card-body">
                    {reviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
                            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 15 }} />
                            <p>No reviews yet for this doctor.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {reviews.map(review => (
                                <div key={review.id} style={{ padding: 15, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 600 }}>{review.patientName}</div>
                                        <div style={{ display: 'flex', gap: 2 }}>
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star key={s} size={14} fill={s <= review.rating ? '#f59e0b' : 'none'} color={s <= review.rating ? '#f59e0b' : '#cbd5e1'} />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.95rem', color: '#334155' }}>
                                        {review.comment}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>
                                        {review.timestamp?.toDate ? new Date(review.timestamp.toDate()).toLocaleDateString() : 'Recent'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => !submittingReview && setShowReviewModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Review Dr. {doctor.displayName}</h2>
                            <button className="modal-close" onClick={() => !submittingReview && setShowReviewModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: '1.2rem', marginBottom: 10 }}>Rate your experience</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setReviewRating(star)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                color: star <= reviewRating ? '#f59e0b' : '#cbd5e1'
                                            }}
                                        >
                                            <Star size={32} fill={star <= reviewRating ? '#f59e0b' : 'none'} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Your Comment</label>
                                <textarea
                                    placeholder="Share details of your experience..."
                                    rows={4}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="modal-cancel-btn"
                                style={{ padding: '10px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => setShowReviewModal(false)}
                                disabled={submittingReview}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-upload-btn"
                                style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
