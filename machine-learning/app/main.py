from ray import serve

from .config import settings
from .deployments.handler import ModelHandler
from .deployments.ingress import ModelIngress

handler = ModelHandler.bind(  # type: ignore
    settings.classification_model,
    settings.clip_image_model,
    settings.clip_text_model,
    settings.facial_recognition_model,
)
ingress = ModelIngress.options(max_concurrent_queries=settings.max_concurrency).bind(handler)  # type: ignore


if __name__ == "__main__":
    serve.run(ingress, host=settings.host, port=settings.port, _blocking=True)
