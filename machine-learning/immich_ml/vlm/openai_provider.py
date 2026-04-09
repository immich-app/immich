"""OpenAI VLM provider — supports GPT-4V, GPT-4o, and compatible APIs."""

from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from .base import VLMProvider

log = logging.getLogger("ml.vlm.openai")

DEFAULT_API_URL = "https://api.openai.com/v1"
DEFAULT_MODEL = "gpt-4o-mini"


class OpenAIProvider(VLMProvider):
    """OpenAI-compatible provider (works with OpenAI, Azure, and local proxies)."""

    def __init__(self, model: str = DEFAULT_MODEL, **kwargs: Any) -> None:
        super().__init__(model, **kwargs)
        self.api_key: str = kwargs.get("api_key", "")
        self.base_url = kwargs.get("url", DEFAULT_API_URL).rstrip("/")
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout, connect=10.0),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def _generate(self, prompt: str, images: list[bytes], **kwargs: Any) -> str:
        """Call OpenAI chat completions with vision."""
        content: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
        for img in images:
            b64 = base64.b64encode(img).decode("utf-8")
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "auto"},
            })

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": kwargs.get("max_tokens", self.max_tokens),
            "temperature": kwargs.get("temperature", self.temperature),
        }

        try:
            response = await self.client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except httpx.TimeoutException:
            log.error(f"OpenAI request timed out after {self.timeout}s")
            raise
        except httpx.HTTPStatusError as e:
            log.error(f"OpenAI HTTP error: {e.response.status_code} {e.response.text[:200]}")
            raise
        except (KeyError, IndexError) as e:
            log.error(f"Unexpected OpenAI response format: {e}")
            raise

    async def is_available(self) -> bool:
        """Check if the API key is valid."""
        if not self.api_key:
            return False
        try:
            resp = await self.client.get("/models")
            return resp.status_code == 200
        except Exception:
            return False

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
