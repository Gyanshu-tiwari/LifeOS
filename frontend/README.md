# 🌐 LIFEOS Frontend

The modern web and mobile-responsive frontend for the **LIFEOS** agentic AI platform. Built with React 18, Vite, TypeScript, Tailwind CSS, TanStack React Query, and MapLibre GL.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **State & Data Fetching**: TanStack React Query v5
- **Authentication**: Firebase Client SDK (Email/Password & JWT)
- **Maps**: MapLibre GL (with self-hosted worker pipeline)
- **Deployment**: Vercel SPA configuration

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your Firebase client credentials in `.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Run Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 4. Build for Production

```bash
npm run build
```

Production artifacts are output to `dist/`.

---

## 📂 Project Structure

```text
frontend/src/
├── api/             # Axios client & typed API services (activities, plans, tasks, notifications)
├── auth/            # Firebase authentication service & React auth context
├── components/      # Reusable UI components
│   ├── layout/      # AppLayout, PlanLayout, Navigation
│   ├── map/         # JourneyMap, StartingLocationBox
│   ├── notifications/# NotificationsPopover & badges
│   └── ui/          # Skeletons, ErrorState, EmptyState
├── context/         # Toast and Notification contexts
├── hooks/           # Custom React Query hooks (usePlan, useTasks, useRoute, etc.)
├── pages/           # Route views (Home, Dashboard, Create, Journey, Places, Tasks, Packing, Profile, etc.)
└── types/           # Strongly typed data models matching backend schemas
```

---

## 🧪 Testing

Run end-to-end automated headless browser verification:

```bash
node scripts/e2e_full_validation.mjs
node scripts/verify-map-flow.mjs
node scripts/test-current-location.mjs
```
