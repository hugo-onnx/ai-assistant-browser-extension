import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes.chat import router as chat_router
from app.models import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    settings = get_settings()
    logger.info("Starting wxo-proxy server")
    logger.info("WXO endpoint: %s", settings.wxo_api_endpoint)
    logger.info("WXO agent ID: %s", settings.wxo_agent_id)
    logger.info("WXO stream URL: %s", settings.wxo_stream_url)
    logger.info("CORS origins: %s", settings.cors_origins)
    yield
    logger.info("Shutting down wxo-proxy server")


app = FastAPI(
    title="watsonx Orchestrate Proxy",
    description="FastAPI proxy for IBM watsonx Orchestrate with streaming support",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(chat_router)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse()