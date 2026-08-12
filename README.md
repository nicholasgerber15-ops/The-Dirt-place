# The Dirt Place

FastAPI + React e-commerce site for The Dirt Place landscape materials.

## Quick Deploy on Render (Free)

1. Push this repo to GitHub.
2. In [Render](https://render.com), click **New → Blueprint** and connect the repo.
3. Render reads `render.yaml` and creates:
   - **Backend** web service (`dirt-place-backend`)
   - **Frontend** static site (`dirt-place-frontend`)
   - **MongoDB** database (`dirt-place-mongo`)
4. After creation, set the remaining secrets in the Render dashboard:
   - `QUICKBOOKS_CLIENT_ID`
   - `QUICKBOOKS_CLIENT_SECRET`
   - `QUICKBOOKS_COMPANY_ID`
   - `QUICKBOOKS_TOKEN_ENCRYPTION_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`

### Domains

- Frontend: `https://dirt-place-frontend.onrender.com`
- Backend: `https://dirt-place-backend.onrender.com`

### Local Development

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

# Frontend
cd frontend
npm install
npm start
```

## License

Proprietary — NRG-CO. All rights reserved.

## Mobile App (Capacitor)

The frontend is wrapped with Capacitor for native Android/iOS builds.

### Prerequisites

- Node.js 18+
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Build Commands

```bash
cd frontend

# Install dependencies
npm install

# Build web assets
npm run build

# Sync Capacitor platforms
npm run cap:sync

# Open Android Studio
npm run cap:open:android

# Open Xcode
npm run cap:open:ios
```

### Role Selection

On first launch, the mobile app prompts the user to select a role:
- **Customer** — standard shopping flow
- **Admin** — admin dashboard, inventory, settings
- **Driver** — delivery dashboard and calendar

The selected role is stored locally and used to route the app. To reset the role, clear the app data or use:

```bash
# In browser dev tools
localStorage.removeItem('mobile_role')
```

### Android Build

1. Run `npm run build:android`
2. In Android Studio, select **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. For Play Store, build a signed release bundle

### iOS Build

1. Run `npm run build:ios`
2. In Xcode, select a development team and build
3. Archive and upload to App Store Connect
