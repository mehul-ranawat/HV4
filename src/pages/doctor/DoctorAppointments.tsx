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
import { db, collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, getDoc } from '../../firebase/config'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CalendarDays, ExternalLink, Plus, X, Trash2 } from 'lucide-react'
import './DoctorAppointments.css'

interface Appointment {
    id: string
    patientId: string
    doctorId: string
    doctor: string // In this context, could represent the patient's name visually. Let's keep data structure identical though.
    patientName?: string // We'll add this to easily show who the appointment is with
    specialty: string
    date: Date
    type: string
    status: string
    notes: string
}

export default function DoctorAppointments() {
    const { user } = useAuth()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Booking state
    const [patients, setPatients] = useState<any[]>([])
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [bookingData, setBookingData] = useState({
        patientId: '',
        date: '',
        time: '',
        type: 'Consultation',
        notes: ''
    })
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Current doctor profile
    const [doctorProfile, setDoctorProfile] = useState<any>(null)

    useEffect(() => {
        if (!user) return
        const fetchDoctorAndPatients = async () => {
            try {
                // Get doctor profile first
                const docRef = await getDoc(doc(db, 'users', user.uid));
                if (docRef.exists()) {
                    setDoctorProfile({ id: docRef.id, ...docRef.data() });
                }

                // Get patients
                // Assuming doctor has assigned patients OR we just fetch all users whose role is patient for now
                // For a real app, only linked patients would show up.
                const q = query(collection(db, 'users'), where('role', '==', 'patient'));
                const snap = await getDocs(q);
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Let's filter to only patients this doctor has actually seen or are assigned.
                // For simplicity, we'll allow booking with any patient in the system, but sorting by assigned.
                setPatients(docs);
                if (docs.length > 0) {
                    setBookingData(prev => ({ ...prev, patientId: docs[0].id }));
                }
            } catch (err) {
                console.error("Error fetching dependencies:", err);
            }
        }
        fetchDoctorAndPatients();
    }, [user])

    useEffect(() => {
        if (!user) return
        const fetchAppointments = async () => {
            setLoading(true)
            try {
                // Fetch where the DOCTOR is the current user
                const q = query(collection(db, 'appointments'), where('doctorId', '==', user.uid))
                const snap = await getDocs(q)

                // We need to resolve patient names
                const apptsPromises = snap.docs.map(async (docSnap) => {
                    const docData = docSnap.data()

                    let patientName = 'Unknown Patient'
                    try {
                        if (docData.patientId) {
                            const pDoc = await getDoc(doc(db, 'users', docData.patientId))
                            if (pDoc.exists() && pDoc.data().displayName) {
                                patientName = pDoc.data().displayName
                            }
                        }
                    } catch (e) {
                        console.error("Could not fetch patient name", e)
                    }

                    return {
                        id: docSnap.id,
                        ...docData,
                        date: docData.date.toDate(),
                        patientName
                    } as Appointment
                })

                const data = await Promise.all(apptsPromises)

                // Deduplicate due to potential double-mounting auto-seeding
                const uniqueData = data.filter((appt, index, self) =>
                    index === self.findIndex((t) => (
                        t.patientId === appt.patientId &&
                        t.date.getFullYear() === appt.date.getFullYear() &&
                        t.date.getMonth() === appt.date.getMonth() &&
                        t.date.getDate() === appt.date.getDate() &&
                        t.date.getHours() === appt.date.getHours()
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
        if (!user || !bookingData.patientId || !bookingData.date || !bookingData.time || !doctorProfile) return

        setIsSaving(true)
        try {
            const selectedPatient = patients.find(p => p.id === bookingData.patientId)
            if (!selectedPatient) throw new Error("Patient not found")

            // Create Date object from date and time strings
            const dateTime = new Date(`${bookingData.date}T${bookingData.time}`)

            const newAppt = {
                patientId: selectedPatient.id,
                doctorId: user.uid,
                doctor: doctorProfile.displayName || 'Doctor',
                specialty: doctorProfile.specialization || 'General Practice',
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
                date: dateTime,
                patientName: selectedPatient.displayName || 'Unknown Patient'
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
        if (!window.confirm("Are you sure you want to cancel this appointment with the patient?")) return

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
        const text = encodeURIComponent(`Consultation with Patient ${appt.patientName}`)
        const details = encodeURIComponent(`Type: ${appt.type}\nNotes: ${appt.notes || 'None provided.'}`)
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
                <h1 className="dash-title">Doctor's Schedule</h1>
                <p className="dash-subtitle">Manage your calendar and book appointments with patients.</p>
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
                                            <div className="appt-doctor">Patient: {appt.patientName}</div>
                                            <div className="appt-specialty">{appt.type}</div>
                                        </div>
                                        <div className="appt-time">
                                            <Clock size={14} />
                                            {appt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {appt.notes && (
                                        <div className="appt-notes">
                                            <strong>Patient Notes:</strong> {appt.notes}
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
                            <h2>Book Appointment with Patient</h2>
                            <button className="close-modal-btn" onClick={() => setIsBookingModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBookAppointment}>
                            <div className="form-group">
                                <label>Select Patient</label>
                                <select
                                    required
                                    value={bookingData.patientId}
                                    onChange={e => setBookingData({ ...bookingData, patientId: e.target.value })}
                                >
                                    <option value="" disabled>Choose a patient...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.displayName || p.email}
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
                                    <option value="Test Results Review">Test Results Review</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea
                                    placeholder="Enter instructions or reason for visit here"
                                    rows={3}
                                    value={bookingData.notes}
                                    onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsBookingModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSaving || !bookingData.patientId}>
                                    {isSaving ? 'Booking...' : 'Confirm Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
