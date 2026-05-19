import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('../credentials/healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const mockProfiles = [
    {
        bloodGroup: 'A+',
        allergies: 'Penicillin, Peanuts',
        medicalHistory: 'Hypertension, Asthma',
        emergencyContactName: 'Jane Doe',
        emergencyContactRelation: 'Spouse',
        emergencyContactPhone: '555-0101',
        phone: '555-0100',
        address: '123 Main St, Springfield',
        insuranceProvider: 'BlueCross BlueShield',
        insuranceId: 'BCBS-123456',
        age: 45,
        gender: 'Male'
    },
    {
        bloodGroup: 'O-',
        allergies: 'Latex',
        medicalHistory: 'Type 2 Diabetes',
        emergencyContactName: 'John Smith',
        emergencyContactRelation: 'Brother',
        emergencyContactPhone: '555-0201',
        phone: '555-0200',
        address: '456 Elm St, Springfield',
        insuranceProvider: 'Aetna',
        insuranceId: 'AET-789012',
        age: 32,
        gender: 'Female'
    },
    {
        bloodGroup: 'B+',
        allergies: '',
        medicalHistory: 'None',
        emergencyContactName: 'Mary Johnson',
        emergencyContactRelation: 'Mother',
        emergencyContactPhone: '555-0301',
        phone: '555-0300',
        address: '789 Oak Ave, Springfield',
        insuranceProvider: 'Cigna',
        insuranceId: 'CIG-345678',
        age: 28,
        gender: 'Female'
    }
];

async function seedProfiles() {
    console.log('Starting profile seeding...');
    try {
        // Get all users who are patients
        const usersSnapshot = await db.collection('users').where('role', '==', 'patient').get();
        console.log(`Found ${usersSnapshot.size} patients to seed.`);

        let updatedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            // Pick a random mock profile
            const randomProfile = mockProfiles[Math.floor(Math.random() * mockProfiles.length)];

            // Only update fields that the user document might not have
            await db.collection('users').doc(userId).update({
                bloodGroup: randomProfile.bloodGroup,
                allergies: randomProfile.allergies,
                medicalHistory: randomProfile.medicalHistory,
                emergencyContactName: randomProfile.emergencyContactName,
                emergencyContactRelation: randomProfile.emergencyContactRelation,
                emergencyContactPhone: randomProfile.emergencyContactPhone,
                phone: randomProfile.phone,
                address: randomProfile.address,
                insuranceProvider: randomProfile.insuranceProvider,
                insuranceId: randomProfile.insuranceId,
                age: randomProfile.age, // Fallback if missing
                gender: randomProfile.gender, // Fallback if missing
            });

            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} profiles.`);

    } catch (error) {
        console.error('Error seeding profiles:', error);
    }
}

seedProfiles();
