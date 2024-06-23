from __future__ import annotations

from pathlib import Path
from typing import Any, NamedTuple

import numpy as np
from numpy.typing import NDArray

from ann.ann import Ann
from app.schemas import SessionNode

from ..config import log, settings


class AnnSession:
    """
    Wrapper for ANN to be drop-in replacement for ONNX session.
    """

    def __init__(self, model_path: Path, cache_dir: Path = settings.cache_folder) -> None:
        self.model_path = model_path
        self.cache_dir = cache_dir
        self.ann = Ann(tuning_level=3, tuning_file=(cache_dir / "gpu-tuning.ann").as_posix())

        log.info("Loading ANN model %s ...", model_path)
        self.model = self.ann.load(
            model_path.as_posix(),
            cached_network_path=model_path.with_suffix(".anncache").as_posix(),
        )
        log.info("Loaded ANN model with ID %d", self.model)

    def __del__(self) -> None:
        self.ann.unload(self.model)
        log.info("Unloaded ANN model %d", self.model)
        self.ann.destroy()

    def get_inputs(self) -> list[SessionNode]:
        shapes = self.ann.input_shapes[self.model]
        return [AnnNode(None, s) for s in shapes]

    def get_outputs(self) -> list[SessionNode]:
        shapes = self.ann.output_shapes[self.model]
        return [AnnNode(None, s) for s in shapes]

    def run(
        self,
        output_names: list[str] | None,
        input_feed: dict[str, NDArray[np.float32]] | dict[str, NDArray[np.int32]],
        run_options: Any = None,
    ) -> list[NDArray[np.float32]]:
        inputs: list[NDArray[np.float32]] = [np.ascontiguousarray(v) for v in input_feed.values()]
        return self.ann.execute(self.model, inputs)


class AnnNode(NamedTuple):
    name: str | None
    shape: tuple[int, ...]
