# FastAPI app entry. Mount API routes; run with: uvicorn app.main:app --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.routes import router as itinerary_router

app = FastAPI(title="SquadSpot Itinerary API", version="0.2.0")

# Allow the local Expo/web development frontends.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    # Authentication uses Bearer tokens, not cross-site cookies.
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Core Application Endpoints
app.include_router(auth_router, prefix="/api")
app.include_router(itinerary_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Return readable validation errors to the frontend."""
    errors = exc.errors()
    error_messages = []

    for err in errors:
        field_name = err['loc'][-1] if err['loc'] else "field"
        error_msg = err['msg']
        error_messages.append(f"'{field_name}': {error_msg}")

    readable_detail = "Input verification failed -> " + ", ".join(error_messages)

    return JSONResponse(
        status_code=422,
        content={"detail": readable_detail}
    )
