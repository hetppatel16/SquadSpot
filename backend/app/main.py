# FastAPI app entry. Mount API routes; run with: uvicorn app.main:app --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.routes import router as itinerary_router

app = FastAPI(title="SquadSpot Itinerary API", version="0.2.0")

# Allow requests from React Native (Expo dev server / mobile device)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Application Endpoints
app.include_router(auth_router, prefix="/api")
app.include_router(itinerary_router) 


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """
    Catches Pydantic validation errors (like invalid EmailStr formats), 
    pulls out the exact field name, and returns a clean, human-readable 
    text sentence back to the frontend application.
    """
    errors = exc.errors()
    error_messages = []
    
    for err in errors:
        # Loc targets the broken variable name, e.g., ("body", "email")
        field_name = err['loc'][-1] if err['loc'] else "field"
        error_msg = err['msg']
        error_messages.append(f"'{field_name}': {error_msg}")
        
    readable_detail = "Input verification failed -> " + ", ".join(error_messages)
    
    return JSONResponse(
        status_code=422,
        content={"detail": readable_detail}
    )