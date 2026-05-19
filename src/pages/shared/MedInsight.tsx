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
import { Search, Info, AlertTriangle, Building2, Pill, Activity, ShieldAlert, Heart } from 'lucide-react'
import BodyMap from '../../components/BodyMap'
import { extractAffectedRegions } from '../../utils/medInsight'
import './MedInsight.css'

interface DrugInfo {
    brand_name?: string
    generic_name?: string
    manufacturer_name?: string
    purpose?: string[]
    warnings?: string[]
    active_ingredient?: string[]
    adverse_reactions?: string[]
    indications_and_usage?: string[]
}

export default function MedInsight() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [drugData, setDrugData] = useState<DrugInfo | null>(null)
    const [affectedRegions, setAffectedRegions] = useState<string[]>([])
    const [alternatives, setAlternatives] = useState<string[]>([])

    const searchDrug = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setError('')
        setDrugData(null)
        setAffectedRegions([])

        try {
            const cleanQuery = query.trim()

            // 1. Broad Search: Search brand, generic, or substance name utilizing an exact phrase OR operation.
            let response = await fetch(`${import.meta.env.VITE_FDA_API_URL}/drug/label.json?search=(openfda.brand_name:"${cleanQuery}"+OR+openfda.generic_name:"${cleanQuery}"+OR+openfda.substance_name:"${cleanQuery}")&limit=1`)

            // 2. Fallback Search: If the specific brand/generic lookup fails, query the ENTIRE document text as a last resort, ensuring it returns an openfda payload.
            if (!response.ok && response.status === 404) {
                response = await fetch(`${import.meta.env.VITE_FDA_API_URL}/drug/label.json?search="${cleanQuery}"+AND+_exists_:openfda.brand_name&limit=1`)
            }

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Medication not found. Please try checking your spelling or trying a generic name.")
                }
                throw new Error("Failed to fetch data from FDA API.")
            }

            const data = await response.json()
            const result = data.results[0]
            const openfda = result.openfda || {}

            const info: DrugInfo = {
                brand_name: openfda.brand_name?.[0],
                generic_name: openfda.generic_name?.[0],
                manufacturer_name: openfda.manufacturer_name?.[0],
                purpose: result.purpose,
                warnings: result.warnings,
                active_ingredient: result.active_ingredient,
                adverse_reactions: result.adverse_reactions,
                indications_and_usage: result.indications_and_usage
            }

            setDrugData(info)

            // Extract body regions affected by side effects or indications
            const textToAnalyze = (info.adverse_reactions?.join(' ') + ' ' + info.warnings?.join(' ')).toLowerCase()
            const regions = extractAffectedRegions(textToAnalyze)
            setAffectedRegions(regions)

            // 3. Fetch Alternatives based on established Pharmacologic Class
            const epc = openfda.pharm_class_epc?.[0]
            if (epc) {
                fetch(`${import.meta.env.VITE_FDA_API_URL}/drug/label.json?search=openfda.pharm_class_epc.exact:"${epc}"&limit=10`)
                    .then(res => res.json())
                    .then(altData => {
                        const currentBrand = info.brand_name?.toUpperCase() || ''
                        const altNames = altData.results
                            .map((r: any) => r.openfda?.brand_name?.[0])
                            .filter((name: string) => name && name.toUpperCase() !== currentBrand)

                        const uniqueAlts = Array.from(new Set(altNames)).slice(0, 5)
                        setAlternatives(uniqueAlts as string[])
                    })
                    .catch(err => console.log('Could not fetch alternatives', err))
            }

        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="medinsight-standalone-wrapper">
            <nav className="medinsight-nav">
                <div className="container">
                    <Link to="/" className="nav-logo">
                        <Heart size={22} /> HealthVault
                    </Link>
                    <Link to="/" className="back-link">
                        Back to Home
                    </Link>
                </div>
            </nav>
            <div className="medinsight-page container">
                <div className="dash-header">
                    <div>
                        <h1 className="dash-title">MedInsight Explorer</h1>
                        <p className="dash-subtitle">Powered by official FDA Data. Search any medication to see its effects, active ingredients, and systemic impact.</p>
                    </div>
                </div>

                <div className="medinsight-search-box">
                    <form onSubmit={searchDrug} className="search-form">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search for a medication (e.g. Aspirin, Tylenol, Lisinopril)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            required
                        />
                        <button type="submit" className="search-btn" disabled={loading}>
                            {loading ? 'Searching...' : 'Analyze'}
                        </button>
                    </form>
                    {error && <div className="error-alert"><AlertTriangle size={16} /> {error}</div>}
                </div>

                {drugData && (
                    <div className="medinsight-results">
                        <div className="results-grid">
                            {/* LEFT COLUMN: Data */}
                            <div className="drug-data-panel">
                                <div className="drug-header">
                                    <div className="drug-icon-wrapper">
                                        <Pill size={32} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h2 className="drug-brand">{drugData.brand_name || query}</h2>
                                        <span className="drug-generic">{drugData.generic_name || 'Generic Name Unavailable'}</span>
                                    </div>
                                </div>

                                <div className="info-cards">
                                    <div className="info-card">
                                        <div className="card-lbl"><Building2 size={16} /> Manufacturer</div>
                                        <div className="card-val">{drugData.manufacturer_name || 'Unknown Manufacturer'}</div>
                                    </div>
                                    <div className="info-card">
                                        <div className="card-lbl"><Activity size={16} /> Active Ingredients</div>
                                        <div className="card-val">{drugData.active_ingredient?.[0] || 'Not specified'}</div>
                                    </div>
                                </div>

                                <div className="text-section">
                                    <h3><Info size={18} /> Indications & Usage</h3>
                                    <p>{drugData.indications_and_usage?.[0] || drugData.purpose?.[0] || 'No specific indications found in label.'}</p>
                                </div>

                                <div className="text-section warning-section">
                                    <h3><ShieldAlert size={18} color="#ef4444" /> Warnings & Adverse Reactions</h3>
                                    <div className="warning-scroll">
                                        <p>{drugData.warnings?.[0] || 'No general warnings found.'}</p>
                                        {drugData.adverse_reactions && (
                                            <>
                                                <strong>Side Effects:</strong>
                                                <p>{drugData.adverse_reactions[0]}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Body Map */}
                            <div className="body-map-panel">
                                <h3>Physiological Impact Map</h3>
                                <p className="map-desc">Highlights potential areas of side effects or interaction based on FDA clinical text.</p>

                                <div className="body-map-container">
                                    <BodyMap affectedRegions={affectedRegions} />
                                </div>

                                {affectedRegions.length > 0 ? (
                                    <div className="impact-legend">
                                        <span className="legend-lbl">Potential Impact Zones:</span>
                                        <div className="impact-tags">
                                            {affectedRegions.map(reg => (
                                                <span key={reg} className="impact-tag">{reg.toUpperCase()}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="impact-legend empty">No specific body systems identified in adverse reactions.</div>
                                )}

                                {/* ALTERNATIVES SECTION */}
                                {alternatives.length > 0 && (
                                    <div className="alternatives-section mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                                        <h4 className="legend-lbl" style={{ color: 'var(--primary)' }}>Similar Alternative Medications:</h4>
                                        <div className="impact-tags">
                                            {alternatives.map(alt => (
                                                <span
                                                    key={alt}
                                                    className="impact-tag alt-tag"
                                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-dark)', cursor: 'pointer', border: '1px solid var(--border)' }}
                                                    onClick={() => {
                                                        setQuery(alt)
                                                        // Hack to re-trigger search programmatically
                                                        document.querySelector<HTMLButtonElement>('.search-btn')?.click()
                                                    }}
                                                >
                                                    {alt}
                                                </span>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '8px', fontStyle: 'italic' }}>
                                            These medications share the same primary pharmacological class. Always consult your doctor before substituting medications.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!drugData && !loading && !error && (
                    <div className="medinsight-empty-state">
                        <div className="empty-icon-circle">
                            <Activity size={40} className="pulse-icon" />
                        </div>
                        <h3>Start Your Health Discovery</h3>
                        <p>Enter a drug name above to explore its FDA-approved label, active ingredients, and visualize its potential impact on the human body.</p>

                        <div className="suggestions">
                            <span>Try searching:</span>
                            <button onClick={() => setQuery('Ibuprofen')}>Ibuprofen</button>
                            <button onClick={() => setQuery('Lisinopril')}>Lisinopril</button>
                            <button onClick={() => setQuery('Atorvastatin')}>Atorvastatin</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
