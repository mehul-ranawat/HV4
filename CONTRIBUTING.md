# Contributing to HealthVault (HV4)

Welcome to the HealthVault project! We're excited to have you on board. Please follow these guidelines to ensure a smooth development workflow.

## Setting Up Your Local Environment

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root of the project (this file is git-ignored). 
   Add the following variables and ask the Lead Developer (Mehul Ranawat) for the actual secret values:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_FDA_API_URL=https://api.fda.gov
   VITE_GOOGLE_SHEET_URL=your_google_sheet_url_here
   VITE_GOOGLE_APPS_SCRIPT_URL=your_google_apps_script_url_here
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## Firebase CLI Workflow

We use Firebase for Hosting, Firestore, and Storage.

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```
   *Make sure you are logged in with the authorized account for the HealthVault project.*

3. **Deploying the Application**:
   Before deploying, ensure you have built the production bundle:
   ```bash
   npm run build
   ```
   Then, deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

4. **Updating Security Rules**:
   If you change `firestore.rules` or `storage.rules`, deploy them with:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

## Development Standards
- All code must pass existing ESLint rules.
- Maintain the 'Single Source of Truth' architecture.
- Always append the 'Proprietary / Internal Use' license header to new `.ts` and `.tsx` source files.
