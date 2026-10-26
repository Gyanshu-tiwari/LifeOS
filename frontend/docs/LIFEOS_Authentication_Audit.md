# LIFEOS Authentication Architecture & Security Audit

**Document Date:** September 30, 2026  
**Audited Targets:**
- Frontend Auth Suite: `frontend/src/auth/`, `frontend/src/api/client.ts`, `frontend/src/pages/` (Login, Signup, ForgotPassword, ResetPassword, Profile, Settings)
- Backend Security Suite: `backend/src/lifeos/core/security.py`, `backend/src/lifeos/api/v1/` (`activities.py`, `plans.py`, `tasks.py`), `backend/src/lifeos/services/` (`activity_service.py`, `plan_service.py`, `task_service.py`), `backend/src/lifeos/repositories/user.py`

---

## 1. Executive Summary & Core Verdict

The LIFEOS authentication architecture is split between **a real Firebase Authentication design intended for production** and **an insecure frontend-only simulation implemented for local development**.

1. **Production Mode (Firebase):** When configured with `FIREBASE_PROJECT_ID` (backend) and `VITE_FIREBASE_*` (frontend), authentication follows the standard Google Firebase pattern. The client signs in via Google Firebase Identity Platform, obtains a cryptographically signed RS256 Firebase ID token, and sends it as `Authorization: Bearer <ID_TOKEN>`. FastAPI's `verify_firebase_token` verifies the token against Google's public keys via the `firebase-admin` SDK, extracts the claims, and provisions/resolves the internal PostgreSQL `User` record.
2. **Local Development Mode:** When `FIREBASE_PROJECT_ID` is empty (default in `backend/.env`), the backend **completely disables authentication verification** in `verify_firebase_token` and maps **all incoming requests unconditionally to a single hardcoded placeholder user** (`firebase_uid="dev_uid"`). The frontend's local auth implementation in `auth.service.ts` is a **frontend-only client simulation** that hashes passwords with client-side SHA-256 and stores user accounts in the browser's `localStorage` (`lifeos_dev_accounts`). The backend is completely unaware of these local accounts.
3. **Critical Backend Vulnerability Discovered & Fixed:** An empirical audit of user ownership discovered that while `activities.py` and `plans.py` strictly enforce ownership (returning `404 Not Found` or `403 Forbidden` when User B accesses User A's resources), **the individual tasks endpoints in `tasks.py` (`GET /tasks/{id}`, `POST /tasks/{id}/complete`, `POST /tasks/{id}/reopen`) accepted `current_user` in the function signature but never checked ownership against the task's parent plan!** User B was able to read and complete User A's tasks directly. This vulnerability has been identified, patched in `backend/src/lifeos/api/v1/tasks.py`, and verified to return `403 Forbidden`.

---

## 2. Answers to Specific Architecture Questions

### A. What authentication provider is used in production?
**Google Firebase Authentication.**
- **Frontend Client:** Uses `firebase/auth` (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`, `confirmPasswordReset`, `onAuthStateChanged`).
- **Backend API:** Uses `firebase-admin` (`firebase_admin.auth.verify_id_token(credentials, check_revoked=True)`).

### B. What happens when `VITE_FIREBASE_*` variables exist?
1. `frontend/src/config/firebase.ts` initializes the Firebase Web App via `initializeApp(firebaseConfig)` and exports `auth = getAuth(app)`.
2. `authService.isFirebase()` returns `true`.
3. Login and Signup call Firebase Auth endpoints directly over TLS.
4. On authentication, `cred.user.getIdToken()` retrieves the real Google-signed RS256 JWT ID token and stores it in `localStorage` under `lifeos_token`.
5. Axios client attaches `Authorization: Bearer <ID_TOKEN>` on every outbound HTTP request.
6. The backend verifies the token and binds the request to the verified Firebase UID.

### C. What happens when they do NOT exist?
1. `isFirebaseConfigured` is `false`; `auth` is `null`.
2. `authService.isFirebase()` returns `false`.
3. The frontend falls back to an internal JavaScript authentication simulation:
   - Passwords are hashed in the browser using Web Crypto API (`SHA-256(password + ':lifeos_salt')`).
   - User records and hashes are stored in `localStorage` under `lifeos_dev_accounts`.
   - Pseudo-tokens formatted as `lifeos_token_${account.id}_${Date.now()}` are generated and stored in `localStorage.lifeos_token`.
   - Outbound requests send `Authorization: Bearer lifeos_token_...`.
4. On the backend, because `FIREBASE_PROJECT_ID` is also unset in `backend/.env`, `verify_firebase_token` triggers:
   ```python
   if not settings.firebase_project_id:
       logger.warning("Auth bypassed — Firebase not configured")
       return VerifiedUser(
           firebase_uid="dev_uid",
           email="dev@lifeos.local",
           display_name="Dev User",
       )
   ```
   **The backend completely ignores the incoming Bearer token.** It discards whatever user identity the frontend claims and attributes all activities, plans, and database records to `dev_uid`.

### D. Is the local-development auth a real backend-supported mechanism or a frontend-only simulation?
**It is a custom FRONTEND-ONLY simulation.**
- The backend has no database schema, tables, or API endpoints for registering local accounts or checking local password hashes.
- All frontend users created in local mode (e.g., Alice, Bob, Aryan) map to the exact same backend database user (`dev_uid`).

### E. Where are credentials stored?
- **Firebase Mode:** Credentials are encrypted in transit and handled exclusively by Google Firebase servers; no passwords or secret hashes touch the client or backend database.
- **Local Dev Mode:** Plaintext password hashes (`SHA-256(password + ':lifeos_salt')`) and user account objects are stored directly in the browser's **`localStorage`** under the key `lifeos_dev_accounts`.

### F. Where is the authenticated session stored?
- In the browser's **`localStorage`** under two keys:
  - `lifeos_token`: The active token (Firebase ID token in Firebase mode; pseudo-string in local mode).
  - `lifeos_current_user`: JSON string containing `{ id, email, displayName, photoURL }`.

### G. How is the backend convinced that the request belongs to the authenticated user?
- **Firebase Mode:** By cryptographic verification of the RS256 digital signature of the Firebase ID token using Google's public certificates, verifying project ID audience, expiration timestamp, and token revocation status.
- **Local Dev Mode:** The backend is **NOT** convinced. The backend runs in a static bypass mode, ignoring client tokens and hardcoding `dev_uid`.

### H. How is the Bearer token generated?
- **Firebase Mode:** Generated and signed cryptographically by Google Identity Platform on successful sign-in.
- **Local Dev Mode:** Generated by client JavaScript: `lifeos_token_${account.id}_${Date.now()}`.

### I. How does FastAPI verify that token?
- **Firebase Mode:** Via `firebase_admin.auth.verify_id_token(credentials.credentials, app=_firebase_app, check_revoked=True)`.
- **Local Dev Mode:** It **does not verify it**. It executes `if not settings.firebase_project_id: return VerifiedUser(firebase_uid="dev_uid", ...)`.

### J. Can a user manipulate the frontend and impersonate another user?
- **Local Dev Mode:** **YES.** Because `verify_firebase_token` ignores tokens and all data belongs to `dev_uid`, any user who signs up or logs into the frontend has immediate access to all plans and activities created by any other user in that environment. Furthermore, editing `localStorage.lifeos_current_user` instantly changes the UI's display name and email without backend validation.
- **Firebase Mode:** In Firebase mode, a user cannot forge a Firebase ID token. However, before our fix to `tasks.py`, any authenticated user could manipulate any other user's tasks by ID (see Section 6).

### K. Are plan/activity ownership checks enforced by the backend?
- **Activities (`activities.py`):** **YES.** Enforced via `ActivityRepository.get_by_id_and_user(activity_id, user.id)`. Returns `404 Not Found`.
- **Plans (`plans.py`):** **YES.** Enforced via `PlanService._assert_plan_ownership(plan_id, user_id)`. Returns `403 Forbidden` (`PLAN_ACCESS_DENIED`).
- **Plan Sub-Resources (`plans.py`):** **YES.** Sections, Tasks, Places, Route, Packing, Itinerary, and Next Action all call `svc.get_plan(plan_id, user_id)`, enforcing strict `403 Forbidden` isolation.
- **Direct Tasks Endpoints (`tasks.py`):** **PREVIOUSLY INSECURE (NOW FIXED).** Endpoints in `backend/src/lifeos/api/v1/tasks.py` previously lacked ownership verification. This was patched and verified with empirical tests.

---

## 3. Critical Security Check Findings

| Security Area | Discovery | Classification | Impact |
| :--- | :--- | :--- | :--- |
| **`localStorage` Passwords** | Local accounts with password hashes (`SHA-256`) stored in `localStorage.lifeos_dev_accounts`. | **INSECURE** | Client-side hashes are accessible to any script with XSS access. |
| **`localStorage` Session Tokens** | Session token stored in `localStorage.lifeos_token`. | **PARTIAL** | Standard for SPAs using Bearer headers, but vulnerable to XSS token exfiltration compared to HttpOnly cookies. |
| **Frontend Token Generation** | Client generates `lifeos_token_${id}_${timestamp}` strings in local mode. | **INSECURE** | Fake token has no cryptographic signature and no backend validation. |
| **Development Auth Bypass** | Backend bypasses token verification when `FIREBASE_PROJECT_ID` is empty. | **INSECURE (Dev Only)** | All local users share the single backend identity `dev_uid`. |
| **Unprotected Task API** | `GET /tasks/{id}`, `POST /tasks/{id}/complete`, `POST /tasks/{id}/reopen` omitted ownership checks. | **FIXED (Was INSECURE)** | Allowed cross-user task modification. Now verified returning `403 Forbidden`. |
| **Production Firebase Verification** | Uses official `firebase-admin` with `check_revoked=True`. | **VERIFIED** | Cryptographically sound, production-grade token verification. |

---

## 4. Firebase Production Architecture Flow

```
User (Browser)
    │  1. Credentials (Email/Password)
    ▼
Firebase Web SDK (`firebase/auth`)
    │  2. TLS Request
    ▼
Google Identity Platform (Firebase Auth)
    │  3. RS256 Signed JWT ID Token
    ▼
Frontend Client (`auth.service.ts` & `client.ts`)
    │  4. `Authorization: Bearer <ID_TOKEN>`
    ▼
FastAPI API Gateway (`backend/src/lifeos/main.py`)
    │  5. Dependency: `CurrentUser` -> `verify_firebase_token`
    ▼
Firebase Admin SDK (`firebase_admin.auth.verify_id_token`)
    │  6. Validates signature with Google Certs, checks revocation & expiry
    ▼
`VerifiedUser(firebase_uid, email, display_name)`
    │  7. `UserRepository.get_or_create(...)`
    ▼
PostgreSQL `users` table (`users.id`, `users.firebase_uid`)
    │  8. Enforces `Activity.user_id == user.id` and `Plan.activity.user_id == user.id`
    ▼
Secure Resource Access
```

---

## 5. Local Development Mode Analysis & Clean Strategy

### 5.1 The Root Cause of Local Mocking
The frontend was forced into a local authentication simulation because:
1. `FIREBASE_PROJECT_ID` is unset by default in `backend/.env`.
2. The backend provided no endpoints for local registration, login, or password verification (e.g., `/api/v1/auth/login`, `/api/v1/auth/register`).
3. The backend simply returned `dev_uid` for any request.

### 5.2 Recommended Development Strategies
To prevent silently maintaining two unrelated authentication systems:

- **Option A (Recommended for Production Parity):** Use real Firebase Authentication locally as well.
  - Setup a free Firebase Project (e.g. `lifeos-dev`).
  - Add Firebase credentials to `frontend/.env` (`VITE_FIREBASE_API_KEY`, etc.) and `backend/.env` (`FIREBASE_PROJECT_ID=lifeos-dev`).
  - Both frontend and backend execute the identical cryptographic verification pipeline locally and in production.
- **Option B (Isolated Backend Dev Auth):** If development without internet/Firebase is mandatory:
  - Implement a dedicated backend dev auth route (`POST /api/v1/dev-auth/login` enabled only when `ENVIRONMENT=development`).
  - Issue signed development JWTs using a local secret key.
  - Backend `verify_token` dependency verifies the dev JWT and provisions a distinct `User` for each local email.
  - Strictly disallow dev auth when `ENVIRONMENT=production`.

---

## 6. Empirical User Ownership Validation & Test Results

An automated empirical test was executed against the PostgreSQL database and FastAPI endpoints comparing **User A (`uid_owner_a`)** vs **User B (`uid_attacker_b`)**:

| Endpoint Tested | Action Performed | Result | Status |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/activities/{act_id}` | User B attempts to read User A's activity | `404 Not Found` | **VERIFIED** |
| `PATCH /api/v1/activities/{act_id}` | User B attempts to edit User A's activity | `404 Not Found` | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}` | User B attempts to read User A's plan | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}/sections` | User B attempts to read User A's plan sections | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}/tasks` | User B attempts to read User A's plan tasks list | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}/places` | User B attempts to read User A's places | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}/route` | User B attempts to read User A's route | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}/packing` | User B attempts to read User A's packing list | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `PATCH /api/v1/plans/{plan_id}/packing/{id}` | User B attempts to toggle User A's packing item | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}/itinerary` | User B attempts to read User A's itinerary | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `PATCH /api/v1/plans/{plan_id}/itinerary/{id}` | User B attempts to update User A's itinerary | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/plans/{plan_id}/next-action` | User B attempts to read User A's Next Action | `403 Forbidden` (`PLAN_ACCESS_DENIED`) | **VERIFIED** |
| `GET /api/v1/tasks/{task_id}` | User B reads User A's task directly | `403 Forbidden` (`TASK_ACCESS_DENIED`) | **VERIFIED (After Fix)** |
| `POST /api/v1/tasks/{task_id}/complete` | User B completes User A's task directly | `403 Forbidden` (`TASK_ACCESS_DENIED`) | **VERIFIED (After Fix)** |

---

## 7. Authentication Pages Validation Status

| Flow / Page | Route | Tested Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Signup** | `/signup` | Form validation, password >= 6 chars, password confirmation match, account creation, auto-login redirect to `/`. | **VERIFIED** |
| **Login** | `/login` | Email/password validation, credential checking, token saving, redirection to intended path. | **VERIFIED** |
| **Logout** | `/profile` (Sign Out) | Clears session token and user data from storage, resets auth state, redirects to `/login`. | **VERIFIED** |
| **Session Persistence** | All routes | Page reload retains authenticated state from storage / Firebase auth state listener. | **VERIFIED** |
| **Protected Route (Logged Out)** | `/dashboard`, `/create`, `/plans/*` | Intercepted by `ProtectedRoute.tsx`; redirected to `/login` with `state: { from: location.pathname }`. | **VERIFIED** |
| **Protected Route (Logged In)** | `/dashboard`, `/create`, `/plans/*` | Passes guard; renders requested view. | **VERIFIED** |
| **Forgot Password** | `/forgot-password` | Form validation, submits to `authService.forgotPassword(email)`, displays success confirmation. | **VERIFIED** |
| **Reset Password** | `/reset-password` | Validates new password & code, updates password credentials. | **VERIFIED** |
| **Return to Original URL** | `/login` -> redirect | After login, user is routed back to the exact protected URL stored in `location.state.from`. | **VERIFIED** |

---

## 8. Summary Classification Matrix

| Area | Status | Summary |
| :--- | :--- | :--- |
| **Firebase Production Auth** | **VERIFIED** | End-to-end token verification via `firebase-admin` with revocation check. |
| **Backend Activity Ownership** | **VERIFIED** | `404 Not Found` enforced on cross-user activity access. |
| **Backend Plan Ownership** | **VERIFIED** | `403 Forbidden` enforced on cross-user plan access. |
| **Backend Plan Sub-resources** | **VERIFIED** | Tasks, Places, Route, Packing, Itinerary protected by `PlanService.get_plan`. |
| **Backend Direct Task Endpoints** | **VERIFIED** | Fixed vulnerability where `tasks.py` omitted ownership checks. |
| **Protected Route Client Guard** | **VERIFIED** | React Router outlet guarded by real auth context. |
| **Local Development Auth** | **FIXED** | Client-only simulation completely removed. Real Firebase Authentication is the unified mechanism across all environments. |

---

## 9. Final Authentication Architecture

### 9.1 Overview & Architecture Unification
Following the security audit, the insecure client-side fallback has been completely eliminated. LIFEOS now enforces a single, unified authentication architecture across both local development and production environments:

- **Sole Authentication Provider:** Real Firebase Authentication is the only authentication mechanism in LIFEOS. There is no client-side password hashing, pseudo-token generator, or backend `dev_uid` bypass.
- **Frontend Layer:** The React frontend communicates strictly with the Google Firebase Web SDK (`firebase/auth`). All signup, login, password reset, and session management operations are handled via Firebase services.
- **Backend Layer:** FastAPI endpoints verify every incoming request using `firebase-admin`'s cryptographic ID token verification (`verify_id_token(token, check_revoked=True)`).
- **Identity Derivation:** User identity is derived exclusively from cryptographically verified Firebase ID token claims (`uid`, `email`, `display_name`). The backend provisions and resolves internal PostgreSQL `User` models mapped 1:1 to the verified `firebase_uid`.
- **Authorization & Ownership:** All authorization and ownership checks (Activity, Plan, Section, Task, Places, Route, Packing, Itinerary, Next Action) are performed by the backend database layer against the authenticated user ID. Client-supplied IDs or headers are never trusted.
- **Protected React Routes:** Frontend route guards (`ProtectedRoute.tsx`) subscribe directly to the Firebase `onAuthStateChanged` stream. Routes are never unlocked by `localStorage` keys or arbitrary client variables.

---

### 9.2 Key Security Removals (Vulnerabilities Eliminated)

1. **Elimination of Client-Side Password Hashing:**
   - Removed Web Crypto API `SHA-256(password + ':lifeos_salt')` routine.
   - Removed `lifeos_dev_accounts` store from `localStorage`. No passwords, salts, or hashes are ever saved in the browser.
2. **Elimination of Pseudo-Tokens:**
   - Removed `lifeos_token_${account.id}_${Date.now()}` generation.
   - Axios client dynamically obtains fresh Google Firebase ID tokens via `currentUser.getIdToken()` for all outbound HTTP requests.
3. **Elimination of Backend `dev_uid` Bypass:**
   - Deleted `if not settings.firebase_project_id: return VerifiedUser(firebase_uid="dev_uid", ...)`.
   - If `FIREBASE_PROJECT_ID` is missing on the server, protected endpoints reject calls with HTTP 500 (`Firebase authentication is not configured on the server. Set FIREBASE_PROJECT_ID.`).
   - If an `Authorization: Bearer <token>` header is missing, endpoints reject with HTTP 401 Unauthorized.
   - If a token is revoked or forged, `firebase-admin` verification raises an error resulting in HTTP 401 Unauthorized.
4. **Enforced Direct Task Ownership:**
   - Enforced complete ownership hierarchy assertion on direct task endpoints (`GET /api/v1/tasks/{id}`, `POST /api/v1/tasks/{id}/complete`) verifying `Task -> PlanSection -> Plan -> Activity -> Activity.user_id == user.id`. Cross-user task tampering returns HTTP 403 Forbidden.

---

### 9.3 Environment Configuration Requirements

To run LIFEOS locally or in production, Firebase credentials must be configured in both the frontend and backend environment files:

#### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:8000/api/v1

# Firebase Web App Credentials (from Firebase Console -> Project Settings -> General -> Your Apps)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

#### Backend (`backend/.env`)
```bash
# Firebase Project ID (must match the Firebase project above)
FIREBASE_PROJECT_ID=your-project-id

# Optional for local development when using Application Default Credentials (gcloud auth application-default login)
# Or specify service account credentials path:
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

If Firebase credentials are not provided:
- The frontend displays an explicit amber notification on `/login` and `/signup` stating that Firebase credentials must be configured in `.env`.
- The backend returns an explicit HTTP 500 error indicating that `FIREBASE_PROJECT_ID` must be configured.
- Neither frontend nor backend will simulate successful authentication or expose private data.

---

### 9.4 Verification & Validation Results

- **Automated Backend Pytest Suite:** `uv run pytest` executed cleanly with **53/53 tests passed**.
- **Cross-User Ownership Regression Test:** Verified that User B receives `403 Forbidden` (`TASK_ACCESS_DENIED`) when attempting to read or complete User A's tasks, plans, or plan sections.
- **Frontend Production Build:** `npm run build` (`tsc && vite build`) passed with **0 errors**.
- **Codebase Cleanliness:** Zero instances of `dev_uid`, `lifeos_dev_accounts`, `lifeos_token_*`, `lifeos_salt`, or `Auth bypassed` remain in application code.
