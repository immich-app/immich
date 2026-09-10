"""Vendored from RapidOCR (Apache-2.0, rapidocr/ch_ppocr_det/utils.py @ v3.4).

`__call__` takes one image's [H, W] probability map rather than the raw [B, 1, H, W], and
`unclip` grows the min-area rect directly instead of offsetting a polygon via pyclipper/shapely.
"""

import math

import cv2
import numpy as np
from numpy.typing import NDArray


def order_points_clockwise(points: NDArray[np.float32]) -> NDArray[np.float32]:
    """Order each group of four points as top-left, top-right, bottom-right, bottom-left."""
    by_x = np.take_along_axis(points, np.argsort(points[..., 0], axis=-1)[..., None], axis=-2)
    pairs = by_x.reshape(*points.shape[:-2], 2, 2, 2)  # [left, right][member][xy]
    first, second = pairs[..., 0, :], pairs[..., 1, :]
    swap = (first[..., 1] > second[..., 1])[..., None]  # sorting two points by y is one comparison
    top, bottom = np.where(swap, second, first), np.where(swap, first, second)
    return np.concatenate([top, bottom[..., ::-1, :]], axis=-2)


def _span(values: cv2.typing.MatLike, limit: int) -> tuple[int, int]:
    lo, hi = math.floor(values.min()), math.ceil(values.max())
    return min(max(lo, 0), limit - 1), min(max(hi, 0), limit - 1)


class DBPostProcess:
    """The post process for Differentiable Binarization (DB)."""

    def __init__(
        self,
        thresh: float = 0.3,
        max_candidates: int = 1000,
        unclip_ratio: float = 2.0,
        use_dilation: bool = False,
    ):
        self.thresh = thresh
        self.max_candidates = max_candidates
        self.unclip_ratio = unclip_ratio
        self.min_size = 3
        self.dilation_kernel = np.ones((2, 2), dtype=np.uint8) if use_dilation else None

    def __call__(
        self, probs: NDArray[np.float32], ori_shape: tuple[int, int], box_thresh: float, score_mode: str = "fast"
    ) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        mask: NDArray[np.uint8] = (probs > self.thresh).view(np.uint8)  # bool is already 0/1 bytes, so this is free
        if self.dilation_kernel is not None:
            cv2.dilate(mask, self.dilation_kernel, dst=mask)  # OpenCV buffers rows, so this needs no second image
        boxes, scores = self.boxes_from_bitmap(probs, mask, ori_shape[1], ori_shape[0], box_thresh, score_mode)
        return self.filter_det_res(boxes, scores, ori_shape[0], ori_shape[1])

    def boxes_from_bitmap(
        self,
        pred: NDArray[np.float32],
        bitmap: NDArray[np.uint8],
        dest_width: int,
        dest_height: int,
        box_thresh: float,
        score_mode: str,
    ) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        height, width = bitmap.shape
        contours, _ = cv2.findContours(bitmap, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        boxes, scores = [], []
        for contour in contours[: self.max_candidates]:
            rect = cv2.minAreaRect(contour)
            if min(rect[1]) < self.min_size:
                continue

            score = self.box_score(pred, cv2.boxPoints(rect) if score_mode == "fast" else contour)
            if box_thresh > score:
                continue

            box, sside = self.unclip(rect)
            if sside < self.min_size + 2:
                continue

            boxes.append(box)
            scores.append(score)

        if not boxes:
            return np.empty((0, 4, 2), dtype=np.float32), np.empty(0, dtype=np.float32)
        scaled = np.stack(boxes)
        scaled *= [dest_width / width, dest_height / height]  # in place, or the list would promote to float64
        np.clip(np.round(scaled, out=scaled), 0, [dest_width, dest_height], out=scaled)
        return scaled, np.array(scores, dtype=np.float32)

    @staticmethod
    def box_score(probs: NDArray[np.float32], poly: cv2.typing.MatLike) -> float:
        """Mean probability inside `poly`: the min-area rect for "fast", the contour for "slow"."""
        h, w = probs.shape[:2]
        xs, ys = poly.reshape(-1, 2).T
        xmin, xmax = _span(xs, w)
        ymin, ymax = _span(ys, h)

        mask = np.zeros((ymax - ymin + 1, xmax - xmin + 1), dtype=np.uint8)
        points = poly.reshape(1, -1, 2).astype(np.int32, copy=False)  # read-only, so aliasing a contour is fine
        cv2.fillPoly(mask, points, 1, offset=(-xmin, -ymin))  # type: ignore[call-overload]
        return cv2.mean(probs[ymin : ymax + 1, xmin : xmax + 1], mask)[0]

    def unclip(self, rect: cv2.typing.RotatedRect) -> tuple[NDArray[np.float32], float]:
        width, height = rect[1]
        grow = width * height * self.unclip_ratio / (width + height)
        points = cv2.boxPoints((rect[0], (width + grow, height + grow), rect[2])).astype(np.float32, copy=False)
        return points, min(width, height) + grow

    def filter_det_res(
        self, dt_boxes: NDArray[np.float32], scores: NDArray[np.float32], img_height: int, img_width: int
    ) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
        if len(dt_boxes) == 0:
            return dt_boxes, scores

        boxes = order_points_clockwise(dt_boxes)
        np.clip(boxes, 0, [img_width - 1, img_height - 1], out=boxes)
        sides = boxes[:, 1:4:2] - boxes[:, :1]  # top edge and left edge
        np.square(sides, out=sides)
        keep = sides.sum(2).min(1) >= 16  # coordinates are whole numbers, so int(length) > 3 is length**2 >= 16
        return boxes[keep], scores[keep]
