from io import BytesIO
from pathlib import Path
from unittest import mock

import cv2
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from .config import settings
from .models.cache import ModelCache
from .models.clip import CLIPSTEncoder
from .models.facial_recognition import FaceRecognizer
from .models.image_classification import ImageClassifier
from .schemas import ModelType


class TestImageClassifier:
    def test_init(self, mock_classifier_pipeline: mock.Mock) -> None:
        cache_dir = Path("test_cache")
        classifier = ImageClassifier("test_model_name", 0.5, cache_dir=cache_dir)

        assert classifier.min_score == 0.5
        mock_classifier_pipeline.assert_called_once_with(
            "image-classification",
            "test_model_name",
            model_kwargs={"cache_dir": cache_dir},
        )

    def test_min_score(self, pil_image: Image.Image, mock_classifier_pipeline: mock.Mock) -> None:
        classifier = ImageClassifier("test_model_name", min_score=0.0)
        classifier.min_score = 0.0
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
    def test_init(self, mock_st: mock.Mock) -> None:
        CLIPSTEncoder("test_model_name", cache_dir="test_cache")

        mock_st.assert_called_once_with("test_model_name", cache_folder="test_cache")

    def test_basic_image(self, pil_image: Image.Image, mock_st: mock.Mock) -> None:
        clip_encoder = CLIPSTEncoder("test_model_name", cache_dir="test_cache")
        embedding = clip_encoder.predict(pil_image)

        assert isinstance(embedding, list)
        assert len(embedding) == 512
        assert all([isinstance(num, float) for num in embedding])
        mock_st.assert_called_once()

    def test_basic_text(self, mock_st: mock.Mock) -> None:
        clip_encoder = CLIPSTEncoder("test_model_name", cache_dir="test_cache")
        embedding = clip_encoder.predict("test search query")

        assert isinstance(embedding, list)
        assert len(embedding) == 512
        assert all([isinstance(num, float) for num in embedding])
        mock_st.assert_called_once()


class TestFaceRecognition:
    def test_init(self, mock_faceanalysis: mock.Mock) -> None:
        FaceRecognizer("test_model_name", cache_dir="test_cache")

        mock_faceanalysis.assert_called_once_with(
            name="test_model_name",
            root="test_cache",
            allowed_modules=["detection", "recognition"],
        )

    def test_basic(self, cv_image: cv2.Mat, mock_faceanalysis: mock.Mock) -> None:
        face_recognizer = FaceRecognizer("test_model_name", min_score=0.0, cache_dir="test_cache")
        faces = face_recognizer.predict(cv_image)

        assert len(faces) == 2
        for face in faces:
            assert face["imageHeight"] == 800
            assert face["imageWidth"] == 600
            assert isinstance(face["embedding"], list)
            assert len(face["embedding"]) == 512
            assert all([isinstance(num, float) for num in face["embedding"]])

        mock_faceanalysis.assert_called_once()


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
    def test_tagging_endpoint(self, pil_image: Image.Image, deployed_app: TestClient) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        headers = {"Content-Type": "image/jpg"}
        response = deployed_app.post(
            "http://localhost:3003/image-classifier/tag-image",
            content=byte_image.getvalue(),
            headers=headers,
        )
        assert response.status_code == 200

    def test_clip_image_endpoint(self, pil_image: Image.Image, deployed_app: TestClient) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        headers = {"Content-Type": "image/jpg"}
        response = deployed_app.post(
            "http://localhost:3003/sentence-transformer/encode-image",
            content=byte_image.getvalue(),
            headers=headers,
        )
        assert response.status_code == 200

    def test_clip_text_endpoint(self, deployed_app: TestClient) -> None:
        response = deployed_app.post(
            "http://localhost:3003/sentence-transformer/encode-text",
            json={"text": "test search query"},
        )
        assert response.status_code == 200

    def test_face_endpoint(self, pil_image: Image.Image, deployed_app: TestClient) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        headers = {"Content-Type": "image/jpg"}
        response = deployed_app.post(
            "http://localhost:3003/facial-recognition/detect-faces",
            content=byte_image.getvalue(),
            headers=headers,
        )
        assert response.status_code == 200
