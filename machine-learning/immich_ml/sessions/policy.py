from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from immich_ml.schemas import Shape


@dataclass(frozen=True)
class ShapePolicy:
    dims: tuple[Shape, ...] = (Shape(batch=1),)
    label: str = ""  # the artifact subdirectory, for a submodel that ships more than one set

    @property
    def pinned(self) -> Shape:
        first = self.dims[0]
        return Shape(
            batch=1,
            height=first.height if all(shape.height == first.height for shape in self.dims) else None,
            width=first.width if all(shape.width == first.width for shape in self.dims) else None,
        )


def batches(maximum: int) -> tuple[int, ...]:
    return (1, maximum) if maximum > 1 else (1,)


def runs(total: int, batches: Sequence[int]) -> list[int]:
    runs = []
    while total > 0:
        runs.append(max(size for size in batches if size <= total))
        total -= runs[-1]
    return runs
