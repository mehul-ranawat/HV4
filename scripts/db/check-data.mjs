import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('../credentials/healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function check() {
    try {
        const userRecord = await auth.getUserByEmail('patient001@healthvault.com');
        console.log('User UID:', userRecord.uid);

        const doctorsQuery = await db.collection('users').where('assignedPatients', 'array-contains', userRecord.uid).get();
        console.log('Assigned Doctors count:', doctorsQuery.size);

        const apptsQuery = await db.collection('appointments').where('patientId', '==', userRecord.uid).get();
        console.log('Appointments count:', apptsQuery.size);
        apptsQuery.forEach(doc => console.log('Appointment:', doc.id, doc.data()));

    } catch (e) {
        console.error(e);
    }
}
check();
