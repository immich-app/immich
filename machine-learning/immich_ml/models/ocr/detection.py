import math
from collections.abc import Hashable, Sequence
from functools import cached_property
from typing import Any, Self

import cv2
import numpy as np
from immich_model.constants import OCR_DETECTION_SIZES, ocr_canvases
from numpy.typing import NDArray
from PIL import Image

from immich_ml.config import log
from immich_ml.models.transforms import widen
from immich_ml.schemas import ModelGraph, ModelTask, ModelType, Shape, TextDetectionOptions
from immich_ml.sessions.ort import OrtSession
from immich_ml.sessions.policy import ShapePolicy

from .legacy import TextModel
from .postprocess import DBPostProcess
from .schemas import TextDetectionOutput

# of a tile's side, which is wider than all but the largest lines are tall, so most lie whole inside some tile
TILE_OVERLAP = 0.25
# how much of a box from the whole-image pass the tiles must have found for their boxes to stand in its place
COVERED = 0.5
# the longest side the boxes are rasterized at to compare them, as coverage needs no finer grid than that
COVERAGE_SIDE = 1024
# of the device memory free as a tile size is picked, what one run may plan on: the other models share the device
RUN_MEMORY_SHARE = 0.5
# what a run holds on the device per pixel of its canvas, at most: PP-OCRv6_medium takes 330 in fp32 on CUDA
RUN_BYTES_PER_PIXEL = 400


class TextDetector(TextModel[TextDetectionOptions]):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.OCR)

    def __init__(
        self, model_name: str, max_resolution: int = TextDetectionOptions.max_resolution, **model_kwargs: Any
    ) -> None:
        super().__init__(model_name, **model_kwargs)
        # past the largest size that ships, an image is read in tiles of it rather than on a canvas of its own size
        self.tile = self.tile_size(max_resolution)
        # and in smaller tiles while the device has too little memory free for those
        sizes = sorted({size for size in OCR_DETECTION_SIZES if size < self.tile} | {self.tile})
        self.ceiling = self.tile
        # RKNPU ships a binary per short side, which the label picks
        canvases = tuple(Shape(batch=1, **canvas) for size in sizes for canvas in ocr_canvases(size))
        self.shape_policy = ShapePolicy(dims=canvases, label=f"res{self.tile}")
        self.scale = np.float32(1.0 / 127.5)  # (x/255 - 0.5) / 0.5
        self._empty: TextDetectionOutput = {
            "boxes": np.empty(0, dtype=np.float32),
            "scores": np.empty(0, dtype=np.float32),
        }
        self.postprocess = DBPostProcess(thresh=0.3, max_candidates=1000, unclip_ratio=1.6, use_dilation=True)

    @classmethod
    def tile_size(cls, max_resolution: int) -> int:
        return min(cls._canvas_size(max_resolution), OCR_DETECTION_SIZES[-1])

    @classmethod
    def graph(cls, options: TextDetectionOptions) -> Hashable:
        return cls.tile_size(options.max_resolution)  # the graphs are the tile's, whatever resolution reads them

    @classmethod
    def create(cls, model_name: str, options: TextDetectionOptions) -> Self:
        return cls(model_name, max_resolution=options.max_resolution)

    def _predict(self, inputs: Image.Image, options: TextDetectionOptions) -> TextDetectionOutput:
        width, height = inputs.size
        if width < 32 or height < 32:
            return self._empty

        while True:
            tile = self._tile_for_run()
            try:
                boxes, scores = self._detect(inputs, options, tile)
                break
            except Exception as error:
                smaller = [size for size in self._tile_sizes() if size < tile]
                if not smaller or not self._out_of_memory(error):
                    raise
                self._lower_ceiling(smaller[-1])
        if len(boxes) == 0:
            return self._empty
        order = self.reading_order(boxes)
        return {"boxes": boxes[order], "scores": scores[order]}

    def _detect(
        self, img: Image.Image, options: TextDetectionOptions, tile: int
    ) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        width, height = img.size
        ratio = min(options.max_resolution / min(height, width), 1.0)
        content_h, content_w = max(self._round32(height * ratio), 32), max(self._round32(width * ratio), 32)
        canvases = [canvas for canvas in self._canvases() if min(canvas) <= tile]
        if any(canvas[0] >= content_h and canvas[1] >= content_w for canvas in canvases):
            return self._whole(img, options, canvases if self._fixed() else [])
        target = (max(round(height * ratio), 32), max(round(width * ratio), 32))
        return self._tiled(img, target, [canvas for canvas in canvases if min(canvas) == tile], tile, options)

    def _tile_for_run(self) -> int:
        """The largest tile whose largest canvas the device has the memory free to run, or the smallest if none."""
        sizes = [size for size in self._tile_sizes() if size <= self.ceiling] or self._tile_sizes()[:1]
        free = self.session.free_memory() if isinstance(self.session, OrtSession) else None
        if free is None:
            return sizes[-1]
        affordable = [size for size in sizes if self._run_bytes(size) <= free * RUN_MEMORY_SHARE]
        return affordable[-1] if affordable else sizes[0]

    def _run_bytes(self, tile: int) -> int:
        return RUN_BYTES_PER_PIXEL * max(
            height * width for height, width in self._canvases() if min(height, width) == tile
        )

    def _lower_ceiling(self, tile: int) -> None:
        """Keeps to tiles of `tile` or less until the model is next loaded, past a run the device had no memory for,
        and closes the graphs of the larger ones so their arenas hand back what the failed run left in them."""
        log.warning(f"Text detection ran out of device memory with tiles of {self.ceiling}, so it takes {tile} now")
        self.ceiling = tile
        if isinstance(self.session, OrtSession):
            for shape in self.session.policy.dims:
                if shape.height and shape.width and min(shape.height, shape.width) > tile:
                    self.session.drop(shape)

    @staticmethod
    def _out_of_memory(error: Exception) -> bool:
        message = str(error).lower()
        return any(sign in message for sign in ("failed to allocate memory", "out of memory", "alloc_failed"))

    def _whole(
        self, img: Image.Image, options: TextDetectionOptions, canvases: Sequence[tuple[int, int]]
    ) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        """The boxes from one pass over the image, shrunk onto a canvas if it is larger than all of them."""
        session, image, content = self._transform(img, options.max_resolution, canvases)
        probs = self._probs(session, image)
        return self.postprocess(probs[: content[0], : content[1]], (img.height, img.width), options.min_score)

    def _tiled(
        self,
        img: Image.Image,
        target: tuple[int, int],
        canvases: Sequence[tuple[int, int]],
        tile: int,
        options: TextDetectionOptions,
    ) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        """The boxes from overlapping tiles at the resolution asked for, which no one canvas holds without shrinking.

        The tiles' probability maps are blended into one before any box is drawn, so a line crossing a seam is one
        box rather than two halves or a pair of duplicates. Text taller than a tile reads as strokes to every tile,
        so a pass over the whole image shrunk onto a canvas adds the boxes the tiles did not find."""
        height, width = target
        resized = img if img.size == (width, height) else img.resize((width, height), resample=Image.Resampling.LANCZOS)
        if resized.mode != "RGB":
            resized = resized.convert("RGB")
        probs, tiles = self._stitch(np.asarray(resized), canvases, tile)
        # the cap is per map, and this one stands for many
        postprocess = DBPostProcess(thresh=0.3, max_candidates=1000 * tiles, unclip_ratio=1.6, use_dilation=True)
        fine, fine_scores = postprocess(probs, (img.height, img.width), options.min_score)
        coarse, coarse_scores = self._whole(img, options, canvases)
        return self._fuse(fine, fine_scores, coarse, coarse_scores, (img.height, img.width))

    def _stitch(
        self, array: NDArray[np.uint8], canvases: Sequence[tuple[int, int]], tile: int
    ) -> tuple[NDArray[np.float32], int]:
        """The probability map of the whole of `array`, from the tiling that costs the fewest pixels to run."""
        height, width = array.shape[:2]
        overlap = max(self._round32(tile * TILE_OVERLAP), 32)
        canvas, ys, xs = min(
            (
                (canvas, self._starts(height, canvas[0], overlap), self._starts(width, canvas[1], overlap))
                for canvas in canvases
            ),
            key=lambda layout: (
                len(layout[1]) * len(layout[2]) * layout[0][0] * layout[0][1],
                len(layout[1]) * len(layout[2]),
            ),
        )
        session = self.session.for_shape(Shape(batch=1, height=canvas[0], width=canvas[1]))
        tile_h, tile_w = min(canvas[0], height), min(canvas[1], width)
        # a graph that takes any size is fed the tile alone, padded only to the stride
        fed = canvas if self._fixed() else (self._ceil32(tile_h), self._ceil32(tile_w))
        ramps_y, ramps_x = self._ramps(ys, tile_h), self._ramps(xs, tile_w)

        probs = np.zeros((height, width), dtype=np.float32)
        for y, ramp_y in zip(ys, ramps_y):
            for x, ramp_x in zip(xs, ramps_x):
                probs_tile = self._probs(session, self._feed(session, array[y : y + tile_h, x : x + tile_w], fed))
                weighted = probs_tile[:tile_h, :tile_w] * ramp_y[:, None]
                weighted *= ramp_x
                probs[y : y + tile_h, x : x + tile_w] += weighted
        # the weights are a product of one ramp per axis, and so is their sum, which normalizes one axis at a time
        probs /= self._coverage(ys, ramps_y, height)[:, None]
        probs /= self._coverage(xs, ramps_x, width)
        return probs, len(ys) * len(xs)

    def _fuse(
        self,
        fine: NDArray[np.float32],
        fine_scores: NDArray[np.float32],
        coarse: NDArray[np.float32],
        coarse_scores: NDArray[np.float32],
        shape: tuple[int, int],
    ) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        """The tiles' boxes, with those of the whole-image pass only where the tiles found next to none of it, which
        take the place of any tile box centred inside them: those are pieces of letters too large for a tile."""
        if len(coarse) == 0:
            return fine, fine_scores
        factor = min(1.0, COVERAGE_SIDE / max(shape))
        size = (max(round(shape[0] * factor), 1), max(round(shape[1] * factor), 1))
        found = np.zeros(size, dtype=np.float32)
        if len(fine):
            cv2.fillPoly(found, list(np.round(fine * factor).astype(np.int32)), 1.0)
        missed = np.array([self.postprocess.box_score(found, box * factor) < COVERED for box in coarse])
        if not missed.any():
            return fine, fine_scores

        large = np.zeros(size, dtype=np.uint8)
        cv2.fillPoly(large, list(np.round(coarse[missed] * factor).astype(np.int32)), 1)
        centres = np.round(fine.mean(axis=1) * factor).astype(np.intp)
        np.clip(centres, 0, [size[1] - 1, size[0] - 1], out=centres)
        pieces = large[centres[:, 1], centres[:, 0]].astype(bool)
        return (
            np.concatenate([fine[~pieces], coarse[missed]]),
            np.concatenate([fine_scores[~pieces], coarse_scores[missed]]),
        )

    def _transform(
        self, img: Image.Image, max_resolution: int, canvases: Sequence[tuple[int, int]]
    ) -> tuple[ModelGraph, NDArray[Any], tuple[int, int]]:
        ratio = min(max_resolution / min(img.height, img.width), 1.0)
        content_h = max(self._round32(img.height * ratio), 32)
        content_w = max(self._round32(img.width * ratio), 32)
        canvas = self._canvas(canvases, content_h, content_w)
        session = self.session.for_shape(Shape(batch=1, height=canvas[0], width=canvas[1]))
        # a compiled canvas may be smaller than the image was sized for, so it shrinks again
        scale = min(canvas[0] / content_h, canvas[1] / content_w, 1.0)
        content_h = min(max(self._round32(content_h * scale), 32), canvas[0])
        content_w = min(max(self._round32(content_w * scale), 32), canvas[1])
        resized = img.resize((content_w, content_h), resample=Image.Resampling.LANCZOS)
        if resized.mode != "RGB":
            resized = resized.convert("RGB")
        content = (content_h, content_w)
        if not self._fixed():  # a graph that takes any size is fed the content alone
            canvas = content
        return session, self._feed(session, np.asarray(resized), canvas), content

    def _feed(self, session: ModelGraph, array: NDArray[np.uint8], canvas: tuple[int, int]) -> NDArray[Any]:
        """`array` in the corner of `canvas`, in the form the graph takes it."""
        content_h, content_w = array.shape[:2]
        height, width = canvas
        if session.normalizes_input:
            if canvas == (content_h, content_w):
                return np.ascontiguousarray(array[None])  # a tile is a view into the rows of the image
            image = np.zeros((1, height, width, 3), dtype=np.uint8)  # what is left of the canvas stays black
            image[0, :content_h, :content_w] = array
            return image
        # reverse plane order gets the BGR swap and the CHW transpose for free
        out = np.empty((1, 3, height, width), dtype=np.float32)
        if canvas != (content_h, content_w):  # -1.0 is what the graph would have made of a black pixel
            out[0, :, content_h:] = -1.0
            out[0, :, :content_h, content_w:] = -1.0
        for channel in range(3):
            plane = out[0, 2 - channel, :content_h, :content_w]
            np.multiply(array[:, :, channel], self.scale, out=plane)
            plane -= 1.0
        return out

    def _probs(self, session: ModelGraph, image: NDArray[Any]) -> NDArray[np.float32]:
        feed = {session.get_inputs()[0].name: image}
        outputs = session.run(None, feed) if self._releasing is None else session.run(None, feed, self._releasing)
        probs = widen(outputs[0][0])
        return probs[0] if probs.ndim == 3 else probs

    @cached_property
    def _releasing(self) -> Any:
        """Every canvas is a graph with an arena of its own, which would keep its largest run as long as it is open."""
        return self.session.releasing if isinstance(self.session, OrtSession) else None

    def _tile_sizes(self) -> list[int]:
        """The short sides there are canvases for, each a size of tile."""
        return sorted({min(canvas) for canvas in self._canvases()})

    def _fixed(self) -> bool:
        return bool(self._sizes(self.session.shapes))

    def _canvases(self) -> list[tuple[int, int]]:
        """The canvases there are graphs for, or for a graph that takes any size, those the tiles would compile to."""
        return self._sizes(self.session.shapes) or self._sizes(self.shape_policy.dims)

    @staticmethod
    def _sizes(shapes: Sequence[Shape]) -> list[tuple[int, int]]:
        return [(shape.height, shape.width) for shape in shapes if shape.height and shape.width]

    @staticmethod
    def _starts(length: int, tile: int, overlap: int) -> list[int]:
        """Where tiles of `tile` start to cover `length`, evenly spaced and overlapping by `overlap` or more."""
        if length <= tile:
            return [0]
        count = math.ceil((length - overlap) / (tile - overlap))
        return [round(index * (length - tile) / (count - 1)) for index in range(count)]

    @staticmethod
    def _ramps(starts: Sequence[int], tile: int) -> list[NDArray[np.float32]]:
        """Each tile's weight along one axis: rising across its overlap with the tile before and falling across the one
        after, so a seam is read from whichever tile sees more around it, and an image edge at full weight."""
        positions = np.arange(tile, dtype=np.float32) + 0.5
        ramps = []
        for index, start in enumerate(starts):
            ramp = np.ones(tile, dtype=np.float32)
            if index > 0:
                np.minimum(ramp, positions / (starts[index - 1] + tile - start), out=ramp)
            if index < len(starts) - 1:
                np.minimum(ramp, (tile - positions) / (start + tile - starts[index + 1]), out=ramp)
            ramps.append(ramp)
        return ramps

    @staticmethod
    def _coverage(starts: Sequence[int], ramps: Sequence[NDArray[np.float32]], length: int) -> NDArray[np.float32]:
        total = np.zeros(length, dtype=np.float32)
        for start, ramp in zip(starts, ramps):
            total[start : start + len(ramp)] += ramp
        return total

    @staticmethod
    def _canvas(canvases: Sequence[tuple[int, int]], height: int, width: int) -> tuple[int, int]:
        return min(
            canvases,
            key=lambda canvas: (-min(canvas[0] / height, canvas[1] / width, 1.0), canvas[0] * canvas[1]),
            default=(height, width),
        )

    @staticmethod
    def _canvas_size(max_resolution: int) -> int:
        # the graph only takes sides divisible by 32; up, so the short side _transform rounds to always fits
        return math.ceil(max_resolution / 32) * 32

    @staticmethod
    def _round32(value: float) -> int:
        return int(round(value / 32) * 32)

    @staticmethod
    def _ceil32(value: int) -> int:
        return -(-value // 32) * 32

    def reading_order(self, boxes: NDArray[np.float32]) -> NDArray[np.intp]:
        """Indices of `boxes` top to bottom, then left to right within a line."""
        y_order = np.argsort(boxes[:, 0, 1], kind="stable")
        lines = np.zeros(len(boxes), dtype=np.int32)  # indexed in y-sorted order, not box order
        np.cumsum(np.diff(boxes[y_order, 0, 1]) >= 10, out=lines[1:])  # ascending, so the diffs are already positive
        order: NDArray[np.intp] = y_order[np.argsort(lines * 1e6 + boxes[y_order, 0, 0], kind="stable")]
        return order
