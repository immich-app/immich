"""
Host-side geometry for the fused face models.

The decode, NMS and Umeyama similarity are ports of insightface (Apache-2.0, https://github.com/deepinsight/insightface)
"""

from functools import lru_cache

import cv2
import numpy as np
from numpy.typing import NDArray

from immich_ml.models.transforms import ensure_dims

DET_SIZE = 640
ALIGNED_SIZE = 112

# the FPN levels for which the fused detector emits a (scores, boxes, kps) triple,
# and the anchors each feature-map cell carries, laid out anchor-major
DET_STRIDES = (8, 16, 32)
ANCHORS_PER_CELL = 2

# canonical ArcFace 5-point template for a 112x112 crop
ARCFACE_DST = np.array(
    [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]],
    dtype=np.float32,
)


@lru_cache(maxsize=len(DET_STRIDES))
def _anchor_centers(size: int, stride: int) -> NDArray[np.float32]:
    ys, xs = np.mgrid[: size // stride, : size // stride]
    centers = np.stack([xs, ys], axis=-1, dtype=np.float32).reshape(-1, 2) * stride
    return np.repeat(centers, ANCHORS_PER_CELL, axis=0)


def decode_scrfd(
    heads: list[NDArray[np.float32]], size: int = DET_SIZE
) -> tuple[NDArray[np.float32], NDArray[np.float32], NDArray[np.float32]]:
    heads = [ensure_dims(head, 4) for head in heads]
    scores, boxes, kps = [], [], []
    for level, stride in enumerate(DET_STRIDES):
        centers = _anchor_centers(size, stride)
        distance = heads[level + len(DET_STRIDES)][0] * stride
        offsets = heads[level + 2 * len(DET_STRIDES)][0] * stride
        scores.append(heads[level][0].squeeze(-1))
        boxes.append(np.concatenate([centers[None] - distance[:, :, :2], centers[None] + distance[:, :, 2:]], axis=2))
        kps.append(np.tile(centers, offsets.shape[2] // 2) + offsets)

    return np.concatenate(scores, axis=1), np.concatenate(boxes, axis=1), np.concatenate(kps, axis=1)


def nms(boxes: NDArray[np.float32], scores: NDArray[np.float32], threshold: float = 0.4) -> NDArray[np.intp]:
    wh = np.column_stack([boxes[:, 0], boxes[:, 1], boxes[:, 2] - boxes[:, 0], boxes[:, 3] - boxes[:, 1]])
    keep = cv2.dnn.NMSBoxes(wh.tolist(), scores.tolist(), 0.0, threshold)  # NMSBoxes treats the inputs as Sequences
    return np.asarray(keep, dtype=np.intp).reshape(-1)


def umeyama(src: NDArray[np.float32], dst: NDArray[np.float32]) -> NDArray[np.float32]:
    src_mean, dst_mean = src.mean(0), dst.mean(0)
    src_c, dst_c = src - src_mean, dst - dst_mean
    cov = dst_c.T @ src_c / len(src)
    u, s, vt = np.linalg.svd(cov)
    d = np.sign(np.linalg.det(u @ vt))
    diag = np.diag([1.0, d])
    rotation = u @ diag @ vt
    scale = np.trace(np.diag(s) @ diag) / (src_c**2).sum() * len(src)
    translation = dst_mean - scale * rotation @ src_mean
    return np.hstack([scale * rotation, translation[:, None]], dtype=np.float32)


def align_face(image: NDArray[np.uint8], kps: NDArray[np.float32]) -> NDArray[np.float32]:
    matrix = umeyama(kps, ARCFACE_DST)
    return cv2.warpAffine(image, matrix, (ALIGNED_SIZE, ALIGNED_SIZE)).astype(np.float32)
