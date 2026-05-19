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

export const BODY_PARTS = [
    { id: 'head', name: 'Head / Brain', keywords: ['headache', 'dizziness', 'migraine', 'confusion', 'stroke', 'insomnia', 'vision', 'ears', 'hearing'] },
    { id: 'throat', name: 'Neck / Throat', keywords: ['sore throat', 'swelling', 'thyroid', 'cough', 'hoarseness'] },
    { id: 'chest', name: 'Heart / Lungs', keywords: ['chest pain', 'palpitations', 'heart', 'pulmonary', 'breathing', 'asthma', 'bronchitis', 'respiratory', 'lungs'] },
    { id: 'stomach', name: 'Stomach / GI', keywords: ['nausea', 'vomiting', 'diarrhea', 'constipation', 'ulcer', 'stomach', 'gastric', 'abdominal', 'indigestion', 'liver'] },
    { id: 'kidneys', name: 'Kidneys / Urinary', keywords: ['kidney', 'urinary', 'renal', 'bladder', 'urine'] },
    { id: 'joints', name: 'Joints / Muscles', keywords: ['joint', 'muscle', 'ache', 'arthritis', 'cramps', 'weakness', 'back pain'] },
    { id: 'skin', name: 'Skin', keywords: ['rash', 'itching', 'hives', 'redness', 'swelling on face', 'lips', 'tongue', 'sweating'] },
]

export function extractAffectedRegions(text: string): string[] {
    if (!text) return []
    const lowerText = text.toLowerCase()
    const affected = new Set<string>()

    BODY_PARTS.forEach(part => {
        part.keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                affected.add(part.id)
            }
        })
    })

    return Array.from(affected)
}
