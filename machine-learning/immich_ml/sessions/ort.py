from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from threading import Lock
from typing import Any

import numpy as np
import onnxruntime as ort
from numpy.typing import NDArray

from immich_ml.models.constants import SUPPORTED_PROVIDERS  # here, as the preparing child has no use for the models
from immich_ml.schemas import ModelInput, ModelPrecision, ModelTask, SessionNode, Shape

from ..config import log, settings
from .policy import ShapePolicy

# the one provider that handles a free dim well; the rest miscompile it, recompile inside the run,
# or partition around it, so they are handed one graph per shape instead
DYNAMIC_PROVIDERS = frozenset({"CPUExecutionProvider"})


def _label(pins: Mapping[str, int]) -> str:
    return "_".join(f"{name}{size}" for name, size in pins.items())


class OrtGraph:
    def __init__(self, spec: GraphSpec) -> None:
        self.session = spec.session(spec.model_path)
        image = self.session.get_inputs()[0]
        # whether the graph scales and shifts the image itself, so the host hands over raw pixels
        self.normalizes_input = image.type == "tensor(uint8)"

    def get_inputs(self) -> Sequence[SessionNode]:
        inputs: Sequence[SessionNode] = self.session.get_inputs()
        return inputs

    def get_outputs(self) -> Sequence[SessionNode]:
        outputs: Sequence[SessionNode] = self.session.get_outputs()
        return outputs

    def get_metadata(self) -> dict[str, str]:
        metadata: dict[str, str] = self.session.get_modelmeta().custom_metadata_map
        return metadata

    def run(
        self,
        output_names: list[str] | None,
        input_feed: ModelInput,
        run_options: Any = None,
    ) -> list[NDArray[np.float32]]:
        outputs: list[NDArray[Any]] = self.session.run(output_names, input_feed, run_options)
        return outputs


@dataclass(frozen=True)
class GraphSpec:
    model_path: Path
    pins: Mapping[str, int]
    overrides: Sequence[tuple[str, int]]
    providers: list[str]

    @cached_property
    def directory(self) -> Path:
        provider = self.providers[0].removesuffix("ExecutionProvider").lower()
        return self.model_path.parent / provider / _label(self.pins)

    @cached_property
    def cpu_only(self) -> bool:
        return self.providers == ["CPUExecutionProvider"]

    def session(self, graph: Path, sess_options: ort.SessionOptions | None = None) -> ort.InferenceSession:
        return ort.InferenceSession(
            graph.as_posix(),
            providers=self.providers,
            provider_options=self.provider_options,
            sess_options=sess_options or self.sess_options(),
        )

    @cached_property
    def provider_options(self) -> list[dict[str, Any]]:
        provider_options = []
        for provider in self.providers:
            match provider:
                case "CPUExecutionProvider":
                    options = {"arena_extend_strategy": "kSameAsRequested"}
                case "CUDAExecutionProvider":
                    options = {"arena_extend_strategy": "kSameAsRequested", "device_id": settings.device_id}
                case "MIGraphXExecutionProvider":
                    # MIGraphX does not create the underlying folder and will crash if it does not exist
                    self.directory.mkdir(parents=True, exist_ok=True)
                    options = {
                        "device_id": settings.device_id,
                        "migraphx_model_cache_dir": self.directory.as_posix(),
                        "migraphx_fp16_enable": "1" if settings.rocm_precision == ModelPrecision.FP16 else "0",
                    }
                case "OpenVINOExecutionProvider":
                    device_ids: list[str] = ort.capi._pybind_state.get_available_openvino_device_ids()
                    # Check for available devices, preferring GPU over CPU
                    gpu_devices = [d for d in device_ids if d.startswith("GPU")]
                    if gpu_devices:
                        device_type = f"GPU.{settings.device_id}"
                        log.debug(f"OpenVINO: Using GPU device {device_type}")
                    else:
                        device_type = "CPU"
                        log.debug("OpenVINO: No GPU found, using CPU")
                    options = {
                        "device_type": device_type,
                        "precision": settings.openvino_precision.value,
                        "cache_dir": self.directory.as_posix(),
                    }
                case "CoreMLExecutionProvider":
                    options = {
                        "ModelFormat": "MLProgram",
                        "MLComputeUnits": "ALL",
                        "SpecializationStrategy": "FastPrediction",
                        "AllowLowPrecisionAccumulationOnGPU": "1",
                        "ModelCacheDirectory": self.directory.as_posix(),
                    }
                case _:
                    options = {}
            provider_options.append(options)
        log.debug(f"Setting execution provider options to {provider_options}")
        return provider_options

    def sess_options(self) -> ort.SessionOptions:
        sess_options = ort.SessionOptions()
        sess_options.enable_cpu_mem_arena = settings.model_arena

        # avoid thread contention between models
        # Set inter_op threads
        if settings.model_inter_op_threads > 0:
            sess_options.inter_op_num_threads = settings.model_inter_op_threads
        # these defaults work well for CPU, but bottleneck GPU
        elif settings.model_inter_op_threads == 0 and self.cpu_only:
            sess_options.inter_op_num_threads = 1

        # Set intra_op threads
        if settings.model_intra_op_threads > 0:
            sess_options.intra_op_num_threads = settings.model_intra_op_threads
        elif settings.model_intra_op_threads == 0 and self.cpu_only:
            sess_options.intra_op_num_threads = 2

        if sess_options.inter_op_num_threads > 1:
            sess_options.execution_mode = ort.ExecutionMode.ORT_PARALLEL

        for dimension, size in self.overrides:
            sess_options.add_free_dimension_override_by_name(dimension, size)

        log.debug(f"Setting execution_mode to {sess_options.execution_mode.name}")
        log.debug(f"Setting inter_op_num_threads to {sess_options.inter_op_num_threads}")
        log.debug(f"Setting intra_op_num_threads to {sess_options.intra_op_num_threads}")
        return sess_options


class OrtSession:
    def __init__(
        self, model_path: Path | str, policy: ShapePolicy, task: ModelTask, providers: list[str] | None = None
    ) -> None:
        self.model_path = Path(model_path)
        self.policy = policy
        self.providers = providers if providers is not None else _providers_default()
        log.info(f"Setting execution providers to {self.providers}, in descending order of preference")
        self.dynamic = self.providers[0] in DYNAMIC_PROVIDERS
        # OpenVINO runs CLIP's towers slower at a fixed size than with nothing pinned
        self.pins = not (self.providers[0] == "OpenVINOExecutionProvider" and task == ModelTask.SEARCH)
        # the shapes to snap onto, where a dim a shape leaves out takes any size
        self.shapes = (policy.pinned,) if self.dynamic else policy.dims
        self.batches = tuple(sorted({shape.batch for shape in self.shapes}, reverse=True))
        self.graphs: dict[Shape, OrtGraph] = {}
        self.locks: dict[Shape, Lock] = {}
        if self.dynamic or len(policy.dims) == 1:
            self.for_shape(policy.dims[0])  # the one graph there is, so nothing waits on a shape

    def for_shape(self, shape: Shape) -> OrtGraph:
        if self.dynamic:  # a batch gains nothing here, and a graph that knows it has one row optimizes further
            shape = self.shapes[0]
        if (graph := self.graphs.get(shape)) is not None:
            return graph
        if not self.dynamic and shape not in self.policy.dims:  # every shape admitted is another graph to compile
            raise ValueError(f"Asked for {shape}, which is none of {list(self.policy.dims)}")
        with self.locks.setdefault(shape, Lock()):  # requests arrive together for a graph none of them has
            if (graph := self.graphs.get(shape)) is None:
                log.debug(f"Building a graph for {shape}")
                pins = shape.pins if self.pins else {}
                spec = GraphSpec(self.model_path, pins, _overrides(self.policy, pins), self.providers)
                graph = self.graphs[shape] = OrtGraph(spec)
            return graph


def _overrides(policy: ShapePolicy, pins: Mapping[str, int]) -> list[tuple[str, int]]:
    order = tuple(policy.dims[0].pins)
    named = []
    for dimension, size in pins.items():
        position = order.index(dimension)  # a graph that names several dims takes the first pin for all
        named += [(dimension, size), (f"DynamicDimension.{position}", size)]
        named.append(("None", size) if position == 0 else ("?", size))
    return named


def _providers_default() -> list[str]:
    available_providers = set(ort.get_available_providers())
    log.debug(f"Available ORT providers: {available_providers}")
    return [provider for provider in SUPPORTED_PROVIDERS if provider in available_providers]
