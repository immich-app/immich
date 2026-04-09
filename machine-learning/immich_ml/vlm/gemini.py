"""Google Gemini VLM provider."""

from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from .base import VLMProvider

log = logging.getLogger("ml.vlm.gemini")

DEFAULT_API_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-2.0-flash"


class GeminiProvider(VLMProvider):
    """Google Generative AI (Gemini) provider."""

    def __init__(self, model: str = DEFAULT_MODEL, **kwargs: Any) -> None:
        super().__init__(model, **kwargs)
        self.api_key: str = kwargs.get("api_key", "")
        self.base_url = kwargs.get("url", DEFAULT_API_URL).rstrip("/")
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(self.timeout, connect=10.0),
            )
        return self._client

    async def _generate(self, prompt: str, images: list[bytes], **kwargs: Any) -> str:
        """Call Gemini generateContent with inline image data."""
        parts: list[dict[str, Any]] = []
        for img in images:
            b64 = base64.b64encode(img).decode("utf-8")
            parts.append({
                "inline_data": {"mime_type": "image/jpeg", "data": b64},
            })
        parts.append({"text": prompt})

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": kwargs.get("temperature", self.temperature),
                "maxOutputTokens": kwargs.get("max_tokens", self.max_tokens),
                "responseMimeType": "text/plain",
            },
        }

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"

        try:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                return "".join(p.get("text", "") for p in parts)
            return ""
        except httpx.TimeoutException:
            log.error(f"Gemini request timed out after {self.timeout}s")
            raise
        except httpx.HTTPStatusError as e:
            log.error(f"Gemini HTTP error: {e.response.status_code} {e.response.text[:200]}")
            raise

    async def is_available(self) -> bool:
        """Check if the API key is valid."""
        if not self.api_key:
            return False
        try:
            url = f"{self.base_url}/models?key={self.api_key}"
            resp = await self.client.get(url)
            return resp.status_code == 200
        except Exception:
            return False

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
