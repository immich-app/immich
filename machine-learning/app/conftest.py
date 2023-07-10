from typing import Any, Iterator
from unittest import mock

import numpy as np
import pytest
from PIL import Image
from ray import serve
from ray.serve.handle import RayServeHandle

from .main import ingress
from .schemas import ndarray


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
            if isinstance(inputs, list):
                if not all([isinstance(img, Image.Image) for img in inputs]):
                    raise TypeError
                return [classifier_preds] * len(inputs)
            elif not isinstance(inputs, Image.Image):
                raise TypeError

            return classifier_preds

        model.return_value = forward
        yield model


@pytest.fixture
def mock_st() -> Iterator[mock.Mock]:
    with mock.patch("app.models.clip.SentenceTransformer") as model:
        embedding = np.random.rand(512).astype(np.float32)

        def encode(inputs: Image.Image | list[Image.Image], **kwargs: Any) -> ndarray:
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
        batch_det = np.random.rand(2, 5).astype(np.float32)
        batch_kpss = np.random.rand(2, 5, 2).astype(np.float32)
        batch_embeddings = np.random.rand(2, 512).astype(np.float32)

        model.return_value.det_model.detect.return_value = batch_det, batch_kpss
        model.return_value.models["recognition"].get_feat.return_value = batch_embeddings
        yield model


@pytest.fixture
def mock_get_model() -> Iterator[mock.Mock]:
    with mock.patch("app.models.base.InferenceModel.from_model_type", autospec=True) as mocked:
        yield mocked


@pytest.fixture(scope="session")
def deployed_app() -> RayServeHandle | None:
    return serve.run(ingress, host="localhost", port=3003)
