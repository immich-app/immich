from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from numpy.typing import NDArray

from immich_ml.models.constants import SUPPORTED_PROVIDERS
from immich_ml.schemas import SessionNode

from ..config import log, settings


class OrtSession:
    session: ort.InferenceSession

    def __init__(
        self,
        model_path: Path | str,
        providers: list[str] | None = None,
        provider_options: list[dict[str, Any]] | None = None,
        sess_options: ort.SessionOptions | None = None,
    ):
        self.model_path = Path(model_path)
        initial_providers = providers if providers is not None else self._providers_default
        initial_provider_options = (
            provider_options if provider_options is not None else self._build_provider_options(initial_providers)
        )
        self.providers = initial_providers
        self.provider_options = initial_provider_options
        using_default_sess_options = sess_options is None
        self._using_default_sess_options = using_default_sess_options
        self.sess_options = sess_options if sess_options is not None else self._sess_options_default

        try:
            self.session = ort.InferenceSession(
                self.model_path.as_posix(),
                providers=self.providers,
                provider_options=self.provider_options,
                sess_options=self.sess_options,
            )
        except Exception as error:
            if not self.fallback_to_cpu(error):
                raise

    def get_inputs(self) -> list[SessionNode]:
        inputs: list[SessionNode] = self.session.get_inputs()
        return inputs

    def get_outputs(self) -> list[SessionNode]:
        outputs: list[SessionNode] = self.session.get_outputs()
        return outputs

    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
        run_options: Any = None,
    ) -> list[NDArray[np.float32]]:
        outputs: list[NDArray[np.float32]] = self.session.run(output_names, input_feed, run_options)
        return outputs

    @property
    def providers(self) -> list[str]:
        return self._providers

    @providers.setter
    def providers(self, providers: list[str]) -> None:
        log.info(f"Setting execution providers to {providers}, in descending order of preference")
        self._providers = providers

    @property
    def _providers_default(self) -> list[str]:
        available_providers = set(ort.get_available_providers())
        log.debug(f"Available ORT providers: {available_providers}")
        if (openvino := "OpenVINOExecutionProvider") in available_providers:
            device_ids: list[str] = ort.capi._pybind_state.get_available_openvino_device_ids()
            log.debug(f"Available OpenVINO devices: {device_ids}")

            gpu_devices = [device_id for device_id in device_ids if device_id.startswith("GPU")]
            if not gpu_devices:
                log.warning("No GPU device found in OpenVINO. Falling back to CPU.")
                available_providers.remove(openvino)
        return [provider for provider in SUPPORTED_PROVIDERS if provider in available_providers]

    @property
    def provider_options(self) -> list[dict[str, Any]]:
        return self._provider_options

    @provider_options.setter
    def provider_options(self, provider_options: list[dict[str, Any]]) -> None:
        log.debug(f"Setting execution provider options to {provider_options}")
        self._provider_options = provider_options

    def _build_provider_options(self, providers: list[str]) -> list[dict[str, Any]]:
        provider_options = []
        for provider in providers:
            match provider:
                case "CPUExecutionProvider":
                    options = {"arena_extend_strategy": "kSameAsRequested"}
                case "CUDAExecutionProvider" | "ROCMExecutionProvider":
                    options = {"arena_extend_strategy": "kSameAsRequested", "device_id": settings.device_id}
                case "OpenVINOExecutionProvider":
                    options = {
                        "device_type": f"GPU.{settings.device_id}",
                        "precision": "FP32",
                        "cache_dir": (self.model_path.parent / "openvino").as_posix(),
                    }
                case "CoreMLExecutionProvider":
                    options = {
                        "ModelFormat": "MLProgram",
                        "MLComputeUnits": "ALL",
                        "SpecializationStrategy": "FastPrediction",
                        "AllowLowPrecisionAccumulationOnGPU": "1",
                        "ModelCacheDirectory": (self.model_path.parent / "coreml").as_posix(),
                    }
                case _:
                    options = {}
            provider_options.append(options)
        return provider_options

    @property
    def sess_options(self) -> ort.SessionOptions:
        return self._sess_options

    @sess_options.setter
    def sess_options(self, sess_options: ort.SessionOptions) -> None:
        log.debug(f"Setting execution_mode to {sess_options.execution_mode.name}")
        log.debug(f"Setting inter_op_num_threads to {sess_options.inter_op_num_threads}")
        log.debug(f"Setting intra_op_num_threads to {sess_options.intra_op_num_threads}")
        self._sess_options = sess_options

    @property
    def _sess_options_default(self) -> ort.SessionOptions:
        sess_options = ort.SessionOptions()
        sess_options.enable_cpu_mem_arena = settings.model_arena

        # avoid thread contention between models
        if settings.model_inter_op_threads > 0:
            sess_options.inter_op_num_threads = settings.model_inter_op_threads
        # these defaults work well for CPU, but bottleneck GPU
        elif settings.model_inter_op_threads == 0 and self.providers == ["CPUExecutionProvider"]:
            sess_options.inter_op_num_threads = 1

        if settings.model_intra_op_threads > 0:
            sess_options.intra_op_num_threads = settings.model_intra_op_threads
        elif settings.model_intra_op_threads == 0 and self.providers == ["CPUExecutionProvider"]:
            sess_options.intra_op_num_threads = 2

        if sess_options.inter_op_num_threads > 1:
            sess_options.execution_mode = ort.ExecutionMode.ORT_PARALLEL

        return sess_options

    def fallback_to_cpu(self, error: Exception | None = None) -> bool:
        # the new CPU session.
        current_providers = list(self.providers)
        if current_providers == ["CPUExecutionProvider"]:
            log.warning(
                "ORT session %s is already using CPUExecutionProvider; cannot fall back further (%s).",
                self.model_path,
                error,
            )
            return False

        failed_provider = current_providers[0] if current_providers else "<unknown>"
        log.warning(
            "Provider '%s' failed for ORT session %s (%s). Retrying with CPUExecutionProvider only.",
            failed_provider,
            self.model_path,
            error,
        )

        fallback_providers = ["CPUExecutionProvider"]
        current_provider_options = list(self.provider_options)
        fallback_options = [
            options
            for provider, options in zip(current_providers, current_provider_options)
            if provider == "CPUExecutionProvider"
        ]
        if not fallback_options:
            fallback_options = self._build_provider_options(fallback_providers)

        self.providers = fallback_providers
        self.provider_options = fallback_options

        if self._using_default_sess_options:
            self.sess_options = self._sess_options_default
        else:
            log.debug("Retaining custom session options after provider fallback.")

        self.session = ort.InferenceSession(
            self.model_path.as_posix(),
            providers=self.providers,
            provider_options=self.provider_options,
            sess_options=self.sess_options,
        )

        try:
            provider_list = self.session.get_providers()
        except Exception:  # pragma: no cover - defensive
            provider_list = ["<unavailable>"]
        log.info("ORT session fallback providers now: %s", provider_list)
        return True

    @staticmethod
    def is_onnxruntime_error(error: Exception) -> bool:
        module = type(error).__module__
        return "onnxruntime" in module
