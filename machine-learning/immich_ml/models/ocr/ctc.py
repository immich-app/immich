from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any, Self

import numpy as np
from numpy.typing import NDArray

from immich_ml.models.transforms import widen


def picked(indices: NDArray[np.int32], confidence: NDArray[Any]) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    return indices, widen(confidence)


def kept(indices: NDArray[np.integer[Any]]) -> NDArray[np.bool_]:
    """The steps a greedy CTC decode reads a character from: not blank, and not a repeat of the step before."""
    keep = np.empty(indices.shape, dtype=bool)
    keep[:, 0] = True
    np.not_equal(indices[:, 1:], indices[:, :-1], out=keep[:, 1:])
    keep &= indices != 0
    return keep


def logits(raw: NDArray[Any]) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    steps = raw.reshape(-1, raw.shape[-1])  # a binary keeps a unit axis between the steps and the classes
    indices = _argmax(steps)
    keep = kept(indices.reshape(raw.shape[:2])).ravel()
    rows = widen(steps[keep])  # a confidence is only read where a character is kept
    best = rows[np.arange(len(rows)), indices[keep]]
    # the winner's softmax, summing only the few classes within exp(-16) of it rather than every class
    near = rows > (best - 16)[:, None]
    counts = np.count_nonzero(near, axis=1)
    confidence = np.zeros(len(steps), np.float32)
    if len(rows):
        weights = np.exp(rows[near] - np.repeat(best, counts))
        confidence[keep] = 1 / np.add.reduceat(weights, np.cumsum(counts) - counts)
    return indices.reshape(raw.shape[:2]).astype(np.int32), confidence.reshape(raw.shape[:2])


def _argmax(steps: NDArray[Any]) -> NDArray[np.intp]:
    if steps.dtype != np.float16:
        return steps.argmax(axis=1)
    bits = steps.view(np.int16)  # a half's bits order like its value where it is not negative
    indices = bits.argmax(axis=1)
    negative = np.flatnonzero(bits[np.arange(len(bits)), indices] < 0)  # a step with no logit above zero
    if len(negative):
        flipped = bits[negative] ^ ((bits[negative] >> 15) & np.int16(0x7FFF))  # negatives' order restored
        indices[negative] = flipped.argmax(axis=1)
    return indices


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
        keep = kept(indices)

        scores: NDArray[np.float32] = np.where(keep, probs, 0).sum(1)
        scores /= np.maximum(keep.sum(1), 1)  # an all-blank row sums to 0, so it stays 0
        texts = ["".join(map(self.charset.__getitem__, row[k])) for row, k in zip(indices, keep)]
        return texts, scores
