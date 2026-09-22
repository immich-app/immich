from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any, Self

import numpy as np
from numpy.typing import NDArray

from immich_ml.models.transforms import widen


def picked(indices: NDArray[np.int32], confidence: NDArray[Any]) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    return indices, widen(confidence)


def logits(raw: NDArray[np.float32]) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    steps = raw.reshape(-1, raw.shape[-1])  # a binary keeps a unit axis between the steps and the classes
    indices = steps.argmax(axis=1)
    best = steps[np.arange(len(steps)), indices]
    # the winner's softmax, summing only the few classes within exp(-16) of it rather than every class of every step
    step, near = np.nonzero(steps > (best - 16)[:, None])
    total = np.bincount(step, weights=np.exp(steps[step, near] - best[step]), minlength=len(steps))
    return indices.reshape(raw.shape[:2]).astype(np.int32), (1 / total).reshape(raw.shape[:2]).astype(np.float32)


def probabilities(probs: NDArray[Any]) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    # probabilities are non-negative, so half-precision bits order like their values and need no widening to compare
    indices = (probs.view(np.uint16) if probs.dtype == np.float16 else probs).argmax(axis=2)
    return indices.astype(np.int32), widen(np.take_along_axis(probs, indices[:, :, None], axis=2)[:, :, 0])


Greedy = Callable[..., tuple[NDArray[np.int32], NDArray[np.float32]]]
GREEDY: dict[str, Greedy] = {"ctc_indices": picked, "ctc_logits": logits, "logits_softmax": probabilities}


class CtcDecoder:
    def __init__(self, charset: list[str], greedy: Greedy):
        self.charset = ["", *charset, " "]  # PP-OCR: blank at 0, space last
        self.greedy = greedy

    @classmethod
    def from_file(cls, charset_path: Path, greedy: Greedy) -> Self:
        if not charset_path.is_file():
            raise FileNotFoundError(f"Recognition charset not found: {charset_path}")
        return cls(charset_path.read_text(encoding="utf-8").splitlines(), greedy)

    def __len__(self) -> int:
        return len(self.charset)

    def __call__(self, outputs: Sequence[NDArray[Any]]) -> tuple[list[str], NDArray[np.float32]]:
        return self.decode(*self.greedy(*outputs))

    def decode(self, indices: NDArray[np.int32], probs: NDArray[np.float32]) -> tuple[list[str], NDArray[np.float32]]:
        keep = np.empty(indices.shape, dtype=bool)
        keep[:, 0] = True
        np.not_equal(indices[:, 1:], indices[:, :-1], out=keep[:, 1:])  # repeats before blanks
        keep &= indices != 0

        scores: NDArray[np.float32] = np.where(keep, probs, 0).sum(1)
        scores /= np.maximum(keep.sum(1), 1)  # an all-blank row sums to 0, so it stays 0
        texts = ["".join(map(self.charset.__getitem__, row[k])) for row, k in zip(indices, keep)]
        return texts, scores
