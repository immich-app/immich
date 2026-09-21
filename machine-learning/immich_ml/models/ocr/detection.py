from collections.abc import Sequence
from typing import Any

import numpy as np
from immich_model.constants import ocr_canvases
from numpy.typing import NDArray
from PIL import Image

from immich_ml.schemas import ModelGraph, ModelTask, ModelType, Shape
from immich_ml.sessions.policy import ShapePolicy

from .legacy import TextModel
from .postprocess import DBPostProcess
from .schemas import TextDetectionOutput


class TextDetector(TextModel):
    depends = []
    identity = (ModelType.DETECTION, ModelTask.OCR)
    graph_options = ("maxResolution",)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs)
        short_side = model_kwargs.get("maxResolution", 736)
        # RKNPU ships a binary per short side, which the label picks
        canvases = tuple(Shape(batch=1, **canvas) for canvas in ocr_canvases(short_side))
        self.shape_policy = ShapePolicy(dims=canvases, label=f"res{short_side}")
        self.scale = np.float32(1.0 / 127.5)  # (x/255 - 0.5) / 0.5
        self._empty: TextDetectionOutput = {
            "boxes": np.empty(0, dtype=np.float32),
            "scores": np.empty(0, dtype=np.float32),
        }
        self.postprocess = DBPostProcess(thresh=0.3, max_candidates=1000, unclip_ratio=1.6, use_dilation=True)

    def _predict(
        self, inputs: Image.Image, maxResolution: int = 736, minScore: float = 0.5, scoreMode: str = "fast"
    ) -> TextDetectionOutput:
        width, height = inputs.size
        if width < 32 or height < 32:
            return self._empty

        session, image, content = self._transform(inputs, maxResolution)
        probs = session.run(None, {session.get_inputs()[0].name: image})[0][0]
        if probs.ndim == 3:
            probs = probs[0]
        boxes, scores = self.postprocess(probs[: content[0], : content[1]], (height, width), minScore, scoreMode)
        if len(boxes) == 0:
            return self._empty
        order = self.reading_order(boxes)
        return {"boxes": boxes[order], "scores": scores[order]}

    def _transform(self, img: Image.Image, max_resolution: int) -> tuple[ModelGraph, NDArray[Any], tuple[int, int]]:
        ratio = min(max_resolution / min(img.height, img.width), 1.0)
        content_h = max(self._round32(img.height * ratio), 32)
        content_w = max(self._round32(img.width * ratio), 32)
        canvas = self._canvas(self.session.shapes, content_h, content_w)
        session = self.session.for_shape(Shape(batch=1, height=canvas[0], width=canvas[1]))
        # a compiled canvas may be smaller than the image was sized for, so it shrinks again
        scale = min(canvas[0] / content_h, canvas[1] / content_w, 1.0)
        content_h = min(max(self._round32(content_h * scale), 32), canvas[0])
        content_w = min(max(self._round32(content_w * scale), 32), canvas[1])
        resized = img.resize((content_w, content_h), resample=Image.Resampling.LANCZOS)
        if resized.mode != "RGB":
            resized = resized.convert("RGB")
        array = np.asarray(resized)
        content = (content_h, content_w)
        height, width = canvas
        if session.normalizes_input:
            if canvas == content:
                return session, array[None], content
            image = np.zeros((1, height, width, 3), dtype=np.uint8)  # what is left of the canvas stays black
            image[0, :content_h, :content_w] = array
            return session, image, content
        # reverse plane order gets the BGR swap and the CHW transpose for free
        out = np.empty((1, 3, height, width), dtype=np.float32)
        if canvas != content:  # -1.0 is what the graph would have made of a black pixel
            out[0, :, content_h:] = -1.0
            out[0, :, :content_h, content_w:] = -1.0
        for channel in range(3):
            plane = out[0, 2 - channel, :content_h, :content_w]
            np.multiply(array[:, :, channel], self.scale, out=plane)
            plane -= 1.0
        return session, out, content

    @staticmethod
    def _canvas(shapes: Sequence[Shape], height: int, width: int) -> tuple[int, int]:
        return min(
            ((shape.height, shape.width) for shape in shapes if shape.height and shape.width),
            key=lambda canvas: (-min(canvas[0] / height, canvas[1] / width, 1.0), canvas[0] * canvas[1]),
            default=(height, width),
        )

    @staticmethod
    def _round32(value: float) -> int:
        return int(round(value / 32) * 32)

    def reading_order(self, boxes: NDArray[np.float32]) -> NDArray[np.intp]:
        """Indices of `boxes` top to bottom, then left to right within a line."""
        y_order = np.argsort(boxes[:, 0, 1], kind="stable")
        lines = np.zeros(len(boxes), dtype=np.int32)  # indexed in y-sorted order, not box order
        np.cumsum(np.diff(boxes[y_order, 0, 1]) >= 10, out=lines[1:])  # ascending, so the diffs are already positive
        order: NDArray[np.intp] = y_order[np.argsort(lines * 1e6 + boxes[y_order, 0, 0], kind="stable")]
        return order
