import json
from typing import Any, Iterator
from unittest import mock

import numpy as np
import pytest
from fastapi.testclient import TestClient
from numpy.typing import NDArray
from PIL import Image

from app.config import log

from .main import app


@pytest.fixture
def pil_image() -> Image.Image:
    return Image.new("RGB", (600, 800))


@pytest.fixture
def cv_image(pil_image: Image.Image) -> NDArray[np.float32]:
    return np.asarray(pil_image)[:, :, ::-1]  # PIL uses RGB while cv2 uses BGR


@pytest.fixture
def mock_get_model() -> Iterator[mock.Mock]:
    with mock.patch("app.models.cache.from_model_type", autospec=True) as mocked:
        yield mocked


@pytest.fixture(scope="session")
def deployed_app() -> Iterator[TestClient]:
    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="session")
def responses() -> dict[str, Any]:
    responses: dict[str, Any] = json.load(open("responses.json", "r"))
    return responses


@pytest.fixture(scope="session")
def clip_model_cfg() -> dict[str, Any]:
    return {
        "embed_dim": 512,
        "vision_cfg": {"image_size": 224, "layers": 12, "width": 768, "patch_size": 32},
        "text_cfg": {"context_length": 77, "vocab_size": 49408, "width": 512, "heads": 8, "layers": 12},
    }


@pytest.fixture(scope="session")
def clip_preprocess_cfg() -> dict[str, Any]:
    return {
        "size": [224, 224],
        "mode": "RGB",
        "mean": [0.48145466, 0.4578275, 0.40821073],
        "std": [0.26862954, 0.26130258, 0.27577711],
        "interpolation": "bicubic",
        "resize_mode": "shortest",
        "fill_color": 0,
    }


@pytest.fixture(scope="session")
def clip_tokenizer_cfg() -> dict[str, Any]:
    return {
        "add_prefix_space": False,
        "added_tokens_decoder": {
            "49406": {
                "content": "<|startoftext|>",
                "lstrip": False,
                "normalized": True,
                "rstrip": False,
                "single_word": False,
                "special": True,
            },
            "49407": {
                "content": "<|endoftext|>",
                "lstrip": False,
                "normalized": True,
                "rstrip": False,
                "single_word": False,
                "special": True,
            },
        },
        "bos_token": "<|startoftext|>",
        "clean_up_tokenization_spaces": True,
        "do_lower_case": True,
        "eos_token": "<|endoftext|>",
        "errors": "replace",
        "model_max_length": 77,
        "pad_token": "<|endoftext|>",
        "tokenizer_class": "CLIPTokenizer",
        "unk_token": "<|endoftext|>",
    }


@pytest.fixture(scope="function")
def providers(request: pytest.FixtureRequest) -> Iterator[mock.Mock]:
    marker = request.node.get_closest_marker("providers")
    if marker is None:
        raise ValueError("Missing marker 'providers'")

    providers = marker.args[0]
    with mock.patch("app.sessions.ort.ort.get_available_providers") as mocked:
        mocked.return_value = providers
        yield providers


@pytest.fixture(scope="function")
def ort_pybind() -> Iterator[mock.Mock]:
    with mock.patch("app.sessions.ort.ort.capi._pybind_state") as mocked:
        yield mocked


@pytest.fixture(scope="function")
def ov_device_ids(request: pytest.FixtureRequest, ort_pybind: mock.Mock) -> Iterator[mock.Mock]:
    marker = request.node.get_closest_marker("ov_device_ids")
    if marker is None:
        raise ValueError("Missing marker 'ov_device_ids'")
    ort_pybind.get_available_openvino_device_ids.return_value = marker.args[0]
    return ort_pybind


@pytest.fixture(scope="function")
def ort_session() -> Iterator[mock.Mock]:
    with mock.patch("app.sessions.ort.ort.InferenceSession") as mocked:
        yield mocked


@pytest.fixture(scope="function")
def ann_session() -> Iterator[mock.Mock]:
    with mock.patch("app.sessions.ann.Ann") as mocked:
        yield mocked


@pytest.fixture(scope="function")
def rmtree() -> Iterator[mock.Mock]:
    with mock.patch("app.models.base.rmtree", autospec=True) as mocked:
        mocked.avoids_symlink_attacks = True
        yield mocked


@pytest.fixture(scope="function")
def path() -> Iterator[mock.Mock]:
    path = mock.MagicMock()
    path.exists.return_value = True
    path.is_dir.return_value = True
    path.is_file.return_value = True
    path.with_suffix.return_value = path
    path.return_value = path

    with mock.patch("app.models.base.Path", return_value=path) as mocked:
        yield mocked


@pytest.fixture(scope="function")
def info() -> Iterator[mock.Mock]:
    with mock.patch.object(log, "info") as mocked:
        yield mocked


@pytest.fixture(scope="function")
def warning() -> Iterator[mock.Mock]:
    with mock.patch.object(log, "warning") as mocked:
        yield mocked


@pytest.fixture(scope="function")
def snapshot_download() -> Iterator[mock.Mock]:
    with mock.patch("app.models.base.snapshot_download") as mocked:
        yield mocked
