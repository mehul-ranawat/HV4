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
import { useAuth } from '../../context/AuthContext'
import { db, collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from '../../firebase/config'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CalendarDays, ExternalLink, Plus, X, Trash2 } from 'lucide-react'
import './PatientAppointments.css'

interface Appointment {
    id: string
    patientId: string
    doctorId: string
    doctor: string
    specialty: string
    date: Date
    type: string
    status: string
    notes: string
}

export default function PatientAppointments() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Booking state
    const [doctors, setDoctors] = useState<any[]>([])
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [bookingData, setBookingData] = useState({
        doctorId: '',
        date: '',
        time: '',
        type: 'Consultation',
        notes: ''
    })
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        if (!user) return
        const fetchDoctors = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'doctor'))
                const snap = await getDocs(q)
                const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                // Filter verified doctors or those without the flag (for compatibility)
                const verifiedDocs = allDocs.filter((d: any) => d.isVerified !== false)
                setDoctors(verifiedDocs)
                if (verifiedDocs.length > 0) {
                    setBookingData(prev => ({ ...prev, doctorId: verifiedDocs[0].id }))
                }
            } catch (err) {
                console.error("Error fetching doctors:", err)
            }
        }
        fetchDoctors()
    }, [user])

    useEffect(() => {
        if (!user) return
        const fetchAppointments = async () => {
            setLoading(true)
            try {
                const q = query(collection(db, 'appointments'), where('patientId', '==', user.uid))
                const snap = await getDocs(q)
                const data = snap.docs.map(doc => {
                    const docData = doc.data()
                    return {
                        id: doc.id,
                        ...docData,
                        date: docData.date.toDate() // Convert Firestore Timestamp to JS Date
                    } as Appointment
                })

                // Deduplicate due to potential double-mounting auto-seeding
                const uniqueData = data.filter((appt, index, self) =>
                    index === self.findIndex((t) => (
                        t.doctorId === appt.doctorId &&
                        t.date.getFullYear() === appt.date.getFullYear() &&
                        t.date.getMonth() === appt.date.getMonth() &&
                        t.date.getDate() === appt.date.getDate()
                    ))
                )

                // Sort by date ascending
                uniqueData.sort((a, b) => a.date.getTime() - b.date.getTime())
                setAppointments(uniqueData)

                // We don't auto-select the upcoming date anymore. We just stay on today's date.
            } catch (err) {
                console.error("Error fetching appointments:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchAppointments()
    }, [user])

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !bookingData.doctorId || !bookingData.date || !bookingData.time) return

        setIsSaving(true)
        try {
            const selectedDoctor = doctors.find(d => d.id === bookingData.doctorId)
            if (!selectedDoctor) throw new Error("Doctor not found")

            // Create Date object from date and time strings
            const dateTime = new Date(`${bookingData.date}T${bookingData.time}`)

            const newAppt = {
                patientId: user.uid,
                doctorId: selectedDoctor.id,
                doctor: selectedDoctor.displayName,
                specialty: selectedDoctor.specialization || 'General Practice',
                date: Timestamp.fromDate(dateTime),
                type: bookingData.type,
                status: 'pending',
                notes: bookingData.notes
            }

            const docRef = await addDoc(collection(db, 'appointments'), newAppt)

            // Add to local state so it appears immediately
            const createdAppt: Appointment = {
                id: docRef.id,
                ...newAppt,
                date: dateTime
            }

            setAppointments(prev => {
                const updated = [...prev, createdAppt]
                return updated.sort((a, b) => a.date.getTime() - b.date.getTime())
            })

            setIsBookingModalOpen(false)
            setBookingData({ ...bookingData, date: '', time: '', notes: '' })

            // Auto-select the date that was just booked
            setSelectedDate(dateTime)
            setCurrentMonth(new Date(dateTime.getFullYear(), dateTime.getMonth(), 1))

        } catch (err) {
            console.error("Error booking appointment:", err)
            alert("Failed to book appointment. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAppointment = async (apptId: string) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return

        setDeletingId(apptId)
        try {
            await deleteDoc(doc(db, 'appointments', apptId))
            setAppointments(prev => prev.filter(appt => appt.id !== apptId))
        } catch (err) {
            console.error("Error canceling appointment:", err)
            alert("Failed to cancel appointment.")
        } finally {
            setDeletingId(null)
        }
    }

    // Calendar Helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
    }

    // Generate Google Calendar Link
    const generateGoogleCalendarLink = (appt: Appointment) => {
        const text = encodeURIComponent(`Appointment with ${appt.doctor}`)
        const details = encodeURIComponent(`Type: ${appt.type}\nNotes: ${appt.notes || 'No standard notes provided.'}\nPlease bring any relevant medical records.`)
        const location = encodeURIComponent('HealthVault Virtual/In-Person Clinic')

        // Format times to YYYYMMDDTHHmmssZ
        const pad = (n: number) => (n < 10 ? '0' + n : n)
        const formatGoogleDate = (d: Date) => {
            return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
        }

        const startDate = new Date(appt.date)
        const endDate = new Date(startDate.getTime() + 30 * 60000) // Assumes 30 min duration

        const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`
    }

    const renderCalendar = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDayIndex = getFirstDayOfMonth(year, month)

        const days = []

        // Empty slots for days before the 1st
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
        }

        // The exact days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i)
            const isToday = isSameDay(dateObj, new Date())
            const isSelected = isSameDay(dateObj, selectedDate)
            const hasAppt = appointments.some(appt => isSameDay(appt.date, dateObj))

            days.push(
                <div
                    key={i}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasAppt ? 'has-appointment' : ''}`}
                    onClick={() => setSelectedDate(dateObj)}
                >
                    {i}
                </div>
            )
        }

        return days
    }

    const selectedAppointments = appointments
        .filter(appt => isSameDay(appt.date, selectedDate))
        // Already sorted but keep this just in case
        .sort((a, b) => a.date.getTime() - b.date.getTime())

    return (
        <div className="appointments-page">
            <div className="dash-header">
                <h1 className="dash-title">Appointments</h1>
                <p className="dash-subtitle">Manage your schedule and book upcoming visits.</p>
            </div>

            <div className="calendar-container">
                {/* Calendar View */}
                <div className="calendar-card">
                    <div className="calendar-header">
                        <h2>
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                                <ChevronLeft size={20} />
                            </button>
                            <button className="calendar-nav-btn" onClick={handleNextMonth}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid-header">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    <div className="calendar-grid">
                        {renderCalendar()}
                    </div>
                </div>

                {/* Selected Day Details */}
                <div className="appointments-sidebar">
                    <div className="selected-date-card">
                        <button
                            className="book-btn"
                            onClick={() => setIsBookingModalOpen(true)}
                        >
                            <Plus size={16} /> Book
                        </button>
                        <h3>{selectedDate.toLocaleDateString('default', { weekday: 'long' })}</h3>
                        <p>{selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <div className="day-appointments-list">
                        {loading ? (
                            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading appointments...</p>
                        ) : selectedAppointments.length > 0 ? (
                            selectedAppointments.map(appt => (
                                <div key={appt.id} className="day-appointment-card">
                                    <div className="appt-card-top">
                                        <div>
                                            <div className="appt-doctor">{appt.doctor}</div>
                                            <div className="appt-specialty">{appt.specialty} • {appt.type}</div>
                                        </div>
                                        <div className="appt-time">
                                            <Clock size={14} />
                                            {appt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {appt.notes && (
                                        <div className="appt-notes">
                                            <strong>Notes:</strong> {appt.notes}
                                        </div>
                                    )}

                                    {user?.providerData?.some((p: any) => p.providerId === 'google.com') && (
                                        <a
                                            href={generateGoogleCalendarLink(appt)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="google-calendar-btn"
                                        >
                                            <CalendarDays size={16} />
                                            Add to Google Calendar
                                            <ExternalLink size={14} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
                                        </a>
                                    )}

                                    <button
                                        className="cancel-appt-btn"
                                        onClick={() => handleDeleteAppointment(appt.id)}
                                        disabled={deletingId === appt.id}
                                    >
                                        <Trash2 size={16} />
                                        {deletingId === appt.id ? 'Canceling...' : 'Cancel Appointment'}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="no-appointments">
                                <CalendarIcon size={32} style={{ margin: '0 auto', opacity: 0.5 }} />
                                <p>No appointments scheduled for this date.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {isBookingModalOpen && (
                <div className="modal-overlay" onClick={() => setIsBookingModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Book New Appointment</h2>
                            <button className="close-modal-btn" onClick={() => setIsBookingModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBookAppointment}>
                            <div className="form-group">
                                <label>Select Doctor</label>
                                <select
                                    required
                                    value={bookingData.doctorId}
                                    onChange={e => setBookingData({ ...bookingData, doctorId: e.target.value })}
                                >
                                    <option value="" disabled>Choose a doctor...</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.displayName} - {doc.specialization}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bookingData.date}
                                        onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={bookingData.time}
                                        onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Appointment Type</label>
                                <select
                                    required
                                    value={bookingData.type}
                                    onChange={e => setBookingData({ ...bookingData, type: e.target.value })}
                                >
                                    <option value="Consultation">Consultation</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Routine Checkup">Routine Checkup</option>
                                    <option value="Specialist Visit">Specialist Visit</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea
                                    placeholder="Briefly describe your symptoms or reason for visit"
                                    rows={3}
                                    value={bookingData.notes}
                                    onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsBookingModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSaving || !bookingData.doctorId}>
                                    {isSaving ? 'Booking...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
