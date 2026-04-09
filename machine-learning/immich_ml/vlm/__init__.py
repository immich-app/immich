"""VLM (Vision Language Model) provider abstraction for Immich AI features."""

from .base import VLMProvider, ImageDescription, DateEstimate, SceneTag, VideoAnalysis, VideoHighlight, VideoChapter
from .ollama import OllamaProvider
from .openai_provider import OpenAIProvider
from .gemini import GeminiProvider
from .router import router as vlm_router

__all__ = [
    "VLMProvider",
    "ImageDescription",
    "DateEstimate",
    "SceneTag",
    "VideoAnalysis",
    "VideoHighlight",
    "VideoChapter",
    "OllamaProvider",
    "OpenAIProvider",
    "GeminiProvider",
    "vlm_router",
]
