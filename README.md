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
