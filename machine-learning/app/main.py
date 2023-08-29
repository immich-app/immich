import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import orjson
import uvicorn
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.responses import ORJSONResponse
from starlette.formparsers import MultiPartParser

from app.models.base import InferenceModel

from .config import settings
from .models.cache import ModelCache
from .schemas import (
    MessageResponse,
    ModelType,
    TextResponse,
)

MultiPartParser.max_file_size = 2**24  # spools to disk if payload is 16 MiB or larger

app = FastAPI()


def init_state() -> None:
    app.state.model_cache = ModelCache(ttl=settings.model_ttl, revalidate=settings.model_ttl > 0)
    # asyncio is a huge bottleneck for performance, so we use a thread pool to run blocking code
    app.state.thread_pool = ThreadPoolExecutor(settings.request_threads)


@app.on_event("startup")
async def startup_event() -> None:
    init_state()


@app.get("/", response_model=MessageResponse)
async def root() -> dict[str, str]:
    return {"message": "Immich ML"}


@app.get("/ping", response_model=TextResponse)
def ping() -> str:
    return "pong"


@app.post("/predict")
async def predict(
    model_name: str = Form(alias="modelName"),
    model_type: ModelType = Form(alias="modelType"),
    options: str = Form(default="{}"),
    text: str | None = Form(default=None),
    image: UploadFile | None = None,
) -> Any:
    if image is not None:
        inputs: str | bytes = await image.read()
    elif text is not None:
        inputs = text
    else:
        raise HTTPException(400, "Either image or text must be provided")

    model: InferenceModel = await app.state.model_cache.get(model_name, model_type, **orjson.loads(options))
    outputs = await run(model, inputs)
    return ORJSONResponse(outputs)


async def run(model: InferenceModel, inputs: Any) -> Any:
    return await asyncio.get_running_loop().run_in_executor(app.state.thread_pool, model.predict, inputs)


if __name__ == "__main__":
    is_dev = os.getenv("NODE_ENV") == "development"
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=is_dev,
        workers=settings.workers,
    )
