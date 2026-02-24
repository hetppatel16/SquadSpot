# FastAPI app entry. Mount API routes; run with: uvicorn app.main:app --reload

from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(title="SquadSpot Itinerary API", version="0.1.0")
app.include_router(router)
