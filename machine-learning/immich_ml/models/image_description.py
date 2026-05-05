from __future__ import annotations

from pathlib import Path
from typing import Any, cast

import numpy as np
import orjson
from huggingface_hub import snapshot_download
from PIL import Image

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelTask, ModelType

IMAGE_DESCRIPTION_PROMPT = """You are generating a concise searchable image record from computer vision outputs.

Use only visible evidence from the image. If estimating age, use broad apparent age groups only,
such as baby, child, teenager, young adult, adult, older adult, or unknown.

Return valid JSON with this schema:

{
  "description": "Two or three factual sentences about the main subject, activity, environment, and visible objects.",
  "people": [
    {
      "count": 1,
      "apparent_age_group": "adult | young adult | teenager | child | older adult | unknown",
      "activity": "visible activity",
      "confidence": "low | medium | high"
    }
  ],
  "environment": "indoor office, outdoor street, kitchen, store, vehicle interior, etc.",
  "objects": ["object1", "object2", "object3"],
  "visible_text": ["text visible in image, if any"],
  "context": "brief inferred context, only if visually supported",
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- Keep the description factual and searchable.
- Prefer concrete nouns over vague adjectives.
- Include brands, signage, screens, documents, uniforms, tools, vehicles, animals, food, and landmarks only when
  visible.
- Use 8 to 20 tags.
- Tags should be lowercase, short, and useful for search.
- Avoid moralizing language.
"""

NSFW_PROMPT_SUFFIX = """
The dedicated NSFW classifier flagged this image. If visible evidence supports it, include specific factual NSFW
reasons in the description and tags, such as nudity, naked, sex, explicit, or nsfw. If apparent age is uncertain around
NSFW content, use conservative tags such as nsfw_review rather than explicit age claims.
"""

MODEL_ALIASES = {
    "Qwen/Qwen2.5-VL-3B-Instruct": "llmware/qwen2.5-vl-3b-ov",
}


class ImageDescriptionModel(InferenceModel):
    depends = []
    identity = (ModelType.VISUAL, ModelTask.IMAGE_DESCRIPTION)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        self.hf_model_name = MODEL_ALIASES.get(model_name, model_name)
        self.device = str(model_kwargs.get("device", "AUTO") or "AUTO")
        self.nsfw = model_kwargs.get("nsfw")
        super().__init__(model_name, **model_kwargs)

    def configure(self, **kwargs: Any) -> None:
        if "device" in kwargs:
            device = str(kwargs["device"] or "AUTO")
            if device != self.device:
                log.warning("Ignoring image description device change until the model is reloaded.")
        if "nsfw" in kwargs:
            self.nsfw = kwargs["nsfw"]

    def _download(self) -> None:
        snapshot_download(self.hf_model_name, cache_dir=self.cache_dir, local_dir=self.cache_dir)

    def _load(self) -> Any:
        try:
            import openvino_genai
        except ImportError as error:
            raise ImportError("openvino-genai is required for image description models") from error

        return openvino_genai.VLMPipeline(str(self.cache_dir), self.device)

    def _predict(self, image: Image.Image, **model_kwargs: Any) -> dict[str, Any]:
        prompt = self._make_prompt()
        session = cast(Any, self.session)
        result = session.generate(
            prompt,
            images=[self._to_openvino_tensor(image)],
            generation_config=self._generation_config(),
        )
        text = self._result_text(result)
        return self._normalize_response(text)

    def _make_prompt(self) -> str:
        prompt = IMAGE_DESCRIPTION_PROMPT
        if isinstance(self.nsfw, dict) and self.nsfw.get("isNsfw"):
            prompt += NSFW_PROMPT_SUFFIX
        return prompt

    def _generation_config(self) -> Any:
        import openvino_genai

        config = openvino_genai.GenerationConfig()
        config.max_new_tokens = 768
        config.temperature = 0.0
        return config

    def _to_openvino_tensor(self, image: Image.Image) -> Any:
        from openvino import Tensor

        rgb = image.convert("RGB")
        image_data = np.array(rgb.getdata()).reshape(1, rgb.size[1], rgb.size[0], 3).astype(np.uint8)
        return Tensor(image_data)

    def _result_text(self, result: Any) -> str:
        texts = getattr(result, "texts", None)
        if isinstance(texts, list) and texts:
            return str(texts[0])
        return str(result)

    def _normalize_response(self, text: str) -> dict[str, Any]:
        data = self._parse_json(text)
        description = str(data.get("description") or "").strip()

        return {
            "description": description,
            "people": self._list_of_records(data.get("people")),
            "environment": str(data.get("environment") or "").strip(),
            "objects": self._list_of_strings(data.get("objects")),
            "visible_text": self._list_of_strings(data.get("visible_text")),
            "context": str(data.get("context") or "").strip(),
            "tags": self._list_of_strings(data.get("tags"))[:20],
        }

    def _parse_json(self, text: str) -> dict[str, Any]:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]

        try:
            parsed = orjson.loads(text)
            return parsed if isinstance(parsed, dict) else {}
        except orjson.JSONDecodeError:
            log.warning("Image description model returned invalid JSON; using raw text as description.")
            return {"description": text, "tags": []}

    def _list_of_strings(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    def _list_of_records(self, value: Any) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return []
        return [item for item in value if isinstance(item, dict)]

    @property
    def cached(self) -> bool:
        return self.cache_dir.exists() and any(self.cache_dir.iterdir())

    @property
    def model_path(self) -> Path:
        return self.cache_dir
