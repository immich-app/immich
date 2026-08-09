"""Vendored from RapidOCR (Apache-2.0, rapidocr/ch_ppocr_det/utils.py @ v3.4).

`__call__` takes one image's [H, W] probability map rather than the raw [B, 1, H, W], and
`unclip` computes the offset directly instead of via pyclipper/shapely.
"""

import cv2
import numpy as np


def order_points_clockwise(points: np.ndarray) -> np.ndarray:
    """Order each group of four points as top-left, top-right, bottom-right, bottom-left."""

    def by(axis: int, pts: np.ndarray) -> np.ndarray:
        return np.take_along_axis(pts, np.argsort(pts[..., axis], axis=-1)[..., None], axis=-2)

    x_sorted = by(0, points)
    left, right = by(1, x_sorted[..., :2, :]), by(1, x_sorted[..., 2:, :])
    return np.stack([left[..., 0, :], right[..., 0, :], right[..., 1, :], left[..., 1, :]], axis=-2).astype(np.float32)


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
        self.dilation_kernel = np.array([[1, 1], [1, 1]]) if use_dilation else None

    def __call__(
        self, probs: np.ndarray, ori_shape: tuple[int, int], box_thresh: float, score_mode: str = "fast"
    ) -> tuple[np.ndarray, np.ndarray]:
        mask = probs > self.thresh
        if self.dilation_kernel is not None:
            mask = cv2.dilate(mask.astype(np.uint8), self.dilation_kernel)
        boxes, scores = self.boxes_from_bitmap(probs, mask, ori_shape[1], ori_shape[0], box_thresh, score_mode)
        return self.filter_det_res(boxes, scores, ori_shape[0], ori_shape[1])

    def boxes_from_bitmap(
        self,
        pred: np.ndarray,
        bitmap: np.ndarray,
        dest_width: int,
        dest_height: int,
        box_thresh: float,
        score_mode: str,
    ) -> tuple[np.ndarray, np.ndarray]:
        height, width = bitmap.shape
        contours, _ = cv2.findContours(bitmap.astype(np.uint8, copy=False), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        boxes, scores = [], []
        for contour in contours[: self.max_candidates]:
            points, sside = self.get_mini_boxes(contour)
            if sside < self.min_size:
                continue

            score = self.box_score(pred, points if score_mode == "fast" else contour)
            if box_thresh > score:
                continue

            box, sside = self.get_mini_boxes(self.unclip(points))
            if sside < self.min_size + 2:
                continue

            boxes.append(box)
            scores.append(score)

        if not boxes:
            return np.empty((0, 4, 2), dtype=np.int32), np.empty(0, dtype=np.float32)
        scaled = np.stack(boxes) * [dest_width / width, dest_height / height]
        np.clip(np.round(scaled, out=scaled), 0, [dest_width, dest_height], out=scaled)
        return scaled.astype(np.int32), np.array(scores, dtype=np.float32)

    def get_mini_boxes(self, contour: np.ndarray) -> tuple[np.ndarray, float]:
        rect = cv2.minAreaRect(contour)
        return order_points_clockwise(cv2.boxPoints(rect)), min(rect[1])

    @staticmethod
    def box_score(probs: np.ndarray, poly: np.ndarray) -> float:
        """Mean probability inside `poly`: the min-area rect for "fast", the contour for "slow"."""
        h, w = probs.shape[:2]
        poly = poly.reshape(-1, 2).copy()
        xmin, xmax = np.clip([np.floor(poly[:, 0].min()), np.ceil(poly[:, 0].max())], 0, w - 1).astype(np.int32)
        ymin, ymax = np.clip([np.floor(poly[:, 1].min()), np.ceil(poly[:, 1].max())], 0, h - 1).astype(np.int32)

        mask = np.zeros((ymax - ymin + 1, xmax - xmin + 1), dtype=np.uint8)
        poly -= np.array([xmin, ymin], dtype=poly.dtype)
        cv2.fillPoly(mask, poly.reshape(1, -1, 2).astype(np.int32), 1)  # type: ignore[call-overload]
        return cv2.mean(probs[ymin : ymax + 1, xmin : xmax + 1], mask)[0]

    def unclip(self, box: np.ndarray) -> np.ndarray:
        """Grow the 4-point rect from `get_mini_boxes` by area * unclip_ratio / perimeter.

        Offsetting a rectangle is just that rectangle grown along its own axes, and the caller
        re-fits a min-area rect anyway, so pyclipper's round joins would be discarded.
        """
        points = box.reshape(-1, 2).astype(np.float32)
        following = np.roll(points, -1, axis=0)
        edges = following - points
        lengths = np.linalg.norm(edges, axis=1)
        area = 0.5 * abs(float((points[:, 0] * following[:, 1] - following[:, 0] * points[:, 1]).sum()))
        perimeter = float(lengths.sum())
        if perimeter <= 0:
            return box

        wide, tall = edges[:2] / np.maximum(lengths[:2, None], 1e-6)
        offsets = np.stack([-wide - tall, wide - tall, wide + tall, -wide + tall])  # tl, tr, br, bl
        return (points + area * self.unclip_ratio / perimeter * offsets).reshape((-1, 1, 2))

    def filter_det_res(
        self, dt_boxes: np.ndarray, scores: np.ndarray, img_height: int, img_width: int
    ) -> tuple[np.ndarray, np.ndarray]:
        if len(dt_boxes) == 0:
            return dt_boxes, scores

        boxes = order_points_clockwise(dt_boxes)
        np.clip(boxes, 0, [img_width - 1, img_height - 1], out=boxes)
        boxes = boxes.astype(np.int32).astype(np.float32)
        keep = (np.linalg.norm(boxes[:, 0] - boxes[:, 1], axis=1).astype(np.int32) > 3) & (
            np.linalg.norm(boxes[:, 0] - boxes[:, 3], axis=1).astype(np.int32) > 3
        )
        return boxes[keep], scores[keep]
