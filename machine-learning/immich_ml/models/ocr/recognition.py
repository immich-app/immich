import math
from bisect import bisect_left
from typing import Any

import cv2
import numpy as np
from immich_model.constants import OCR_RECOGNITION_WIDTHS
from numpy.typing import NDArray
from PIL import Image

from immich_ml.config import settings
from immich_ml.schemas import ModelGraph, ModelSession, ModelTask, ModelType, Shape
from immich_ml.sessions.policy import ShapePolicy, batches, runs

from .ctc import GREEDY, CtcDecoder, probabilities
from .legacy import TextModel
from .schemas import TextDetectionOutput, TextRecognitionOutput

REC_HEIGHT = 48
SCALE = np.float32(1.0 / 127.5)


class TextRecognizer(TextModel):
    depends = [(ModelType.DETECTION, ModelTask.OCR)]
    identity = (ModelType.RECOGNITION, ModelTask.OCR)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        self._empty: TextRecognitionOutput = {
            "box": np.empty(0, dtype=np.float32),
            "boxScore": np.empty(0, dtype=np.float32),
            "text": [],
            "textScore": np.empty(0, dtype=np.float32),
        }
        super().__init__(model_name, **model_kwargs)
        self.decoder: CtcDecoder | None = None
        sizes = batches(settings.max_batch_size.ocr)
        self.shape_policy = ShapePolicy(
            dims=tuple(Shape(batch, width=width) for width in OCR_RECOGNITION_WIDTHS for batch in sizes)
        )

    def _load(self) -> ModelSession:
        session = super()._load()
        # the widths it was compiled for, narrowest first: none where it takes any
        self.widths = tuple(sorted({shape.width for shape in session.shapes if shape.width is not None}))
        return session

    def _decoder(self, session: ModelGraph) -> CtcDecoder:
        character = session.get_metadata().get("character")
        greedy = GREEDY.get(session.get_outputs()[0].name, probabilities)
        return (
            CtcDecoder(character.splitlines(), greedy)
            if character is not None
            else CtcDecoder.from_file(self.model_dir / "charset.txt", greedy)
        )

    def _predict(self, img: Image.Image, texts: TextDetectionOutput, minScore: float = 0.9) -> TextRecognitionOutput:
        boxes, box_scores = texts["boxes"], texts["scores"]
        if boxes.shape[0] == 0:
            return self._empty

        widths, heights, coeffs = self._crop_geometry(boxes)
        upright = heights * 2 >= widths * 3  # PP-OCR stands a crop up when it is 1.5x taller than it is wide
        ratios = np.where(upright, heights / widths, widths / heights)
        order = np.argsort(ratios)  # group similar widths so each batch pads the least it can

        text_list: list[str] = [""] * len(order)
        score_list = np.zeros(len(order), dtype=np.float32)
        sized = runs(len(order), self.session.batches)
        bounds = [sum(sized[:index]) for index in range(len(sized))]
        chunked = [order[start : start + size] for start, size in zip(bounds, sized)]
        batch_widths = [self._width(int(REC_HEIGHT * ratios[chunk[-1]])) for chunk in chunked]
        graphs = [self.session.for_shape(Shape(len(chunk), width=width)) for chunk, width in zip(chunked, batch_widths)]
        raw = graphs[0].normalizes_input
        # one buffer per request, sized for the largest batch and reshaped for each
        sizes = [len(chunk) * REC_HEIGHT * width * 3 for chunk, width in zip(chunked, batch_widths)]
        buffer = np.empty(max(sizes), dtype=np.uint8 if raw else np.float32)
        for chunk, width, size, session in zip(chunked, batch_widths, sizes, graphs):
            shape = (len(chunk), REC_HEIGHT, width, 3) if raw else (len(chunk), 3, REC_HEIGHT, width)
            images: NDArray[Any] = buffer[:size].reshape(shape)
            for i, index in enumerate(chunk):
                crop = self._crop(img, coeffs[index], widths[index], heights[index], upright[index])
                resized_w = max(1, min(width, math.ceil(REC_HEIGHT * ratios[index])))
                if raw:
                    cv2.resize(crop, (resized_w, REC_HEIGHT), dst=images[i, :, :resized_w])
                    images[i, :, resized_w:] = 127  # the pad the crop is read against, over whatever was there
                    continue
                resized = cv2.resize(crop, (resized_w, REC_HEIGHT))
                view = images[i, :, :, :resized_w]
                np.multiply(resized.transpose(2, 0, 1)[::-1], SCALE, out=view)  # [::-1] is the RGB -> BGR swap
                view -= 1.0
                images[i, :, :, resized_w:] = 0

            outputs = session.run(None, {session.get_inputs()[0].name: images})
            if self.decoder is None:
                self.decoder = self._decoder(session)
            chunk_texts, chunk_scores = self.decoder(outputs)
            for index, text, score in zip(chunk, chunk_texts, chunk_scores):
                text_list[index] = text
                score_list[index] = score

        boxes[:, :, 0] /= img.width
        boxes[:, :, 1] /= img.height

        valid = score_list > minScore
        valid_list = valid.tolist()
        return {
            "box": boxes.reshape(-1, 8)[valid].reshape(-1),
            "text": [text for text, keep in zip(text_list, valid_list) if keep],
            "boxScore": box_scores[valid],
            "textScore": score_list[valid],
        }

    def _width(self, width: int) -> int:
        if not self.widths:  # room past the text in proportion to it, as the recognizer reads a line worse without
            return min(OCR_RECOGNITION_WIDTHS[-1], max(OCR_RECOGNITION_WIDTHS[0], math.ceil(width * 1.25)))
        return self.widths[min(bisect_left(self.widths, width), len(self.widths) - 1)]

    def _crop_geometry(
        self, boxes: NDArray[np.float32]
    ) -> tuple[NDArray[np.int32], NDArray[np.int32], NDArray[np.float32]]:
        """Upright crop size for each box, and the perspective coefficients that map the box onto it."""
        widths = np.maximum(
            np.linalg.norm(boxes[:, 1] - boxes[:, 0], axis=1), np.linalg.norm(boxes[:, 2] - boxes[:, 3], axis=1)
        ).astype(np.int32)
        heights = np.maximum(
            np.linalg.norm(boxes[:, 0] - boxes[:, 3], axis=1), np.linalg.norm(boxes[:, 1] - boxes[:, 2], axis=1)
        ).astype(np.int32)
        pts_std = np.zeros((len(boxes), 4, 2), dtype=np.float32)
        pts_std[:, 1:3, 0] = widths[:, None]
        pts_std[:, 2:4, 1] = heights[:, None]
        return widths, heights, self._get_perspective_transform(pts_std, boxes)

    def _crop(
        self, img: Image.Image, coeffs: NDArray[np.float32], width: int, height: int, upright: bool
    ) -> NDArray[np.uint8]:
        crop = img.transform(
            size=(width, height),
            method=Image.Transform.PERSPECTIVE,
            data=coeffs.tolist(),
            resample=Image.Resampling.BICUBIC,
        )
        return np.asarray(crop.rotate(90, expand=True) if upright else crop)

    def _get_perspective_transform(self, src: NDArray[np.float32], dst: NDArray[np.float32]) -> NDArray[np.float32]:
        N = src.shape[0]
        x, y = src[:, :, 0], src[:, :, 1]
        u, v = dst[:, :, 0], dst[:, :, 1]
        A = np.zeros((N, 8, 8), dtype=np.float32)
        b = np.empty((N, 8, 1), dtype=np.float32)

        # even rows [x, y, 1, 0, 0, 0, -u*x, -u*y] = u; odd [0, 0, 0, x, y, 1, -v*x, -v*y] = v
        A[:, ::2, 0] = x
        A[:, ::2, 1] = y
        A[:, ::2, 2] = 1
        A[:, ::2, 6] = -u * x
        A[:, ::2, 7] = -u * y
        b[:, ::2, 0] = u

        A[:, 1::2, 3] = x
        A[:, 1::2, 4] = y
        A[:, 1::2, 5] = 1
        A[:, 1::2, 6] = -v * x
        A[:, 1::2, 7] = -v * y
        b[:, 1::2, 0] = v

        # h22 is fixed at 1, so this is a determined system rather than a null space
        coeffs: NDArray[np.float32] = np.linalg.solve(A, b)[:, :, 0]
        return coeffs
