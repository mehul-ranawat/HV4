// seed-epitrack.mjs
// Adds city, lat, lng, and medical conditions to existing patients for EpiTrack demo
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('../credentials/healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json', 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Indian city pool with coordinates
const cities = [
    { city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { city: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { city: 'Pune', lat: 18.5204, lng: 73.8567 },
    { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { city: 'Surat', lat: 21.1702, lng: 72.8311 },
]

// Disease pool — realistic spread to make clusters visible
const diseasePools = {
    'Mumbai': ['Diabetes', 'Hypertension', 'Dengue', 'Malaria', 'Asthma'],
    'Delhi': ['Diabetes', 'Hypertension', 'Dengue', 'Air Pollution-related Asthma', 'Typhoid'],
    'Bangalore': ['Diabetes', 'Hypertension', 'Dengue', 'Chikungunya', 'Thyroid Disorder'],
    'Hyderabad': ['Diabetes', 'Hypertension', 'Dengue', 'Malaria', 'Kidney Disease'],
    'Chennai': ['Diabetes', 'Dengue', 'Hypertension', 'Leptospirosis', 'Cholera'],
    'Kolkata': ['Malaria', 'Dengue', 'Diabetes', 'Tuberculosis', 'Cholera'],
    'Pune': ['Diabetes', 'Hypertension', 'Dengue', 'Swine Flu', 'Leptospirosis'],
    'Ahmedabad': ['Diabetes', 'Hypertension', 'Dengue', 'Malaria', 'Chikungunya'],
    'Jaipur': ['Diabetes', 'Hypertension', 'Malaria', 'Dengue', 'Typhoid'],
    'Surat': ['Dengue', 'Malaria', 'Diabetes', 'Hypertension', 'Chikungunya'],
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function getConditions(city) {
    const pool = diseasePools[city] || diseasePools['Mumbai']
    // Pick 1-3 conditions, weighted toward the first (most prevalent)
    const count = Math.floor(Math.random() * 2) + 1
    const conditions = []
    for (let i = 0; i < count; i++) {
        // Higher probability for first 2 diseases (cluster-forming)
        const weighted = Math.random() < 0.6 ? pool[Math.floor(Math.random() * 2)] : randomFrom(pool)
        if (!conditions.includes(weighted)) conditions.push(weighted)
    }
    return conditions.join(', ')
}

async function seed() {
    // Get all users
    const snapshot = await db.collection('users').where('role', '==', 'patient').get()

    if (snapshot.empty) {
        console.log('No patients found in database.')
        return
    }

    console.log(`Found ${snapshot.docs.length} patients. Seeding...`)

    const batch = db.batch()
    let count = 0

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data()

        // Pick a city (but keep existing if set)
        const cityData = data.city ? cities.find(c => c.city === data.city) || randomFrom(cities) : randomFrom(cities)

        // Build update — don't overwrite fields that already have data
        const update = {}

        if (!data.city) update.city = cityData.city
        if (!data.lat) update.lat = cityData.lat + (Math.random() - 0.5) * 0.15  // small offset within city
        if (!data.lng) update.lng = cityData.lng + (Math.random() - 0.5) * 0.15

        // Add medical history if missing
        if (!data.medicalHistory || data.medicalHistory === '') {
            const city = update.city || data.city || cityData.city
            update.medicalHistory = getConditions(city)
        }

        if (!data.bloodGroup) update.bloodGroup = randomFrom(bloodGroups)
        if (!data.age) update.age = String(Math.floor(Math.random() * 45) + 20) // 20-65

        if (Object.keys(update).length > 0) {
            batch.update(docSnap.ref, update)
            count++
            console.log(`  → ${data.displayName || data.email}: city=${update.city || data.city}, conditions=${update.medicalHistory || data.medicalHistory}`)
        }
    }

    await batch.commit()
    console.log(`\n✅ Seeded ${count} patients successfully.`)
}

seed().catch(console.error)
