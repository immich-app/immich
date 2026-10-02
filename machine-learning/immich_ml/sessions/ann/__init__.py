from __future__ import annotations

from pathlib import Path
from typing import Any, NamedTuple

import numpy as np
from numpy.typing import NDArray

from immich_ml.config import log, settings
from immich_ml.schemas import ModelInput, SessionNode, Shape

from .loader import Ann


class AnnSession:
    """
    Wrapper for ANN to be drop-in replacement for ONNX session.
    """

    def __init__(self, model_path: Path, cache_dir: Path = settings.cache_folder) -> None:
        self.model_path = model_path
        self.cache_dir = cache_dir
        self.ann = Ann(tuning_level=settings.ann_tuning_level, tuning_file=(cache_dir / "gpu-tuning.ann").as_posix())

        log.info("Loading ANN model %s ...", model_path)
        self.model = self.ann.load(
            model_path.as_posix(),
            cached_network_path=model_path.with_suffix(".anncache").as_posix(),
            fp16=settings.ann_fp16_turbo,
        )
        log.info("Loaded ANN model with ID %d", self.model)
        batch = self.ann.input_shapes[self.model][0][0]
        self.shapes = (Shape(batch),)  # the artifact is compiled for one shape
        self.batches = (batch,)

    def __del__(self) -> None:
        self.ann.unload(self.model)
        log.info("Unloaded ANN model %d", self.model)
        self.ann.destroy()

    def get_inputs(self) -> list[SessionNode]:
        shapes = self.ann.input_shapes[self.model]
        return [AnnNode(f"input.{i + 1}", s) for i, s in enumerate(shapes)]

    def get_outputs(self) -> list[SessionNode]:
        shapes = self.ann.output_shapes[self.model]
        return [AnnNode(f"output.{i + 1}", s) for i, s in enumerate(shapes)]

    def get_metadata(self) -> dict[str, str]:
        return {}

    @property
    def normalizes_input(self) -> bool:
        return False  # no ARM-NN artifact is built from a graph that carries its own preprocessing

    def for_shape(self, shape: Shape) -> AnnSession:
        return self

    def warm(self) -> None:
        pass  # the artifact is loaded whole when the session opens

    def run(
        self,
        output_names: list[str] | None,
        input_feed: ModelInput,
        run_options: Any = None,
    ) -> list[NDArray[np.float32]]:
        inputs: list[NDArray[np.float32]] = [np.ascontiguousarray(v) for v in input_feed.values()]
        return self.ann.execute(self.model, inputs)


class AnnNode(NamedTuple):
    name: str
    shape: tuple[int, ...]
