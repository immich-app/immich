import json
import os
from io import BytesIO
from pathlib import Path
from random import randint
from types import SimpleNamespace
from typing import Any, Callable
from unittest import mock

import numpy as np
import onnxruntime as ort
import orjson
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image
from pytest import MonkeyPatch
from pytest_mock import MockerFixture

from immich_ml.config import MaxBatchSize, Settings, settings
from immich_ml.main import load, preload_models
from immich_ml.models.base import InferenceModel
from immich_ml.models.cache import ModelCache
from immich_ml.models.clip.textual import MClipTextualEncoder, OpenClipTextualEncoder
from immich_ml.models.clip.visual import OpenClipVisualEncoder
from immich_ml.models.facial_recognition.detection import FaceDetector
from immich_ml.models.facial_recognition.recognition import FaceRecognizer
from immich_ml.models.ocr.detection import TextDetector
from immich_ml.models.ocr.recognition import TextRecognizer
from immich_ml.schemas import ModelFormat, ModelPrecision, ModelTask, ModelType
from immich_ml.sessions.ann import AnnSession
from immich_ml.sessions.ort import OrtSession
from immich_ml.sessions.rknn import RknnSession, run_inference


class FakeLock:
    def __init__(self) -> None:
        self.enter = mock.Mock()
        self.exit = mock.Mock()

    def __enter__(self) -> None:
        self.enter()

    def __exit__(self, *args: object) -> None:
        self.exit(*args)


class TestBase:
    def test_sets_default_worker_timeout(self, monkeypatch: MonkeyPatch) -> None:
        monkeypatch.delenv("DEVICE", raising=False)
        monkeypatch.delenv("MACHINE_LEARNING_WORKER_TIMEOUT", raising=False)

        assert Settings().worker_timeout == 300

    def test_sets_rocm_default_worker_timeout(self, monkeypatch: MonkeyPatch) -> None:
        monkeypatch.setenv("DEVICE", "rocm")
        monkeypatch.delenv("MACHINE_LEARNING_WORKER_TIMEOUT", raising=False)

        assert Settings().worker_timeout == 900

    def test_worker_timeout_env_override(self, monkeypatch: MonkeyPatch) -> None:
        monkeypatch.setenv("DEVICE", "rocm")
        monkeypatch.setenv("MACHINE_LEARNING_WORKER_TIMEOUT", "1200")

        assert Settings().worker_timeout == 1200

    def test_sets_default_cache_dir(self) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai")

        assert encoder.cache_dir == Path(settings.cache_folder) / "clip" / "ViT-B-32__openai"

    def test_sets_cache_dir_kwarg(self) -> None:
        cache_dir = Path("/test_cache")
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=cache_dir)

        assert encoder.cache_dir == cache_dir

    def test_sets_default_model_format(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "ann", True)
        mocker.patch("immich_ml.sessions.ann.loader.is_available", False)

        encoder = OpenClipTextualEncoder("ViT-B-32__openai")

        assert encoder.model_format == ModelFormat.ONNX

    def test_sets_default_model_format_to_armnn_if_available(self, path: mock.Mock, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "ann", True)
        mocker.patch("immich_ml.sessions.ann.loader.is_available", True)
        path.suffix = ".armnn"

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)

        assert encoder.model_format == ModelFormat.ARMNN

    def test_sets_model_format_kwarg(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "ann", False)
        mocker.patch("immich_ml.sessions.ann.loader.is_available", False)

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.ARMNN)

        assert encoder.model_format == ModelFormat.ARMNN

    def test_sets_default_model_format_to_rknn_if_available(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "rknn", True)
        mocker.patch("immich_ml.sessions.rknn.is_available", True)

        encoder = OpenClipTextualEncoder("ViT-B-32__openai")

        assert encoder.model_format == ModelFormat.RKNN

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
            ignore_patterns=["*.armnn", "*.rknn"],
        )

    def test_download_downloads_armnn_if_preferred_format(self, snapshot_download: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.ARMNN)
        encoder.download()

        snapshot_download.assert_called_once_with(
            "immich-app/ViT-B-32__openai",
            cache_dir=encoder.cache_dir,
            local_dir=encoder.cache_dir,
            ignore_patterns=["*.rknn"],
        )

    def test_download_downloads_rknn_if_preferred_format(self, snapshot_download: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.RKNN)
        encoder.download()

        snapshot_download.assert_called_once_with(
            "immich-app/ViT-B-32__openai",
            cache_dir=encoder.cache_dir,
            local_dir=encoder.cache_dir,
            ignore_patterns=["*.armnn"],
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
    ROCM_EP = ["MIGraphXExecutionProvider", "CPUExecutionProvider"]
    COREML_EP = ["CoreMLExecutionProvider", "CPUExecutionProvider"]

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

    @pytest.mark.providers(CUDA_EP_OUT_OF_ORDER)
    def test_sets_providers_in_correct_order(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.CUDA_EP

    @pytest.mark.providers(TRT_EP)
    def test_ignores_unsupported_providers(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.CUDA_EP

    @pytest.mark.providers(ROCM_EP)
    def test_uses_rocm(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.ROCM_EP

    @pytest.mark.providers(COREML_EP)
    def test_uses_coreml(self, providers: list[str]) -> None:
        session = OrtSession("ViT-B-32__openai")

        assert session.providers == self.COREML_EP

    def test_sets_provider_kwarg(self) -> None:
        providers = ["CUDAExecutionProvider"]
        session = OrtSession("ViT-B-32__openai", providers=providers)

        assert session.providers == providers

    @pytest.mark.ov_device_ids(["GPU.0", "CPU"])
    def test_sets_default_provider_options(self, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/textual/model.onnx"

        session = OrtSession(model_path, providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"])

        assert session.provider_options == [
            {
                "device_type": "GPU.0",
                "precision": "FP32",
                "cache_dir": "/cache/ViT-B-32__openai/textual/openvino",
            },
            {"arena_extend_strategy": "kSameAsRequested"},
        ]

    @pytest.mark.ov_device_ids(["GPU.0", "GPU.1", "CPU"])
    def test_sets_provider_options_for_openvino(self, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/textual/model.onnx"
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"

        session = OrtSession(model_path, providers=["OpenVINOExecutionProvider"])

        assert session.provider_options == [
            {
                "device_type": "GPU.1",
                "precision": "FP32",
                "cache_dir": "/cache/ViT-B-32__openai/textual/openvino",
            }
        ]

    @pytest.mark.ov_device_ids(["GPU.0", "GPU.1", "CPU"])
    def test_sets_openvino_to_fp16_if_enabled(self, ov_device_ids: list[str], mocker: MockerFixture) -> None:
        model_path = "/cache/ViT-B-32__openai/textual/model.onnx"
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"
        mocker.patch.object(settings, "openvino_precision", ModelPrecision.FP16)

        session = OrtSession(model_path, providers=["OpenVINOExecutionProvider"])

        assert session.provider_options == [
            {
                "device_type": "GPU.1",
                "precision": "FP16",
                "cache_dir": "/cache/ViT-B-32__openai/textual/openvino",
            }
        ]

    @pytest.mark.ov_device_ids(["CPU"])
    def test_sets_provider_options_for_openvino_cpu(self, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/model.onnx"
        session = OrtSession(model_path, providers=["OpenVINOExecutionProvider"])

        assert session.provider_options == [
            {
                "device_type": "CPU",
                "precision": "FP32",
                "cache_dir": "/cache/ViT-B-32__openai/openvino",
            }
        ]

    def test_sets_provider_options_for_cuda(self) -> None:
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"

        session = OrtSession("ViT-B-32__openai", providers=["CUDAExecutionProvider"])

        assert session.provider_options == [{"arena_extend_strategy": "kSameAsRequested", "device_id": "1"}]

    def test_sets_provider_options_for_rocm(self, mocker: MockerFixture) -> None:
        model_path = "/cache/ViT-B-32__openai/textual/model.onnx"
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"
        mkdir = mocker.patch("immich_ml.sessions.ort.Path.mkdir")

        session = OrtSession(model_path, providers=["MIGraphXExecutionProvider"])

        assert session.provider_options == [
            {
                "device_id": "1",
                "migraphx_model_cache_dir": "/cache/ViT-B-32__openai/textual/migraphx",
                "migraphx_fp16_enable": "0",
            }
        ]
        mkdir.assert_called_once_with(parents=True, exist_ok=True)

    def test_sets_rocm_to_fp16_if_enabled(self, path: mock.Mock, mocker: MockerFixture) -> None:
        model_path = "/cache/ViT-B-32__openai/textual/model.onnx"
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"
        mocker.patch.object(settings, "rocm_precision", ModelPrecision.FP16)
        mkdir = mocker.patch("immich_ml.sessions.ort.Path.mkdir")

        session = OrtSession(model_path, providers=["MIGraphXExecutionProvider"])

        assert session.provider_options == [
            {
                "device_id": "1",
                "migraphx_model_cache_dir": "/cache/ViT-B-32__openai/textual/migraphx",
                "migraphx_fp16_enable": "1",
            }
        ]
        mkdir.assert_called_once_with(parents=True, exist_ok=True)

    def test_sets_provider_options_kwarg(self) -> None:
        session = OrtSession(
            "ViT-B-32__openai",
            providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"],
            provider_options=[],
        )

        assert session.provider_options == []

    def test_sets_default_sess_options_if_cpu(self) -> None:
        session = OrtSession("ViT-B-32__openai", providers=["CPUExecutionProvider"])

        assert session.sess_options.execution_mode == ort.ExecutionMode.ORT_SEQUENTIAL
        assert session.sess_options.inter_op_num_threads == 1
        assert session.sess_options.intra_op_num_threads == 2

    @pytest.mark.ov_device_ids(["CPU"])
    def test_sets_default_sess_options_if_openvino_cpu(self, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/model.onnx"
        session = OrtSession(model_path, providers=["OpenVINOExecutionProvider"])

        assert session.sess_options.execution_mode == ort.ExecutionMode.ORT_SEQUENTIAL
        assert session.sess_options.inter_op_num_threads == 0
        assert session.sess_options.intra_op_num_threads == 0

    @pytest.mark.ov_device_ids(["GPU.0", "CPU"])
    def test_sets_default_sess_options_if_openvino_gpu(self, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/model.onnx"
        session = OrtSession(model_path, providers=["OpenVINOExecutionProvider"])

        assert session.sess_options.inter_op_num_threads == 0
        assert session.sess_options.intra_op_num_threads == 0

    def test_sets_default_sess_options_does_not_set_threads_if_non_cpu_and_default_threads(self) -> None:
        session = OrtSession("ViT-B-32__openai", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

        assert session.sess_options.inter_op_num_threads == 0
        assert session.sess_options.intra_op_num_threads == 0

    def test_sets_default_sess_options_sets_threads_if_non_cpu_and_set_threads(self, mocker: MockerFixture) -> None:
        mock_settings = mocker.patch("immich_ml.sessions.ort.settings", autospec=True)
        mock_settings.model_inter_op_threads = 2
        mock_settings.model_intra_op_threads = 4

        session = OrtSession("ViT-B-32__openai", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

        assert session.sess_options.inter_op_num_threads == 2
        assert session.sess_options.intra_op_num_threads == 4

    def test_uses_arena_if_enabled(self, mocker: MockerFixture) -> None:
        mock_settings = mocker.patch("immich_ml.sessions.ort.settings", autospec=True)
        mock_settings.model_inter_op_threads = 0
        mock_settings.model_intra_op_threads = 0
        mock_settings.model_arena = True

        session = OrtSession("ViT-B-32__openai", providers=["CPUExecutionProvider"])

        assert session.sess_options.enable_cpu_mem_arena

    def test_does_not_use_arena_if_disabled(self, mocker: MockerFixture) -> None:
        mock_settings = mocker.patch("immich_ml.sessions.ort.settings", autospec=True)
        mock_settings.model_inter_op_threads = 0
        mock_settings.model_intra_op_threads = 0
        mock_settings.model_arena = False

        session = OrtSession("ViT-B-32__openai", providers=["CPUExecutionProvider"])

        assert not session.sess_options.enable_cpu_mem_arena

    def test_sets_sess_options_kwarg(self) -> None:
        sess_options = ort.SessionOptions()
        session = OrtSession(
            "ViT-B-32__openai",
            providers=["OpenVINOExecutionProvider", "CPUExecutionProvider"],
            provider_options=[],
            sess_options=sess_options,
        )

        assert sess_options is session.sess_options

    def test_serializes_rocm_first_run_for_new_input_signature(self, mocker: MockerFixture) -> None:
        lock = FakeLock()
        get_model_lock = mocker.patch("immich_ml.sessions.ort._migraphx_get_model_lock", return_value=lock)
        mocker.patch("immich_ml.sessions.ort._migraphx_compiled_inputs", set())
        mocker.patch("immich_ml.sessions.ort.Path.mkdir")
        session = OrtSession("/cache/ViT-B-32__openai/model.onnx", providers=["MIGraphXExecutionProvider"])
        input_feed = {"input": np.random.rand(1, 3, 224, 224).astype(np.float32)}

        session.run(None, input_feed)
        session.run(None, input_feed)

        lock.enter.assert_called_once()
        lock.exit.assert_called_once()
        get_model_lock.assert_called_once()
        session.session.run.assert_has_calls([mock.call(None, input_feed, None), mock.call(None, input_feed, None)])

    def test_serializes_rocm_run_for_each_new_input_signature(self, mocker: MockerFixture) -> None:
        lock = FakeLock()
        mocker.patch("immich_ml.sessions.ort._migraphx_get_model_lock", return_value=lock)
        mocker.patch("immich_ml.sessions.ort._migraphx_compiled_inputs", set())
        mocker.patch("immich_ml.sessions.ort.Path.mkdir")
        session = OrtSession("/cache/ViT-B-32__openai/model.onnx", providers=["MIGraphXExecutionProvider"])
        input_feed = {"input": np.random.rand(1, 3, 224, 224).astype(np.float32)}
        new_shape_input_feed = {"input": np.random.rand(2, 3, 224, 224).astype(np.float32)}

        session.run(None, input_feed)
        session.run(None, new_shape_input_feed)

        assert lock.enter.call_count == 2
        assert lock.exit.call_count == 2
        session.session.run.assert_has_calls(
            [mock.call(None, input_feed, None), mock.call(None, new_shape_input_feed, None)]
        )

    def test_does_not_serialize_non_rocm_run(self, mocker: MockerFixture) -> None:
        lock = FakeLock()
        get_model_lock = mocker.patch("immich_ml.sessions.ort._migraphx_get_model_lock", return_value=lock)
        session = OrtSession("/cache/ViT-B-32__openai/model.onnx", providers=["CPUExecutionProvider"])
        input_feed = {"input": np.random.rand(1, 3, 224, 224).astype(np.float32)}

        session.run(None, input_feed)

        get_model_lock.assert_not_called()
        lock.enter.assert_not_called()
        session.session.run.assert_called_once_with(None, input_feed, None)


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
        assert inputs[0].name == "input.1"
        assert inputs[0].shape == (1, 3, 224, 224)

    def test_get_outputs(self, ann_session: mock.Mock) -> None:
        ann_session.return_value.load.return_value = 123
        ann_session.return_value.output_shapes = {123: [(1, 3, 224, 224)]}
        session = AnnSession(Path("ViT-B-32__openai"))

        outputs = session.get_outputs()

        assert len(outputs) == 1
        assert outputs[0].name == "output.1"
        assert outputs[0].shape == (1, 3, 224, 224)

    def test_run(self, ann_session: mock.Mock, mocker: MockerFixture) -> None:
        ann_session.return_value.load.return_value = 123
        np_spy = mocker.spy(np, "ascontiguousarray")
        session = AnnSession(Path("ViT-B-32__openai"))
        [input1, input2] = [np.random.rand(1, 3, 224, 224).astype(np.float32) for _ in range(2)]
        input_feed = {"input.1": input1, "input.2": input2}

        session.run(None, input_feed)

        ann_session.return_value.execute.assert_called_once_with(123, [input1, input2])
        assert np_spy.call_count == 2
        np_spy.assert_has_calls([mock.call(input1), mock.call(input2)])


class TestRknnSession:
    def test_creates_rknn_session(self, rknn_session: mock.Mock, info: mock.Mock, mocker: MockerFixture) -> None:
        model_path = mock.MagicMock(spec=Path)
        tpe = 1
        mocker.patch("immich_ml.sessions.rknn.soc_name", "rk3566")
        mocker.patch("immich_ml.sessions.rknn.is_available", True)
        RknnSession(model_path)

        rknn_session.assert_called_once_with(model_path=model_path.as_posix(), tpes=tpe, func=run_inference)

        info.assert_has_calls([mock.call(f"Loaded RKNN model from {model_path} with {tpe} threads.")])

    def test_run_rknn(self, rknn_session: mock.Mock, mocker: MockerFixture) -> None:
        rknn_session.return_value.load.return_value = 123
        np_spy = mocker.spy(np, "ascontiguousarray")
        mocker.patch("immich_ml.sessions.rknn.soc_name", "rk3566")
        session = RknnSession(Path("ViT-B-32__openai"))
        [input1, input2] = [np.random.rand(1, 3, 224, 224).astype(np.float32) for _ in range(2)]
        input_feed = {"input.1": input1, "input.2": input2}

        session.run(None, input_feed)

        rknn_session.return_value.run.assert_called_once_with([input1, input2])
        assert np_spy.call_count == 2
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
        embedding_str = clip_encoder.predict(pil_image)
        assert isinstance(embedding_str, str)
        embedding = orjson.loads(embedding_str)
        assert isinstance(embedding, list)
        assert len(embedding) == clip_model_cfg["embed_dim"]
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
        mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True)

        clip_encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        embedding_str = clip_encoder.predict("test search query")
        assert isinstance(embedding_str, str)
        embedding = orjson.loads(embedding_str)
        assert isinstance(embedding, list)
        assert len(embedding) == clip_model_cfg["embed_dim"]
        mocked.run.assert_called_once()

    def test_reads_model_configs_as_utf8(self, mocker: MockerFixture, tmp_path: Path) -> None:
        original_open = Path.open

        def locale_default_is_ascii(self: Path, mode: str = "r", *args: Any, **kwargs: Any) -> Any:
            if "b" not in mode and kwargs.get("encoding") is None:
                kwargs["encoding"] = "ascii"
            return original_open(self, mode, *args, **kwargs)

        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipVisualEncoder, "download")

        textual = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=tmp_path)
        visual = OpenClipVisualEncoder("ViT-B-32__openai", cache_dir=tmp_path)
        paths = [
            textual.model_cfg_path,
            textual.tokenizer_file_path,
            textual.tokenizer_cfg_path,
            visual.model_cfg_path,
            visual.preprocess_cfg_path,
        ]
        for path in paths:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(orjson.dumps({"eos_token": "<|café|>"}).decode(), encoding="utf-8")

        mocker.patch.object(Path, "open", locale_default_is_ascii)

        assert textual.model_cfg["eos_token"] == "<|café|>"
        assert textual.tokenizer_file["eos_token"] == "<|café|>"
        assert textual.tokenizer_cfg["eos_token"] == "<|café|>"
        assert visual.model_cfg["eos_token"] == "<|café|>"
        assert visual.preprocess_cfg["eos_token"] == "<|café|>"

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
        mock_tokenizer = mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
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
        mock_tokenizer = mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
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

    def test_openclip_tokenizer_adds_flores_token_for_nllb(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)
        mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mock_tokenizer = mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
        mock_ids = [randint(0, 50000) for _ in range(77)]
        mock_tokenizer.encode.return_value = SimpleNamespace(ids=mock_ids)

        clip_encoder = OpenClipTextualEncoder("nllb-clip-base-siglip__mrl", cache_dir="test_cache")
        clip_encoder._load()
        clip_encoder.tokenize("test search query", language="de")

        mock_tokenizer.encode.assert_called_once_with("deu_Latntest search query")

    def test_openclip_tokenizer_removes_country_code_from_language_for_nllb_if_not_found(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)
        mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mock_tokenizer = mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
        mock_ids = [randint(0, 50000) for _ in range(77)]
        mock_tokenizer.encode.return_value = SimpleNamespace(ids=mock_ids)

        clip_encoder = OpenClipTextualEncoder("nllb-clip-base-siglip__mrl", cache_dir="test_cache")
        clip_encoder._load()
        clip_encoder.tokenize("test search query", language="de-CH")

        mock_tokenizer.encode.assert_called_once_with("deu_Latntest search query")

    def test_openclip_tokenizer_falls_back_to_english_for_nllb_if_language_code_not_found(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
        warning: mock.Mock,
    ) -> None:
        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)
        mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mock_tokenizer = mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
        mock_ids = [randint(0, 50000) for _ in range(77)]
        mock_tokenizer.encode.return_value = SimpleNamespace(ids=mock_ids)

        clip_encoder = OpenClipTextualEncoder("nllb-clip-base-siglip__mrl", cache_dir="test_cache")
        clip_encoder._load()
        clip_encoder.tokenize("test search query", language="unknown")

        mock_tokenizer.encode.assert_called_once_with("eng_Latntest search query")
        warning.assert_called_once_with("Language 'unknown' not found, defaulting to 'en'")

    def test_openclip_tokenizer_does_not_add_flores_token_for_non_nllb_model(
        self,
        mocker: MockerFixture,
        clip_model_cfg: dict[str, Any],
        clip_tokenizer_cfg: Callable[[Path], dict[str, Any]],
    ) -> None:
        mocker.patch.object(OpenClipTextualEncoder, "download")
        mocker.patch.object(OpenClipTextualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipTextualEncoder, "tokenizer_cfg", clip_tokenizer_cfg)
        mocker.patch.object(InferenceModel, "_make_session", autospec=True).return_value
        mock_tokenizer = mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
        mock_ids = [randint(0, 50000) for _ in range(77)]
        mock_tokenizer.encode.return_value = SimpleNamespace(ids=mock_ids)

        clip_encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        clip_encoder._load()
        clip_encoder.tokenize("test search query", language="de")

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
        mock_tokenizer = mocker.patch("immich_ml.models.clip.textual.Tokenizer.from_file", autospec=True).return_value
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


def make_scrfd_heads(detections: list[tuple[int, int, float]]) -> list[np.ndarray]:
    """Build the 9 head tensors a SCRFD keypoint model emits at 640x640.

    `detections` is a list of (cell_x, cell_y, score) placed on the stride-8 level.
    Distances and keypoint offsets are fixed so the decoded geometry is known by
    hand rather than derived from the code under test:
        box  = [cx - 1*8, cy - 2*8, cx + 3*8, cy + 4*8]
        kps  = [cx, cy] + [0, 1, 2, ... 9] * 8, reshaped to 5 points
    """
    heads: list[np.ndarray] = []
    counts = [(640 // stride) ** 2 * 2 for stride in (8, 16, 32)]
    for channels in (1, 4, 10):
        for n in counts:
            heads.append(np.zeros((n, channels), dtype=np.float32))
    for cell_x, cell_y, score in detections:
        i = 2 * (cell_y * 80 + cell_x)  # anchor-major, 2 anchors per cell
        heads[0][i] = score
        heads[3][i] = [1, 2, 3, 4]
        heads[6][i] = np.arange(10)
    return heads


def expected_box(cell_x: int, cell_y: int) -> list[float]:
    cx, cy = cell_x * 8, cell_y * 8
    return [cx - 8, cy - 16, cx + 24, cy + 32]


def expected_landmarks(cell_x: int, cell_y: int) -> np.ndarray:
    cx, cy = cell_x * 8, cell_y * 8
    return (np.tile([cx, cy], 5) + np.arange(10) * 8).reshape(5, 2).astype(np.float32)


@pytest.fixture
def batch_axis(mocker: MockerFixture) -> SimpleNamespace:
    """Patches for the `_add_batch_axis` path: the onnx module it rewrites the model
    through, and the download it would otherwise trigger on load."""
    mocker.patch("immich_ml.models.base.InferenceModel.download")
    return SimpleNamespace(
        onnx=mocker.patch("immich_ml.models.facial_recognition.recognition.onnx", autospec=True),
        update_dims=mocker.patch(
            "immich_ml.models.facial_recognition.recognition.update_inputs_outputs_dims", autospec=True
        ),
    )


class TestFaceRecognition:
    def test_detection(self, stub_session: Callable[..., mock.Mock], mocker: MockerFixture) -> None:
        mocker.patch.object(FaceDetector, "load")
        face_detector = FaceDetector("buffalo_s", cache_dir="test_cache")

        session = stub_session((1, 3, 640, 640), outputs=make_scrfd_heads([(10, 10, 0.9), (50, 50, 0.8)]))
        face_detector.session = session

        faces = face_detector.predict(Image.new("RGB", (640, 640)), minScore=0.7)

        assert isinstance(faces, dict)
        assert set(faces) == {"boxes", "scores", "landmarks"}
        # NMS returns highest score first
        assert faces["boxes"].tolist() == [expected_box(10, 10), expected_box(50, 50)]
        assert np.allclose(faces["scores"], [0.9, 0.8])
        assert faces["landmarks"].shape == (2, 5, 2)
        assert np.allclose(faces["landmarks"][0], expected_landmarks(10, 10))
        assert np.allclose(faces["landmarks"][1], expected_landmarks(50, 50))

    def test_detection_applies_min_score_per_request(
        self, stub_session: Callable[..., mock.Mock], mocker: MockerFixture
    ) -> None:
        mocker.patch.object(FaceDetector, "load")
        face_detector = FaceDetector("buffalo_s", cache_dir="test_cache")

        session = stub_session((1, 3, 640, 640), outputs=make_scrfd_heads([(10, 10, 0.9), (50, 50, 0.5)]))
        face_detector.session = session

        # the threshold is a request parameter, so the same loaded model must honour both
        assert face_detector.predict(Image.new("RGB", (640, 640)), minScore=0.7)["boxes"].shape[0] == 1
        assert face_detector.predict(Image.new("RGB", (640, 640)), minScore=0.4)["boxes"].shape[0] == 2

    def test_detection_scales_boxes_back_to_the_original_image(
        self, stub_session: Callable[..., mock.Mock], mocker: MockerFixture
    ) -> None:
        mocker.patch.object(FaceDetector, "load")
        face_detector = FaceDetector("buffalo_s", cache_dir="test_cache")

        session = stub_session((1, 3, 640, 640), outputs=make_scrfd_heads([(10, 10, 0.9)]))
        face_detector.session = session

        # a 320x320 image is letterboxed up to 640, so coordinates come back halved
        faces = face_detector.predict(Image.new("RGB", (320, 320)), minScore=0.7)

        assert faces["boxes"].tolist() == [[v / 2 for v in expected_box(10, 10)]]
        assert np.allclose(faces["landmarks"][0], expected_landmarks(10, 10) / 2)

    def test_recognition(self, stub_session: Callable[..., mock.Mock], mocker: MockerFixture) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        mocker.patch(
            "immich_ml.models.facial_recognition.recognition.ort.get_available_providers",
            return_value=["CPUExecutionProvider"],
        )
        face_recognizer = FaceRecognizer("buffalo_s", cache_dir="test_cache")

        # a uniform grey image whose crops land wholly inside it, so every sampled
        # pixel is 128 and the normalised value the session receives is exact
        image = Image.new("RGB", (600, 800), (128, 128, 128))
        num_faces = 2
        arcface_dst = np.array(
            [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]],
            dtype=np.float32,
        )
        kpss = np.stack([arcface_dst * 2 + [200, 300], arcface_dst * 2 + [220, 320]]).astype(np.float32)
        bbox = np.random.rand(num_faces, 4).astype(np.float32)
        scores = np.array([0.67] * num_faces).astype(np.float32)
        embeddings = np.random.rand(num_faces, 512).astype(np.float32)

        session = stub_session(("batch", 3, 112, 112), outputs=[embeddings])
        face_recognizer.session = session

        faces = face_recognizer.predict(image, {"boxes": bbox, "landmarks": kpss, "scores": scores})

        assert isinstance(faces, list)
        assert len(faces) == num_faces
        for face in faces:
            assert set(face["boundingBox"]) == {"x1", "y1", "x2", "y2"}
            assert all(isinstance(val, np.float32) for val in face["boundingBox"].values())
            embedding = orjson.loads(face["embedding"])
            assert isinstance(embedding, list)
            assert len(embedding) == 512
            assert isinstance(face.get("score", None), np.float32)

        session.run.assert_called_once()
        crops = session.run.call_args.args[1]["input.1"]
        assert crops.shape == (num_faces, 3, 112, 112)
        assert crops.dtype == np.float32
        # mean/std 127.5, not raw 0-255. atol is loose enough for the float32 cancellation
        # in normalize's scale-then-subtract, but still rejects a wrong mean or std
        assert np.allclose(crops, (128 - 127.5) / 127.5, atol=1e-6)

    def test_recognition_returns_early_without_faces(self, pil_image: Image.Image, mocker: MockerFixture) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        mocker.patch(
            "immich_ml.models.facial_recognition.recognition.ort.get_available_providers",
            return_value=["CPUExecutionProvider"],
        )
        face_recognizer = FaceRecognizer("buffalo_s", cache_dir="test_cache")
        session = mock.Mock()
        face_recognizer.session = session

        empty = {
            "boxes": np.empty((0, 4), dtype=np.float32),
            "landmarks": np.empty((0, 5, 2), dtype=np.float32),
            "scores": np.empty(0, dtype=np.float32),
        }

        assert face_recognizer.predict(pil_image, empty) == []
        session.run.assert_not_called()

    def test_recognition_batches_when_batch_size_is_set(
        self, pil_image: Image.Image, stub_session: Callable[..., mock.Mock], mocker: MockerFixture
    ) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        mocker.patch(
            "immich_ml.models.facial_recognition.recognition.ort.get_available_providers",
            return_value=["CPUExecutionProvider"],
        )
        face_recognizer = FaceRecognizer("buffalo_s", cache_dir="test_cache")
        face_recognizer.batch_size = 2

        num_faces = 5
        session = stub_session((1, 3, 112, 112))
        session.run.side_effect = lambda _, feed: [np.zeros((feed["input.1"].shape[0], 512), dtype=np.float32)]
        face_recognizer.session = session

        faces = {
            "boxes": np.random.rand(num_faces, 4).astype(np.float32),
            "landmarks": (np.random.rand(num_faces, 5, 2) * 100).astype(np.float32),
            "scores": np.array([0.67] * num_faces, dtype=np.float32),
        }
        assert len(face_recognizer.predict(pil_image, faces)) == num_faces
        assert session.run.call_count == 3  # 2 + 2 + 1
        assert [c.args[1]["input.1"].shape[0] for c in session.run.call_args_list] == [2, 2, 1]

    def test_recognition_adds_batch_axis_for_ort(
        self, batch_axis: SimpleNamespace, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        mocker.patch(
            "immich_ml.models.facial_recognition.recognition.ort.get_available_providers",
            return_value=["CPUExecutionProvider"],
        )
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

        batch_axis.onnx.load.return_value = proto

        face_recognizer = FaceRecognizer("buffalo_s", cache_dir=path)
        face_recognizer.load()

        assert face_recognizer.batch_size is None
        batch_axis.update_dims.assert_called_once_with(
            proto, {"input.1": ["batch", 3, 224, 224]}, {"output.1": ["batch", 800]}
        )
        batch_axis.onnx.save.assert_called_once_with(batch_axis.update_dims.return_value, face_recognizer.model_path)

    def test_recognition_does_not_add_batch_axis_if_exists(
        self, batch_axis: SimpleNamespace, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        mocker.patch(
            "immich_ml.models.facial_recognition.recognition.ort.get_available_providers",
            return_value=["CPUExecutionProvider"],
        )
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"

        inputs = [SimpleNamespace(name="input.1", shape=("batch", 3, 224, 224))]
        outputs = [SimpleNamespace(name="output.1", shape=("batch", 800))]
        ort_session.return_value.get_inputs.return_value = inputs
        ort_session.return_value.get_outputs.return_value = outputs

        face_recognizer = FaceRecognizer("buffalo_s", cache_dir=path)
        face_recognizer.load()

        # batching is available here, so the axis is only skipped because it already exists
        assert face_recognizer.batch_size is None
        batch_axis.update_dims.assert_not_called()
        batch_axis.onnx.load.assert_not_called()
        batch_axis.onnx.save.assert_not_called()

    @pytest.mark.parametrize(
        ("session_fixture", "suffix", "model_kwargs", "available_providers"),
        [
            pytest.param("ann_session", ".armnn", {"model_format": ModelFormat.ARMNN}, None, id="armnn"),
            pytest.param(
                "ort_session", ".onnx", {}, ["OpenVINOExecutionProvider", "CPUExecutionProvider"], id="openvino"
            ),
            pytest.param(
                "ort_session", ".onnx", {}, ["MIGraphXExecutionProvider", "CPUExecutionProvider"], id="migraphx"
            ),
        ],
    )
    def test_recognition_does_not_add_batch_axis_when_batching_is_unsupported(
        self,
        request: pytest.FixtureRequest,
        batch_axis: SimpleNamespace,
        path: mock.Mock,
        ort_pybind: mock.Mock,
        mocker: MockerFixture,
        session_fixture: str,
        suffix: str,
        model_kwargs: dict[str, Any],
        available_providers: list[str] | None,
    ) -> None:
        session = request.getfixturevalue(session_fixture)
        ort_pybind.get_available_openvino_device_ids.return_value = ["CPU"]
        mocker.patch(
            "immich_ml.models.facial_recognition.recognition.ort.get_available_providers",
            return_value=available_providers,
        )
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = suffix
        session.return_value.get_inputs.return_value = [SimpleNamespace(name="input.1", shape=(1, 3, 224, 224))]
        session.return_value.get_outputs.return_value = [SimpleNamespace(name="output.1", shape=(1, 800))]

        face_recognizer = FaceRecognizer("buffalo_s", cache_dir=path, **model_kwargs)
        face_recognizer.load()

        assert face_recognizer.batch_size == 1
        batch_axis.update_dims.assert_not_called()
        batch_axis.onnx.load.assert_not_called()
        batch_axis.onnx.save.assert_not_called()

    def test_set_custom_max_batch_size(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(facial_recognition=2))

        recognizer = FaceRecognizer("buffalo_l", cache_dir="test_cache")

        assert recognizer.batch_size == 2

    def test_ignore_other_custom_max_batch_size(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(ocr=2))
        mocker.patch(
            "immich_ml.models.facial_recognition.recognition.ort.get_available_providers",
            return_value=["CPUExecutionProvider"],
        )

        recognizer = FaceRecognizer("buffalo_l", cache_dir="test_cache")

        assert recognizer.batch_size is None


class TestOcr:
    def test_det_min_score_is_per_request(self, path: mock.Mock) -> None:
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"
        text_detector = TextDetector("PP-OCRv5_mobile", cache_dir="test_cache")
        probs = np.zeros((1, 1, 64, 64), dtype=np.float32)
        probs[..., 16:32, 8:56] = 0.6
        text_detector.session = mock.Mock()
        text_detector.session.get_inputs.return_value = [SimpleNamespace(name="input.1", shape=(1, 3, 64, 64))]
        text_detector.session.run.return_value = [probs]
        image = Image.new("RGB", (64, 64))

        assert len(text_detector._predict(image, minScore=0.5)["boxes"]) == 1
        assert len(text_detector._predict(image, minScore=0.9)["boxes"]) == 0
        # the default must be unaffected by the request that just ran
        assert len(text_detector._predict(image)["boxes"]) == 1

    def test_rec_min_score_is_per_request(self, path: mock.Mock, mocker: MockerFixture) -> None:
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"
        text_recognizer = TextRecognizer("PP-OCRv5_mobile", cache_dir="test_cache")
        text_recognizer.session = mock.Mock()
        text_recognizer.session.get_inputs.return_value = [SimpleNamespace(name="input.1", shape=(1, 3, 48, 96))]
        text_recognizer.session.run.return_value = [np.zeros((1, 4, 8), dtype=np.float32)]
        text_recognizer.decoder = mock.Mock()
        text_recognizer.decoder.decode.return_value = (["hello"], np.array([0.8], dtype=np.float32))
        mocker.patch.object(text_recognizer, "_crop", return_value=np.zeros((48, 96, 3), dtype=np.uint8))
        image = Image.new("RGB", (100, 50))
        box = np.array([[[0, 0], [96, 0], [96, 48], [0, 48]]], dtype=np.float32)

        def texts() -> Any:  # _predict normalizes the boxes in place, so each call needs its own
            return {"boxes": box.copy(), "scores": np.array([0.9], dtype=np.float32)}

        assert text_recognizer._predict(image, texts(), minScore=0.7)["text"] == ["hello"]
        # the default (0.9) rejects a 0.8 score, and must be unaffected by the 0.7 request
        assert text_recognizer._predict(image, texts())["text"] == []

    def test_set_rec_set_default_max_batch_size(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"
        mocker.patch("immich_ml.models.base.InferenceModel.download")

        text_recognizer = TextRecognizer("PP-OCRv5_mobile", cache_dir="test_cache")

        assert text_recognizer.batch_size == 6

    def test_set_custom_max_batch_size(self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture) -> None:
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"
        mocker.patch("immich_ml.models.base.InferenceModel.download")
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(ocr=4))

        text_recognizer = TextRecognizer("PP-OCRv5_mobile", cache_dir="test_cache")

        assert text_recognizer.batch_size == 4

    def test_ignore_other_custom_max_batch_size(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        path.return_value.__truediv__.return_value.__truediv__.return_value.suffix = ".onnx"
        mocker.patch("immich_ml.models.base.InferenceModel.download")
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(facial_recognition=3))

        text_recognizer = TextRecognizer("PP-OCRv5_mobile", cache_dir="test_cache")

        assert text_recognizer.batch_size == 6


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

    @mock.patch("immich_ml.models.cache.OptimisticLock", autospec=True)
    async def test_model_ttl(self, mock_lock_cls: mock.Mock, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        await model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)
        mock_lock_cls.return_value.__aenter__.return_value.cas.assert_called_with(mock.ANY, ttl=100)

    @mock.patch("immich_ml.models.cache.SimpleMemoryCache.expire")
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
        os.environ["MACHINE_LEARNING_PRELOAD__CLIP__TEXTUAL"] = "ViT-B-32__openai"
        os.environ["MACHINE_LEARNING_PRELOAD__CLIP__VISUAL"] = "ViT-B-32__openai"

        settings = Settings()
        assert settings.preload is not None
        assert settings.preload.clip.textual == "ViT-B-32__openai"
        assert settings.preload.clip.visual == "ViT-B-32__openai"

        model_cache = ModelCache()
        monkeypatch.setattr("immich_ml.main.model_cache", model_cache)

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
        os.environ["MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__DETECTION"] = "buffalo_s"
        os.environ["MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__RECOGNITION"] = "buffalo_s"

        settings = Settings()
        assert settings.preload is not None
        assert settings.preload.facial_recognition.detection == "buffalo_s"
        assert settings.preload.facial_recognition.recognition == "buffalo_s"

        model_cache = ModelCache()
        monkeypatch.setattr("immich_ml.main.model_cache", model_cache)

        await preload_models(settings.preload)
        mock_get_model.assert_has_calls(
            [
                mock.call("buffalo_s", ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION),
                mock.call("buffalo_s", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION),
            ],
            any_order=True,
        )

    async def test_preloads_ocr_models(self, monkeypatch: MonkeyPatch, mock_get_model: mock.Mock) -> None:
        os.environ["MACHINE_LEARNING_PRELOAD__OCR__DETECTION"] = "PP-OCRv5_mobile"
        os.environ["MACHINE_LEARNING_PRELOAD__OCR__RECOGNITION"] = "PP-OCRv5_mobile"

        settings = Settings()
        assert settings.preload is not None
        assert settings.preload.ocr.detection == "PP-OCRv5_mobile"
        assert settings.preload.ocr.recognition == "PP-OCRv5_mobile"

        model_cache = ModelCache()
        monkeypatch.setattr("immich_ml.main.model_cache", model_cache)

        await preload_models(settings.preload)
        mock_get_model.assert_has_calls(
            [
                mock.call("PP-OCRv5_mobile", ModelType.DETECTION, ModelTask.OCR),
                mock.call("PP-OCRv5_mobile", ModelType.RECOGNITION, ModelTask.OCR),
            ],
            any_order=True,
        )

    async def test_preloads_all_models(self, monkeypatch: MonkeyPatch, mock_get_model: mock.Mock) -> None:
        os.environ["MACHINE_LEARNING_PRELOAD__CLIP__TEXTUAL"] = "ViT-B-32__openai"
        os.environ["MACHINE_LEARNING_PRELOAD__CLIP__VISUAL"] = "ViT-B-32__openai"
        os.environ["MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__RECOGNITION"] = "buffalo_s"
        os.environ["MACHINE_LEARNING_PRELOAD__FACIAL_RECOGNITION__DETECTION"] = "buffalo_s"
        os.environ["MACHINE_LEARNING_PRELOAD__OCR__DETECTION"] = "PP-OCRv5_mobile"
        os.environ["MACHINE_LEARNING_PRELOAD__OCR__RECOGNITION"] = "PP-OCRv5_mobile"

        settings = Settings()
        assert settings.preload is not None
        assert settings.preload.clip.visual == "ViT-B-32__openai"
        assert settings.preload.clip.textual == "ViT-B-32__openai"
        assert settings.preload.facial_recognition.recognition == "buffalo_s"
        assert settings.preload.facial_recognition.detection == "buffalo_s"
        assert settings.preload.ocr.detection == "PP-OCRv5_mobile"
        assert settings.preload.ocr.recognition == "PP-OCRv5_mobile"

        model_cache = ModelCache()
        monkeypatch.setattr("immich_ml.main.model_cache", model_cache)

        await preload_models(settings.preload)
        mock_get_model.assert_has_calls(
            [
                mock.call("ViT-B-32__openai", ModelType.TEXTUAL, ModelTask.SEARCH),
                mock.call("ViT-B-32__openai", ModelType.VISUAL, ModelTask.SEARCH),
                mock.call("buffalo_s", ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION),
                mock.call("buffalo_s", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION),
                mock.call("PP-OCRv5_mobile", ModelType.DETECTION, ModelTask.OCR),
                mock.call("PP-OCRv5_mobile", ModelType.RECOGNITION, ModelTask.OCR),
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

    async def test_falls_back_to_onnx_if_other_format_does_not_exist(self, warning: mock.Mock) -> None:
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
        warning.assert_called_once_with(
            "ARMNN is available, but model 'test_model_name' does not support it.", exc_info=error
        )
        mock_model.model_format = ModelFormat.ONNX


@pytest.mark.parametrize("size", [(0, 100), (100, 0), (0, 0)])
def test_predict_rejects_empty_image(size: tuple[int, int], deployed_app: TestClient) -> None:
    with mock.patch("immich_ml.main.decode_pil", return_value=Image.new("RGB", size)):
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={"entries": json.dumps({"clip": {"visual": {"modelName": "ViT-B-32__openai"}}})},
            files={"image": b"fake image bytes"},
        )

    assert response.status_code == 400
    assert "zero" in response.json()["detail"].lower()


def test_root_endpoint(deployed_app: TestClient) -> None:
    response = deployed_app.get("http://localhost:3003")

    body = response.json()
    assert response.status_code == 200
    assert body == {"message": "Immich ML"}


def test_ping_endpoint(deployed_app: TestClient) -> None:
    response = deployed_app.get("http://localhost:3003/ping")

    assert response.status_code == 200
    assert response.text == "pong"


@pytest.mark.skipif(
    not settings.test_full,
    reason="More time-consuming since it deploys the app and loads models.",
)
class TestPredictionEndpoints:
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
        embedding = actual.get("clip", None)
        assert isinstance(embedding, str)
        parsed_embedding = orjson.loads(embedding)
        assert np.allclose(expected, parsed_embedding)

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
        embedding = actual.get("clip", None)
        assert isinstance(embedding, str)
        parsed_embedding = orjson.loads(embedding)
        assert np.allclose(expected, parsed_embedding)

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
            embedding = actual_face.get("embedding", None)
            assert isinstance(embedding, str)
            parsed_embedding = orjson.loads(embedding)
            assert np.allclose(expected_face["embedding"], parsed_embedding)
            assert np.allclose(expected_face["score"], actual_face["score"])
