from io import BytesIO
from pathlib import Path
from unittest import mock

import cv2
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from .fixtures import *
from .main import app
from .models.clip import CLIPSTEncoder
from .models.facial_recognition import FaceRecognizer
from .models.image_classification import ImageClassifier

client = TestClient(app)


@pytest.mark.usefixtures("mock_classifier_pipeline")
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

    def test_min_score(
        self, mock_classifier_pipeline: mock.Mock, pil_image: Image.Image
    ) -> None:
        classifier = ImageClassifier("test_model_name", min_score=0.0)
        classifier.min_score = 0.0
        all_labels = classifier.classify(pil_image)
        classifier.min_score = 0.5
        filtered_labels = classifier.classify(pil_image)

        assert all_labels == [
            "that's an image alright",
            "well it ends with .jpg",
            "idk",
            "im just seeing bytes",
            "not sure",
            "probably a virus",
        ]
        assert filtered_labels == ["that's an image alright"]

    def test_endpoint(
        self, pil_image: Image.Image, mock_classifier_pipeline: mock.Mock
    ) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        headers = {"Content-Type": "image/jpg"}
        response = client.post(
            "/image-classifier/tag-image",
            content=byte_image.getvalue(),
            headers=headers,
        )
        assert response.status_code == 200

    @pytest.mark.skip(reason="Not implemented")
    def test_model(
        self, pil_image: Image.Image, mock_classifier_pipeline: mock.Mock
    ) -> None:
        pass


@pytest.mark.usefixtures("mock_st")
class TestCLIP:
    def test_init(self, mock_st: mock.Mock) -> None:
        CLIPSTEncoder("test_model_name", cache_dir="test_cache")

        mock_st.assert_called_once_with("test_model_name", cache_folder="test_cache")

    def test_different_models(self, mock_st: mock.Mock) -> None:
        CLIPSTEncoder(
            "vision_model_name",
            "text_model_name",
            cache_dir="test_cache",
        )

        mock_st.assert_has_calls(
            [
                mock.call("vision_model_name", cache_folder="test_cache"),
                mock.call("text_model_name", cache_folder="test_cache"),
            ]
        )

    def test_basic_image(self, pil_image: Image.Image, mock_st: mock.Mock) -> None:
        clip_encoder = CLIPSTEncoder("test_model_name", vision_cache_dir="test_cache")
        embedding = clip_encoder.encode_image(pil_image)

        assert isinstance(embedding, list)
        assert len(embedding) == 512
        assert all([isinstance(num, float) for num in embedding])
        mock_st.assert_called_once()

    def test_basic_text(self, mock_st: mock.Mock) -> None:
        clip_encoder = CLIPSTEncoder("test_model_name", vision_cache_dir="test_cache")
        embedding = clip_encoder.encode_text("test search query")

        assert isinstance(embedding, list)
        assert len(embedding) == 512
        assert all([isinstance(num, float) for num in embedding])
        mock_st.assert_called_once()

    def test_image_endpoint(self, pil_image: Image.Image, mock_st: mock.Mock) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        headers = {"Content-Type": "image/jpg"}
        response = client.post(
            "/sentence-transformer/encode-image",
            content=byte_image.getvalue(),
            headers=headers,
        )
        assert response.status_code == 200

    def test_text_endpoint(self, mock_st: mock.Mock) -> None:
        response = client.post(
            "/sentence-transformer/encode-text", json={"text": "test search query"}
        )
        assert response.status_code == 200

    @pytest.mark.skip(reason="Not implemented")
    def test_image_model(self, pil_image: Image.Image, mock_st: mock.Mock) -> None:
        pass

    @pytest.mark.skip(reason="Not implemented")
    def test_text_model(self, mock_st: mock.Mock) -> None:
        pass


@pytest.mark.usefixtures("mock_faceanalysis")
class TestFaceRecognition:
    def test_init(self, mock_faceanalysis: mock.Mock) -> None:
        FaceRecognizer("test_model_name", cache_dir="test_cache")

        mock_faceanalysis.assert_called_once_with(
            name="test_model_name",
            root="test_cache",
            allowed_modules=["detection", "recognition"],
        )

    def test_basic(self, cv_image: cv2.Mat, mock_faceanalysis: mock.Mock) -> None:
        face_recognizer = FaceRecognizer(
            "test_model_name", min_score=0.0, cache_dir="test_cache"
        )
        faces = face_recognizer.recognize(cv_image)

        assert len(faces) == 2
        for face in faces:
            assert face["imageHeight"] == 800
            assert face["imageWidth"] == 600
            assert isinstance(face["embedding"], list)
            assert len(face["embedding"]) == 512
            assert all([isinstance(num, float) for num in face["embedding"]])

        mock_faceanalysis.assert_called_once()

    def test_endpoint(
        self, pil_image: Image.Image, mock_faceanalysis: mock.Mock
    ) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        headers = {"Content-Type": "image/png"}
        response = client.post(
            "/facial-recognition/detect-faces",
            content=byte_image.getvalue(),
            headers=headers,
        )
        assert response.status_code == 200

    @pytest.mark.skip(reason="Not implemented")
    def test_model(self, cv_image: cv2.Mat, mock_faceanalysis: mock.Mock) -> None:
        pass
