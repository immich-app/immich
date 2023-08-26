import asyncio
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from app.models.base import InferenceModel

import orjson
import uvicorn
from starlette.formparsers import MultiPartParser
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.responses import ORJSONResponse

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
async def prediction(
    model_name: str = Form(alias="modelName"),
    model_type: ModelType = Form(alias="modelType"),
    options: str | None = Form(default=None),
    text: str | None = Form(default=None),
    image: UploadFile | None = None,
) -> Any:
    model: InferenceModel = await app.state.model_cache.get(model_name, model_type)
    if options is not None:
        model.configure(**orjson.loads(options))
    if image is not None:
        outputs = await predict(model, await image.read())
    elif text is not None:
        outputs = await predict(model, text)
    else:
        raise HTTPException(400, "Either image or text must be provided")

    return ORJSONResponse(outputs)


async def predict(model: InferenceModel, inputs: Any) -> Any:
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
