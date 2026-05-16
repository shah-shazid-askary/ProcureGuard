from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ProcureGuard API",
    description="AI-powered supply chain risk intelligence platform unifying fraud detection and compliance.",
    version="1.0.0"
)

# CORS configuration for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """
    Basic health check endpoint to verify the API is up.
    """
    return {"status": "healthy", "service": "ProcureGuard API"}

@app.get("/")
async def root():
    return {"message": "Welcome to the ProcureGuard API."}
