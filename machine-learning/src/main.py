from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
from PIL import Image
from fastapi import FastAPI
import uvicorn
import os
from pydantic import BaseModel


class MlRequestBody(BaseModel):
    thumbnailPath: str


class ClipRequestBody(BaseModel):
    text: str


is_dev = os.getenv('NODE_ENV') == 'development'
server_port = os.getenv('MACHINE_LEARNING_PORT', 3003)
server_host = os.getenv('MACHINE_LEARNING_HOST', '0.0.0.0')

app = FastAPI()

"""
Model Initialization
"""
classification_model = os.getenv(
    'MACHINE_LEARNING_CLASSIFICATION_MODEL', 'microsoft/resnet-50')
object_model = os.getenv('MACHINE_LEARNING_OBJECT_MODEL', 'hustvl/yolos-tiny')
clip_image_model = os.getenv(
    'MACHINE_LEARNING_CLIP_IMAGE_MODEL', 'clip-ViT-B-32')
clip_text_model = os.getenv(
    'MACHINE_LEARNING_CLIP_TEXT_MODEL', 'clip-ViT-B-32')

_model_cache = {}


@app.get("/")
async def root():
    return {"message": "Immich ML"}


@app.get("/ping")
def ping():
    return "pong"


@app.post("/object-detection/detect-object", status_code=200)
def object_detection(payload: MlRequestBody):
    model = _get_model(object_model, 'object-detection')
    assetPath = payload.thumbnailPath
    return run_engine(model, assetPath)


@app.post("/image-classifier/tag-image", status_code=200)
def image_classification(payload: MlRequestBody):
    model = _get_model(classification_model, 'image-classification')
    assetPath = payload.thumbnailPath
    return run_engine(model, assetPath)


@app.post("/sentence-transformer/encode-image", status_code=200)
def clip_encode_image(payload: MlRequestBody):
    model = _get_model(clip_image_model)
    assetPath = payload.thumbnailPath
    return model.encode(Image.open(assetPath)).tolist()


@app.post("/sentence-transformer/encode-text", status_code=200)
def clip_encode_text(payload: ClipRequestBody):
    model = _get_model(clip_text_model)
    text = payload.text
    return model.encode(text).tolist()


def run_engine(engine, path):
    result = []
    predictions = engine(path)

    for index, pred in enumerate(predictions):
        tags = pred['label'].split(', ')
        if (pred['score'] > 0.9):
            result = [*result, *tags]

    if (len(result) > 1):
        result = list(set(result))

    return result


def _get_model(model, task=None):
    global _model_cache
    key = '|'.join([model, str(task)])
    if key not in _model_cache:
        if task:
            _model_cache[key] = pipeline(model=model, task=task)
        else:
            _model_cache[key] = SentenceTransformer(model)
    return _model_cache[key]


if __name__ == "__main__":
    uvicorn.run("main:app", host=server_host,
                port=int(server_port), reload=is_dev, workers=1)
