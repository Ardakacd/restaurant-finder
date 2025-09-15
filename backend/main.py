import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from functionalities.auth import router as auth_router
from functionalities.search import router as search_router
from functionalities.favorites import router as favorites_router
from fastapi.exceptions import RequestValidationError
from exceptions import auth_validation_handler
from database import init_db

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Restaurant Finder API", version="1.0.0")

logger.info("Starting Restaurant Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RequestValidationError, auth_validation_handler)

app.include_router(auth_router)
app.include_router(search_router)
app.include_router(favorites_router)

try:
    init_db()
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize database: {e}", exc_info=True)
    raise

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Restaurant Finder API is running!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
