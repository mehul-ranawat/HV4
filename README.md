# 🏥 HealthVault: Advanced Healthcare Management System

**Empowering patients and doctors with seamless medical history tracking, secure data management, and instant emergency profile access.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blueviolet?style=for-the-badge&logo=firebase)](https://healthvault-hv4-12104.web.app)

---

## 🚀 Overview

**HealthVault** is a modern, high-security healthcare platform designed to bridge the gap between patients and medical professionals. Built on a serverless architecture using **Firebase**, it provides a robust environment for managing medical records, appointment scheduling, and medication tracking, all while offering a life-saving **Emergency ID Card** system accessible via QR codes.

---

## 🛠️ Tech Stack

### **Core**
*   **Vite + React**: Next-generation frontend tooling and UI library.
*   **TypeScript**: Static typing for enhanced reliability and developer productivity.
*   **Firebase Ecosystem**:
    *   **Authentication**: Secure multi-role sign-in system.
    *   **Cloud Firestore**: Real-time NoSQL database for patient data.
    *   **Hosting**: Globally distributed production deployment.

### **Libraries & Integrations**
*   **Lucide React**: Premium icon set for a modern UI.
*   **Html2Canvas**: High-resolution export for Physical ID Cards.
*   **QrCode.React**: Dynamic QR generation for emergency access.
*   **Leaflet / React Leaflet**: Interactive maps for clinic locations.
*   **React Router**: Sophisticated client-side navigation.

![Core Architecture and Stack Overview](./docs/screenshots/architecture.png)

---

## ✨ Key Features

### **1. Unified Patient Dashboard**
*   **Medical Timeline**: View comprehensive health history in a clean, chronological feed.
*   **Medication Tracker**: Real-time monitoring of active dosages and frequency.
*   **Appointment Hub**: Seamless scheduling with assigned primary care doctors.

![Patient Dashboard Preview](./docs/screenshots/dashboard.png)

### **2. Emergency ID System (Life-Saving)**
*   **Dynamic QR Access**: Instant access to critical medical data (allergies, blood group) for first responders.
*   **Physical ID Export**: Generate CR-80 standard high-resolution ID cards ready for professional printing.
*   **Verified Profiles**: Secure data verification by healthcare providers.

![Emergency Card System](./docs/screenshots/emergency-card.png)

### **3. Doctor & Clinic Management**
*   **Patient Oversight**: Manage assigned patients, review charts, and update prescriptions.
*   **Appointment Workflow**: Track scheduled consultations and update appointment statuses in real-time.

![Doctor Management Interface](./docs/screenshots/doctor-interface.png)

### **4. Administrative Control**
*   **Role Management**: Securely provision accounts for Patients, Doctors, and Staff.
*   **System Integrity**: Complete oversight of global database records and audit trails.

![Admin Control Panel](./docs/screenshots/admin-panel.png)

---

## 📊 Data Schema (Cloud Firestore)

The project leverages a highly scalable NoSQL structure optimized for rapid retrieval and real-time updates.

| Collection | Description | Primary Fields |
| :--- | :--- | :--- |
| **`users`** | Core identities and role-specific health profiles. | `uid`, `displayName`, `role`, `bloodGroup`, `allergies`, `assignedPatients` (for doctors) |
| **`medications`** | Linked medication logs for individual patients. | `userId`, `name`, `dosage`, `frequency`, `status` (Active/Completed) |
| **`appointments`** | Transactional consultants records. | `patientId`, `doctorId`, `date`, `time`, `status`, `notes` |
| **`medical_records`** | Detailed health charts and historical logs. | `patientId`, `title`, `doctor`, `description`, `attachments` |

---

## ☁️ Deployment

This project is configured for continuous delivery via **Firebase Hosting**.

### **Prerequisites**
```bash
npm install -g firebase-tools
```

### **Steps to Deploy**
1.  **Build the Project**:
    ```bash
    npm run build
    ```
2.  **Login to Firebase**:
    ```bash
    firebase login
    ```
3.  **Initialize & Deploy**:
    ```bash
    firebase deploy --only hosting
    ```

## 👥 Contributors

* **Mehul Ranawat** - Lead Developer & Architect
* **Laxmi Nayakodi** - UI/UX Designer
* **Srushti Reddy** - Security Specialist
* **Sanket Deshmukh** - Data Engineering

---

## 📄 License

Designed and developed by the HealthVault Team. Internal Use / Proprietary.
