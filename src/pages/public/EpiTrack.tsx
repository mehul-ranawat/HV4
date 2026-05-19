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

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, Popup, useMap, Pane } from 'react-leaflet'
import { db, collection, getDocs, query, where } from '../../firebase/config'
import {
    Activity, Shield, MapPin, Users, Zap, AlertTriangle, RefreshCw, ChevronRight, Heart, Biohazard, Menu
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './EpiTrack.css'

// ── City → Lat/Lng dictionary (fallback) ──
const CITY_COORDS: Record<string, [number, number]> = {
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.7041, 77.1025],
    'Bangalore': [12.9716, 77.5946],
    'Hyderabad': [17.3850, 78.4867],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Pune': [18.5204, 73.8567],
    'Ahmedabad': [23.0225, 72.5714],
    'Jaipur': [26.9124, 75.7873],
    'Surat': [21.1702, 72.8311],
    'Lucknow': [26.8467, 80.9462],
    'Kanpur': [26.4499, 80.3319],
    'Nagpur': [21.1458, 79.0882],
    'Indore': [22.7196, 75.8577],
    'Thane': [19.2183, 72.9781],
    'Bhopal': [23.2599, 77.4126],
    'Visakhapatnam': [17.6868, 83.2185],
    'Pimpri': [18.6279, 73.8009],
    'Patna': [25.5941, 85.1376],
    'Vadodara': [22.3073, 73.1812],
}

export interface Cluster {
    id: string
    disease: string
    city: string
    lat: number
    lng: number
    count: number
    risk: 'low' | 'medium' | 'high' | 'critical'
    trend: 'rising' | 'stable' | 'falling'
    patients: string[]
}

// ── Risk level from count ──
function getRisk(count: number): Cluster['risk'] {
    if (count >= 21) return 'critical'
    if (count >= 11) return 'high'
    if (count >= 6) return 'medium'
    return 'low'
}

const RISK_COLORS = {
    low: '#f59e0b',
    medium: '#f97316',
    high: '#ef4444',
    critical: '#7f1d1d',
}

const RISK_LABELS = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
}

// ── Extract disease keywords from text ──
function extractDiseases(text: string): string[] {
    if (!text) return []
    // Split on comma, semicolon, "and", newline
    return text.split(/[,;\n&]|and /i)
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 60)
}

// ── Map fly-to helper ──
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap()
    useEffect(() => { map.flyTo([lat, lng], 10, { duration: 1.2 }) }, [lat, lng])
    return null
}

export default function EpiTrack() {
    const [clusters, setClusters] = useState<Cluster[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Cluster | null>(null)
    const [filterRisk, setFilterRisk] = useState<string>('all')
    const [lastUpdated, setLastUpdated] = useState('')
    const [totalPatients, setTotalPatients] = useState(0)
    const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null)

    // Collapsible UI state
    const [isNavExpanded, setIsNavExpanded] = useState(true)
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

    // Map constraints
    const mapBounds: [number, number][] = [[-85, -180], [85, 180]]

    const analyze = async () => {
        setLoading(true)
        try {
            // 1. Fetch all patients
            const patientsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'patient')))
            setTotalPatients(patientsSnap.size)

            // 2. Fetch all active medications
            const medsSnap = await getDocs(collection(db, 'medications'))
            const medsByUser: Record<string, string[]> = {}
            medsSnap.docs.forEach(d => {
                const data = d.data()
                if (data.userId && data.name) {
                    if (!medsByUser[data.userId]) medsByUser[data.userId] = []
                    medsByUser[data.userId].push(data.name)
                }
            })

            // 3. Build city-disease map
            type CityDisease = { city: string; lat: number; lng: number; patients: Set<string> }
            const clusters: Record<string, CityDisease> = {}

            patientsSnap.docs.forEach(docSnap => {
                const p = docSnap.data()
                const uid = docSnap.id
                const city = p.city as string
                if (!city) return

                let lat = p.lat as number
                let lng = p.lng as number

                // Fallback to city lookup
                if (!lat || !lng) {
                    const coords = CITY_COORDS[city]
                    if (!coords) return
                    lat = coords[0]; lng = coords[1]
                }

                // Gather diseases from medicalHistory + medications
                const diseases: string[] = []
                if (p.medicalHistory) diseases.push(...extractDiseases(p.medicalHistory))
                if (medsByUser[uid]) diseases.push(...medsByUser[uid].map(m => m.split(' ')[0])) // first word of med name

                diseases.forEach(disease => {
                    const normalised = disease.replace(/\s+/g, ' ').trim()
                    if (!normalised || normalised.length < 3) return
                    const key = `${city}__${normalised.toLowerCase()}`

                    if (!clusters[key]) {
                        clusters[key] = {
                            city,
                            lat: lat + (Math.random() - 0.5) * 0.05, // micro-spread within city
                            lng: lng + (Math.random() - 0.5) * 0.05,
                            patients: new Set()
                        }
                    }
                    clusters[key].patients.add(uid)
                })
            })

            // 4. Filter to clusters with ≥3 patients, build Cluster objects
            const result: Cluster[] = Object.entries(clusters)
                .filter(([, v]) => v.patients.size >= 3)
                .map(([key, v]) => {
                    const [city, disease] = key.split('__')
                    const count = v.patients.size
                    const risk = getRisk(count)
                    // Simulate trend: >10 = rising, 6-10 = stable, ≤5 = random
                    const trend: Cluster['trend'] = count > 10 ? 'rising' : count > 5 ? 'stable' : (Math.random() > 0.5 ? 'stable' : 'falling')
                    const label = disease.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                    return {
                        id: key,
                        disease: label,
                        city,
                        cityId: city.toLowerCase(),
                        lat: v.lat,
                        lng: v.lng,
                        count,
                        risk,
                        trend,
                        patients: [...v.patients],
                    }
                })
                .sort((a, b) => b.count - a.count)

            setClusters(result)
            setLastUpdated(new Date().toLocaleTimeString())
        } catch (err) {
            console.error('EpiTrack error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { analyze() }, [])

    const filtered = useMemo(() =>
        filterRisk === 'all' ? clusters : clusters.filter(c => c.risk === filterRisk),
        [clusters, filterRisk])

    const stats = useMemo(() => ({
        critical: clusters.filter(c => c.risk === 'critical').length,
        high: clusters.filter(c => c.risk === 'high').length,
        medium: clusters.filter(c => c.risk === 'medium').length,
        totalClusters: clusters.length,
    }), [clusters])

    const handleSelectCluster = (cl: Cluster) => {
        setSelected(cl)
        setFlyTarget({ lat: cl.lat, lng: cl.lng })
        setIsSidebarExpanded(true) // Expand sidebar when selecting a cluster
    }

    return (
        <div className={`epi-wrapper ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
            {/* ── Nav ── */}
            <nav className={`epi-nav ${isNavExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="container epi-nav-inner">
                    <div className="epi-nav-left-box">
                        <Link to="/" className="nav-logo"><Heart size={22} /> {isNavExpanded && 'HealthVault'}</Link>
                        <button className="epi-toggle-btn" onClick={() => setIsNavExpanded(!isNavExpanded)}>
                            {isNavExpanded ? <Activity size={20} className="active" /> : <Menu size={20} />}
                        </button>
                    </div>

                    {isNavExpanded && (
                        <>
                            <div className="epi-nav-center">
                                <Biohazard size={18} className="epi-nav-icon" />
                                <span>EpiTrack — Disease Outbreak Intelligence</span>
                            </div>
                            <div className="epi-nav-right">
                                {/* Compact Stat Chips */}
                                <div className="epi-nav-stats">
                                    <div className="epi-nav-stat critical" title="Critical Clusters">
                                        <Zap size={14} /> {stats.critical}
                                    </div>
                                    <div className="epi-nav-stat high" title="High Risk Clusters">
                                        <AlertTriangle size={14} /> {stats.high}
                                    </div>
                                    <div className="epi-nav-stat neutral" title="Total Patients Analysed">
                                        <Users size={14} /> {totalPatients}
                                    </div>
                                </div>
                                {lastUpdated && <span className="epi-last-updated">Updated {lastUpdated}</span>}
                                <button className="epi-refresh-btn" onClick={analyze} disabled={loading}>
                                    <RefreshCw size={14} className={loading ? 'spin' : ''} />
                                </button>
                                <Link to="/" className="back-link">← Home</Link>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            {/* ── Main panel ── */}
            <div className="epi-main">
                {/* Sidebar */}
                <aside className={`epi-sidebar ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="epi-sidebar-head">
                        <div className="epi-sidebar-title-row">
                            {isSidebarExpanded && <h2><Shield size={16} /> Outbreak Alerts</h2>}
                            <button className="epi-sidebar-toggle" onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}>
                                {isSidebarExpanded ? <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> : <Shield size={18} />}
                            </button>
                        </div>

                        {isSidebarExpanded && (
                            <div className="epi-filter-pills">
                                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(r => (
                                    <button
                                        key={r}
                                        className={`epi-pill ${filterRisk === r ? 'active' : ''} ${r !== 'all' ? r : ''}`}
                                        onClick={() => setFilterRisk(r)}
                                    >
                                        {r === 'all' ? 'All' : RISK_LABELS[r]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {isSidebarExpanded && (
                        <>
                            {loading ? (
                                <div className="epi-sidebar-loading">
                                    <div className="epi-spinner" />
                                    <p>Analysing...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="epi-sidebar-empty">
                                    <Shield size={32} />
                                    <p>No clusters.</p>
                                </div>
                            ) : (
                                <div className="epi-cluster-list">
                                    {filtered.map((cl) => (
                                        <button
                                            key={cl.id}
                                            className={`epi-cluster-card ${selected?.id === cl.id ? 'selected' : ''} risk-${cl.risk}`}
                                            onClick={() => handleSelectCluster(cl)}
                                        >
                                            <div className="epi-cluster-body">
                                                <div className="epi-cluster-top">
                                                    <span className="epi-cluster-disease">{cl.disease}</span>
                                                    <span className={`epi-risk-badge ${cl.risk}`}>{RISK_LABELS[cl.risk]}</span>
                                                </div>
                                                <div className="epi-cluster-meta">
                                                    <MapPin size={12} /> {cl.city} ({cl.count} Cases)
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </aside>

                {/* Map */}
                <div className="epi-map-wrap">
                    <MapContainer
                        center={[20.5937, 78.9629]}
                        zoom={5}
                        minZoom={3.5}
                        maxBounds={mapBounds}
                        maxBoundsViscosity={1.0}
                        className="epi-map"
                        zoomControl={true}
                        worldCopyJump={false}
                    >
                        {/* Base Tile Layer (No City Names) */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                        />

                        {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}

                        {/* Disease Clusters Output */}
                        {filtered.map(cl => {
                            const color = RISK_COLORS[cl.risk]
                            const radius = 8000 + cl.count * 2500 // scale with count
                            const isSelected = selected?.id === cl.id

                            return (
                                <Circle
                                    key={cl.id}
                                    center={[cl.lat, cl.lng]}
                                    radius={radius}
                                    pathOptions={{
                                        color,
                                        fillColor: color,
                                        fillOpacity: isSelected ? 0.45 : 0.25,
                                        weight: isSelected ? 2 : 1,
                                        opacity: isSelected ? 0.8 : 0.5,
                                    }}
                                    eventHandlers={{ click: () => handleSelectCluster(cl) }}
                                >
                                    <Popup className="epi-popup">
                                        <div className="epi-popup-inner">
                                            <div className="epi-popup-title">{cl.disease}</div>
                                            <div className="epi-popup-city"><MapPin size={12} /> {cl.city}</div>
                                            <div className="epi-popup-grid">
                                                <div><span>Cases</span><strong>{cl.count}</strong></div>
                                                <div><span>Risk</span><strong className={cl.risk}>{RISK_LABELS[cl.risk]}</strong></div>
                                                <div><span>Trend</span><strong>{cl.trend}</strong></div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Circle>
                            )
                        })}

                        {/* Top Tile Layer (City Names Only, renders ON TOP of heat map circles) */}
                        <Pane name="labelsPane" style={{ zIndex: 450, pointerEvents: 'none' }}>
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                            />
                        </Pane>
                    </MapContainer>

                    {loading && (
                        <div className="epi-map-loading">
                            <div className="epi-loading-content">
                                <div className="epi-pulse-ring" />
                                <Biohazard size={40} />
                                <p>Scanning patient database for outbreak patterns...</p>
                            </div>
                        </div>
                    )}

                    {/* Map legend */}
                    {!loading && isSidebarExpanded && (
                        <div className="epi-legend">
                            <div className="epi-legend-title">Risk Level</div>
                            {(['critical', 'high', 'medium', 'low'] as const).map(r => (
                                <div key={r} className="epi-legend-item">
                                    <span className="epi-legend-dot" style={{ background: RISK_COLORS[r] }} />
                                    {RISK_LABELS[r]}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer note ── */}
            <div className="epi-footer-note">
                <Shield size={14} />
                <span>EpiTrack uses anonymised data. No PII is displayed.</span>
            </div>
        </div>
    )
}
