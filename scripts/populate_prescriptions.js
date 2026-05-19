import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin using the found service account key
const serviceAccount = JSON.parse(fs.readFileSync('scripts/credentials/healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "healthvault-hv4-12104"
});

const db = admin.firestore();

const IMAGES_DIR = 'temp_prescriptions/data';
const MAX_FILE_SIZE = 600 * 1024; // 600KB to ensure base64 stays under 1MB Firestore limit

async function run() {
  console.log('--- Prescription Population Script ---');

  // 1. Get all patients
  console.log('Fetching patients...');
  const usersSnap = await db.collection('users').where('role', '==', 'patient').get();
  const patients = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`Found ${patients.length} patients.`);

  // 2. Get all valid images
  console.log('Scanning images...');
  const files = fs.readdirSync(IMAGES_DIR);
  const validImages = files.filter(file => {
    const stats = fs.statSync(path.join(IMAGES_DIR, file));
    return stats.size <= MAX_FILE_SIZE && (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'));
  });
  console.log(`Found ${validImages.length} images under ${MAX_FILE_SIZE / 1024}KB.`);

  if (validImages.length === 0) {
    console.error('No valid images found! Check the directory.');
    return;
  }

  // 3. Populate
  console.log('Starting population...');
  let totalAdded = 0;

  for (const patient of patients) {
    // Check if patient already has random prescriptions to avoid duplicates on retry
    const existing = await db.collection('healthRecords')
      .where('userId', '==', patient.id)
      .where('description', '==', 'Randomly assigned handwritten prescription for testing.')
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`Skipping patient ${patient.displayName || patient.id} (already has prescriptions).`);
      continue;
    }

    // Random number of prescriptions (2-5)
    const count = Math.floor(Math.random() * 4) + 2; 
    console.log(`Adding ${count} prescriptions for patient ${patient.displayName || patient.id}...`);

    for (let i = 0; i < count; i++) {
      const randomIdx = Math.floor(Math.random() * validImages.length);
      const filename = validImages[randomIdx];
      const filePath = path.join(IMAGES_DIR, filename);
      
      const fileData = fs.readFileSync(filePath, { encoding: 'base64' });
      const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const stats = fs.statSync(filePath);

      await db.collection('healthRecords').add({
        userId: patient.id,
        fileName: `Prescription_${i + 1}_${filename}`,
        fileType: mimeType,
        fileSize: stats.size,
        category: 'Prescription',
        description: 'Randomly assigned handwritten prescription for testing.',
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        fileData: `data:${mimeType};base64,${fileData}`
      });
      totalAdded++;
    }
  }

  console.log(`--- Finished! Added ${totalAdded} prescriptions total ---`);
}

run().catch(console.error);
