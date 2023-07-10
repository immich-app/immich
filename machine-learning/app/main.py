import asyncio
import os

import ray
import uvloop
from ray import serve

from .config import get_shm_size, settings
from .deployments.handler import ModelHandler
from .deployments.ingress import ModelIngress

handler = ModelHandler.bind(  # type: ignore
    settings.classification_model,
    settings.clip_image_model,
    settings.clip_text_model,
    settings.facial_recognition_model,
)
ingress = ModelIngress.options(max_concurrent_queries=settings.max_concurrency).bind(handler)  # type: ignore


async def main() -> None:
    os.environ["OMP_NUM_THREADS"] = str(settings.num_cpus)
    ray.init(
        num_cpus=2,
        object_store_memory=get_shm_size(),
        include_dashboard=os.environ["NODE_ENV"] == "development",
        dashboard_host=settings.host,
    )
    serve.run(ingress, host=settings.host, port=settings.port)
    await asyncio.Future()


if __name__ == "__main__":
    uvloop.install()
    asyncio.run(main())
