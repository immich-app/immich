import json
import os
import platform
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from random import randint
from types import SimpleNamespace
from typing import Any, Callable, TypeVar
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

from immich_ml import allocator
from immich_ml.config import MaxBatchSize, PreloadModelData, Settings, settings
from immich_ml.main import (
    MODEL_FILE_ERRORS,
    app,
    attempt,
    lifespan,
    load,
    preload_models,
    update_state,
)
from immich_ml.main import run_inference as run_request
from immich_ml.models.base import InferenceModel
from immich_ml.models.cache import ModelCache
from immich_ml.models.clip.textual import MClipTextualEncoder, OpenClipTextualEncoder
from immich_ml.models.clip.visual import OpenClipVisualEncoder
from immich_ml.models.facial_recognition.detection import FaceDetector
from immich_ml.models.facial_recognition.recognition import FaceRecognizer
from immich_ml.models.ocr.detection import TextDetector
from immich_ml.models.ocr.recognition import TextRecognizer
from immich_ml.schemas import ModelFormat, ModelTask, ModelType, Shape
from immich_ml.sessions.ann import AnnSession
from immich_ml.sessions.ort import OrtSession, flush_denormals
from immich_ml.sessions.policy import ShapePolicy, batches, runs
from immich_ml.sessions.rknn import RknnSession, run_inference


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

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)

        assert encoder.model_format == ModelFormat.ARMNN

    def test_sets_model_format_kwarg(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "ann", False)
        mocker.patch("immich_ml.sessions.ann.loader.is_available", False)

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.ARMNN)

        assert encoder.model_format == ModelFormat.ARMNN

    def test_hands_the_session_the_shapes_the_model_feeds(self, path: mock.Mock, mocker: MockerFixture) -> None:
        session = mocker.patch("immich_ml.models.base.OrtSession")

        FaceDetector("buffalo_l", cache_dir=path)._make_session()

        assert session.call_args.args[1].dims == (Shape(batch=1, height=640, width=640),)

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

    def test_unload_lets_go_of_the_session(self, stub_session: Callable[..., mock.Mock]) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", session=stub_session((1, 77)))

        encoder.unload()

        assert not encoder.loaded
        assert not hasattr(encoder, "session")

    @pytest.mark.parametrize(
        ("symbols", "called"), [(["mi_collect", "malloc_trim"], "mi_collect"), (["malloc_trim"], "malloc_trim")]
    )
    def test_returns_memory_through_the_allocator_the_process_runs_on(
        self, mocker: MockerFixture, symbols: list[str], called: str
    ) -> None:
        process = mocker.patch("immich_ml.allocator._process", mock.Mock(spec=symbols))

        allocator.release()

        getattr(process, called).assert_called_once()

    def test_download(self, snapshot_download: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir="/path/to/cache")
        encoder.download()

        snapshot_download.assert_called_once_with(
            "immich-app/ViT-B-32__openai",
            revision=settings.model_revision,
            cache_dir=encoder.cache_dir,
            local_dir=encoder.cache_dir,
            ignore_patterns=["*.armnn", "*.rknn"],
        )

    def test_download_downloads_armnn_if_preferred_format(self, snapshot_download: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.ARMNN)
        encoder.download()

        assert snapshot_download.call_args.kwargs["ignore_patterns"] == ["*.rknn"]

    def test_download_downloads_rknn_if_preferred_format(self, snapshot_download: mock.Mock) -> None:
        encoder = OpenClipTextualEncoder("ViT-B-32__openai", model_format=ModelFormat.RKNN)
        encoder.download()

        assert snapshot_download.call_args.kwargs["ignore_patterns"] == ["*.armnn"]

    def test_throws_exception_if_model_path_does_not_exist(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        snapshot_download = mocker.patch("immich_ml.models.base.snapshot_download")  # which brings no such file
        path.return_value.__truediv__.return_value.__truediv__.return_value.is_file.return_value = False

        encoder = OpenClipTextualEncoder("ViT-B-32__openai", cache_dir=path)

        with pytest.raises(FileNotFoundError):
            encoder.load()

        snapshot_download.assert_called_once()
        ort_session.assert_not_called()


class TestShapePolicy:
    def test_pins_only_what_cannot_vary(self) -> None:
        policy = ShapePolicy(dims=(Shape(batch=1, height=64, width=64), Shape(batch=1, height=64, width=128)))

        assert policy.pinned == Shape(batch=1, height=64)

    def test_batches_follow_the_configured_maximum(self) -> None:
        assert batches(1) == (1,)
        assert batches(6) == (1, 6)  # a single row as well, so a remainder is never padded

    @pytest.mark.parametrize(
        ("total", "sizes", "expected"),
        [
            (10, (1, 6), [6, 1, 1, 1, 1]),  # the remainder runs a row at a time
            (12, (1, 6), [6, 6]),
        ],
    )
    def test_runs_split_the_rows_the_session_will_take(
        self, total: int, sizes: tuple[int, ...], expected: list[int]
    ) -> None:
        assert runs(total, sizes) == expected


@pytest.mark.usefixtures("ort_session")
class TestOrtSessions:
    CPU_EP = ["CPUExecutionProvider"]
    CUDA_EP = ["CUDAExecutionProvider", "CPUExecutionProvider"]
    OV_EP = ["OpenVINOExecutionProvider", "CPUExecutionProvider"]
    CUDA_EP_OUT_OF_ORDER = ["CPUExecutionProvider", "CUDAExecutionProvider"]
    TRT_EP = ["TensorrtExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]
    ROCM_EP = ["MIGraphXExecutionProvider", "CPUExecutionProvider"]
    COREML_EP = ["CoreMLExecutionProvider", "CPUExecutionProvider"]

    @pytest.mark.providers(CPU_EP)
    def test_sets_cpu_provider(self, ort_session: mock.Mock, providers: list[str]) -> None:
        ort_sessions("ViT-B-32__openai")

        assert given_providers(ort_session) == self.CPU_EP

    @pytest.mark.providers(CUDA_EP)
    def test_sets_cuda_provider_if_available(self, ort_session: mock.Mock, providers: list[str]) -> None:
        ort_sessions("ViT-B-32__openai")

        assert given_providers(ort_session) == self.CUDA_EP

    @pytest.mark.ov_device_ids(["GPU.0", "CPU"])
    @pytest.mark.providers(OV_EP)
    def test_sets_openvino_provider_if_available(
        self, ort_session: mock.Mock, providers: list[str], ov_device_ids: list[str]
    ) -> None:
        ort_sessions("ViT-B-32__openai")

        assert given_providers(ort_session) == self.OV_EP

    @pytest.mark.providers(CUDA_EP_OUT_OF_ORDER)
    def test_sets_providers_in_correct_order(self, ort_session: mock.Mock, providers: list[str]) -> None:
        ort_sessions("ViT-B-32__openai")

        assert given_providers(ort_session) == self.CUDA_EP

    @pytest.mark.providers(TRT_EP)
    def test_ignores_unsupported_providers(self, ort_session: mock.Mock, providers: list[str]) -> None:
        ort_sessions("ViT-B-32__openai")

        assert given_providers(ort_session) == self.CUDA_EP

    @pytest.mark.providers(ROCM_EP)
    def test_uses_rocm(self, ort_session: mock.Mock, providers: list[str]) -> None:
        ort_sessions("ViT-B-32__openai")

        assert given_providers(ort_session) == self.ROCM_EP

    @pytest.mark.providers(COREML_EP)
    def test_uses_coreml(self, ort_session: mock.Mock, providers: list[str]) -> None:
        ort_sessions("ViT-B-32__openai")

        assert given_providers(ort_session) == self.COREML_EP

    def test_leaves_a_dimension_free_when_the_model_feeds_several_sizes(
        self, ort_session: mock.Mock, mocker: MockerFixture
    ) -> None:
        sess_options = mocker.patch("immich_ml.sessions.ort.ort.SessionOptions").return_value
        policy = ShapePolicy(dims=(Shape(batch=1, height=64, width=64), Shape(batch=1, height=64, width=128)))

        ort_sessions("PP-OCRv5_mobile", providers=["CPUExecutionProvider"], shape_policy=policy)

        assert sess_options.add_free_dimension_override_by_name.call_args_list == [
            mock.call("batch", 1),
            mock.call("DynamicDimension.0", 1),
            mock.call("None", 1),
            mock.call("height", 64),
            mock.call("DynamicDimension.1", 64),
            mock.call("?", 64),
        ]

    def test_builds_one_graph_on_cpu_that_runs_a_row_at_a_time_at_any_size_of_what_varies(
        self, ort_session: mock.Mock
    ) -> None:
        widths = (Shape(batch=1, height=64, width=64), Shape(batch=4, height=64, width=128))
        session = ort_sessions("PP-OCRv5_mobile", providers=["CPUExecutionProvider"], shape_policy=ShapePolicy(widths))

        assert session.shapes == (Shape(batch=1, height=64),)  # the width is left out, so it takes any
        session.for_shape(Shape(batch=4, height=64, width=128))
        session.for_shape(Shape(batch=1, height=64, width=96))

        ort_session.assert_called_once()

    def test_builds_a_graph_once_for_the_requests_that_arrive_wanting_it(self, ort_session: mock.Mock) -> None:
        together = threading.Barrier(2)
        policy = ShapePolicy(dims=(Shape(batch=1, height=64, width=64), Shape(batch=1, height=64, width=128)))
        session = ort_sessions("PP-OCRv5_mobile", providers=["CoreMLExecutionProvider"], shape_policy=policy)

        def slow(*args: Any, **kwargs: Any) -> Any:  # long enough for the other to arrive
            time.sleep(0.05)
            return mock.DEFAULT

        ort_session.side_effect = slow

        def request(_: int) -> Any:
            together.wait()
            return session.for_shape(Shape(batch=1, height=64, width=64))

        with ThreadPoolExecutor(2) as pool:
            first, second = pool.map(request, range(2))

        assert first is second
        ort_session.assert_called_once()

    def test_opens_a_shape_while_another_is_still_being_built(self, ort_session: mock.Mock) -> None:
        policy = ShapePolicy(dims=(Shape(batch=1, height=64, width=64), Shape(batch=1, height=64, width=128)))
        session = ort_sessions("PP-OCRv5_mobile", providers=["CoreMLExecutionProvider"], shape_policy=policy)
        building, built = threading.Event(), threading.Event()

        def build(*args: Any, **kwargs: Any) -> Any:
            building.set()
            built.wait(5)
            return mock.DEFAULT

        ort_session.side_effect = build

        with ThreadPoolExecutor(1) as pool:
            slow = pool.submit(session.for_shape, Shape(batch=1, height=64, width=64))
            building.wait(5)
            ort_session.side_effect = None
            session.for_shape(Shape(batch=1, height=64, width=128))
            assert not slow.done()
            built.set()

    def test_builds_one_session_per_shape_it_is_asked_for(self, ort_session: mock.Mock) -> None:
        policy = ShapePolicy(dims=(Shape(batch=1, height=64, width=64), Shape(batch=1, height=64, width=128)))
        sessions = ort_sessions("PP-OCRv5_mobile", providers=["CoreMLExecutionProvider"], shape_policy=policy)
        assert sessions.shapes == policy.dims  # the policy speaks for graphs that do not exist yet
        ort_session.assert_not_called()

        for width in (128, 64, 128):
            sessions.for_shape(Shape(batch=1, height=64, width=width))

        assert ort_session.call_count == 2
        caches = [call.kwargs["provider_options"][0]["ModelCacheDirectory"] for call in ort_session.call_args_list]
        assert len(set(caches)) == 2  # CoreML keys its compiled model on the path, so variants cannot share one

    @pytest.mark.ov_device_ids(["GPU.0", "CPU"])
    def test_pins_clip_on_openvino(
        self, ort_session: mock.Mock, ov_device_ids: list[str], mocker: MockerFixture
    ) -> None:
        sess_options = mocker.patch("immich_ml.sessions.ort.ort.SessionOptions").return_value
        sess_options.inter_op_num_threads = 0

        # older Intel GPUs compute garbage for a free dim, and CLIP is the only model that would leave one
        ort_sessions("/cache/ViT-B-32__openai/textual/model.onnx", providers=["OpenVINOExecutionProvider"])

        assert sess_options.add_free_dimension_override_by_name.called

    def test_sets_provider_kwarg(self, ort_session: mock.Mock) -> None:
        providers = ["CUDAExecutionProvider"]
        ort_sessions("ViT-B-32__openai", providers=providers)

        assert given_providers(ort_session) == providers

    def test_sets_provider_options_for_cuda(self, ort_session: mock.Mock) -> None:
        os.environ["MACHINE_LEARNING_DEVICE_ID"] = "1"

        ort_sessions("ViT-B-32__openai", providers=["CUDAExecutionProvider"])

        assert given_options(ort_session) == [{"arena_extend_strategy": "kSameAsRequested", "device_id": "1"}]

    @pytest.mark.skipif(sys.platform != "linux" or platform.machine() != "x86_64", reason="an x86 register")
    def test_flushes_denormals_on_the_calling_thread(self) -> None:
        results: list[float] = []

        def probe() -> None:  # a fresh thread, as a request thread is
            flush_denormals()
            results.append(float((np.array([1e-39], np.float32) * np.float32(1))[0]))

        thread = threading.Thread(target=probe)
        thread.start()
        thread.join()

        assert results == [0.0]

    def test_sets_default_sess_options_if_cpu(self, ort_session: mock.Mock) -> None:
        ort_sessions("ViT-B-32__openai", providers=["CPUExecutionProvider"])

        assert given_sess_options(ort_session).execution_mode == ort.ExecutionMode.ORT_SEQUENTIAL
        assert given_sess_options(ort_session).inter_op_num_threads == 1
        assert given_sess_options(ort_session).intra_op_num_threads == 2
        assert given_sess_options(ort_session).get_session_config_entry("session.set_denormal_as_zero") == "1"

    def test_gives_a_model_the_cpu_threads_it_asks_for(self, ort_session: mock.Mock) -> None:
        ort_sessions("ViT-B-32__openai", providers=["CPUExecutionProvider"], threads=4)

        assert given_sess_options(ort_session).intra_op_num_threads == 4
        assert OpenClipTextualEncoder.threads == 4 and OpenClipVisualEncoder.threads == 2

    @pytest.mark.ov_device_ids(["CPU"])
    def test_sets_default_sess_options_if_openvino_cpu(self, ort_session: mock.Mock, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/model.onnx"
        ort_sessions(model_path, providers=["OpenVINOExecutionProvider"])

        assert given_sess_options(ort_session).execution_mode == ort.ExecutionMode.ORT_SEQUENTIAL
        assert given_sess_options(ort_session).inter_op_num_threads == 0
        assert given_sess_options(ort_session).intra_op_num_threads == 0

    @pytest.mark.ov_device_ids(["GPU.0", "CPU"])
    def test_sets_default_sess_options_if_openvino_gpu(self, ort_session: mock.Mock, ov_device_ids: list[str]) -> None:
        model_path = "/cache/ViT-B-32__openai/model.onnx"
        ort_sessions(model_path, providers=["OpenVINOExecutionProvider"])

        assert given_sess_options(ort_session).inter_op_num_threads == 0
        assert given_sess_options(ort_session).intra_op_num_threads == 0

    def test_sets_default_sess_options_does_not_set_threads_if_non_cpu_and_default_threads(
        self, ort_session: mock.Mock
    ) -> None:
        ort_sessions("ViT-B-32__openai", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

        assert given_sess_options(ort_session).inter_op_num_threads == 0
        assert given_sess_options(ort_session).intra_op_num_threads == 0

    def test_sets_default_sess_options_sets_threads_if_non_cpu_and_set_threads(
        self, ort_session: mock.Mock, mocker: MockerFixture
    ) -> None:
        mock_settings = mocker.patch("immich_ml.sessions.ort.settings", autospec=True)
        mock_settings.model_inter_op_threads = 2
        mock_settings.model_intra_op_threads = 4

        ort_sessions("ViT-B-32__openai", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])

        assert given_sess_options(ort_session).inter_op_num_threads == 2
        assert given_sess_options(ort_session).intra_op_num_threads == 4

    def test_uses_arena_if_enabled(self, ort_session: mock.Mock, mocker: MockerFixture) -> None:
        mock_settings = mocker.patch("immich_ml.sessions.ort.settings", autospec=True)
        mock_settings.model_inter_op_threads = 0
        mock_settings.model_intra_op_threads = 0
        mock_settings.model_arena = True

        ort_sessions("ViT-B-32__openai", providers=["CPUExecutionProvider"])

        assert given_sess_options(ort_session).enable_cpu_mem_arena

    def test_does_not_use_arena_if_disabled(self, ort_session: mock.Mock, mocker: MockerFixture) -> None:
        mock_settings = mocker.patch("immich_ml.sessions.ort.settings", autospec=True)
        mock_settings.model_inter_op_threads = 0
        mock_settings.model_intra_op_threads = 0
        mock_settings.model_arena = False

        ort_sessions("ViT-B-32__openai", providers=["CPUExecutionProvider"])

        assert not given_sess_options(ort_session).enable_cpu_mem_arena

    @pytest.mark.parametrize(
        "image",
        [
            SimpleNamespace(name="image", type="tensor(uint8)", shape=["batch", 224, 224, 3]),
            SimpleNamespace(name="input.1", type="tensor(float)", shape=[1, 3, 224, 224]),
        ],
    )
    def test_feeds_every_other_graph_what_it_was_handed(self, ort_session: mock.Mock, image: SimpleNamespace) -> None:
        ort_session.return_value.get_inputs.return_value = [image]
        session = ort_sessions("ViT-B-32__openai", providers=["CPUExecutionProvider"]).for_shape(Shape(batch=1))
        feed = {image.name: np.zeros((1, 3, 224, 224), dtype=np.float32)}

        session.run(None, feed)

        assert ort_session.return_value.run.call_args.args[1] is feed

    @pytest.mark.parametrize(
        ("machine", "disabled"),
        [("arm64", ["ConvAddActivationFusion"]), ("aarch64", ["ConvAddActivationFusion"]), ("x86_64", [])],
    )
    def test_disables_the_fusion_that_is_slower_on_arm_whatever_the_os_calls_it(
        self, ort_session: mock.Mock, mocker: MockerFixture, machine: str, disabled: list[str]
    ) -> None:
        mocker.patch("immich_ml.sessions.ort.platform.machine", return_value=machine)

        ort_sessions("ViT-B-32__openai", providers=["CPUExecutionProvider"])

        assert ort_session.call_args.kwargs["disabled_optimizers"] == disabled

    @pytest.mark.parametrize(
        ("providers", "disabled"),
        [
            (["CUDAExecutionProvider", "CPUExecutionProvider"], ["MatMulAddFusion"]),
            (["CoreMLExecutionProvider", "CPUExecutionProvider"], ["MatMulAddFusion"]),
            (["CPUExecutionProvider"], []),
        ],
    )
    def test_disables_the_fusion_that_is_slower_on_cuda_and_coreml(
        self, ort_session: mock.Mock, mocker: MockerFixture, providers: list[str], disabled: list[str]
    ) -> None:
        mocker.patch("immich_ml.sessions.ort.platform.machine", return_value="x86_64")

        ort_sessions("ViT-B-32__openai", providers=providers)

        assert ort_session.call_args.kwargs["disabled_optimizers"] == disabled


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
        mocker.patch("immich_ml.sessions.rknn.soc_name", "rk3566")
        session = RknnSession(Path("ViT-B-32__openai"))
        [input1, input2] = [np.random.rand(1, 3, 224, 224).astype(np.float32) for _ in range(2)]
        input_feed = {"input.1": input1, "input.2": input2}

        session.run(None, input_feed)

        rknn_session.return_value.run.assert_called_once_with([input1, input2], "nchw")
        assert all(fed.flags.c_contiguous for fed in rknn_session.return_value.run.call_args.args[0])

    def test_run_rknn_rejects_a_shape_the_binary_was_not_compiled_for(
        self, rknn_session: mock.Mock, mocker: MockerFixture
    ) -> None:
        mocker.patch("immich_ml.sessions.rknn.soc_name", "rk3566")
        session = RknnSession(Path("ViT-B-32__openai"))

        # a wrong data_format label is not something librknnrt reports; it reinterprets the buffer
        with pytest.raises(ValueError, match="takes 3 channels"):
            session.run(None, {"input.1": np.zeros((1, 5, 112, 112), dtype=np.float32)})

    def test_shapes_come_from_the_binary(self, rknn_session: mock.Mock) -> None:
        rknn_session.return_value.custom_string = '{"dims":[{"height":736,"width":1472},{"height":736,"width":736}]}'

        session = RknnSession(Path("PP-OCRv5_mobile"))

        assert session.shapes == (
            Shape(batch=1, height=736, width=1472),
            Shape(batch=1, height=736, width=736),
        )

    def test_offers_no_choice_of_shape_when_the_binary_has_one(self, rknn_session: mock.Mock) -> None:
        # a graph the exporter left no dim free in is stamped with one empty set
        rknn_session.return_value.custom_string = '{"dims":[{}]}'

        assert RknnSession(Path("buffalo_l")).shapes == (Shape(batch=1),)


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
        mocked.for_shape.return_value = mocked
        mocked.run.return_value = [[self.embedding]]

        clip_encoder = OpenClipVisualEncoder("ViT-B-32__openai", cache_dir="test_cache")
        embedding_str = clip_encoder.predict(pil_image)
        assert isinstance(embedding_str, str)
        embedding = orjson.loads(embedding_str)
        assert isinstance(embedding, list)
        assert len(embedding) == clip_model_cfg["embed_dim"]
        mocked.run.assert_called_once()

    @pytest.mark.parametrize(
        ("normalizes_input", "expected_dtype", "expected_shape"),
        [(False, np.float32, (1, 3, 224, 224)), (True, np.uint8, (1, 224, 224, 3))],
    )
    def test_visual_feeds_the_contract_the_session_declares(
        self,
        normalizes_input: bool,
        expected_dtype: type[np.generic],
        expected_shape: tuple[int, ...],
        pil_image: Image.Image,
        mocker: MockerFixture,
        stub_session: Callable[..., mock.Mock],
        clip_model_cfg: dict[str, Any],
        clip_preprocess_cfg: dict[str, Any],
    ) -> None:
        mocker.patch.object(OpenClipVisualEncoder, "download")
        mocker.patch.object(OpenClipVisualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipVisualEncoder, "preprocess_cfg", clip_preprocess_cfg)
        session = stub_session(expected_shape, outputs=[[self.embedding]], normalizes_input=normalizes_input)
        mocker.patch.object(InferenceModel, "_make_session", return_value=session)

        OpenClipVisualEncoder("ViT-B-32__openai", cache_dir="test_cache").predict(pil_image)

        fed = session.run.call_args.args[1]["image"]
        assert fed.dtype == expected_dtype
        assert fed.shape == expected_shape

    def test_visual_squashes_when_the_tower_was_calibrated_that_way(
        self,
        mocker: MockerFixture,
        stub_session: Callable[..., mock.Mock],
        clip_model_cfg: dict[str, Any],
        clip_preprocess_cfg: dict[str, Any],
    ) -> None:
        mocker.patch.object(OpenClipVisualEncoder, "download")
        mocker.patch.object(OpenClipVisualEncoder, "model_cfg", clip_model_cfg)
        mocker.patch.object(OpenClipVisualEncoder, "preprocess_cfg", clip_preprocess_cfg | {"resize_mode": "squash"})
        session = stub_session((1, 224, 224, 3), outputs=[[self.embedding]], normalizes_input=True)
        mocker.patch.object(InferenceModel, "_make_session", return_value=session)

        # a stripe far enough left that a shortest-side crop of this frame would discard it
        image = Image.new("RGB", (600, 200), "black")
        image.paste(Image.new("RGB", (20, 200), "white"), (0, 0))
        OpenClipVisualEncoder("ViT-B-32__openai", cache_dir="test_cache").predict(image)

        assert session.run.call_args.args[1]["image"][0, 0, 0].tolist() == [255, 255, 255]

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
        mocked.for_shape.return_value = mocked
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


M = TypeVar("M", bound=InferenceModel)


def given_options(ort_session: mock.Mock) -> Any:
    return ort_session.call_args.kwargs["provider_options"]


def given_sess_options(ort_session: mock.Mock) -> Any:
    return ort_session.call_args.kwargs["sess_options"]


def given_providers(ort_session: mock.Mock) -> Any:
    return ort_session.call_args.kwargs["providers"]


def loaded(model: M, session: mock.Mock, mocker: MockerFixture) -> M:
    mocker.patch.object(model, "download")
    mocker.patch.object(model, "_make_session", return_value=session)
    model.load()
    return model


def ort_sessions(
    model_path: str,
    providers: list[str] | None = None,
    shape_policy: ShapePolicy = ShapePolicy(),
    threads: int = 2,
) -> OrtSession:
    return OrtSession(model_path, shape_policy, providers=providers, threads=threads)


def expected_landmarks(cell_x: int, cell_y: int) -> np.ndarray:
    cx, cy = cell_x * 8, cell_y * 8
    return (np.tile([cx, cy], 5) + np.arange(10) * 8).reshape(5, 2).astype(np.float32)


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

        session = stub_session(("batch", 3, 112, 112), outputs=[embeddings], shapes=(Shape(batch=num_faces),))
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

    @pytest.mark.parametrize(
        ("normalizes_input", "expected_dtype", "expected_shape"),
        [(False, np.float32, (1, 3, 640, 640)), (True, np.uint8, (1, 640, 640, 3))],
    )
    def test_detection_feeds_the_contract_the_session_declares(
        self,
        normalizes_input: bool,
        expected_dtype: type[np.generic],
        expected_shape: tuple[int, ...],
        stub_session: Callable[..., mock.Mock],
        mocker: MockerFixture,
    ) -> None:
        mocker.patch.object(FaceDetector, "load")
        face_detector = FaceDetector("buffalo_s", cache_dir="test_cache")
        face_detector.session = stub_session(
            expected_shape, outputs=make_scrfd_heads([(10, 10, 0.9)]), normalizes_input=normalizes_input
        )

        faces = face_detector.predict(Image.new("RGB", (640, 640)), minScore=0.7)

        fed = face_detector.session.run.call_args.args[1]["input.1"]
        assert fed.dtype == expected_dtype
        assert fed.shape == expected_shape
        # whichever contract it fed, the decode is the same and lands on the same box
        assert faces["boxes"].tolist() == [expected_box(10, 10)]

    @pytest.mark.parametrize(
        ("normalizes_input", "expected_dtype", "expected_shape"),
        [(False, np.float32, (2, 3, 112, 112)), (True, np.uint8, (2, 112, 112, 3))],
    )
    def test_recognition_feeds_the_contract_the_session_declares(
        self,
        normalizes_input: bool,
        expected_dtype: type[np.generic],
        expected_shape: tuple[int, ...],
        stub_session: Callable[..., mock.Mock],
        mocker: MockerFixture,
    ) -> None:
        mocker.patch.object(FaceRecognizer, "load")
        face_recognizer = FaceRecognizer("buffalo_s", cache_dir="test_cache")
        face_recognizer.session = stub_session(
            expected_shape,
            outputs=[np.zeros((2, 512), dtype=np.float32)],
            normalizes_input=normalizes_input,
            shapes=(Shape(batch=2),),
        )
        faces: Any = {
            "boxes": np.array([[0, 0, 60, 60], [60, 60, 120, 120]], dtype=np.float32),
            "scores": np.array([0.9, 0.8], dtype=np.float32),
            "landmarks": np.stack([expected_landmarks(1, 1), expected_landmarks(8, 8)]),
        }

        face_recognizer.predict(Image.new("RGB", (200, 200)), faces)

        fed = face_recognizer.session.run.call_args.args[1]["input.1"]
        assert fed.dtype == expected_dtype
        assert fed.shape == expected_shape
        assert fed.flags.c_contiguous

    def test_recognition_returns_early_without_faces(self, pil_image: Image.Image, mocker: MockerFixture) -> None:
        mocker.patch.object(FaceRecognizer, "load")
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
        face_recognizer = FaceRecognizer("buffalo_s", cache_dir="test_cache")

        num_faces = 5
        session = stub_session((1, 3, 112, 112), shapes=(Shape(batch=1), Shape(batch=2)))
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

    @pytest.mark.parametrize(
        ("provider", "shapes"),
        [
            ("CPUExecutionProvider", (Shape(batch=1),)),  # a row at a time
            ("CUDAExecutionProvider", (Shape(batch=1), Shape(batch=4))),  # the configured size, and one for the rest
        ],
    )
    def test_recognition_is_built_the_batches_it_asks_for(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture, provider: str, shapes: tuple[Shape, ...]
    ) -> None:
        mocker.patch("immich_ml.models.base.InferenceModel.download")
        mocker.patch("immich_ml.sessions.ort.ort.get_available_providers", return_value=[provider])

        face_recognizer = FaceRecognizer("buffalo_s", cache_dir=path)
        face_recognizer.load()

        assert face_recognizer.session.shapes == shapes

    @pytest.mark.parametrize("model_format", [ModelFormat.RKNN, ModelFormat.ARMNN])
    def test_recognition_takes_the_batch_the_artifact_was_compiled_for(
        self,
        rknn_session: mock.Mock,
        ann_session: mock.Mock,
        path: mock.Mock,
        mocker: MockerFixture,
        model_format: ModelFormat,
    ) -> None:
        mocker.patch("immich_ml.models.base.InferenceModel.download")
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(facial_recognition=8))  # which cannot raise it
        rknn_session.return_value.inputs = [SimpleNamespace(name="image", shape=(1, 112, 112, 3))]

        face_recognizer = FaceRecognizer("buffalo_s", cache_dir=path, model_format=model_format)
        face_recognizer.load()

        assert face_recognizer.session.shapes == (Shape(batch=1),)

    def test_set_custom_max_batch_size(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(facial_recognition=2))

        recognizer = FaceRecognizer("buffalo_l", cache_dir="test_cache")

        assert recognizer.shape_policy.dims == (Shape(batch=1), Shape(batch=2))

    def test_ignore_other_custom_max_batch_size(self, mocker: MockerFixture) -> None:
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(ocr=2))

        recognizer = FaceRecognizer("buffalo_l", cache_dir="test_cache")

        assert recognizer.shape_policy.dims == (
            Shape(batch=1),
            Shape(batch=4),
        )  # another task's setting is not this one's


class TestOcr:
    def test_det_min_score_is_per_request(self, path: mock.Mock, stub_session: Callable[..., mock.Mock]) -> None:
        text_detector = TextDetector("PP-OCRv5_mobile", cache_dir="test_cache")
        probs = np.zeros((1, 1, 64, 64), dtype=np.float32)
        probs[..., 16:32, 8:56] = 0.6
        text_detector.session = stub_session((1, 3, 64, 64), outputs=[probs])
        image = Image.new("RGB", (64, 64))

        assert len(text_detector._predict(image, minScore=0.5)["boxes"]) == 1
        assert len(text_detector._predict(image, minScore=0.9)["boxes"]) == 0
        # the default must be unaffected by the request that just ran
        assert len(text_detector._predict(image)["boxes"]) == 1

    def test_det_letterboxes_onto_the_canvas_the_session_takes(
        self, path: mock.Mock, stub_session: Callable[..., mock.Mock]
    ) -> None:
        text_detector = TextDetector("PP-OCRv5_mobile", cache_dir=path)
        text_detector.session = stub_session(
            (1, 64, 128, 3),
            outputs=[np.zeros((1, 64, 128), dtype=np.float32)],
            name="image",
            normalizes_input=True,
            shapes=(Shape(batch=1, height=64, width=128), Shape(batch=1, height=128, width=64)),
        )

        text_detector._predict(Image.new("RGB", (100, 100), (10, 20, 30)), maxResolution=64)

        fed = text_detector.session.run.call_args.args[1]["image"]
        assert fed.dtype == np.uint8 and fed.shape == (1, 64, 128, 3)  # the canvas costing it the least downscale
        assert fed[0, :, :64].all() and not fed[0, :, 64:].any()  # in the corner, with the rest left black
        # the legacy path swaps to BGR on the way in; the fused graph does its own
        assert fed[0, 0, 0].tolist() == [10, 20, 30]

    def test_set_rec_set_default_max_batch_size(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        mocker.patch("immich_ml.models.base.InferenceModel.download")

        text_recognizer = TextRecognizer("PP-OCRv5_mobile", cache_dir="test_cache")

        assert {shape.batch for shape in text_recognizer.shape_policy.dims} == {1, 6}

    def test_set_custom_max_batch_size(self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture) -> None:
        mocker.patch("immich_ml.models.base.InferenceModel.download")
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(ocr=4))

        text_recognizer = TextRecognizer("PP-OCRv5_mobile", cache_dir="test_cache")

        assert {shape.batch for shape in text_recognizer.shape_policy.dims} == {1, 4}

    def test_ignore_other_custom_max_batch_size(
        self, ort_session: mock.Mock, path: mock.Mock, mocker: MockerFixture
    ) -> None:
        mocker.patch("immich_ml.models.base.InferenceModel.download")
        mocker.patch.object(settings, "max_batch_size", MaxBatchSize(facial_recognition=3))

        text_recognizer = TextRecognizer("PP-OCRv5_mobile", cache_dir="test_cache")

        assert {shape.batch for shape in text_recognizer.shape_policy.dims} == {1, 6}


@pytest.mark.asyncio
class TestCache:
    async def test_caches(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)
        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)
        assert len(model_cache._models) == 1
        mock_get_model.return_value.assert_called_once()

    async def test_separate_instances_per_graph_option(self) -> None:
        # the real TextDetector, so that dropping its graph_options fails this
        model_cache = ModelCache()

        for max_resolution in (736, 1088, 1088):
            model_cache.get("PP-OCRv5_mobile", ModelType.DETECTION, ModelTask.OCR, maxResolution=max_resolution)
        # maxResolution picks the graphs a detector builds, so instances cannot share them
        assert len(model_cache._models) == 2

    async def test_kwargs_used(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, cache_dir="test_cache")
        mock_get_model.return_value.assert_called_once_with("test_model_name", cache_dir="test_cache")

    async def test_different_clip(self, mock_get_model: mock.Mock) -> None:
        model_cache = ModelCache()
        model_cache.get("test_model_name", ModelType.VISUAL, ModelTask.SEARCH)
        model_cache.get("test_model_name", ModelType.TEXTUAL, ModelTask.SEARCH)
        assert mock_get_model.call_args_list == [
            mock.call("test_model_name", ModelType.VISUAL, ModelTask.SEARCH),
            mock.call("test_model_name", ModelType.TEXTUAL, ModelTask.SEARCH),
        ]
        assert len(model_cache._models) == 2

    async def test_lets_go_of_a_model_unused_for_its_ttl_and_returns_its_memory(
        self, mock_get_model: mock.Mock, mocker: MockerFixture
    ) -> None:
        events: list[str] = []

        class Model:
            graph_options = ()

            def __init__(self, *args: Any, **kwargs: Any) -> None:
                pass

            def __del__(self) -> None:
                events.append("destroyed")

        mock_get_model.return_value = Model
        mocker.patch("immich_ml.models.cache.allocator.release", side_effect=lambda: events.append("released"))
        loop = mocker.patch("immich_ml.models.cache.asyncio.get_running_loop").return_value
        model_cache = ModelCache()

        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)
        delay, evict, key = loop.call_later.call_args.args
        evict(key)

        assert delay == 100
        assert events == ["destroyed", "released"]
        assert not model_cache._models

    async def test_a_use_starts_the_ttl_over(self, mock_get_model: mock.Mock, mocker: MockerFixture) -> None:
        loop = mocker.patch("immich_ml.models.cache.asyncio.get_running_loop").return_value
        model_cache = ModelCache()

        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)
        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)

        loop.call_later.return_value.cancel.assert_called_once()
        assert loop.call_later.call_count == 2

    async def test_keeps_a_preloaded_model_whatever_ttl_a_request_names(
        self, mock_get_model: mock.Mock, mocker: MockerFixture
    ) -> None:
        loop = mocker.patch("immich_ml.models.cache.asyncio.get_running_loop").return_value
        model_cache = ModelCache()

        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)
        model_cache.get("test_model_name", ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION, ttl=100)

        loop.call_later.assert_not_called()

    async def test_loads_mclip(self) -> None:
        model_cache = ModelCache()

        model = model_cache.get("XLM-Roberta-Large-Vit-B-32", ModelType.TEXTUAL, ModelTask.SEARCH)

        assert isinstance(model, MClipTextualEncoder)
        assert model.model_name == "XLM-Roberta-Large-Vit-B-32"

    async def test_raises_exception_if_invalid_model_type(self) -> None:
        invalid: Any = SimpleNamespace(value="invalid")
        model_cache = ModelCache()

        with pytest.raises(ValueError):
            model_cache.get("XLM-Roberta-Large-Vit-B-32", ModelType.TEXTUAL, invalid)

    async def test_raises_exception_if_unknown_model_name(self) -> None:
        model_cache = ModelCache()

        with pytest.raises(ValueError):
            model_cache.get("test_model_name", ModelType.TEXTUAL, ModelTask.SEARCH)

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
        mock_model.unload.assert_called_once()  # so that the retry holds one copy while it loads
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
        mock_model.unload.assert_called_once()
        assert mock_model.load.call_count == 2
        warning.assert_called_once_with(
            "ARMNN is available, but model 'test_model_name' does not support it.", exc_info=error
        )
        assert mock_model.model_format == ModelFormat.ONNX

    async def test_leaves_the_cache_alone_when_a_request_fails_for_another_reason(self) -> None:
        mock_model = mock.Mock(spec=InferenceModel)
        mock_model.loaded = True
        mock_model.predict.side_effect = OSError("image file is truncated")

        with pytest.raises(OSError):
            await attempt(mock_model, mock_model.predict, MODEL_FILE_ERRORS)

        mock_model.clear_cache.assert_not_called()


@pytest.mark.asyncio
async def test_waits_for_every_entry_before_failing_the_request(mocker: MockerFixture) -> None:
    finished = threading.Event()

    def model(task: ModelTask, load: Callable[[], None]) -> mock.Mock:
        stub = mock.Mock(
            spec=InferenceModel, depends=[], loaded=False, load_attempts=0, identity=(ModelType.VISUAL, task)
        )
        stub.load.side_effect = load
        return stub

    def slow() -> None:
        time.sleep(0.2)
        finished.set()

    models = {
        ModelTask.SEARCH: model(ModelTask.SEARCH, slow),
        ModelTask.OCR: model(ModelTask.OCR, mock.Mock(side_effect=RuntimeError("fails at once"))),
    }
    mocker.patch("immich_ml.main.model_cache.get", side_effect=lambda name, type, task, **options: models[task])
    entries: Any = [
        {"name": "a", "task": ModelTask.SEARCH, "type": ModelType.VISUAL, "options": {}},
        {"name": "b", "task": ModelTask.OCR, "type": ModelType.DETECTION, "options": {}},
    ]

    with ThreadPoolExecutor(2) as pool, pytest.raises(RuntimeError, match="fails at once"):
        mocker.patch("immich_ml.main.thread_pool", pool)
        await run_request("text", (entries, []))

    assert finished.is_set()  # or it would still be loading with no request counted as active


@pytest.mark.asyncio
async def test_returns_what_a_preload_freed(mocker: MockerFixture) -> None:
    events: list[str] = []
    mocker.patch.object(settings, "preload", PreloadModelData())
    mocker.patch("immich_ml.main.preload_models", side_effect=lambda _: events.append("preloaded"))
    mocker.patch("immich_ml.main.allocator.release", side_effect=lambda: events.append("released"))

    async with lifespan(app):
        assert events == ["preloaded", "released"]


@pytest.mark.asyncio
async def test_returns_memory_once_requests_stop_unless_another_arrives(mocker: MockerFixture) -> None:
    mocker.patch("immich_ml.main.release", None)
    loop = mocker.patch("immich_ml.main.asyncio.get_running_loop").return_value
    first, second, third = update_state(), update_state(), update_state()
    await anext(first)
    await anext(second)

    await first.aclose()
    loop.call_later.assert_not_called()
    await second.aclose()
    loop.call_later.assert_called_once_with(5, allocator.release)

    await anext(third)
    loop.call_later.return_value.cancel.assert_called_once()
    await third.aclose()


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
        self, asset: Callable[[str], bytes], responses: dict[str, Any], deployed_app: TestClient
    ) -> None:
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={"entries": json.dumps({"clip": {"visual": {"modelName": "ViT-B-32__openai"}}})},
            files={"image": asset("albums/nature/silver_fir.jpg")},
        )

        assert response.status_code == 200
        assert np.allclose(orjson.loads(response.json()["clip"]), responses["clip"]["image"], atol=1e-3)

    def test_clip_text_endpoint(self, responses: dict[str, Any], deployed_app: TestClient) -> None:
        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "entries": json.dumps({"clip": {"textual": {"modelName": "ViT-B-32__openai"}}}),
                "text": "a photo of a forest",
            },
        )

        assert response.status_code == 200
        assert np.allclose(orjson.loads(response.json()["clip"]), responses["clip"]["text"], atol=1e-3)

    def test_face_endpoint(
        self, asset: Callable[[str], bytes], responses: dict[str, Any], deployed_app: TestClient
    ) -> None:
        expected = responses["facial-recognition"]

        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "entries": json.dumps(
                    {
                        "facial-recognition": {
                            "detection": {"modelName": "buffalo_l", "options": {"minScore": 0.7}},
                            "recognition": {"modelName": "buffalo_l"},
                        }
                    }
                )
            },
            files={"image": asset("metadata/faces/portrait.jpg")},
        )

        actual = response.json()
        assert response.status_code == 200
        assert actual["imageWidth"] == expected["imageWidth"]
        assert actual["imageHeight"] == expected["imageHeight"]
        assert len(actual["facial-recognition"]) == len(expected["faces"])

        for expected_face, actual_face in zip(expected["faces"], actual["facial-recognition"]):
            assert actual_face["boundingBox"] == expected_face["boundingBox"]
            assert actual_face["score"] == pytest.approx(expected_face["score"], abs=1e-3)
            assert np.allclose(orjson.loads(actual_face["embedding"]), expected_face["embedding"], atol=1e-3)

    def test_ocr_endpoint(
        self, asset: Callable[[str], bytes], responses: dict[str, Any], deployed_app: TestClient
    ) -> None:
        expected = responses["ocr"]

        response = deployed_app.post(
            "http://localhost:3003/predict",
            data={
                "entries": json.dumps(
                    {
                        "ocr": {
                            "detection": {
                                "modelName": "PP-OCRv5_mobile",
                                "options": {"maxResolution": 736, "minScore": 0.5},
                            },
                            "recognition": {"modelName": "PP-OCRv5_mobile", "options": {"minScore": 0.9}},
                        }
                    }
                )
            },
            files={"image": asset("albums/text/craft-beer.jpg")},
        )

        actual = response.json()["ocr"]
        assert response.status_code == 200
        assert actual["text"] == expected["text"]
        assert np.allclose(actual["box"], expected["box"], atol=1e-3)
        assert np.allclose(actual["boxScore"], expected["boxScore"], atol=1e-3)
        assert np.allclose(actual["textScore"], expected["textScore"], atol=1e-3)
