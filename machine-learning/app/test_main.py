import json
import os
from io import BytesIO
from pathlib import Path
from random import randint
from types import SimpleNamespace
from typing import Any, Callable
from unittest import mock

import cv2
import numpy as np
import onnxruntime as ort
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image
from pytest import MonkeyPatch
from pytest_mock import MockerFixture

from app.main import load, preload_models
from app.models.clip.textual import MClipTextualEncoder, OpenClipTextualEncoder
from app.models.clip.visual import OpenClipVisualEncoder
from app.models.facial_recognition.detection import FaceDetector
from app.models.facial_recognition.recognition import FaceRecognizer
from app.sessions.ann import AnnSession
from app.sessions.ort import OrtSession

from .config import Settings, settings
from .models.base import InferenceModel
from .models.cache import ModelCache
from .schemas import ModelFormat, ModelTask, ModelType


class TestBase:
    def test_sets_default_cache_dir(self) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai")

        assert encoder.cache_dir == Path(settings.cache_folder) / "clip" / "ViT-B-32__openai"

    def test_sets_cache_dir_kwarg(self) -> None:
        cache_dir = Path("/test_cache")
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=cache_dir)

        assert encoder.cache_dir == cache_dir

    def test_sets_default_model_format(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "ann", True)
        mocker.patch("ann.ann.is_available", False)

        encoder = OpenClipTextualEncoder("ViT-B-32__openai")

        assert encoder.model_format == ModelFormat.ONNX

    def test_sets_default_model_format_to_armnn_if_available(self, path: mock.Mock, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "ann", True)
        mocker.patch("ann.ann.is_available", True)
        path.suffix = ".armnn"

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)

        assert encoder.model_format == ModelFormat.ARMNN

    def test_sets_model_format_kwarg(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "ann", False)
        mocker.patch("ann.ann.is_available", False)

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.ARMNN)

        assert encoder.model_format == ModelFormat.ARMNN

    def test_casts_cache_dir_string_to_path(self) -> None:
        cache_dir = "/test_cache"
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=cache_dir)

        assert encoder.cache_dir == Path(cache_dir)

    def test_clear_cache(self, rmtree: mock.Mock, path: mock.Mock, info: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)
        encoder.clear_cache()

        rmtree.assert_called_once_with(encoder.cache_dir)
        info.assert_called_with(f"Cleared cache directory for model '{encoder.model_name}'.")

    def test_clear_cache_warns_if_path_does_not_exist(
        self, rmtree: mock.Mock, path: mock.Mock, warning: mock.Mock
    ) -> None:
        path.return_value.exists.return_value = False

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)
        encoder.clear_cache()

        rmtree.assert_not_called()
        warning.assert_called_once()

    def test_clear_cache_raises_exception_if_vulnerable_to_symlink_attack(
        self, rmtree: mock.Mock, path: mock.Mock
    ) -> None:
        rmtree.avoids_symlink_attacks = False

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)
        with pytest.raises(RuntimeError):
            encoder.clear_cache()

        rmtree.assert_not_called()

    def test_clear_cache_replaces_file_with_dir_if_path_is_file(
        self, rmtree: mock.Mock, path: mock.Mock, warning: mock.Mock
    ) -> None:
        path.return_value.is_dir.return_value = False

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)
        encoder.clear_cache()

        rmtree.assert_not_called()
        path.return_value.unlink.assert_called_once()
        path.return_value.mkdir.assert_called_once()
        warning.assert_called_once()

    def test_download(self, snapshot_download: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir="/path/to/cache")
        encoder.download()

        snapshot_download.assert_called_once_with(
            "immich-app/ViT-B-32__openai",
            cache_dir=encoder.cache_dir,
            local_dir=encoder.cache_dir,
            ignore_patterns=["*.armnn"],
        )

    def test_download_downloads_armnn_if_preferred_format(self, snapshot_download: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.ARMNN)
        encoder.download()

        snapshot_download.assert_called_once_with(
            "immich-app/ViT-B-32__openai",
            cache_dir=encoder.cache_dir,
            local_dir=encoder.cache_dir,
            ignore_patterns=[],
        )

    def test_throws_exception_if_model_path_does_not_exist(
        self, snapshot_download: mock.Mock, ort_session: mock.Mock, path: mock.Mock
    ) -> None:
        path.return_value.__truediv__.return_value.__truediv__.return_value.is_file.return_value = False

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)

        with pytest.raises(FileNotFoundError):
            encoder.load()

        snapshot_download.assert_called_once()
        ort_session.assert_not_called()


@pytest.mark.usefixtures("ort_session")
class TestOrtSession:
    CPU_EP = ["CPUExecutionProvider"]
    CUDA_EP = ["CUDAExecutionProvider", "CPUExecutionProvider"]
    OV_EP = ["OpenVINOExecutionProvider", "CPUExecutionProvider"]
    CUDA_EP_OUT_OF_ORDER = ["CPUExecutionProvider", "CUDAExecutionProvider"]
    TRT_EP = ["TensorrtExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]

    @pytest.mark.providers(CPU_EP)
    def test_sets_cpu_provider(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.CPU_EP

    @pytest.mark.providers(CUDA_EP)
    def test_sets_cuda_provider_if_available(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.CUDA_EP

    @pytest.mark.ov_device_ids(["GPU.0", "CPU"])
    @pytest.mark.providers(OV_EP)
    def test_sets_openvino_provider_if_available(self, providers: list[str], ov_device_ids: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.OV_EP

    @pytest.mark.ov_device_ids(["CPU"])
    @pytest.mark.providers(OV_EP)
    def test_avoids_openvino_if_gpu_not_available(self, providers: list[str], ov_device_ids: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.CPU_EP

    @pytest.mark.providers(CUDA_EP_OUT_OF_ORDER)
    def test_sets_providers_in_correct_order(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.CUDA_EP

    @pytest.mark.providers(TRT_EP)
    def test_ignores_unsupported_providers(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.CUDA_EP

    def test_sets_provider_kwarg(self) -> None:
        providers = ["CUDAExecutionProvider"]
        session = OrtSession("ViT-B-32__openai", providers=providers)

        assert session.providers == providers

    @pytest.mark.ov_device_ids(["GPU.0", "CPU"])
    def test_sets_default_provider_options(self, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/model.onnx"
        session = OrtSession(model_path, providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"])

        assert session.provider_options == [
            {"device_type": "GPU.0", "precision": "FP32", "cache_dir": "/cache/ViT-B-32__openai/openvino"},
            {"arena_extend_strategy": "kSameAsRequested"},
        ]

    def test_sets_device_id_for_openvino(self) -> None:
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"

        session = OrtSession("ViT-B-32__openai", providers=["OpenVINOExecutionProvider"])

        assert session.provider_options[0]["device_type"] == "GPU.1"

    def test_sets_device_id_for_cuda(self) -> None:
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"

        session = OrtSession("ViT-B-32__openai", providers=["CUDAExecutionProvider"])

        assert session.provider_options[0]["device_id"] == "1"

    def test_sets_provider_options_kwarg(self) -> None:
        session = OrtSession(
            "ViT-B-32__openai",
            providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"],
            provider_options=[],
        )

        assert session.provider_options == []

    def test_sets_default_sess_options(self) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.sess_options.execution_mode == ort.ExecutionMode.ORT_SEQUENTIAL
        assert session.sess_options.inter_op_num_threads == 1
        assert session.sess_options.intra_op_num_threads == 2
        assert session.sess_options.enable_cpu_mem_arena is False

    def test_sets_default_sess_options_does_not_set_threads_if_non_cpu_and_default_threads(self) -> None:
        session = OrtSession("ViT-B-32__openai", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

        assert session.sess_options.inter_op_num_threads == 0
        assert session.sess_options.intra_op_num_threads == 0

    def test_sets_default_sess_options_sets_threads_if_non_cpu_and_set_threads(self, mocker: MockerFixture) -> None:
        mock_settings = mocker.patch("app.sessions.ort.settings", autospec=True)
        mock_settings.model_inter_op_threads = 2
        mock_settings.model_intra_op_threads = 4

        session = OrtSession("ViT-B-32__openai", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

        assert session.sess_options.inter_op_num_threads == 2
        assert session.sess_options.intra_op_num_threads == 4

    def test_sets_sess_options_kwarg(self) -> None:
        sess_options = ort.SessionOptions()
        session = OrtSession(
            "ViT-B-32__openai",
            providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"],
            provider_options=[],
            sess_options=sess_options,
        )

        assert sess_options is session.sess_options


class TestAnnSession:
    def test_creates_ann_session(self, ann_session: mock.Mock, info: mock.Mock) -> None:
        model_path = mock.MagicMock(spec=Path)
        cache_dir = mock.MagicMock(spec=Path)

        AnnSession(model_path, cache_dir)

        ann_session.assert_called_once_with(tuning_level=2, tuning_file=(cache_dir / "gpu-tuning.ann").as_posix())
        ann_session.return_value.load.assert_called_once_with(
            model_path.as_posix(), cached_network_path=model_path.with_suffix(".anncache").as_posix(), fp16=False
        )
        info.assert_has_calls(
            [
                mock.call("Loading ANN model %s ...", model_path),
                mock.call("Loaded ANN model with ID %d", ann_session.return_value.load.return_value),
            ]
        )

    def test_get_inputs(self, ann_session: mock.Mock) -> None:
        ann_session.return_value.load.return_value = 123
        ann_session.return_value.input_shapes = {123: [(1, 3, 224, 224)]}
        session = AnnSession(Path("ViT-B-32__openai"))

        inputs = session.get_inputs()

        assert len(inputs) == 1
        assert inputs[0].name is None
        assert inputs[0].shape == (1, 3, 224, 224)

    def test_get_outputs(self, ann_session: mock.Mock) -> None:
        ann_session.return_value.load.return_value = 123
        ann_session.return_value.output_shapes = {123: [(1, 3, 224, 224)]}
        session = AnnSession(Path("ViT-B-32__openai"))

        outputs = session.get_outputs()

        assert len(outputs) == 1
        assert outputs[0].name is None
        assert outputs[0].shape == (1, 3, 224, 224)

    def test_run(self, ann_session: mock.Mock, mocker: MockerFixture) -> None:
        ann_session.return_value.load.return_value = 123
        np_spy = mocker.spy(np, "ascontiguousarray")
        session = AnnSession(Path("ViT-B-32__openai"))
        [input1, input2] = [np.random.rand(1, 3, 224, 224).astype(np.float32) for _ in range(2)]
        input_feed = {"input.1": input1, "input.2": input2}

        session.run(None, input_feed)

        ann_session.return_value.execute.assert_called_once_with(123, [input1, input2])
        np_spy.call_count == 2
        np_spy.assert_has_calls([mock.call(input1), mock.call(input2)])


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
        mocker.patch.object(OpenClipVisualEncoder, "download")
        mocker.patch.object(OpenClipVisualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipVisualEncoder, "preprocess_cfg", clip_preprocess_cfg)

        mocked = mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mocked.run.return_value = [[self.embedding]]

        clip_encoder = OpenClipVisualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        embedding = clip_encoder.predict(pil_image)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape[0] == clip_model_cfg["embed_dim"]
        assert embedding.dtype == np.float32
        mocked.run.assert_called_once()

    def test_basic_text(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)

        mocked = mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mocked.run.return_value = [[self.embedding]]
        mocker.patch("app.models.clip.textual.Tokenizer.from_file", autospec=True)

        clip_encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        embedding = clip_encoder.predict("test search query")

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape[0] == clip_model_cfg["embed_dim"]
        assert embedding.dtype == np.float32
        mocked.run.assert_called_once()

    def test_openclip_tokenizer(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)
        mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mock_tokenizer = mocker.patch("app.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
        mock_ids = [randint(0, 50000) for _ in range(77)]
        mock_tokenizer.encode.return_value = SimpleNamespace(ids=mock_ids)

        clip_encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        clip_encoder._load()
        tokens = clip_encoder.tokenize("test   search query")

        assert "text" in tokens
        assert isinstance(tokens["text"], np.ndarray)
        assert tokens["text"].shape == (1, 77)
        assert tokens["text"].dtype == np.int32
        assert np.allclose(tokens["text"], np.array([mock_ids], dtype=np.int32), atol=0)
        mock_tokenizer.encode.assert_called_once_with("test search query")

    def test_openclip_tokenizer_canonicalizes_text(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        clip_model_cfg["text_cfg"]["tokenizer_kwargs"] = {"clean": "canonicalize"}
        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)
        mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mock_tokenizer = mocker.patch("app.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
        mock_ids = [randint(0, 50000) for _ in range(77)]
        mock_tokenizer.encode.return_value = SimpleNamespace(ids=mock_ids)

        clip_encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        clip_encoder._load()
        tokens = clip_encoder.tokenize("Test   Search Query!")

        assert "text" in tokens
        assert isinstance(tokens["text"], np.ndarray)
        assert tokens["text"].shape == (1, 77)
        assert tokens["text"].dtype == np.int32
        assert np.allclose(tokens["text"], np.array([mock_ids], dtype=np.int32), atol=0)
        mock_tokenizer.encode.assert_called_once_with("test search query")

    def test_mclip_tokenizer(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(MClipTextualEncoder, "download")
        mocker.patch.object(MClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(MClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)
        mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mock_tokenizer = mocker.patch("app.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
        mock_ids = [randint(0, 50000) for _ in range(77)]
        mock_attention_mask = [randint(0, 1) for _ in range(77)]
        mock_tokenizer.encode.return_value = SimpleNamespace(ids=mock_ids, attention_mask=mock_attention_mask)

        clip_encoder = MClipTextualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        clip_encoder._load()
        tokens = clip_encoder.tokenize("test search query")

        assert "input_ids" in tokens
        assert "attention_mask" in tokens
        assert isinstance(tokens["input_ids"], np.ndarray)
        assert isinstance(tokens["attention_mask"], np.ndarray)
        assert tokens["input_ids"].shape == (1, 77)
        assert tokens["attention_mask"].shape == (1, 77)
        assert np.allclose(tokens["input_ids"], np.array([mock_ids], dtype=np.int32), atol=0)
        assert np.allclose(tokens["attention_mask"], np.array([mock_attention_mask], dtype=np.int32), atol=0)


class TestFaceRecognition:
    def test_set_min_score(self, mocker: MockerFixture) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        face_recognizer = FaceRecognizer("buffalo_s", cache_dir="test_cache", min_score=0.5)

        assert face_recognizer.min_score == 0.5

    def test_detection(self, cv_image: cv2.Mat, mocker: MockerFixture) -> None:
        mocker.patch.object(FaceDetector, "load")
        face_detector = FaceDetector("buffalo_s", min_score=0.0, cache_dir="test_cache")

        det_model = mock.Mock()
        num_faces = 2
        bbox = np.random.rand(num_faces, 4).astype(np.float32)
        scores = np.array([[0.67]] * num_faces).astype(np.float32)
        kpss = np.random.rand(num_faces, 5, 2).astype(np.float32)
        det_model.detect.return_value = (np.concatenate([bbox, scores], axis=-1), kpss)
        face_detector.model = det_model

        faces = face_detector.predict(cv_image)

        assert isinstance(faces, dict)
        assert isinstance(faces.get("boxes", None), np.ndarray)
        assert isinstance(faces.get("landmarks", None), np.ndarray)
        assert isinstance(faces.get("scores", None), np.ndarray)
        assert np.equal(faces["boxes"], bbox.round()).all()
        assert np.equal(faces["landmarks"], kpss).all()
        assert np.equal(faces["scores"], scores).all()
        det_model.detect.assert_called_once()

    def test_recognition(self, cv_image: cv2.Mat, mocker: MockerFixture) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        face_recognizer = FaceRecognizer("buffalo_s", min_score=0.0, cache_dir="test_cache")

        num_faces = 2
        bbox = np.random.rand(num_faces, 4).astype(np.float32)
        scores = np.array([0.67] * num_faces).astype(np.float32)
        kpss = np.random.rand(num_faces, 5, 2).astype(np.float32)
        faces = {"boxes": bbox, "landmarks": kpss, "scores": scores}

        rec_model = mock.Mock()
        embedding = np.random.rand(num_faces, 512).astype(np.float32)
        rec_model.get_feat.return_value = embedding
        face_recognizer.model = rec_model

        faces = face_recognizer.predict(cv_image, faces)

        assert isinstance(faces, list)
        assert len(faces) == num_faces
        for face in faces:
            assert isinstance(face.get("boundingBox"), dict)
            assert set(face["boundingBox"]) == {"x1", "y1", "x2", "y2"}
            assert all(isinstance(val, np.float32) for val in face["boundingBox"].values())
            assert isinstance(face.get("embedding"), np.ndarray)
            assert face["embedding"].shape[0] == 512
            assert isinstance(face.get("score", None), np.float32)

        rec_model.get_feat.assert_called_once()
        call_args = rec_model.get_feat.call_args_list[0].args
        assert len(call_args) == 1
        assert isinstance(call_args[0], list)
        assert isinstance(call_args[0][0], np.ndarray)
        assert call_args[0][0].shape == (112, 112, 3)

    def test_recognition_adds_batch_axis_for_ort(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        onnx = mocker.patch("app.models.facial_recognition.recognition.onnx", autospec=True)
        update_dims = mocker.patch(
            "app.models.facial_recognition.recognition.update_inputs_outputs_dims", autospec=True
        )
        mocker.patch("app.models.base.InferenceModel.download")
        mocker.patch("app.models.facial_recognition.recognition.ArcFaceONNX")
        ort_session.return_value.get_inputs.return_value = [SimpleNamespace(name="input.1", shape=(1, 3, 224, 224))]
        ort_session.return_value.get_outputs.return_value = [SimpleNamespace(name="output.1", shape=(1, 800))]
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"

        proto = mock.Mock()

        input_dims = mock.Mock()
        input_dims.name = "input.1"
        input_dims.type.tensor_type.shape.dim = [SimpleNamespace(dim_value=size) for size in [1, 3, 224, 224]]
        proto.graph.input = [input_dims]

        output_dims = mock.Mock()
        output_dims.name = "output.1"
        output_dims.type.tensor_type.shape.dim = [SimpleNamespace(dim_value=size) for size in [1, 800]]
        proto.graph.output = [output_dims]

        onnx.load.return_value = proto

        face_recognizer = FaceRecognizer("buffalo_s", cache_dir=path)
        face_recognizer.load()

        assert face_recognizer.batch is True
        update_dims.assert_called_once_with(proto, {"input.1": ["batch", 3, 224, 224]}, {"output.1": ["batch", 800]})
        onnx.save.assert_called_once_with(update_dims.return_value, face_recognizer.model_path)

    def test_recognition_does_not_add_batch_axis_if_exists(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        onnx = mocker.patch("app.models.facial_recognition.recognition.onnx", autospec=True)
        update_dims = mocker.patch(
            "app.models.facial_recognition.recognition.update_inputs_outputs_dims", autospec=True
        )
        mocker.patch("app.models.base.InferenceModel.download")
        mocker.patch("app.models.facial_recognition.recognition.ArcFaceONNX")
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"

        inputs = [SimpleNamespace(name="input.1", shape=("batch", 3, 224, 224))]
        outputs = [SimpleNamespace(name="output.1", shape=("batch", 800))]
        ort_session.return_value.get_inputs.return_value = inputs
        ort_session.return_value.get_outputs.return_value = outputs

        face_recognizer = FaceRecognizer("buffalo_s", cache_dir=path)
        face_recognizer.load()

        assert face_recognizer.batch is True
        update_dims.assert_not_called()
        onnx.load.assert_not_called()
        onnx.save.assert_not_called()

    def test_recognition_does_not_add_batch_axis_for_armnn(
        self, ann_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        onnx = mocker.patch("app.models.facial_recognition.recognition.onnx", autospec=True)
        update_dims = mocker.patch(
            "app.models.facial_recognition.recognition.update_inputs_outputs_dims", autospec=True
        )
        mocker.patch("app.models.base.InferenceModel.download")
        mocker.patch("app.models.facial_recognition.recognition.ArcFaceONNX")
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".armnn"

        inputs = [SimpleNamespace(name="input.1", shape=("batch", 3, 224, 224))]
        outputs = [SimpleNamespace(name="output.1", shape=("batch", 800))]
        ann_session.return_value.get_inputs.return_value = inputs
        ann_session.return_value.get_outputs.return_value = outputs

        face_recognizer = FaceRecognizer("buffalo_s", model_format=ModelFormat.ARMNN, cache_dir=path)
        face_recognizer.load()

        assert face_recognizer.batch is False
        update_dims.assert_not_called()
        onnx.load.assert_not_called()
        onnx.save.assert_not_called()


@pytest.mark.asyncio
class TestCache:
    async def test_caches(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)
        await model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)
        assert len(model_cache.cache._cache) == 1
        mock_get_model.assert_called_once()

    async def test_kwargs_used(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get(
            "test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, cache_dir="test_cache"
        )
        mock_get_model.assert_called_once_with(
            "test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, cache_dir="test_cache"
        )

    async def test_different_clip(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.VISUAL, ModelTask.SEARCH)
        await model_cache.get("test_model_name", ModelType.TEXTUAL, ModelTask.SEARCH)
        mock_get_model.assert_has_calls(
            [
                mock.call("test_model_name", ModelType.VISUAL, ModelTask.SEARCH),
                mock.call("test_model_name", ModelType.TEXTUAL, ModelTask.SEARCH),
            ]
        )
        assert len(model_cache.cache._cache) == 2

    @mock.patch("app.models.cache.OptimisticLock", autospec=True)
    async def test_model_ttl(self, mock_lock_cls: mock.Mock, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)
        mock_lock_cls.return_value.__aenter__.return_value.cas.assert_called_with(mock.ANY, ttl=100)

    @mock.patch("app.models.cache.SimpleMemoryCache.expire")
    async def test_revalidate_get(self, mock_cache_expire: mock.Mock, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache(revalidate=True)
        await model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)
        await model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)
        mock_cache_expire.assert_called_once_with(mock.ANY, 100)

    async def test_profiling(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache(profiling=True)
        await model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)
        profiling = await model_cache.get_profiling()
        assert isinstance(profiling, dict)
        assert profiling == model_cache.cache.profiling

    async def test_loads_mclip(self) -> None:
        model_cache = ModelCache()

        model = await model_cache.get("XLM-Roberta-Large-Vit-B-32", ModelType.TEXTUAL, ModelTask.SEARCH)

        assert isinstance(model, MClipTextualEncoder)
        assert model.model_name == "XLM-Roberta-Large-Vit-B-32"

    async def test_raises_exception_if_invalid_model_type(self) -> None:
        invalid: Any = SimpleNamespace(value="invalid")
        model_cache = ModelCache()

        with pytest.raises(ValueError):
            await model_cache.get("XLM-Roberta-Large-Vit-B-32", ModelType.TEXTUAL, invalid)

    async def test_raises_exception_if_unknown_model_name(self) -> None:
        model_cache = ModelCache()

        with pytest.raises(ValueError):
            await model_cache.get("test_model_name", ModelType.TEXTUAL, ModelTask.SEARCH)

    async def test_preloads_clip_models(self, monkeypatch: MonkeyPatch, mock_get_model: mock.Mock) -> None:
        os.environ["MACHINE_LEARNING_PRELOAD__CLIP"] = "ViT-B-32__openai"

        settings = Settings()
        assert settings.preload is not None
        assert settings.preload.clip == "ViT-B-32__openai"

        model_cache = ModelCache()
        monkeypatch.setattr("app.main.model_cache", model_cache)

        await preload_models(settings.preload)
        mock_get_model.assert_has_calls(
            [
                mock.call("ViT-B-32__openai", ModelType.TEXTUAL, ModelTask.SEARCH),
                mock.call("ViT-B-32__openai", ModelType.VISUAL, ModelTask.SEARCH),
            ],
            any_order=True,
        )

    async def test_preloads_facial_recognition_models(
        self, monkeypatch: MonkeyPatch, mock_get_model: mock.Mock
    ) -> None:
        os.environ["MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION"] = "buffalo_s"

        settings = Settings()
        assert settings.preload is not None
        assert settings.preload.facial_recognition == "buffalo_s"

        model_cache = ModelCache()
        monkeypatch.setattr("app.main.model_cache", model_cache)

        await preload_models(settings.preload)
        mock_get_model.assert_has_calls(
            [
                mock.call("buffalo_s", ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION),
                mock.call("buffalo_s", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION),
            ],
            any_order=True,
        )

    async def test_preloads_all_models(self, monkeypatch: MonkeyPatch, mock_get_model: mock.Mock) -> None:
        os.environ["MACHINE_LEARNING_PRELOAD__CLIP"] = "ViT-B-32__openai"
        os.environ["MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION"] = "buffalo_s"

        settings = Settings()
        assert settings.preload is not None
        assert settings.preload.clip == "ViT-B-32__openai"
        assert settings.preload.facial_recognition == "buffalo_s"

        model_cache = ModelCache()
        monkeypatch.setattr("app.main.model_cache", model_cache)

        await preload_models(settings.preload)
        mock_get_model.assert_has_calls(
            [
                mock.call("ViT-B-32__openai", ModelType.TEXTUAL, ModelTask.SEARCH),
                mock.call("ViT-B-32__openai", ModelType.VISUAL, ModelTask.SEARCH),
                mock.call("buffalo_s", ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION),
                mock.call("buffalo_s", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION),
            ],
            any_order=True,
        )


@pytest.mark.asyncio
class TestLoad:
    async def test_load(self) -> None:
        mock_model = mock.Mock(spec=InferenceModel)
        mock_model.loaded = False
        mock_model.load_attempts = 0

        res = await load(mock_model)

        assert res is mock_model
        mock_model.load.assert_called_once()
        mock_model.clear_cache.assert_not_called()

    async def test_load_returns_model_if_loaded(self) -> None:
        mock_model = mock.Mock(spec=InferenceModel)
        mock_model.loaded = True

        res = await load(mock_model)

        assert res is mock_model
        mock_model.load.assert_not_called()

    async def test_load_clears_cache_and_retries_if_os_error(self) -> None:
        mock_model = mock.Mock(spec=InferenceModel)
        mock_model.model_name = "test_model_name"
        mock_model.model_type = ModelType.VISUAL
        mock_model.model_task = ModelTask.SEARCH
        mock_model.load.side_effect = [OSError, None]
        mock_model.loaded = False
        mock_model.load_attempts = 0

        res = await load(mock_model)

        assert res is mock_model
        mock_model.clear_cache.assert_called_once()
        assert mock_model.load.call_count == 2

    async def test_load_raises_if_os_error_and_already_retried(self) -> None:
        mock_model = mock.Mock(spec=InferenceModel)
        mock_model.model_name = "test_model_name"
        mock_model.model_type = ModelType.VISUAL
        mock_model.model_task = ModelTask.SEARCH
        mock_model.loaded = False
        mock_model.load_attempts = 2

        with pytest.raises(HTTPException):
            await load(mock_model)

        mock_model.clear_cache.assert_not_called()
        mock_model.load.assert_not_called()

    async def test_falls_back_to_onnx_if_other_format_does_not_exist(
        self, exception: mock.Mock, warning: mock.Mock
    ) -> None:
        mock_model = mock.Mock(spec=InferenceModel)
        mock_model.model_name = "test_model_name"
        mock_model.model_type = ModelType.VISUAL
        mock_model.model_task = ModelTask.SEARCH
        mock_model.model_format = ModelFormat.ARMNN
        mock_model.loaded = False
        mock_model.load_attempts = 0
        error = FileNotFoundError()
        mock_model.load.side_effect = [error, None]

        await load(mock_model)

        mock_model.clear_cache.assert_not_called()
        assert mock_model.load.call_count == 2
        exception.assert_called_once_with(error)
        warning.assert_called_once_with("ARMNN is available, but model 'test_model_name' does not support it.")
        mock_model.model_format = ModelFormat.ONNX


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
        expected = responses["clip"]["image"]

        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={"entries": json.dumps({"clip": {"visual": {"modelName": "ViT-B-32__openai"}}})},
            files={"image": byte_image.getvalue()},
        )

        actual = response.json()
        assert response.status_code == 200
        assert isinstance(actual, dict)
        assert isinstance(actual.get("clip", None), list)
        assert np.allclose(expected, actual["clip"])

    def test_clip_text_endpoint(self, responses: dict[str, Any], deployed_app: TestClient) -> None:
        expected = responses["clip"]["text"]

        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "entries": json.dumps(
                    {
                        "clip": {"textual": {"modelName": "ViT-B-32__openai"}},
                    },
                ),
                "text": "test search query",
            },
        )

        actual = response.json()
        assert response.status_code == 200
        assert isinstance(actual, dict)
        assert isinstance(actual.get("clip", None), list)
        assert np.allclose(expected, actual["clip"])

    def test_face_endpoint(self, pil_image: Image.Image, responses: dict[str, Any], deployed_app: TestClient) -> None:
        byte_image = BytesIO()
        pil_image.save(byte_image, format="jpeg")

        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "entries": json.dumps(
                    {
                        "facial-recognition": {
                            "detection": {"modelName": "buffalo_l", "options": {"minScore": 0.034}},
                            "recognition": {"modelName": "buffalo_l"},
                        }
                    }
                )
            },
            files={"image": byte_image.getvalue()},
        )

        actual = response.json()
        assert response.status_code == 200
        assert isinstance(actual, dict)
        assert actual.get("imageHeight", None) == responses["imageHeight"]
        assert actual.get("imageWidth", None) == responses["imageWidth"]
        assert "facial-recognition" in actual and isinstance(actual["facial-recognition"], list)
        assert len(actual["facial-recognition"]) == len(responses["facial-recognition"])

        for expected_face, actual_face in zip(responses["facial-recognition"], actual["facial-recognition"]):
            assert expected_face["boundingBox"] == actual_face["boundingBox"]
            assert np.allclose(expected_face["embedding"], actual_face["embedding"])
            assert np.allclose(expected_face["score"], actual_face["score"])
