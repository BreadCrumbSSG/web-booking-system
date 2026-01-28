# Ride Booking Web App

A full-stack ride booking app using React, Node.js/Express, Postgres (Docker), and Google Maps.

## Features
- Google Maps with Places Autocomplete and directions
- Inputs for pickup/destination and swap button
- Fare estimation for 3 ride categories (Economy, Premium, XL)
- Book rides and store in Postgres
- History of recent bookings

## Prereqs
- Node.js 18+
- Docker Desktop (for Postgres)
- Google Maps API key with Maps JavaScript API + Places API enabled

## Quick Start

1) Start Postgres via Docker

```powershell
cd "c:\Users\BreadSSG\Desktop\web booking system"
docker compose up -d db
```

2) Backend

```powershell
cd "c:\Users\BreadSSG\Desktop\web booking system\backend"
copy .env.example .env
npm install
npm run dev
```

3) Frontend

```powershell
cd "c:\Users\BreadSSG\Desktop\web booking system\frontend"
copy .env.example .env
# Edit .env to set your VITE_GOOGLE_MAPS_API_KEY and optional VITE_GOOGLE_MAPS_ID
npm install
npm run dev
```

Open http://localhost:5173

## Configuration
- Backend env: `backend/.env`
  - `DATABASE_URL=postgres://app:app@localhost:5432/bookings`
  - `PORT=4000`
  - `ALLOW_ORIGIN=http://localhost:5173`
- Frontend env: `frontend/.env`
  - `VITE_GOOGLE_MAPS_API_KEY=...`
  - `VITE_GOOGLE_MAPS_ID=...` (optional)
  - `VITE_BACKEND_URL=http://localhost:4000`
  - `VITE_MAPS_LANGUAGE=en` (optional)
  - `VITE_MAPS_REGION=CA` (Canada-first; Autocomplete restricted to Canada and map biased within Canadian bounds)
  - Tailwind is integrated for styling; edit `styles.css` and use utility classes in components.

## API
- GET /api/health
- GET /api/bookings (latest 50)
- POST /api/bookings body: { pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, distance_km, duration_min, category, fare }
- GET /api/fare?category=economy&distanceKm=10&durationMin=20

## Notes
- Docker all-in-one (frontend + backend + db)

```powershell
cd "c:\Users\BreadSSG\Desktop\web booking system"
docker compose up -d --build
# Frontend served at http://localhost:5173 (Nginx)
# Backend available via http://localhost:4000 (direct) or proxied at http://localhost:5173/api
```

- Fares are estimated. Adjust rules in backend `src/index.js` and frontend `src/App.jsx` for your business logic.
- You can secure CORS and configure production builds as needed.