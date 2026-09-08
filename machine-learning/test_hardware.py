import os

import pytest
from PIL import Image

from immich_ml.models import from_model_type
from immich_ml.schemas import ModelTask, ModelType

pytestmark = pytest.mark.gpu

EXPECTED_EP = os.environ.get("IMMICH_HWACCEL_EXPECTED_EP")


@pytest.fixture(autouse=True)
def require_hwaccel_run() -> None:
    if not EXPECTED_EP:
        pytest.skip("IMMICH_HWACCEL_EXPECTED_EP unset; not a hardware run")


MODELS = [
    pytest.param("ViT-B-32__openai", ModelType.VISUAL, ModelTask.SEARCH, id="clip-visual"),
]


@pytest.mark.parametrize("model_name, model_type, model_task", MODELS)
def test_hwaccel_engaged(model_name: str, model_type: ModelType, model_task: ModelTask) -> None:
    model = from_model_type(model_name, model_type, model_task)
    model.load()

    # a CPU fallback returns the same output, so the provider list is the only fallback signal
    assert EXPECTED_EP in model.session.providers, (
        f"expected {EXPECTED_EP}, session resolved to {model.session.providers}"
    )

    model.predict(Image.new("RGB", (224, 224)))
