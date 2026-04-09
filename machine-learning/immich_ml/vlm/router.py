"""FastAPI router for VLM endpoints — mounted in main.py."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from ..config import settings
from .base import DateEstimate, ImageDescription, SceneTag, VideoAnalysis, VLMProvider
from .gemini import GeminiProvider
from .ollama import OllamaProvider
from .openai_provider import OpenAIProvider

log = logging.getLogger("ml.vlm.router")

router = APIRouter(prefix="/vlm", tags=["vlm"])

_provider_instance: VLMProvider | None = None


def get_provider() -> VLMProvider:
    """Get or create the configured VLM provider singleton."""
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    provider = settings.vlm_provider
    model = settings.vlm_model
    kwargs = {
        "api_key": settings.vlm_api_key,
        "url": settings.vlm_url,
        "max_tokens": settings.vlm_max_tokens,
        "temperature": settings.vlm_temperature,
        "timeout": settings.vlm_timeout,
    }

    if provider == "ollama":
        _provider_instance = OllamaProvider(model=model or "llava", **kwargs)
    elif provider == "openai":
        _provider_instance = OpenAIProvider(model=model or "gpt-4o-mini", **kwargs)
    elif provider == "gemini":
        _provider_instance = GeminiProvider(model=model or "gemini-2.0-flash", **kwargs)
    else:
        raise ValueError(f"Unknown VLM provider: {provider}")

    log.info(f"VLM provider initialized: {provider} / {_provider_instance.model}")
    return _provider_instance


@router.post("/describe")
async def describe_image(
    image: Annotated[UploadFile, File()],
    prompt: Annotated[str | None, Form()] = None,
) -> ImageDescription:
    """Generate AI description of an uploaded image."""
    vlm = get_provider()
    data = await image.read()
    return await vlm.describe_image(data, prompt=prompt)


@router.post("/date-estimate")
async def estimate_date(
    image: Annotated[UploadFile, File()],
) -> DateEstimate:
    """Estimate when a photo was taken based on visual cues."""
    vlm = get_provider()
    data = await image.read()
    return await vlm.estimate_date(data)


@router.post("/scene-tags")
async def tag_scene(
    image: Annotated[UploadFile, File()],
) -> list[SceneTag]:
    """Tag an image with scene/event categories."""
    vlm = get_provider()
    data = await image.read()
    return await vlm.tag_scene(data)


@router.post("/video-analysis")
async def analyze_video(
    frames: Annotated[list[UploadFile], File()],
    audio_text: Annotated[str | None, Form()] = None,
) -> VideoAnalysis:
    """Analyze video frames for highlights and chapters."""
    vlm = get_provider()
    frame_data = [await f.read() for f in frames]
    return await vlm.analyze_video(frame_data, audio_text=audio_text)


@router.get("/health")
async def vlm_health() -> dict:
    """Check if the VLM provider is available."""
    try:
        vlm = get_provider()
        available = await vlm.is_available()
        return {
            "status": "ok" if available else "unavailable",
            "provider": settings.vlm_provider,
            "model": vlm.model,
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
