import asyncio
import base64
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Any

from PIL import Image

from .config import log, settings
from .models.cache import ModelCache
from .models.transforms import decode_pil
from .schemas import ModelTask, ModelType
from .stream_consumer import WorkRequest, WorkResult


class BatchProcessor:
    """Processes batches of ML work requests."""

    def __init__(self, model_cache: ModelCache, thread_pool: ThreadPoolExecutor | None = None):
        self.model_cache = model_cache
        self.thread_pool = thread_pool

    async def process(self, task_type: str, batch: list[WorkRequest]) -> list[WorkResult]:
        """Process a batch of requests for a given task type."""
        if task_type == "clip":
            return await self._process_clip_batch(batch)
        elif task_type == "face":
            return await self._process_face_batch(batch)
        elif task_type == "ocr":
            return await self._process_ocr_batch(batch)
        else:
            raise ValueError(f"Unknown task type: {task_type}")

    async def _run(self, func: Any, *args: Any, **kwargs: Any) -> Any:
        """Run a function in the thread pool if available."""
        if self.thread_pool is None:
            return func(*args, **kwargs)
        partial_func = partial(func, *args, **kwargs)
        return await asyncio.get_running_loop().run_in_executor(self.thread_pool, partial_func)

    async def _load_images(self, batch: list[WorkRequest]) -> list[tuple[WorkRequest, Image.Image | None]]:
        """Load images for a batch of requests in parallel."""
        async def load_single(request: WorkRequest) -> tuple[WorkRequest, Image.Image | None]:
            try:
                with open(request.image_path, "rb") as f:
                    image_data = f.read()
                image = await self._run(decode_pil, image_data)
                return (request, image)
            except Exception as e:
                log.warning(f"Failed to load image {request.image_path}: {e}")
                return (request, None)

        return await asyncio.gather(*[load_single(req) for req in batch])

    async def _process_clip_batch(self, batch: list[WorkRequest]) -> list[WorkResult]:
        """Process CLIP visual encoding in batch."""
        results: list[WorkResult] = []

        # Load all images
        loaded = await self._load_images(batch)

        # Get model
        if not batch:
            return results

        model_name = batch[0].config.get("modelName", "ViT-B-32__openai")

        model = await self.model_cache.get(
            model_name, ModelType.VISUAL, ModelTask.SEARCH, ttl=settings.model_ttl
        )

        # Load model if needed
        if not model.loaded:
            await self._run(model.load)

        # Process each image
        for request, image in loaded:
            if image is None:
                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="clip",
                    status="error",
                    error={"message": "Failed to load image", "code": "IMAGE_LOAD_ERROR"},
                ))
                continue

            try:
                embedding = await self._run(model.predict, image)
                # Convert embedding to base64 string format expected by server
                embedding_str = self._embedding_to_string(embedding)

                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="clip",
                    status="success",
                    result={"embedding": embedding_str},
                ))
            except Exception as e:
                log.error(f"CLIP inference failed for {request.asset_id}: {e}")
                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="clip",
                    status="error",
                    error={"message": str(e), "code": "INFERENCE_ERROR"},
                ))

        return results

    async def _process_face_batch(self, batch: list[WorkRequest]) -> list[WorkResult]:
        """Process face detection in batch."""
        results: list[WorkResult] = []

        # Load all images
        loaded = await self._load_images(batch)

        if not batch:
            return results

        model_name = batch[0].config.get("modelName", "buffalo_l")
        min_score = batch[0].config.get("minScore", 0.7)

        # Get detection and recognition models
        detection_model = await self.model_cache.get(
            model_name, ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION,
            ttl=settings.model_ttl
        )
        recognition_model = await self.model_cache.get(
            model_name, ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION,
            ttl=settings.model_ttl
        )

        # Load models if needed
        if not detection_model.loaded:
            await self._run(detection_model.load)
        if not recognition_model.loaded:
            await self._run(recognition_model.load)

        # Process each image
        for request, image in loaded:
            if image is None:
                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="face",
                    status="error",
                    error={"message": "Failed to load image", "code": "IMAGE_LOAD_ERROR"},
                ))
                continue

            try:
                # Detect faces
                faces = await self._run(detection_model.predict, image, minScore=min_score)

                # Get embeddings for each face
                if faces:
                    embeddings = await self._run(recognition_model.predict, image, faces)
                    # Merge embeddings into faces
                    for i, face in enumerate(faces):
                        if i < len(embeddings):
                            face["embedding"] = self._embedding_to_string(embeddings[i])

                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="face",
                    status="success",
                    result={
                        "faces": faces,
                        "imageHeight": image.height,
                        "imageWidth": image.width,
                    },
                ))
            except Exception as e:
                log.error(f"Face detection failed for {request.asset_id}: {e}")
                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="face",
                    status="error",
                    error={"message": str(e), "code": "INFERENCE_ERROR"},
                ))

        return results

    async def _process_ocr_batch(self, batch: list[WorkRequest]) -> list[WorkResult]:
        """Process OCR in batch."""
        results: list[WorkResult] = []

        # Load all images
        loaded = await self._load_images(batch)

        if not batch:
            return results

        model_name = batch[0].config.get("modelName", "PP-OCRv5_mobile")
        min_detection_score = batch[0].config.get("minDetectionScore", 0.5)
        min_recognition_score = batch[0].config.get("minRecognitionScore", 0.8)
        max_resolution = batch[0].config.get("maxResolution", 736)

        # Get detection and recognition models
        detection_model = await self.model_cache.get(
            model_name, ModelType.DETECTION, ModelTask.OCR,
            ttl=settings.model_ttl,
            minScore=min_detection_score,
            maxResolution=max_resolution,
        )
        recognition_model = await self.model_cache.get(
            model_name, ModelType.RECOGNITION, ModelTask.OCR,
            ttl=settings.model_ttl,
            minScore=min_recognition_score,
        )

        # Load models if needed
        if not detection_model.loaded:
            await self._run(detection_model.load)
        if not recognition_model.loaded:
            await self._run(recognition_model.load)

        # Process each image
        for request, image in loaded:
            if image is None:
                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="ocr",
                    status="error",
                    error={"message": "Failed to load image", "code": "IMAGE_LOAD_ERROR"},
                ))
                continue

            try:
                # Detect text regions
                boxes = await self._run(detection_model.predict, image)

                # Recognize text
                if boxes:
                    ocr_result = await self._run(recognition_model.predict, image, boxes)
                else:
                    ocr_result = {"text": [], "box": [], "boxScore": [], "textScore": []}

                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="ocr",
                    status="success",
                    result=ocr_result,
                ))
            except Exception as e:
                log.error(f"OCR failed for {request.asset_id}: {e}")
                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="ocr",
                    status="error",
                    error={"message": str(e), "code": "INFERENCE_ERROR"},
                ))

        return results

    def _embedding_to_string(self, embedding: Any) -> str:
        """Convert numpy embedding to string format."""
        import numpy as np

        if isinstance(embedding, np.ndarray):
            # Convert to list of floats as JSON string
            return str(embedding.tolist())
        elif isinstance(embedding, (list, tuple)):
            return str(list(embedding))
        else:
            return str(embedding)
