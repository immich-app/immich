from collections.abc import Sequence
from pathlib import Path
from typing import Any, Self

import numpy as np
from numpy.typing import NDArray

from immich_ml.models.transforms import widen


def greedy(outputs: Sequence[NDArray[Any]]) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    """Models with an in-graph argmax head emit (indices, probs); the rest emit raw logits."""
    if len(outputs) == 2:
        return outputs[0], widen(outputs[1])
    (probs,) = outputs
    # probabilities are non-negative, so half-precision bits order like their values and need no widening to compare
    indices = (probs.view(np.uint16) if probs.dtype == np.float16 else probs).argmax(axis=2)
    return indices.astype(np.int32), widen(np.take_along_axis(probs, indices[:, :, None], axis=2)[:, :, 0])


class CtcDecoder:
    def __init__(self, charset: list[str]):
        self.charset = ["", *charset, " "]  # PP-OCR: blank at 0, space last

    @classmethod
    def from_file(cls, charset_path: Path) -> Self:
        if not charset_path.is_file():
            raise FileNotFoundError(f"Recognition charset not found: {charset_path}")
        return cls(charset_path.read_text(encoding="utf-8").splitlines())

    def __len__(self) -> int:
        return len(self.charset)

    def decode(self, indices: NDArray[np.int32], probs: NDArray[np.float32]) -> tuple[list[str], NDArray[np.float32]]:
        keep = np.empty(indices.shape, dtype=bool)
        keep[:, 0] = True
        np.not_equal(indices[:, 1:], indices[:, :-1], out=keep[:, 1:])  # repeats before blanks
        keep &= indices != 0

        scores: NDArray[np.float32] = np.where(keep, probs, 0).sum(1)
        scores /= np.maximum(keep.sum(1), 1)  # an all-blank row sums to 0, so it stays 0
        texts = ["".join(map(self.charset.__getitem__, row[k])) for row, k in zip(indices, keep)]
        return texts, scores
