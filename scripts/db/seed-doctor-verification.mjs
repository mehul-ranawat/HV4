import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('../credentials/healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const specializations = ['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Psychiatry', 'Oncology', 'Radiology', 'Ophthalmology'];

async function seedDoctorVerification() {
    console.log('Starting doctor verification seeding...');
    try {
        const doctorsSnapshot = await db.collection('users').where('role', '==', 'doctor').get();
        console.log(`Found ${doctorsSnapshot.size} doctors.`);

        let verifiedCount = 0;
        let pendingCount = 0;

        const docs = doctorsSnapshot.docs;

        for (let i = 0; i < docs.length; i++) {
            const userDoc = docs[i];
            const userId = userDoc.id;
            const existingData = userDoc.data();

            // Half verified, half pending
            const isVerified = i % 2 === 0;
            const spec = existingData.specialization || specializations[i % specializations.length];
            const licenseNumber = existingData.licenseNumber || `MED-${100000 + Math.floor(Math.random() * 900000)}`;

            await db.collection('users').doc(userId).update({
                isVerified,
                specialization: spec,
                licenseNumber
            });

            if (isVerified) {
                verifiedCount++;
                console.log(`  ✅ ${existingData.displayName || existingData.email} → VERIFIED (${spec}, ${licenseNumber})`);
            } else {
                pendingCount++;
                console.log(`  ⏳ ${existingData.displayName || existingData.email} → PENDING (${spec}, ${licenseNumber})`);
            }
        }

        console.log(`\nDone! ${verifiedCount} verified, ${pendingCount} pending.`);

    } catch (error) {
        console.error('Error seeding doctor verification:', error);
    }
}

seedDoctorVerification();
