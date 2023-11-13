import json
import pickle
from io import BytesIO
from pathlib import Path
from typing import Any, Callable
from unittest import mock

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from pytest_mock import MockerFixture

from .config import settings
from .models.base import PicklableSessionOptions
from .models.cache import ModelCache
from .models.clip import OpenCLIPEncoder
from .models.facial_recognition import FaceRecognizer
from .models.image_classification import ImageClassifier
from .schemas import ModelType


class TestImageClassifier:
    classifier_preds = [
        {"label": "that's an image alright", "score": 0.8},
        {"label": "well it ends with .jpg", "score": 0.1},
        {"label": "idk, im just seeing bytes", "score": 0.05},
        {"label": "not sure", "score": 0.04},
        {"label": "probably a virus", "score": 0.01},
    ]

    def test_min_score(self, pil_image: Image.Image, mocker: MockerFixture) -> None:
        mocker.patch.object(ImageClassifier, "load")
        classifier = ImageClassifier("test_model_name", min_score=0.0)
        assert classifier.min_score == 0.0

        classifier.model = mock.Mock()
        classifier.model.return_value = self.classifier_preds

        all_labels = classifier.predict(pil_image)
        classifier.min_score = 0.5
        filtered_labels = classifier.predict(pil_image)

        assert all_labels == [
            "that's an image alright",
            "well it ends with .jpg",
            "idk",
            "im just seeing bytes",
            "not sure",
            "probably a virus",
        ]
        assert filtered_labels == ["that's an image alright"]


class TestCLIP:
    embedding = np.random.rand(512).astype(np.float32)
    cache_dir = Path("test_cache")

    def test_basic_image(
        self,
        pil_image: Image.Image,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_preprocess_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenCLIPEncoder, "download")
        mocker.patch.object(OpenCLIPEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenCLIPEncoder, "preprocess_cfg", clip_preprocess_cfg)
        mocker.patch("app.models.clip.AutoTokenizer.from_pretrained", autospec=True)
        mocked = mocker.patch("app.models.clip.ort.InferenceSession", autospec=True)
        mocked.return_value.run.return_value = [[self.embedding]]

        clip_encoder = OpenCLIPEncoder("ViT-B-32::openai", cache_dir="test_cache", mode="vision")
        embedding = clip_encoder.predict(pil_image)

        assert clip_encoder.mode == "vision"
        assert isinstance(embedding, list)
        assert len(embedding) == clip_model_cfg["embed_dim"]
        assert all([isinstance(num, float) for num in embedding])
        clip_encoder.vision_model.run.assert_called_once()

    def test_basic_text(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_preprocess_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenCLIPEncoder, "download")
        mocker.patch.object(OpenCLIPEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenCLIPEncoder, "preprocess_cfg", clip_preprocess_cfg)
        mocker.patch("app.models.clip.AutoTokenizer.from_pretrained", autospec=True)
        mocked = mocker.patch("app.models.clip.ort.InferenceSession", autospec=True)
        mocked.return_value.run.return_value = [[self.embedding]]

        clip_encoder = OpenCLIPEncoder("ViT-B-32::openai", cache_dir="test_cache", mode="text")
        embedding = clip_encoder.predict("test search query")

        assert clip_encoder.mode == "text"
        assert isinstance(embedding, list)
        assert len(embedding) == clip_model_cfg["embed_dim"]
        assert all([isinstance(num, float) for num in embedding])
        clip_encoder.text_model.run.assert_called_once()


class TestFaceRecognition:
    def test_set_min_score(self, mocker: MockerFixture) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        face_recognizer = FaceRecognizer("buffalo_s", cache_dir="test_cache", min_score=0.5)

        assert face_recognizer.min_score == 0.5

    def test_basic(self, cv_image: cv2.Mat, mocker: MockerFixture) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        face_recognizer = FaceRecognizer("buffalo_s", min_score=0.0, cache_dir="test_cache")

        det_model = mock.Mock()
        num_faces = 2
        bbox = np.random.rand(num_faces, 4).astype(np.float32)
        score = np.array([[0.67]] * num_faces).astype(np.float32)
        kpss = np.random.rand(num_faces, 5, 2).astype(np.float32)
        det_model.detect.return_value = (np.concatenate([bbox, score], axis=-1), kpss)
        face_recognizer.det_model = det_model

        rec_model = mock.Mock()
        embedding = np.random.rand(num_faces, 512).astype(np.float32)
        rec_model.get_feat.return_value = embedding
        face_recognizer.rec_model = rec_model

        faces = face_recognizer.predict(cv_image)

        assert len(faces) == num_faces
        for face in faces:
            assert face["imageHeight"] == 800
            assert face["imageWidth"] == 600
            assert isinstance(face["embedding"], list)
            assert len(face["embedding"]) == 512
            assert all([isinstance(num, float) for num in face["embedding"]])

        det_model.detect.assert_called_once()
        assert rec_model.get_feat.call_count == num_faces


@pytest.mark.asyncio
class TestCache:
    async def test_caches(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.IMAGE_CLASSIFICATION)
        await model_cache.get("test_model_name", ModelType.IMAGE_CLASSIFICATION)
        assert len(model_cache.cache._cache) == 1
        mock_get_model.assert_called_once()

    async def test_kwargs_used(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.IMAGE_CLASSIFICATION, cache_dir="test_cache")
        mock_get_model.assert_called_once_with(
            ModelType.IMAGE_CLASSIFICATION, "test_model_name", cache_dir="test_cache"
        )

    async def test_different_clip(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_image_model_name", ModelType.CLIP)
        await model_cache.get("test_text_model_name", ModelType.CLIP)
        mock_get_model.assert_has_calls(
            [
                mock.call(ModelType.CLIP, "test_image_model_name"),
                mock.call(ModelType.CLIP, "test_text_model_name"),
            ]
        )
        assert len(model_cache.cache._cache) == 2

    @mock.patch("app.models.cache.OptimisticLock", autospec=True)
    async def test_model_ttl(self, mock_lock_cls: mock.Mock, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache(ttl=100)
        await model_cache.get("test_model_name", ModelType.IMAGE_CLASSIFICATION)
        mock_lock_cls.return_value.__aenter__.return_value.cas.assert_called_with(mock.ANY, ttl=100)

    @mock.patch("app.models.cache.SimpleMemoryCache.expire")
    async def test_revalidate(self, mock_cache_expire: mock.Mock, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache(ttl=100, revalidate=True)
        await model_cache.get("test_model_name", ModelType.IMAGE_CLASSIFICATION)
        await model_cache.get("test_model_name", ModelType.IMAGE_CLASSIFICATION)
        mock_cache_expire.assert_called_once_with(mock.ANY, 100)


@pytest.mark.skipif(
    not settings.test_full,
    reason="More time-consuming since it deploys the app and loads models.",
)
class TestEndpoints:
    def test_tagging_endpoint(
        self, pil_image: Image.Image, responses: dict[str, Any], deployed_app: TestClient
    ) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "modelName": "microsoft/resnet-50",
                "modelType": "image-classification",
                "options": json.dumps({"minScore": 0.0}),
            },
            files={"image": byte_image.getvalue()},
        )
        assert response.status_code == 200
        assert response.json() == responses["image-classification"]

    def test_clip_image_endpoint(
        self, pil_image: Image.Image, responses: dict[str, Any], deployed_app: TestClient
    ) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={"modelName": "ViT-B-32::openai", "modelType": "clip", "options": json.dumps({"mode": "vision"})},
            files={"image": byte_image.getvalue()},
        )
        assert response.status_code == 200
        assert response.json() == responses["clip"]["image"]

    def test_clip_text_endpoint(self, responses: dict[str, Any], deployed_app: TestClient) -> None:
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "modelName": "ViT-B-32::openai",
                "modelType": "clip",
                "text": "test search query",
                "options": json.dumps({"mode": "text"}),
            },
        )
        assert response.status_code == 200
        assert response.json() == responses["clip"]["text"]

    def test_face_endpoint(self, pil_image: Image.Image, responses: dict[str, Any], deployed_app: TestClient) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")

        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "modelName": "buffalo_l",
                "modelType": "facial-recognition",
                "options": json.dumps({"minScore": 0.034}),
            },
            files={"image": byte_image.getvalue()},
        )
        assert response.status_code == 200
        assert response.json() == responses["facial-recognition"]


def test_sess_options() -> None:
    sess_options = PicklableSessionOptions()
    sess_options.intra_op_num_threads = 1
    sess_options.inter_op_num_threads = 1
    pickled = pickle.dumps(sess_options)
    unpickled = pickle.loads(pickled)
    assert unpickled.intra_op_num_threads == 1
    assert unpickled.inter_op_num_threads == 1
