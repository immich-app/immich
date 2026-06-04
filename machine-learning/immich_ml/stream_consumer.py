import asyncio
import json
import os
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine

import redis.asyncio as redis

from .config import log, settings

STREAM_KEYS = {
    "clip": "immich:ml:requests:clip",
    "face": "immich:ml:requests:face",
    "ocr": "immich:ml:requests:ocr",
}
RESULTS_STREAM = "immich:ml:results"
CONSUMER_GROUP = "ml-workers"


@dataclass
class BatchConfig:
    max_size: int = 8
    max_wait_ms: int = 100


@dataclass
class WorkRequest:
    message_id: str
    correlation_id: str
    asset_id: str
    task_type: str
    image_path: str
    config: dict[str, Any]
    timestamp: int
    attempt: int


@dataclass
class WorkResult:
    correlation_id: str
    asset_id: str
    task_type: str
    status: str  # "success" or "error"
    result: dict[str, Any] | None = None
    error: dict[str, str] | None = None
    processing_time_ms: float = 0


ProcessorFunc = Callable[[str, list[WorkRequest]], Coroutine[Any, Any, list[WorkResult]]]


class StreamConsumer:
    def __init__(
        self,
        redis_url: str,
        processor: ProcessorFunc,
        batch_processor: Any | None = None,
    ):
        self.redis_url = redis_url
        self.processor = processor
        self.batch_processor = batch_processor
        self.running = False
        self.consumer_name = f"ml-worker-{os.getpid()}-{int(time.time())}"
        self.redis: redis.Redis | None = None

        # Batch configs per task type
        batch_settings = settings.stream.batch
        self.batch_configs = {
            "clip": BatchConfig(max_size=batch_settings.clip_size, max_wait_ms=batch_settings.clip_wait_ms),
            "face": BatchConfig(max_size=batch_settings.face_size, max_wait_ms=batch_settings.face_wait_ms),
            "ocr": BatchConfig(max_size=batch_settings.ocr_size, max_wait_ms=batch_settings.ocr_wait_ms),
        }

    async def start(self) -> None:
        """Start consuming from all task streams."""
        self.redis = redis.from_url(self.redis_url)
        await self._ensure_consumer_groups()

        self.running = True
        log.info(f"Starting stream consumer: {self.consumer_name}")

        # Start consumer tasks for each stream
        await asyncio.gather(
            self._consume_stream("clip"),
            self._consume_stream("face"),
            self._consume_stream("ocr"),
        )

    async def stop(self) -> None:
        """Gracefully stop consuming."""
        self.running = False
        if self.redis:
            await self.redis.aclose()
            self.redis = None
        log.info("Stream consumer stopped")

    async def _ensure_consumer_groups(self) -> None:
        """Create consumer groups if they don't exist."""
        if not self.redis:
            return

        for stream_key in [*STREAM_KEYS.values(), RESULTS_STREAM]:
            try:
                await self.redis.xgroup_create(stream_key, CONSUMER_GROUP, id="$", mkstream=True)
                log.debug(f"Created consumer group for {stream_key}")
            except redis.ResponseError as e:
                if "BUSYGROUP" in str(e):
                    log.debug(f"Consumer group already exists for {stream_key}")
                else:
                    raise

    async def _read_batch(self, stream_key: str, task_type: str, batch_cfg: Any) -> list[WorkRequest]:
        """Read a full batch from the stream."""
        batch: list[WorkRequest] = []
        batch_start_time: float | None = None

        while len(batch) < batch_cfg.max_size:
            remaining_wait = batch_cfg.max_wait_ms
            if batch_start_time is not None:
                elapsed = (time.time() - batch_start_time) * 1000
                remaining_wait = max(1, int(batch_cfg.max_wait_ms - elapsed))

            response = await self.redis.xreadgroup(
                groupname=CONSUMER_GROUP,
                consumername=self.consumer_name,
                streams={stream_key: ">"},
                count=batch_cfg.max_size - len(batch),
                block=remaining_wait,
            )

            if response:
                for _, messages in response:
                    for msg_id, data in messages:
                        request = self._parse_request(msg_id, task_type, data)
                        batch.append(request)
                        if batch_start_time is None:
                            batch_start_time = time.time()

            # Check if we should stop collecting
            should_stop = len(batch) >= batch_cfg.max_size or (
                batch_start_time is not None
                and (time.time() - batch_start_time) * 1000 >= batch_cfg.max_wait_ms
            )
            if should_stop or not response:
                break

        return batch

    async def _consume_stream(self, task_type: str) -> None:
        """Consume from a stream using a two-stage pipeline.

        Stage 1 (download worker): reads from Redis, downloads images from S3, pushes to queue
        Stage 2 (inference loop): drains queue into batches, runs GPU inference

        S3 downloads never block GPU inference.
        """
        if not self.redis:
            return

        stream_key = STREAM_KEYS[task_type]
        batch_cfg = self.batch_configs[task_type]

        if not self.batch_processor:
            # Fallback: no pipeline, process inline
            log.info(f"Starting consumer for {task_type} (batch_size={batch_cfg.max_size}, no pipeline)")
            while self.running:
                try:
                    batch = await self._read_batch(stream_key, task_type, batch_cfg)
                    if batch:
                        await self._process_batch(stream_key, task_type, batch)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    log.error(f"Error consuming from {stream_key}: {e}")
                    await asyncio.sleep(1)
            return

        # Buffered pipeline: download worker -> queue -> inference worker
        # Buffer several batches ahead so GPU always has work ready
        buffer_size = batch_cfg.max_size * 8
        ready_queue: asyncio.Queue[tuple[WorkRequest, Any] | None] = asyncio.Queue(maxsize=buffer_size)

        log.info(f"Starting consumer for {task_type} (batch_size={batch_cfg.max_size}, pipeline=True, buffer={buffer_size})")

        download_task = asyncio.create_task(
            self._download_worker(stream_key, task_type, batch_cfg, ready_queue)
        )

        try:
            await self._inference_worker(stream_key, task_type, batch_cfg, ready_queue)
        finally:
            download_task.cancel()
            try:
                await download_task
            except asyncio.CancelledError:
                pass

    async def _download_worker(
        self, stream_key: str, task_type: str, batch_cfg: BatchConfig, queue: asyncio.Queue
    ) -> None:
        """Stage 1: Read from Redis stream, download images concurrently, push to ready queue."""
        # Download many images in parallel -- S3 can handle high concurrency
        download_concurrency = batch_cfg.max_size * 4

        while self.running:
            try:
                # Read a chunk of messages
                response = await self.redis.xreadgroup(
                    groupname=CONSUMER_GROUP,
                    consumername=self.consumer_name,
                    streams={stream_key: ">"},
                    count=download_concurrency,
                    block=1000,
                )

                if not response:
                    continue

                # Parse all messages
                requests = []
                for _, messages in response:
                    for msg_id, data in messages:
                        requests.append(self._parse_request(msg_id, task_type, data))

                if not requests:
                    continue

                # Download all images concurrently
                loaded = await self.batch_processor.preload_images(requests)

                # Push downloaded items to the ready queue
                for request, image in loaded:
                    await queue.put((request, image))

            except asyncio.CancelledError:
                break
            except Exception as e:
                log.error(f"Download worker error for {task_type}: {e}")
                await asyncio.sleep(1)

        # Signal inference worker to stop
        await queue.put(None)

    async def _inference_worker(
        self, stream_key: str, task_type: str, batch_cfg: BatchConfig, queue: asyncio.Queue
    ) -> None:
        """Stage 2: Drain ready queue into batches, run GPU inference."""
        while self.running:
            try:
                # Collect a batch from the ready queue
                batch: list[tuple[WorkRequest, Any]] = []

                # Block for first item
                item = await asyncio.wait_for(queue.get(), timeout=2.0)
                if item is None:
                    break
                batch.append(item)

                # Drain up to batch_size without blocking
                while len(batch) < batch_cfg.max_size:
                    try:
                        item = queue.get_nowait()
                        if item is None:
                            break
                        batch.append(item)
                    except asyncio.QueueEmpty:
                        break

                if not batch:
                    continue

                # Split into requests and loaded images
                requests = [req for req, _ in batch]
                loaded = [(req, img) for req, img in batch]

                await self._process_batch_preloaded(stream_key, task_type, requests, loaded)

            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                log.error(f"Inference worker error for {task_type}: {e}")
                await asyncio.sleep(1)

    async def _process_batch(self, stream_key: str, task_type: str, batch: list[WorkRequest]) -> None:
        """Process a batch of messages."""
        if not self.redis or not batch:
            return

        log.debug(f"Processing batch of {len(batch)} {task_type} requests")
        start_time = time.time()

        try:
            # Call the processor
            results = await self.processor(task_type, batch)

            processing_time = (time.time() - start_time) * 1000

            # Publish results and acknowledge messages
            for i, request in enumerate(batch):
                result = results[i] if i < len(results) else WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type=task_type,
                    status="error",
                    error={"message": "No result returned", "code": "NO_RESULT"},
                )
                result.processing_time_ms = processing_time / len(batch)

                await self._publish_result(result)
                await self.redis.xack(stream_key, CONSUMER_GROUP, request.message_id)

            log.info(f"Processed {len(batch)} {task_type} requests in {processing_time:.1f}ms")

        except Exception as e:
            log.error(f"Batch processing failed for {task_type}: {e}")

            # Publish error results for all items in batch
            for request in batch:
                error_result = WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type=task_type,
                    status="error",
                    error={"message": str(e), "code": "BATCH_PROCESSING_ERROR"},
                )
                await self._publish_result(error_result)
                await self.redis.xack(stream_key, CONSUMER_GROUP, request.message_id)

    async def _process_batch_preloaded(self, stream_key: str, task_type: str, batch: list[WorkRequest], loaded: list) -> None:
        """Process a batch with already-loaded images (skips S3 download)."""
        if not self.redis or not batch:
            return

        log.debug(f"Processing preloaded batch of {len(batch)} {task_type} requests")
        start_time = time.time()

        try:
            results = await self.batch_processor.process_preloaded(task_type, loaded)

            processing_time = (time.time() - start_time) * 1000

            for i, request in enumerate(batch):
                result = results[i] if i < len(results) else WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type=task_type,
                    status="error",
                    error={"message": "No result returned", "code": "NO_RESULT"},
                )
                result.processing_time_ms = processing_time / len(batch)

                await self._publish_result(result)
                await self.redis.xack(stream_key, CONSUMER_GROUP, request.message_id)

            log.info(f"Processed {len(batch)} {task_type} requests in {processing_time:.1f}ms")

        except Exception as e:
            log.error(f"Batch processing failed for {task_type}: {e}")

            for request in batch:
                error_result = WorkResult(
                    correlation_id=request.correlation_id,
                    asset_id=request.asset_id,
                    task_type=task_type,
                    status="error",
                    error={"message": str(e), "code": "BATCH_PROCESSING_ERROR"},
                )
                await self._publish_result(error_result)
                await self.redis.xack(stream_key, CONSUMER_GROUP, request.message_id)

    async def _publish_result(self, result: WorkResult) -> None:
        """Publish a result to the results stream."""
        if not self.redis:
            return

        data = {
            "correlationId": result.correlation_id,
            "assetId": result.asset_id,
            "taskType": result.task_type,
            "status": result.status,
            "result": json.dumps(result.result) if result.result else "",
            "error": json.dumps(result.error) if result.error else "",
            "processingTimeMs": str(int(result.processing_time_ms)),
            "timestamp": str(int(time.time() * 1000)),
        }

        await self.redis.xadd(RESULTS_STREAM, data)

    def _parse_request(self, msg_id: bytes, task_type: str, data: dict[bytes, bytes]) -> WorkRequest:
        """Parse a Redis stream message into a WorkRequest."""
        return WorkRequest(
            message_id=msg_id.decode() if isinstance(msg_id, bytes) else msg_id,
            correlation_id=self._get_str(data, b"correlationId"),
            asset_id=self._get_str(data, b"assetId"),
            task_type=task_type,
            image_path=self._get_str(data, b"imagePath"),
            config=json.loads(self._get_str(data, b"config")),
            timestamp=int(self._get_str(data, b"timestamp")),
            attempt=int(self._get_str(data, b"attempt")),
        )

    def _get_str(self, data: dict[bytes, bytes], key: bytes) -> str:
        """Get a string value from a Redis hash, handling bytes."""
        value = data.get(key, b"")
        return value.decode() if isinstance(value, bytes) else value
