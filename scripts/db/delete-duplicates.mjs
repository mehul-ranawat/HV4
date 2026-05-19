import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('../credentials/healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json', 'utf8'));

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}
const db = getFirestore();

async function run() {
    const apptsSnap = await db.collection('appointments').get();
    const appts = [];
    apptsSnap.forEach(doc => {
        appts.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Found ${appts.length} appointments.`);

    // Group by patientId + doctorId + date string (YYYY-MM-DD)
    const grouped = {};
    for (const appt of appts) {
        const d = appt.date.toDate();
        const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const key = `${appt.patientId}_${appt.doctorId}_${dateStr}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(appt);
    }

    let deletedCount = 0;
    for (const key in grouped) {
        const group = grouped[key];
        if (group.length > 1) {
            console.log(`Found ${group.length} duplicates for ${key}. Deleting extras...`);
            // Keep the first one, delete the rest
            for (let i = 1; i < group.length; i++) {
                await db.collection('appointments').doc(group[i].id).delete();
                deletedCount++;
            }
        }
    }

    console.log(`Deleted ${deletedCount} duplicate appointments. Cleanup complete!`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
