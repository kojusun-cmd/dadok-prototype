# Pending API Integrations

## 1. Partner Signup
- **File:** `assets/js/script.js`
- **Function:** `handlePartnerSignupSubmit`
- **Status:** **Firebase Auth & Firestore Integration Complete.** `createUserWithEmailAndPassword` is used alongside Firestore `partners` collection.
- **Next Step:** No further immediate action required unless migrating off Firebase to a Custom REST Backend.

## 2. Partner Login
- **File:** `assets/js/script.js`
- **Function:** `handlePartnerMockLogin`
- **Status:** **Firebase Auth & Firestore Integration Complete.** `signInWithEmailAndPassword` loads partner status and updates UI seamlessly.
- **Next Step:** No further immediate action required unless migrating off Firebase.

## 3. Partner Dashboard Payload (Stats & Profile)
- **File:** `assets/js/script.js`
- **Function:** `loadPartnerDashboardStats`, `populateDashboardFromPartner`
- **Status:** Function `loadPartnerDashboardStats()` returns dynamic Mock Promises simulating a fetch of Dashboard data payload format.
- **Next Step:** Replace `loadPartnerDashboardStats()` dummy payload JSON mock with actual server fetch when dedicated back-end reporting/stats APIs are live.

*(Current Agent Context Reminder: Always check this file for pending API requests and prompt the user to complete them once the endpoints become available.)*
