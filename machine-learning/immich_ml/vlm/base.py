"""Abstract base class for Vision Language Model providers."""

from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class ImageDescription(BaseModel):
    """AI-generated description of an image."""

    description: str = Field(..., description="Natural language description")
    objects: list[str] = Field(default_factory=list, description="Detected objects")
    scene: str = Field(default="", description="Scene classification")
    mood: str = Field(default="", description="Mood/atmosphere")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class DateEstimate(BaseModel):
    """AI-estimated date for an undated photo."""

    estimated_year: int | None = None
    estimated_decade: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    reasoning: str = ""
    signals: list[str] = Field(default_factory=list)


class SceneTag(BaseModel):
    """A scene/event tag with confidence."""

    tag: str
    confidence: float = Field(ge=0.0, le=1.0)
    category: str  # event, location, activity, weather, object, time_of_day


class VideoHighlight(BaseModel):
    """A highlighted segment of a video."""

    timestamp_ms: int
    duration_ms: int
    description: str
    score: float = Field(ge=0.0, le=1.0)


class VideoChapter(BaseModel):
    """A chapter marker in a video."""

    start_ms: int
    end_ms: int
    title: str
    description: str


class VideoAnalysis(BaseModel):
    """Complete AI analysis of video content."""

    summary: str
    highlights: list[VideoHighlight] = Field(default_factory=list)
    chapters: list[VideoChapter] = Field(default_factory=list)


# Scene taxonomy organized by category
SCENE_TAXONOMY: dict[str, list[str]] = {
    "event": [
        "birthday_party", "wedding", "graduation", "baby_shower", "anniversary",
        "christmas", "halloween", "thanksgiving", "easter", "new_years",
        "valentines_day", "fourth_of_july", "hanukkah", "eid", "diwali",
        "funeral", "baptism", "bar_mitzvah", "prom", "reunion",
        "concert", "festival", "parade", "carnival", "fair",
        "sports_game", "marathon", "ceremony", "award_show", "recital",
    ],
    "location": [
        "beach", "mountain", "forest", "lake", "river", "ocean",
        "desert", "park", "garden", "farm", "vineyard", "island",
        "city", "downtown", "suburb", "countryside", "village",
        "airport", "train_station", "hotel", "resort", "campsite",
        "restaurant", "cafe", "bar", "mall", "market",
        "museum", "church", "temple", "castle", "monument",
        "stadium", "gym", "pool", "playground", "zoo",
        "aquarium", "amusement_park", "ski_resort", "harbor", "bridge",
    ],
    "activity": [
        "hiking", "swimming", "skiing", "snowboarding", "surfing",
        "cycling", "running", "yoga", "dancing", "cooking",
        "baking", "gardening", "fishing", "camping", "kayaking",
        "rock_climbing", "scuba_diving", "horseback_riding", "golfing", "tennis",
        "reading", "painting", "crafting", "sewing", "photography",
        "gaming", "karaoke", "bowling", "ice_skating", "sledding",
        "picnic", "bbq", "road_trip", "sightseeing", "shopping",
        "studying", "working", "meeting", "presentation", "workshop",
    ],
    "weather": [
        "sunny", "cloudy", "rainy", "snowy", "foggy",
        "stormy", "windy", "rainbow", "sunset", "sunrise",
        "golden_hour", "blue_hour", "overcast", "clear_sky", "partly_cloudy",
    ],
    "object": [
        "food", "cake", "flowers", "car", "boat",
        "airplane", "bicycle", "motorcycle", "pet", "dog",
        "cat", "bird", "horse", "baby", "child",
        "group_photo", "selfie", "portrait", "landscape", "architecture",
        "artwork", "document", "screenshot", "meme", "receipt",
    ],
    "time_of_day": [
        "morning", "afternoon", "evening", "night",
        "dawn", "dusk", "midday", "midnight",
    ],
}

FLAT_TAXONOMY: list[str] = [tag for tags in SCENE_TAXONOMY.values() for tag in tags]


DESCRIBE_PROMPT = """Analyze this image and provide a detailed description. Return a JSON object with:
- "description": A natural, detailed 2-3 sentence description of the image
- "objects": Array of notable objects/subjects visible (e.g., ["dog", "frisbee", "park bench"])
- "scene": One-word scene type (e.g., "beach", "kitchen", "concert")
- "mood": One-word mood/atmosphere (e.g., "joyful", "serene", "dramatic")
- "confidence": Your confidence in the description from 0.0 to 1.0

Return ONLY valid JSON, no other text."""

DATE_ESTIMATE_PROMPT = """Analyze this photograph and estimate when it was taken. Look for visual clues:
- Fashion and hairstyles (clothing cuts, patterns, accessories)
- Technology visible (phones, computers, TVs, cars)
- Architecture and interior design styles
- Photo quality (film grain, resolution, color characteristics)
- Photo format clues (Polaroid borders, scalloped edges, rounded corners)
- Color palette (sepia, faded colors, Kodachrome saturation)
- Vehicles (car models and styles)

Return a JSON object with:
- "estimated_year": Best guess year (integer, or null if truly impossible)
- "estimated_decade": Decade string like "1980s", "2010s" (or null)
- "confidence": Your confidence from 0.0 to 1.0
- "reasoning": 1-2 sentence explanation of your reasoning
- "signals": Array of evidence signals (e.g., ["film_grain", "80s_fashion", "crt_television"])

Return ONLY valid JSON, no other text."""

SCENE_TAG_PROMPT = """Analyze this image and classify it with relevant tags from this taxonomy:
{taxonomy}

Return a JSON object with:
- "tags": Array of objects, each with:
  - "tag": The tag name from the taxonomy
  - "confidence": Confidence from 0.0 to 1.0
  - "category": The category the tag belongs to

Only include tags with confidence >= 0.5. Return ONLY valid JSON."""

VIDEO_ANALYSIS_PROMPT = """Analyze these video frames (in chronological order) and provide:
- "summary": A 2-3 sentence summary of the video content
- "highlights": Array of notable moments with:
  - "frame_index": Which frame (0-indexed) is most representative
  - "description": What's happening
  - "score": How interesting/notable this moment is (0.0-1.0)
- "chapters": Suggested chapter breaks with:
  - "start_frame": Starting frame index
  - "end_frame": Ending frame index
  - "title": Short chapter title
  - "description": What happens in this section

{transcription_context}

Return ONLY valid JSON."""


def parse_json_response(text: str) -> dict[str, Any]:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()
    # Try to extract from markdown code block
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return {}


class VLMProvider(ABC):
    """Abstract base class for Vision Language Model providers."""

    def __init__(self, model: str, **kwargs: Any) -> None:
        self.model = model
        self.max_tokens: int = kwargs.get("max_tokens", 1024)
        self.temperature: float = kwargs.get("temperature", 0.3)
        self.timeout: float = kwargs.get("timeout", 60.0)

    @abstractmethod
    async def _generate(self, prompt: str, images: list[bytes], **kwargs: Any) -> str:
        """Send prompt + images to the VLM and return raw text response."""
        ...

    async def describe_image(self, image: bytes, prompt: str | None = None) -> ImageDescription:
        """Generate a natural language description of an image."""
        raw = await self._generate(prompt or DESCRIBE_PROMPT, [image])
        data = parse_json_response(raw)
        return ImageDescription(
            description=data.get("description", raw[:500]),
            objects=data.get("objects", []),
            scene=data.get("scene", ""),
            mood=data.get("mood", ""),
            confidence=float(data.get("confidence", 0.7)),
        )

    async def estimate_date(self, image: bytes) -> DateEstimate:
        """Estimate when a photo was taken based on visual cues."""
        raw = await self._generate(DATE_ESTIMATE_PROMPT, [image])
        data = parse_json_response(raw)
        return DateEstimate(
            estimated_year=data.get("estimated_year"),
            estimated_decade=data.get("estimated_decade"),
            confidence=float(data.get("confidence", 0.3)),
            reasoning=data.get("reasoning", ""),
            signals=data.get("signals", []),
        )

    async def tag_scene(self, image: bytes, taxonomy: list[str] | None = None) -> list[SceneTag]:
        """Tag an image with scene/event categories."""
        tax = taxonomy or FLAT_TAXONOMY
        prompt = SCENE_TAG_PROMPT.format(taxonomy=", ".join(tax[:100]))
        raw = await self._generate(prompt, [image])
        data = parse_json_response(raw)
        tags = []
        for t in data.get("tags", []):
            try:
                tags.append(SceneTag(
                    tag=t["tag"],
                    confidence=float(t.get("confidence", 0.5)),
                    category=t.get("category", "object"),
                ))
            except (KeyError, ValueError):
                continue
        return tags

    async def analyze_video(
        self, frames: list[bytes], audio_text: str | None = None
    ) -> VideoAnalysis:
        """Analyze video frames (and optional transcription) for highlights/chapters."""
        ctx = ""
        if audio_text:
            ctx = f'Audio transcription: "{audio_text[:2000]}"'
        prompt = VIDEO_ANALYSIS_PROMPT.format(transcription_context=ctx)
        raw = await self._generate(prompt, frames)
        data = parse_json_response(raw)
        return VideoAnalysis(
            summary=data.get("summary", ""),
            highlights=[
                VideoHighlight(
                    timestamp_ms=h.get("frame_index", 0) * 2000,
                    duration_ms=h.get("duration_ms", 5000),
                    description=h.get("description", ""),
                    score=float(h.get("score", 0.5)),
                )
                for h in data.get("highlights", [])
            ],
            chapters=[
                VideoChapter(
                    start_ms=c.get("start_frame", 0) * 2000,
                    end_ms=c.get("end_frame", 0) * 2000,
                    title=c.get("title", ""),
                    description=c.get("description", ""),
                )
                for c in data.get("chapters", [])
            ],
        )
