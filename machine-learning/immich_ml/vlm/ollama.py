"""Ollama VLM provider — supports LLaVA, Qwen2-VL, MiniCPM-V, and other vision models."""

from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from .base import VLMProvider

log = logging.getLogger("ml.vlm.ollama")

DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llava"

# Models known to support vision
VISION_MODELS = {"llava", "llava:13b", "llava:34b", "qwen2-vl", "minicpm-v", "llava-phi3", "moondream"}


class OllamaProvider(VLMProvider):
    """Ollama provider for local VLM inference."""

    def __init__(self, model: str = DEFAULT_MODEL, **kwargs: Any) -> None:
        super().__init__(model, **kwargs)
        self.base_url = kwargs.get("url", DEFAULT_OLLAMA_URL).rstrip("/")
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout, connect=10.0),
            )
        return self._client

    async def _generate(self, prompt: str, images: list[bytes], **kwargs: Any) -> str:
        """Call Ollama /api/generate with images encoded as base64."""
        encoded_images = [base64.b64encode(img).decode("utf-8") for img in images]

        payload = {
            "model": self.model,
            "prompt": prompt,
            "images": encoded_images,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", self.temperature),
                "num_predict": kwargs.get("max_tokens", self.max_tokens),
            },
        }

        try:
            response = await self.client.post("/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except httpx.TimeoutException:
            log.error(f"Ollama request timed out after {self.timeout}s")
            raise
        except httpx.HTTPStatusError as e:
            log.error(f"Ollama HTTP error: {e.response.status_code} {e.response.text[:200]}")
            raise
        except httpx.ConnectError:
            log.error(f"Cannot connect to Ollama at {self.base_url}")
            raise

    async def is_available(self) -> bool:
        """Check if Ollama is reachable and the model is loaded."""
        try:
            resp = await self.client.get("/api/tags")
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                base_model = self.model.split(":")[0]
                return any(base_model in m for m in models)
        except Exception:
            pass
        return False

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
