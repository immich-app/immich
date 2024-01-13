import json
import pickle
from io import BytesIO
from pathlib import Path
from typing import Any, Callable
from unittest import mock

import cv2
import numpy as np
import onnxruntime as ort
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from pytest_mock import MockerFixture

from .config import log, settings
from .models.base import InferenceModel, PicklableSessionOptions
from .models.cache import ModelCache
from .models.clip import OpenCLIPEncoder
from .models.facial_recognition import FaceRecognizer
from .schemas import ModelType


class TestBase:
    CPU_EP = ["CPUExecutionProvider"]
    CUDA_EP = ["CUDAExecutionProvider", "CPUExecutionProvider"]
    OV_EP = ["OpenVINOExecutionProvider", "CPUExecutionProvider"]
    CUDA_EP_OUT_OF_ORDER = ["CPUExecutionProvider", "CUDAExecutionProvider"]
    TRT_EP = ["TensorrtExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]

    @pytest.mark.providers(CPU_EP)
    def test_sets_cpu_provider(self, providers: list[str]) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.providers == self.CPU_EP

    @pytest.mark.providers(CUDA_EP)
    def test_sets_cuda_provider_if_available(self, providers: list[str]) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.providers == self.CUDA_EP

    @pytest.mark.providers(OV_EP)
    def test_sets_openvino_provider_if_available(self, providers: list[str]) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.providers == self.OV_EP

    @pytest.mark.providers(CUDA_EP_OUT_OF_ORDER)
    def test_sets_providers_in_correct_order(self, providers: list[str]) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.providers == self.CUDA_EP

    @pytest.mark.providers(TRT_EP)
    def test_ignores_unsupported_providers(self, providers: list[str]) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.providers == self.CUDA_EP

    def test_sets_provider_kwarg(self) -> None:
        providers = ["CUDAExecutionProvider"]
        encoder = OpenCLIPEncoder("ViT-B-32__openai", providers=providers)

        assert encoder.providers == providers

    def test_sets_default_provider_options(self) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai", providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"])

        assert encoder.provider_options == [
            {},
            {"arena_extend_strategy": "kSameAsRequested"},
        ]

    def test_sets_provider_options_kwarg(self) -> None:
        encoder = OpenCLIPEncoder(
            "ViT-B-32__openai",
            providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"],
            provider_options=[],
        )

        assert encoder.provider_options == []

    def test_sets_default_sess_options(self) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.sess_options.execution_mode == ort.ExecutionMode.ORT_SEQUENTIAL
        assert encoder.sess_options.inter_op_num_threads == 1
        assert encoder.sess_options.intra_op_num_threads == 2
        assert encoder.sess_options.enable_cpu_mem_arena is False

    def test_default_sets_parallel_sess_options_if_multiple_inter_op_threads(self, mocker: MockerFixture) -> None:
        mock_settings = mocker.patch("app.models.base.settings")
        mock_settings.model_inter_op_threads = 2

        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.sess_options.inter_op_num_threads == 2
        assert encoder.sess_options.execution_mode == ort.ExecutionMode.ORT_PARALLEL

    def test_sets_sess_options_kwarg(self) -> None:
        sess_options = ort.SessionOptions()
        encoder = OpenCLIPEncoder(
            "ViT-B-32__openai",
            providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"],
            provider_options=[],
            sess_options=sess_options,
        )

        assert sess_options is encoder.sess_options

    def test_sets_default_cache_dir(self) -> None:
        encoder = OpenCLIPEncoder("ViT-B-32__openai")

        assert encoder.cache_dir == Path("/cache/clip/ViT-B-32__openai")

    def test_sets_cache_dir_kwarg(self) -> None:
        cache_dir = Path("/test_cache")
        encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir=cache_dir)

        assert encoder.cache_dir == cache_dir

    def test_casts_cache_dir_string_to_path(self) -> None:
        cache_dir = "/test_cache"
        encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir=cache_dir)

        assert encoder.cache_dir == Path(cache_dir)

    def test_clear_cache(self, mocker: MockerFixture) -> None:
        mock_rmtree = mocker.patch("app.models.base.rmtree", autospec=True)
        mock_rmtree.avoids_symlink_attacks = True
        mock_cache_dir = mocker.Mock()
        mock_cache_dir.exists.return_value = True
        mock_cache_dir.is_dir.return_value = True
        mocker.patch("app.models.base.Path", return_value=mock_cache_dir)
        info = mocker.spy(log, "info")

        encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir=mock_cache_dir)
        encoder.clear_cache()

        mock_rmtree.assert_called_once_with(encoder.cache_dir)
        info.assert_called_once()

    def test_clear_cache_warns_if_path_does_not_exist(self, mocker: MockerFixture) -> None:
        mock_rmtree = mocker.patch("app.models.base.rmtree", autospec=True)
        mock_rmtree.avoids_symlink_attacks = True
        mock_cache_dir = mocker.Mock()
        mock_cache_dir.exists.return_value = False
        mock_cache_dir.is_dir.return_value = True
        mocker.patch("app.models.base.Path", return_value=mock_cache_dir)
        warning = mocker.spy(log, "warning")

        encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir=mock_cache_dir)
        encoder.clear_cache()

        mock_rmtree.assert_not_called()
        warning.assert_called_once()

    def test_clear_cache_raises_exception_if_vulnerable_to_symlink_attack(self, mocker: MockerFixture) -> None:
        mock_rmtree = mocker.patch("app.models.base.rmtree", autospec=True)
        mock_rmtree.avoids_symlink_attacks = False
        mock_cache_dir = mocker.Mock()
        mock_cache_dir.exists.return_value = True
        mock_cache_dir.is_dir.return_value = True
        mocker.patch("app.models.base.Path", return_value=mock_cache_dir)

        encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir=mock_cache_dir)
        with pytest.raises(RuntimeError):
            encoder.clear_cache()

        mock_rmtree.assert_not_called()

    def test_clear_cache_replaces_file_with_dir_if_path_is_file(self, mocker: MockerFixture) -> None:
        mock_rmtree = mocker.patch("app.models.base.rmtree", autospec=True)
        mock_rmtree.avoids_symlink_attacks = True
        mock_cache_dir = mocker.Mock()
        mock_cache_dir.exists.return_value = True
        mock_cache_dir.is_dir.return_value = False
        mocker.patch("app.models.base.Path", return_value=mock_cache_dir)
        warning = mocker.spy(log, "warning")

        encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir=mock_cache_dir)
        encoder.clear_cache()

        mock_rmtree.assert_not_called()
        mock_cache_dir.unlink.assert_called_once()
        mock_cache_dir.mkdir.assert_called_once()
        warning.assert_called_once()

    def test_make_session_return_ann_if_available(self, mocker: MockerFixture) -> None:
        mock_cache_dir = mocker.Mock()
        mock_cache_dir.is_file.return_value = True
        mock_cache_dir.with_suffix.return_value = mock_cache_dir
        mocker.patch.object(settings, "ann", True)
        mocker.patch("ann.ann.is_available", True)
        mock_session = mocker.patch("app.models.base.AnnSession")

        encoder = OpenCLIPEncoder("ViT-B-32__openai")
        encoder._make_session(mock_cache_dir)

        mock_session.assert_called_once()

    def test_make_session_return_ort_if_available_and_ann_is_not(self, mocker: MockerFixture) -> None:
        mock_cache_dir = mocker.Mock()
        mock_cache_dir.is_file.return_value = True
        mock_cache_dir.with_suffix.return_value = mock_cache_dir
        mocker.patch.object(settings, "ann", False)
        mocker.patch("ann.ann.is_available", False)
        mock_session = mocker.patch("app.models.base.ort.InferenceSession")

        encoder = OpenCLIPEncoder("ViT-B-32__openai")
        encoder._make_session(mock_cache_dir)

        mock_session.assert_called_once()

    def test_make_session_raises_exception_if_path_does_not_exist(self, mocker: MockerFixture) -> None:
        mock_cache_dir = mocker.Mock()
        mock_cache_dir.is_file.return_value = False
        mock_cache_dir.with_suffix.return_value = mock_cache_dir
        mocker.patch("ann.ann.is_available", False)
        mock_ann = mocker.patch("app.models.base.ort.InferenceSession")
        mock_ort = mocker.patch("app.models.base.ort.InferenceSession")

        encoder = OpenCLIPEncoder("ViT-B-32__openai")
        with pytest.raises(ValueError):
            encoder._make_session(mock_cache_dir)

        mock_ann.assert_not_called()
        mock_ort.assert_not_called()


class TestCLIP:
    embedding = np.random.rand(512).astype(np.float32)
    cache_dir = Path("test_cache")

    def test_basic_image(
        self,
        pil_image: Image.Image,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_preprocess_cfg: Callable[[Path], dict[str, Any]],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenCLIPEncoder, "download")
        mocker.patch.object(OpenCLIPEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenCLIPEncoder, "preprocess_cfg", clip_preprocess_cfg)
        mocker.patch.object(OpenCLIPEncoder, "tokenizer_cfg", clip_tokenizer_cfg)

        mocked = mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mocked.run.return_value = [[self.embedding]]
        mocker.patch("app.models.clip.Tokenizer.from_file", autospec=True)

        clip_encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir="test_cache", mode="vision")
        embedding = clip_encoder.predict(pil_image)

        assert clip_encoder.mode == "vision"
        assert isinstance(embedding, np.ndarray)
        assert embedding.shape[0] == clip_model_cfg["embed_dim"]
        assert embedding.dtype == np.float32
        mocked.run.assert_called_once()

    def test_basic_text(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_preprocess_cfg: Callable[[Path], dict[str, Any]],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenCLIPEncoder, "download")
        mocker.patch.object(OpenCLIPEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenCLIPEncoder, "preprocess_cfg", clip_preprocess_cfg)
        mocker.patch.object(OpenCLIPEncoder, "tokenizer_cfg", clip_tokenizer_cfg)

        mocked = mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mocked.run.return_value = [[self.embedding]]
        mocker.patch("app.models.clip.Tokenizer.from_file", autospec=True)

        clip_encoder = OpenCLIPEncoder("ViT-B-32__openai", cache_dir="test_cache", mode="text")
        embedding = clip_encoder.predict("test search query")

        assert clip_encoder.mode == "text"
        assert isinstance(embedding, np.ndarray)
        assert embedding.shape[0] == clip_model_cfg["embed_dim"]
        assert embedding.dtype == np.float32
        mocked.run.assert_called_once()


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
            assert isinstance(face["embedding"], np.ndarray)
            assert face["embedding"].shape[0] == 512
            assert face["embedding"].dtype == np.float32

        det_model.detect.assert_called_once()
        assert rec_model.get_feat.call_count == num_faces


@pytest.mark.asyncio
class TestCache:
    async def test_caches(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.FACIAL_RECOGNITION)
        await model_cache.get("test_model_name", ModelType.FACIAL_RECOGNITION)
        assert len(model_cache.cache._cache) == 1
        mock_get_model.assert_called_once()

    async def test_kwargs_used(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.FACIAL_RECOGNITION, cache_dir="test_cache")
        mock_get_model.assert_called_once_with(ModelType.FACIAL_RECOGNITION, "test_model_name", cache_dir="test_cache")

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
        await model_cache.get("test_model_name", ModelType.FACIAL_RECOGNITION)
        mock_lock_cls.return_value.__aenter__.return_value.cas.assert_called_with(mock.ANY, ttl=100)

    @mock.patch("app.models.cache.SimpleMemoryCache.expire")
    async def test_revalidate(self, mock_cache_expire: mock.Mock, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache(ttl=100, revalidate=True)
        await model_cache.get("test_model_name", ModelType.FACIAL_RECOGNITION)
        await model_cache.get("test_model_name", ModelType.FACIAL_RECOGNITION)
        mock_cache_expire.assert_called_once_with(mock.ANY, 100)


@pytest.mark.skipif(
    not settings.test_full,
    reason="More time-consuming since it deploys the app and loads models.",
)
class TestEndpoints:
    def test_clip_image_endpoint(
        self, pil_image: Image.Image, responses: dict[str, Any], deployed_app: TestClient
    ) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={"modelName": "ViT-B-32__openai", "modelType": "clip", "options": json.dumps({"mode": "vision"})},
            files={"image": byte_image.getvalue()},
        )
        assert response.status_code == 200
        assert response.json() == responses["clip"]["image"]

    def test_clip_text_endpoint(self, responses: dict[str, Any], deployed_app: TestClient) -> None:
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "modelName": "ViT-B-32__openai",
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
