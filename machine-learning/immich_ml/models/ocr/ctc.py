from pathlib import Path
from typing import Any, Sequence

import numpy as np
from numpy.typing import NDArray


def greedy(outputs: Sequence[NDArray[Any]]) -> tuple[NDArray[np.int32], NDArray[np.float32]]:
    """Models with an in-graph argmax head emit (indices, probs); the rest emit raw logits."""
    if len(outputs) == 2:
        return outputs[0], outputs[1]
    (probs,) = outputs
    indices = probs.argmax(axis=2)
    return indices.astype(np.int32), np.take_along_axis(probs, indices[:, :, None], axis=2)[:, :, 0]


class CtcDecoder:
    def __init__(self, charset: list[str]):
        self.charset = ["", *charset, " "]  # PP-OCR: blank at 0, space last

    @staticmethod
    def from_file(charset_path: Path):
        if not charset_path.is_file():
            raise FileNotFoundError(f"Recognition charset not found: {charset_path}")
        return CtcDecoder(charset_path.read_text(encoding="utf-8").splitlines())

    def __len__(self) -> int:
        return len(self.charset)

    def decode(self, indices: NDArray[np.int32], probs: NDArray[np.float32]) -> tuple[list[str], NDArray[np.float32]]:
        keep = np.empty(indices.shape, dtype=bool)
        keep[:, 0] = True
        np.not_equal(indices[:, 1:], indices[:, :-1], out=keep[:, 1:])  # repeats before blanks
        keep &= indices != 0

        kept = keep.sum(1)
        scores = np.where(kept, np.where(keep, probs, 0).sum(1) / np.maximum(kept, 1), 0)
        texts = ["".join(self.charset[c] for c in row[k]) for row, k in zip(indices, keep)]
        return texts, scores.astype(np.float32)
