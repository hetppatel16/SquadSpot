<<<<<<< HEAD
# SquadSpot

AI-powered group outing planner – find the perfect itinerary for your squad.

## Project Structure

```
SquadSpot/
├── frontend/     ← React Native (Expo) mobile app
│   ├── src/
│   ├── App.js
│   └── package.json
├── backend/      ← Python/FastAPI itinerary recommendation engine
│   ├── app/
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Frontend (React Native)

```bash
cd frontend
npm install
npx expo start
```

## Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env         # configure your env variables
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/itinerary` | Generate optimized itinerary |
| GET | `/api/pois` | List all points of interest |
| GET | `/api/health` | Health check |
=======
# SquadSpot
>>>>>>> e2b28618bdd98982f2e5a6bd90244a967e693b91
