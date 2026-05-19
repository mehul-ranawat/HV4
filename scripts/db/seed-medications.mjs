import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('../credentials/healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to generate a random date in the past
const getRandomPastDate = (daysBack) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
    return d;
};

// Helper to generate a random date in the future
const getRandomFutureDate = (daysForward) => {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(Math.random() * daysForward));
    return d;
};

const MOCK_MEDICATIONS = [
    {
        name: 'Amoxil (Amoxicillin)',
        dosage: '500mg',
        frequency: 'Twice daily',
        timing: 'After food',
        condition: 'Bacterial Infection',
        refillStatus: 5, // days remaining
        status: 'Active',
    },
    {
        name: 'Lipitor (Atorvastatin)',
        dosage: '20mg',
        frequency: 'Once daily',
        timing: 'Night',
        condition: 'High Cholesterol',
        refillStatus: 14,
        status: 'Active',
    },
    {
        name: 'Glucophage (Metformin)',
        dosage: '850mg',
        frequency: 'Twice daily',
        timing: 'Before food',
        condition: 'Type 2 Diabetes',
        refillStatus: 3, // Low refill alert trigger
        status: 'Active',
    },
    {
        name: 'Zoloft (Sertraline)',
        dosage: '50mg',
        frequency: 'Once daily',
        timing: 'Morning',
        condition: 'Anxiety',
        refillStatus: 20,
        status: 'Active',
    },
    {
        name: 'Z-Pak (Azithromycin)',
        dosage: '250mg',
        frequency: 'Once daily',
        timing: 'After food',
        condition: 'Respiratory Infection',
        refillStatus: 0,
        status: 'Completed',
    }
];

const DOCTOR_NAMES = ['Dr. Sarah Jenkins', 'Dr. Michael Chen', 'Dr. Emily Carter', 'Dr. James Wilson'];

async function seedMedications() {
    console.log('Starting medication seeding...');
    try {
        // Get all users who are patients
        const usersSnapshot = await db.collection('users').where('role', '==', 'patient').get();
        console.log(`Found ${usersSnapshot.size} patients to seed.`);

        let addedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            // console.log(`Seeding medications for patient ${userId}...`);

            // For each patient, add the 5 mock medications
            for (let i = 0; i < MOCK_MEDICATIONS.length; i++) {
                const template = MOCK_MEDICATIONS[i];

                // Construct full medication document
                const medData = {
                    ...template,
                    userId: userId,
                    prescribingDoctor: DOCTOR_NAMES[Math.floor(Math.random() * DOCTOR_NAMES.length)],
                    startDate: getRandomPastDate(60), // Started sometime in the last 60 days
                };

                // Add end date if completed
                if (medData.status === 'Completed') {
                    medData.endDate = getRandomPastDate(5); // Ended recently
                }

                await db.collection('medications').add(medData);
                addedCount++;
            }
        }

        console.log(`Successfully added ${addedCount} medications across ${usersSnapshot.size} patients.`);

    } catch (error) {
        console.error('Error seeding medications:', error);
    }
}

seedMedications();
