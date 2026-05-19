const admin = require('firebase-admin');
const path = require('path');

// ── Init Admin SDK ──
const serviceAccount = require(path.join(__dirname, '../credentials', 'healthvault-hv4-12104-firebase-adminsdk-fbsvc-7f84465b61.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Data generators ──
const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advaith', 'Dhruv', 'Kabir', 'Ritvik', 'Aarush', 'Kayaan',
    'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Aarohi', 'Anvi', 'Prisha', 'Riya',
    'Saanvi', 'Anika', 'Navya', 'Avni', 'Kiara', 'Mira', 'Isha', 'Nisha', 'Tanya', 'Pooja',
    'Rahul', 'Amit', 'Priya', 'Neha', 'Rohan', 'Sneha', 'Vikram', 'Kavita', 'Manish', 'Deepa',
    'Rajesh', 'Sunita', 'Ankur', 'Megha', 'Karan', 'Nidhi', 'Gaurav', 'Swati', 'Harsh', 'Rekha',
    'Ajay', 'Sonal', 'Vishal', 'Ritu', 'Nikhil', 'Pallavi', 'Ashish', 'Divya', 'Mohit', 'Anjali',
    'Sachin', 'Komal', 'Tarun', 'Shweta', 'Pankaj', 'Jaya', 'Suresh', 'Meera', 'Dev', 'Lakshmi',
    'Raj', 'Bhavna', 'Siddharth', 'Sapna', 'Akash', 'Seema', 'Nilesh', 'Geeta', 'Prakash', 'Uma',
    'Rakesh', 'Kamala', 'Vijay', 'Rani', 'Arun', 'Madhu', 'Manoj', 'Radha', 'Sandeep', 'Lata',
    'Ramesh', 'Veena', 'Sunil', 'Durga', 'Naresh', 'Chitra', 'Dinesh', 'Hema', 'Yogesh', 'Padma',
    'Mukesh', 'Indira', 'Girish', 'Kalpana', 'Hitesh', 'Archana', 'Paresh', 'Vandana', 'Umesh', 'Nirmala',
    'Jatin', 'Sarita', 'Tushar', 'Manju', 'Kunal', 'Preeti', 'Chirag', 'Rashmi', 'Lalit', 'Smita',
    'Varun', 'Poonam', 'Nitin', 'Anu', 'Sameer', 'Usha', 'Hemant', 'Sushma', 'Brijesh', 'Chhaya',
    'Abhinav', 'Tanvi', 'Shubham', 'Kriti', 'Mayank', 'Shruti', 'Lokesh', 'Bhavika', 'Darshan', 'Mitali'
];

const lastNames = [
    'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Desai', 'Joshi', 'Mehta', 'Shah', 'Verma',
    'Reddy', 'Nair', 'Iyer', 'Rao', 'Pillai', 'Menon', 'Das', 'Roy', 'Kapoor', 'Malhotra',
    'Bhat', 'Chopra', 'Thakur', 'Saxena', 'Agarwal', 'Mishra', 'Pandey', 'Tiwari', 'Chauhan', 'Yadav'
];

const specializations = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'General Practice',
    'Neurology', 'Oncology', 'Ophthalmology', 'Orthopedics', 'Pediatrics',
    'Psychiatry', 'Pulmonology', 'Radiology', 'Urology', 'ENT'
];

const qualifications = [
    'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'MBBS, DM', 'MBBS, MCh',
    'MBBS, MD, DM', 'MBBS, MS, MCh', 'BDS, MDS'
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randAge(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function pad(n) { return String(n).padStart(3, '0'); }

async function seed() {
    console.log('🚀 Starting seed process...\n');

    const patientUids = [];
    const doctorUids = [];
    const credentials = [];

    // ── Create 100 patients ──
    console.log('📋 Creating 100 patient accounts...');
    for (let i = 1; i <= 100; i++) {
        const email = `patient${pad(i)}@healthvault.com`;
        const password = `Patient@${pad(i)}`;
        const firstName = firstNames[(i - 1) % firstNames.length];
        const lastName = lastNames[(i - 1) % lastNames.length];
        const displayName = `${firstName} ${lastName}`;

        try {
            let userRecord;
            try {
                userRecord = await admin.auth().getUserByEmail(email);
                console.log(`  ⏭️  Patient ${i} already exists: ${email}`);
            } catch {
                userRecord = await admin.auth().createUser({
                    email,
                    password,
                    displayName,
                    emailVerified: true,
                });
                console.log(`  ✅ Patient ${i}: ${email}`);
            }

            const uid = userRecord.uid;
            patientUids.push(uid);

            await db.collection('users').doc(uid).set({
                uid,
                email,
                displayName,
                role: 'patient',
                phone: `+91 ${9000000000 + i}`,
                age: randAge(18, 75),
                gender: i % 3 === 0 ? 'Female' : 'Male',
                bloodGroup: pick(bloodGroups),
                address: `${100 + i} Health Street, Mumbai`,
                assignedDoctors: [], // will be filled later
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            credentials.push({ role: 'patient', name: displayName, email, password });
        } catch (err) {
            console.error(`  ❌ Patient ${i} error:`, err.message);
        }
    }

    // ── Create 50 doctors ──
    console.log('\n👨‍⚕️ Creating 50 doctor accounts...');
    for (let i = 1; i <= 50; i++) {
        const email = `doctor${pad(i)}@healthvault.com`;
        const password = `Doctor@${pad(i)}`;
        const firstName = firstNames[(99 + i) % firstNames.length];
        const lastName = lastNames[(i + 10) % lastNames.length];
        const displayName = `Dr. ${firstName} ${lastName}`;

        try {
            let userRecord;
            try {
                userRecord = await admin.auth().getUserByEmail(email);
                console.log(`  ⏭️  Doctor ${i} already exists: ${email}`);
            } catch {
                userRecord = await admin.auth().createUser({
                    email,
                    password,
                    displayName,
                    emailVerified: true,
                });
                console.log(`  ✅ Doctor ${i}: ${email}`);
            }

            const uid = userRecord.uid;
            doctorUids.push(uid);

            await db.collection('users').doc(uid).set({
                uid,
                email,
                displayName,
                role: 'doctor',
                phone: `+91 ${8000000000 + i}`,
                specialization: specializations[(i - 1) % specializations.length],
                qualification: qualifications[(i - 1) % qualifications.length],
                experience: randAge(3, 25) + ' years',
                hospital: ['City Hospital', 'Apollo Health', 'Max Care', 'Fortis Medical', 'AIIMS'][i % 5],
                assignedPatients: [], // will be filled later
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            credentials.push({ role: 'doctor', name: displayName, email, password });
        } catch (err) {
            console.error(`  ❌ Doctor ${i} error:`, err.message);
        }
    }

    // ── Create admin account ──
    console.log('\n🛡️ Creating admin account...');
    try {
        let adminUser;
        try {
            adminUser = await admin.auth().getUserByEmail('admin@healthvault.com');
            console.log('  ⏭️  Admin already exists');
        } catch {
            adminUser = await admin.auth().createUser({
                email: 'admin@healthvault.com',
                password: 'Admin@2026',
                displayName: 'System Admin',
                emailVerified: true,
            });
            console.log('  ✅ Admin: admin@healthvault.com');
        }

        await db.collection('users').doc(adminUser.uid).set({
            uid: adminUser.uid,
            email: 'admin@healthvault.com',
            displayName: 'System Admin',
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        credentials.push({ role: 'admin', name: 'System Admin', email: 'admin@healthvault.com', password: 'Admin@2026' });
    } catch (err) {
        console.error('  ❌ Admin error:', err.message);
    }

    // ── Assign patient-doctor relationships ──
    console.log('\n🔗 Creating patient-doctor relationships...');
    for (let pi = 0; pi < patientUids.length; pi++) {
        // Each patient gets 1-2 doctors
        const numDoctors = 1 + Math.floor(Math.random() * 2);
        const assignedDocs = [];
        const usedIndexes = new Set();

        for (let d = 0; d < numDoctors; d++) {
            let di;
            do { di = Math.floor(Math.random() * doctorUids.length); } while (usedIndexes.has(di));
            usedIndexes.add(di);
            assignedDocs.push(doctorUids[di]);
        }

        // Update patient with assigned doctors
        await db.collection('users').doc(patientUids[pi]).update({
            assignedDoctors: assignedDocs,
        });

        // Update each doctor with this patient
        for (const docUid of assignedDocs) {
            await db.collection('users').doc(docUid).update({
                assignedPatients: admin.firestore.FieldValue.arrayUnion(patientUids[pi]),
            });
        }

        if ((pi + 1) % 20 === 0) console.log(`  ✅ Assigned ${pi + 1}/100 patients`);
    }

    // ── Store credentials in Firestore for admin view ──
    console.log('\n📝 Storing credentials for admin dashboard...');
    const batch1 = db.batch();
    for (let i = 0; i < credentials.length; i++) {
        const cred = credentials[i];
        const ref = db.collection('credentials').doc(cred.email.replace(/[^a-zA-Z0-9]/g, '_'));
        batch1.set(ref, cred);
        // Firestore batches max 500 operations
        if ((i + 1) % 400 === 0) {
            await batch1.commit();
            console.log(`  ✅ Committed batch at ${i + 1}`);
        }
    }
    await batch1.commit();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SEED COMPLETE!');
    console.log(`  Patients:  ${patientUids.length}`);
    console.log(`  Doctors:   ${doctorUids.length}`);
    console.log(`  Admin:     1`);
    console.log(`  Total:     ${credentials.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
}

seed().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
