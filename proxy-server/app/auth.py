import time
import logging
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class IAMTokenManager:
    """Manages IBM Cloud IAM bearer tokens with caching and auto-refresh."""

    def __init__(self) -> None:
        self._token: str | None = None
        self._expiry: float = 0.0

    def _is_token_valid(self) -> bool:
        if self._token is None:
            return False
        settings = get_settings()
        return time.time() < (self._expiry - settings.token_refresh_margin_seconds)

    async def get_token(self) -> str:
        """Return a valid bearer token, refreshing if needed."""
        if self._is_token_valid():
            return self._token

        settings = get_settings()
        logger.info("Refreshing IAM token...")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.iam_token_url,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                    "apikey": settings.ibm_api_key,
                },
            )
            response.raise_for_status()
            data = response.json()

        self._token = data["access_token"]
        self._expiry = data["expiration"]

        logger.info(
            "IAM token refreshed, expires at %s (in %.0f seconds)",
            time.strftime("%H:%M:%S", time.localtime(self._expiry)),
            self._expiry - time.time(),
        )
        return self._token

    def invalidate(self) -> None:
        """Force token refresh on next call."""
        self._token = None
        self._expiry = 0.0


token_manager = IAMTokenManager()