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

interface BodyMapProps {
    affectedRegions: string[]
}

export default function BodyMap({ affectedRegions }: BodyMapProps) {
    const isAffected = (region: string) => affectedRegions.includes(region)

    const getStyle = (region: string) => ({
        fill: isAffected(region) || (region === 'joints' && isAffected('joints')) ? 'rgba(239, 68, 68, 0.4)' : '#e2e8f0',
        stroke: isAffected(region) || (region === 'joints' && isAffected('joints')) ? '#ef4444' : '#94a3b8',
        strokeWidth: 2.5,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        transition: 'all 0.4s ease',
    })

    // Refined geometric paths for a clean, medical-look human figure
    return (
        <svg viewBox="0 0 100 250" style={{ width: '100%', height: '100%', maxWidth: '220px', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.05))' }}>
            {/* Base Drop Shadow / Aura */}
            <circle cx="50" cy="90" r="85" fill="rgba(79, 70, 229, 0.04)" />

            <g>
                {/* Head */}
                <circle cx="50" cy="25" r="14" style={getStyle('head')} />

                {/* Neck / Throat */}
                <path d="M45,38 L55,38 L53,48 L47,48 Z" style={getStyle('throat')} />

                {/* Chest / Lungs / Heart */}
                <path d="M30,65 Q50,45 70,65 L65,95 Q50,105 35,95 Z" style={getStyle('chest')} />

                {/* Stomach / GI / Liver */}
                <path d="M35,95 Q50,105 65,95 L62,125 Q50,135 38,125 Z" style={getStyle('stomach')} />

                {/* Kidneys / Pelvis */}
                <path d="M38,125 Q50,135 62,125 L58,140 Q50,150 42,140 Z" style={getStyle('kidneys')} />

                {/* Left Arm (Joints/Skin) */}
                <path d="M30,65 Q15,80 12,110 L18,112 Q20,80 32,75 Z" style={getStyle('joints')} />

                {/* Right Arm (Joints/Skin) */}
                <path d="M70,65 Q85,80 88,110 L82,112 Q80,80 68,75 Z" style={getStyle('joints')} />

                {/* Left Leg (Joints/Skin) */}
                <path d="M42,140 Q35,180 30,230 L38,230 Q42,180 48,140 Z" style={getStyle('joints')} />

                {/* Right Leg (Joints/Skin) */}
                <path d="M58,140 Q65,180 70,230 L62,230 Q58,180 52,140 Z" style={getStyle('joints')} />
            </g>

            {/* Visual glowing indicators for vital affected regions */}
            {isAffected('head') && <circle cx="50" cy="25" r="20" fill="rgba(239, 68, 68, 0.2)" className="pulse" style={{ pointerEvents: 'none' }} />}
            {isAffected('throat') && <circle cx="50" cy="43" r="12" fill="rgba(239, 68, 68, 0.2)" className="pulse" style={{ pointerEvents: 'none' }} />}
            {isAffected('chest') && <circle cx="50" cy="80" r="24" fill="rgba(239, 68, 68, 0.2)" className="pulse" style={{ pointerEvents: 'none' }} />}
            {isAffected('stomach') && <circle cx="50" cy="110" r="18" fill="rgba(239, 68, 68, 0.2)" className="pulse" style={{ pointerEvents: 'none' }} />}
            {isAffected('kidneys') && <circle cx="50" cy="135" r="14" fill="rgba(239, 68, 68, 0.2)" className="pulse" style={{ pointerEvents: 'none' }} />}
        </svg>
    )
}
