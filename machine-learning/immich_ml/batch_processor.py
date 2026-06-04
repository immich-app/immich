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

# Conditionally import aioboto3 for S3 support
if settings.s3.enabled:
    try:
        import aioboto3
    except ImportError:
        aioboto3 = None  # type: ignore[assignment]
        log.warning("aioboto3 not installed, S3 support disabled")
else:
    aioboto3 = None  # type: ignore[assignment]


class BatchProcessor:
    """Processes batches of ML work requests."""

    def __init__(self, model_cache: ModelCache, thread_pool: ThreadPoolExecutor | None = None):
        self.model_cache = model_cache
        self.thread_pool = thread_pool
        self._s3_session = aioboto3.Session() if aioboto3 and settings.s3.enabled else None
        self._s3_client = None  # Lazy-init reusable client
        self._s3_client_lock = asyncio.Lock()

    async def _get_s3_client(self):
        """Get or create a reusable S3 client."""
        if self._s3_client is None:
            async with self._s3_client_lock:
                if self._s3_client is None:  # Double-check after lock
                    from botocore.config import Config as BotoConfig
                    self._s3_client = await self._s3_session.client(
                        "s3",
                        endpoint_url=settings.s3.endpoint,
                        region_name=settings.s3.region,
                        aws_access_key_id=settings.s3.access_key_id,
                        aws_secret_access_key=settings.s3.secret_access_key,
                        config=BotoConfig(
                            connect_timeout=5,
                            read_timeout=10,
                            retries={"max_attempts": 1},
                        ),
                    ).__aenter__()
        return self._s3_client

    async def close(self):
        """Cleanup S3 client on shutdown."""
        if self._s3_client:
            await self._s3_client.__aexit__(None, None, None)
            self._s3_client = None

    def _parse_s3_path(self, s3_path: str) -> tuple[str, str]:
        """Parse s3://bucket/key format, raising on invalid paths."""
        if not s3_path.startswith("s3://"):
            raise ValueError(f"Invalid S3 path (must start with s3://): {s3_path}")

        path_without_prefix = s3_path[5:]  # Remove "s3://"
        if "/" not in path_without_prefix:
            raise ValueError(f"Invalid S3 path (missing key): {s3_path}")

        bucket, key = path_without_prefix.split("/", 1)
        if not bucket or not key:
            raise ValueError(f"Invalid S3 path (empty bucket or key): {s3_path}")

        return bucket, key

    async def preload_images(self, batch: list[WorkRequest]) -> list[tuple[WorkRequest, Image.Image | None]]:
        """Preload images for a batch. Can run concurrently with inference on another batch."""
        return await self._load_images(batch)

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

    async def process_preloaded(self, task_type: str, loaded: list[tuple[WorkRequest, Image.Image | None]]) -> list[WorkResult]:
        """Process a batch with already-loaded images (skips S3 download)."""
        if task_type == "clip":
            return await self._process_clip_batch(None, loaded)
        elif task_type == "face":
            return await self._process_face_batch(None, loaded)
        elif task_type == "ocr":
            return await self._process_ocr_batch(None, loaded)
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
                # Check if S3 path (starts with s3://)
                if self._s3_session and request.image_path.startswith("s3://"):
                    image_data = await self._load_from_s3(request.image_path)
                else:
                    with open(request.image_path, "rb") as f:
                        image_data = f.read()

                image = await self._run(decode_pil, image_data)
                return (request, image)
            except Exception as e:
                log.warning(f"Failed to load image {request.image_path}: {e}")
                return (request, None)

        return await asyncio.gather(*[load_single(req) for req in batch])

    async def _load_from_s3(self, s3_path: str) -> bytes:
        """Load image from S3. Path format: s3://bucket/key"""
        if not self._s3_session:
            raise RuntimeError("S3 session not initialized")

        bucket, key = self._parse_s3_path(s3_path)
        client = await self._get_s3_client()
        response = await client.get_object(Bucket=bucket, Key=key)
        return await response["Body"].read()

    async def _process_clip_batch(self, batch: list[WorkRequest] | None, preloaded: list[tuple[WorkRequest, Image.Image | None]] | None = None) -> list[WorkResult]:
        """Process CLIP visual encoding in batch."""
        results: list[WorkResult] = []

        if preloaded is not None:
            loaded = preloaded
        elif batch:
            loaded = await self._load_images(batch)
        else:
            return results

        if not loaded:
            return results

        model_name = loaded[0][0].config.get("modelName", "ViT-B-32__openai")

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

    async def _process_face_batch(self, batch: list[WorkRequest] | None, preloaded: list[tuple[WorkRequest, Image.Image | None]] | None = None) -> list[WorkResult]:
        """Process face detection in batch."""
        results: list[WorkResult] = []

        if preloaded is not None:
            loaded = preloaded
        elif batch:
            loaded = await self._load_images(batch)
        else:
            return results

        if not loaded:
            return results

        model_name = loaded[0][0].config.get("modelName", "buffalo_l")
        min_score = loaded[0][0].config.get("minScore", 0.7)

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
                detections = await self._run(detection_model.predict, image, minScore=min_score)

                # Get embeddings for each face
                if detections and detections["boxes"].shape[0] > 0:
                    face_results = await self._run(recognition_model.predict, image, detections)
                else:
                    face_results = []

                # Ensure numpy scalars are converted to native Python types for JSON serialization
                serializable_faces = []
                for face in face_results:
                    serializable_faces.append({
                        "boundingBox": {k: float(v) for k, v in face["boundingBox"].items()},
                        "embedding": face["embedding"],
                        "score": float(face["score"]),
                    })

                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="face",
                    status="success",
                    result={
                        "faces": serializable_faces,
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

    async def _process_ocr_batch(self, batch: list[WorkRequest] | None, preloaded: list[tuple[WorkRequest, Image.Image | None]] | None = None) -> list[WorkResult]:
        """Process OCR in batch."""
        results: list[WorkResult] = []

        if preloaded is not None:
            loaded = preloaded
        elif batch:
            loaded = await self._load_images(batch)
        else:
            return results

        if not loaded:
            return results

        model_name = loaded[0][0].config.get("modelName", "PP-OCRv5_mobile")
        min_detection_score = loaded[0][0].config.get("minDetectionScore", 0.5)
        min_recognition_score = loaded[0][0].config.get("minRecognitionScore", 0.8)
        max_resolution = loaded[0][0].config.get("maxResolution", 736)

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

                # Convert numpy arrays to lists for JSON serialization
                import numpy as np
                serializable_result = {}
                for k, v in ocr_result.items():
                    serializable_result[k] = v.tolist() if isinstance(v, np.ndarray) else v

                results.append(WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type="ocr",
                    status="success",
                    result=serializable_result,
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
