from types import SimpleNamespace
from typing import Any
from unittest import mock

import numpy as np
from PIL import Image
from pytest import MonkeyPatch, fixture

from .config import settings
from .models.cache import ModelCache


@fixture
def pil_image() -> Image.Image:
    return Image.new("RGB", (600, 800))


@fixture
def cv_image(pil_image: Image.Image) -> np.ndarray:
    return np.asarray(pil_image)[:, :, ::-1]  # PIL uses RGB while cv2 uses BGR


@fixture
def classifier_preds() -> list[dict[str, Any]]:
    return [
        {"label": "that's an image alright", "score": 0.8},
        {"label": "well it ends with .jpg", "score": 0.1},
        {"label": "idk, im just seeing bytes", "score": 0.05},
        {"label": "not sure", "score": 0.04},
        {"label": "probably a virus", "score": 0.01},
    ]


@fixture
def clip_embedding() -> np.ndarray[int, np.dtype[np.float32]]:
    return np.random.rand(512).astype(np.float32)


@fixture
def face_preds() -> list[SimpleNamespace]:
    return [
        SimpleNamespace(  # this is so these fields can be accessed through dot notation
            **{
                "bbox": np.random.rand(4).astype(np.float32),
                "kps": np.random.rand(5, 2).astype(np.float32),
                "det_score": np.array([0.67]).astype(np.float32),
                "normed_embedding": np.random.rand(512).astype(np.float32),
            }
        ),
        SimpleNamespace(
            **{
                "bbox": np.random.rand(4).astype(np.float32),
                "kps": np.random.rand(5, 2).astype(np.float32),
                "det_score": np.array([0.4]).astype(np.float32),
                "normed_embedding": np.random.rand(512).astype(np.float32),
            }
        ),
    ]


@fixture
def mock_classifier_pipeline(classifier_preds):
    with mock.patch("app.models.image_classification.pipeline") as model:

        def forward(inputs, *args, **kwargs):
            batched = isinstance(inputs, list)
            if batched and not all([isinstance(img, Image.Image) for img in inputs]):
                raise TypeError
            elif not isinstance(inputs, Image.Image):
                raise TypeError

            if batched:
                return [classifier_preds] * len(inputs)

            return classifier_preds

        model.return_value = forward
        yield model


@fixture
def mock_st(clip_embedding):
    with mock.patch("app.models.clip.SentenceTransformer") as model:

        def encode(inputs, *args, **kwargs):
            batched = isinstance(inputs, list)
            img_batch = batched and all(
                [isinstance(inst, Image.Image) for inst in inputs]
            )
            text_batch = batched and all([isinstance(inst, str) for inst in inputs])
            if batched and not any(img_batch, text_batch):
                raise TypeError

            if batched:
                return [clip_embedding] * len(inputs)

            return clip_embedding

        mocked = mock.Mock()
        mocked.encode = encode
        model.return_value = mocked
        yield model


@fixture
def mock_faceanalysis(face_preds):
    with mock.patch("app.models.facial_recognition.FaceAnalysis") as model:

        def get(image, *args, **kwargs):
            if not isinstance(image, np.ndarray):
                raise TypeError

            return face_preds

        mocked = mock.Mock()
        mocked.get = get
        model.return_value = mocked
        yield model
