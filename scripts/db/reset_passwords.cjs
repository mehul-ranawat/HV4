const admin = require('firebase-admin');
const path = require('path');

// ── Init Admin SDK ──
const serviceAccount = require(path.join(__dirname, '../credentials', 'healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function resetPasswords() {
    console.log('🚀 Starting password reset process...\n');

    try {
        const credsSnap = await db.collection('credentials').get();
        const credentials = credsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`📋 Found ${credentials.length} credentials to update...`);

        let updatedCount = 0;
        const batch = db.batch();

        for (let cred of credentials) {
            const newPassword = cred.role === 'admin' ? 'admin123' : '123456';

            try {
                // Update Auth
                const userRecord = await admin.auth().getUserByEmail(cred.email);
                await admin.auth().updateUser(userRecord.uid, {
                    password: newPassword
                });

                // Update Firestore credentials
                const ref = db.collection('credentials').doc(cred.id);
                batch.update(ref, { password: newPassword });

                updatedCount++;
                if (updatedCount % 20 === 0) {
                    console.log(`  ✅ Updated ${updatedCount}/${credentials.length} passwords...`);
                }
            } catch (err) {
                console.error(`  ❌ Failed to update ${cred.email}:`, err.message);
            }
        }

        console.log('\n📝 Committing changes to Firestore...');
        await batch.commit();

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ PASSWORD RESET COMPLETE! Successfully updated ${updatedCount} users.`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('Fatal error:', error);
    }

    process.exit(0);
}

resetPasswords();
