from types import SimpleNamespace
from typing import Any, Iterator, TypeAlias
from unittest import mock

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from .main import app, init_state

ndarray: TypeAlias = np.ndarray[int, np.dtype[np.float32]]


@pytest.fixture
def pil_image() -> Image.Image:
    return Image.new("RGB", (600, 800))


@pytest.fixture
def cv_image(pil_image: Image.Image) -> ndarray:
    return np.asarray(pil_image)[:, :, ::-1]  # PIL uses RGB while cv2 uses BGR


@pytest.fixture
def mock_classifier_pipeline() -> Iterator[mock.Mock]:
    with mock.patch("app.models.image_classification.pipeline") as model:
        classifier_preds = [
            {"label": "that's an image alright", "score": 0.8},
            {"label": "well it ends with .jpg", "score": 0.1},
            {"label": "idk, im just seeing bytes", "score": 0.05},
            {"label": "not sure", "score": 0.04},
            {"label": "probably a virus", "score": 0.01},
        ]

        def forward(
            inputs: Image.Image | list[Image.Image], **kwargs: Any
        ) -> list[dict[str, Any]] | list[list[dict[str, Any]]]:
            if isinstance(inputs, list) and not all([isinstance(img, Image.Image) for img in inputs]):
                raise TypeError
            elif not isinstance(inputs, Image.Image):
                raise TypeError

            if isinstance(inputs, list):
                return [classifier_preds] * len(inputs)

            return classifier_preds

        model.return_value = forward
        yield model


@pytest.fixture
def mock_st() -> Iterator[mock.Mock]:
    with mock.patch("app.models.clip.SentenceTransformer") as model:
        embedding = np.random.rand(512).astype(np.float32)

        def encode(inputs: Image.Image | list[Image.Image], **kwargs: Any) -> ndarray | list[ndarray]:
            #  mypy complains unless isinstance(inputs, list) is used explicitly
            img_batch = isinstance(inputs, list) and all([isinstance(inst, Image.Image) for inst in inputs])
            text_batch = isinstance(inputs, list) and all([isinstance(inst, str) for inst in inputs])
            if isinstance(inputs, list) and not any([img_batch, text_batch]):
                raise TypeError

            if isinstance(inputs, list):
                return np.stack([embedding] * len(inputs))

            return embedding

        mocked = mock.Mock()
        mocked.encode = encode
        model.return_value = mocked
        yield model


@pytest.fixture
def mock_faceanalysis() -> Iterator[mock.Mock]:
    with mock.patch("app.models.facial_recognition.FaceAnalysis") as model:
        face_preds = [
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

        def get(image: np.ndarray[int, np.dtype[np.float32]], **kwargs: Any) -> list[SimpleNamespace]:
            if not isinstance(image, np.ndarray):
                raise TypeError

            return face_preds

        mocked = mock.Mock()
        mocked.get = get
        model.return_value = mocked
        yield model


@pytest.fixture
def mock_get_model() -> Iterator[mock.Mock]:
    with mock.patch("app.models.cache.InferenceModel.from_model_type", autospec=True) as mocked:
        yield mocked


@pytest.fixture(scope="session")
def deployed_app() -> TestClient:
    init_state()
    return TestClient(app)
