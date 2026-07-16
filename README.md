# Academy MVP — Online Lectures Platform

A minimal web app for a coaching academy's online classes. Admins post recorded and live lecture links; students browse and watch/join them.

**Tech stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Firebase Auth + Firestore

---

## Quick Start

### 1. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create a project** (or use an existing one).
2. **Enable Authentication:**
   - Go to **Authentication → Sign-in method → Email/Password** → Enable.
3. **Create Firestore Database:**
   - Go to **Firestore Database → Create database** → Start in **test mode** (you'll tighten rules later).
   - Choose a region close to your users.
4. **Get your Firebase config:**
   - Go to **Project Settings → General → Your apps → Web app** (click `</>` to add one if none exist).
   - Copy the config values.

### 2. Create the First Admin User

1. In Firebase Console → **Authentication → Add user** → enter your email and password.
2. Copy the **User UID** from the user row.
3. In Firebase Console → **Firestore → Start collection** → Collection ID: `users`
4. Add a document:
   - **Document ID**: Paste the User UID from step 2
   - Fields:
     | Field   | Type   | Value          |
     |---------|--------|----------------|
     | `email` | string | your@email.com |
     | `name`  | string | Your Name      |
     | `role`  | string | `admin`        |

### 3. Create Student Accounts

Repeat the same process as admin creation, but set `role` to `student`.

1. Add the student in **Authentication → Add user**.
2. Create a `users` document with their UID, setting `role: "student"`.

### 4. Local Development

```bash
# Clone the repo
git clone <your-repo-url>
cd academy-mvp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config values

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — student login  
Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) — admin login

### 5. Deploy to Vercel

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo.
3. In **Environment Variables**, add all the values from your `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Click **Deploy**. 

Vercel auto-deploys on every push to `main`.

---

## Firestore Security Rules (Recommended)

Once you're live, replace the default test-mode rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Subjects & lectures: any authenticated user can read
    match /subjects/{subjectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    match /lectures/{lectureId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    // Users: can read own doc, admin can read all
    match /users/{userId} {
      allow read: if request.auth != null 
        && (request.auth.uid == userId 
          || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── globals.css         # Global styles
│   ├── login/page.tsx      # Student login
│   ├── (student)/
│   │   ├── layout.tsx      # Protected student layout
│   │   ├── page.tsx        # Home — subject list
│   │   ├── subjects/[id]/  # Lectures for a subject
│   │   └── lectures/[id]/  # Video player / join live
│   └── admin/
│       ├── login/page.tsx  # Admin login
│       ├── layout.tsx      # Protected admin layout
│       ├── page.tsx        # Dashboard
│       ├── subjects/       # Manage subjects
│       ├── lectures/       # Manage lectures
│       └── students/       # View students
├── components/
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   └── LoadingSpinner.tsx
├── context/
│   └── AuthContext.tsx     # Auth state provider
└── lib/
    ├── firebase.ts         # Firebase init
    ├── auth.ts             # Auth helpers
    ├── firestore.ts        # Firestore CRUD
    └── types.ts            # TypeScript interfaces
```

---

## Environment Variables

All prefixed with `NEXT_PUBLIC_` so they're available client-side:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
