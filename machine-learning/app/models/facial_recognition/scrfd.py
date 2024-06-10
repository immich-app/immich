# Based on InsightFace-REST by SthPhoenix https://github.com/SthPhoenix/InsightFace-REST/blob/master/src/api_trt/modules/model_zoo/detectors/scrfd.py
# Primary changes made:
# 1. Removed CuPy-related code
# 2. Adapted proposal generation to be thread-safe
# 3. Added typing
# 4. Assume RGB input
# 5. Removed unused variables

# Copyright 2021 SthPhoenix

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# -*- coding: utf-8 -*-
# Based on Jia Guo reference implementation at
# https://github.com/deepinsight/insightface/blob/master/detection/scrfd/tools/scrfd.py


from __future__ import division

import cv2
import numpy as np
from numba import njit
from app.schemas import ModelSession
from numpy.typing import NDArray


@njit(cache=True, nogil=True)
def nms(dets, threshold: float = 0.4) -> NDArray[np.float32]:
    x1 = dets[:, 0]
    y1 = dets[:, 1]
    x2 = dets[:, 2]
    y2 = dets[:, 3]
    scores = dets[:, 4]

    areas = (x2 - x1 + 1) * (y2 - y1 + 1)
    order = scores.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])

        w = np.maximum(0.0, xx2 - xx1 + 1)
        h = np.maximum(0.0, yy2 - yy1 + 1)
        inter = w * h
        ovr = inter / (areas[i] + areas[order[1:]] - inter)

        inds = np.where(ovr <= threshold)[0]
        order = order[inds + 1]

    return np.asarray(keep)


@njit(fastmath=True, cache=True, nogil=True)
def single_distance2bbox(point: NDArray[np.float32], distance: NDArray[np.float32], stride: int) -> NDArray[np.float32]:
    """
    Fast conversion of single bbox distances to coordinates

    :param point: Anchor point
    :param distance: Bbox distances from anchor point
    :param stride: Current stride scale
    :return: bbox
    """
    distance[0] = point[0] - distance[0] * stride
    distance[1] = point[1] - distance[1] * stride
    distance[2] = point[0] + distance[2] * stride
    distance[3] = point[1] + distance[3] * stride
    return distance


@njit(fastmath=True, cache=True, nogil=True)
def single_distance2kps(point: NDArray[np.float32], distance: NDArray[np.float32], stride: int) -> NDArray[np.float32]:
    """
    Fast conversion of single keypoint distances to coordinates

    :param point: Anchor point
    :param distance: Keypoint distances from anchor point
    :param stride: Current stride scale
    :return: keypoint
    """
    for ix in range(0, distance.shape[0], 2):
        distance[ix] = distance[ix] * stride + point[0]
        distance[ix + 1] = distance[ix + 1] * stride + point[1]
    return distance


@njit(fastmath=True, cache=True, nogil=True)
def generate_proposals(
    score_blob: NDArray[np.float32],
    bbox_blob: NDArray[np.float32],
    kpss_blob: NDArray[np.float32],
    stride: int,
    anchors: NDArray[np.float32],
    threshold: float,
) -> tuple[NDArray[np.float32], NDArray[np.float32], NDArray[np.float32]]:
    """
    Convert distances from anchors to actual coordinates on source image
    and filter proposals by confidence threshold.

    :param score_blob: Raw scores for stride
    :param bbox_blob: Raw bbox distances for stride
    :param kpss_blob: Raw keypoints distances for stride
    :param stride: Stride scale
    :param anchors: Precomputed anchors for stride
    :param threshold: Confidence threshold
    :return: Filtered scores, bboxes and keypoints
    """

    idxs = []
    for ix in range(score_blob.shape[0]):
        if score_blob[ix][0] > threshold:
            idxs.append(ix)

    score_out = np.empty((len(idxs), 1), dtype="float32")
    bbox_out = np.empty((len(idxs), 4), dtype="float32")
    kpss_out = np.empty((len(idxs), 10), dtype="float32")

    for i in range(len(idxs)):
        ix = idxs[i]
        score_out[i] = score_blob[ix]
        bbox_out[i] = single_distance2bbox(anchors[ix], bbox_blob[ix], stride)
        kpss_out[i] = single_distance2kps(anchors[ix], kpss_blob[ix], stride)

    return score_out, bbox_out, kpss_out


@njit(fastmath=True, cache=True, nogil=True)
def filter(
    bboxes_list: NDArray[np.float32],
    kpss_list: NDArray[np.float32],
    scores_list: NDArray[np.float32],
    nms_threshold: float = 0.4,
) -> tuple[NDArray[np.float32], NDArray[np.float32]]:
    """
    Filter postprocessed network outputs with NMS

    :param bboxes_list: List of bboxes (np.ndarray)
    :param kpss_list: List of keypoints (np.ndarray)
    :param scores_list: List of scores (np.ndarray)
    :return: Face bboxes with scores [t,l,b,r,score], and key points
    """

    pre_det = np.hstack((bboxes_list, scores_list))
    keep = nms(pre_det, threshold=nms_threshold)
    det = pre_det[keep, :]
    kpss = kpss_list[keep, :]
    kpss = kpss.reshape((kpss.shape[0], -1, 2))

    return det, kpss


class SCRFD:
    def __init__(self, session: ModelSession):
        self.session = session
        self.center_cache: dict[tuple[int, int], NDArray[np.float32]] = {}
        self.nms_threshold = 0.4
        self.fmc = 3
        self._feat_stride_fpn = [8, 16, 32]
        self._num_anchors = 2

    def prepare(self, nms_threshold: float = 0.4) -> None:
        """
        Populate class parameters

        :param nms_threshold: Threshold for NMS IoU
        """

        self.nms_threshold = nms_threshold

    def detect(
        self, imgs: NDArray[np.uint8], threshold: float = 0.5
    ) -> tuple[list[NDArray[np.float32]], list[NDArray[np.float32]]]:
        """
        Run detection pipeline for provided images

        :param img: Raw image as nd.ndarray with HWC shape
        :param threshold: Confidence threshold
        :return: Face bboxes with scores [t,l,b,r,score], and key points
        """

        height, width = imgs.shape[1:3]
        blob = self._preprocess(imgs)
        net_outs = self._forward(blob)

        batch_bboxes, batch_kpss, batch_scores = self._postprocess(net_outs, height, width, threshold)

        dets_list = []
        kpss_list = []
        for e in range(imgs.shape[0]):
            if len(batch_bboxes[e]) == 0:
                det, kpss = np.zeros((0, 5), dtype="float32"), np.zeros((0, 10), dtype="float32")
            else:
                det, kpss = filter(batch_bboxes[e], batch_kpss[e], batch_scores[e], self.nms_threshold)

            dets_list.append(det)
            kpss_list.append(kpss)

        return dets_list, kpss_list

    @staticmethod
    def _build_anchors(
        input_height: int, input_width: int, strides: list[int], num_anchors: int
    ) -> NDArray[np.float32]:
        """
        Precompute anchor points for provided image size

        :param input_height: Input image height
        :param input_width: Input image width
        :param strides: Model strides
        :param num_anchors: Model num anchors
        :return: box centers
        """

        centers = []
        for stride in strides:
            height = input_height // stride
            width = input_width // stride

            anchor_centers = np.stack(np.mgrid[:height, :width][::-1], axis=-1).astype(np.float32)
            anchor_centers = (anchor_centers * stride).reshape((-1, 2))
            if num_anchors > 1:
                anchor_centers = np.stack([anchor_centers] * num_anchors, axis=1).reshape((-1, 2))
            centers.append(anchor_centers)
        return centers

    def _preprocess(self, images: NDArray[np.uint8]):
        """
        Normalize image on CPU if backend can't provide CUDA stream,
        otherwise preprocess image on GPU using CuPy

        :param img: Raw image as np.ndarray with HWC shape
        :return: Preprocessed image or None if image was processed on device
        """

        input_size = tuple(images[0].shape[0:2][::-1])
        return cv2.dnn.blobFromImages(images, 1.0 / 128, input_size, (127.5, 127.5, 127.5), swapRB=False)

    def _forward(self, blob: NDArray[np.float32]) -> list[NDArray[np.float32]]:
        """
        Send input data to inference backend.

        :param blob: Preprocessed image of shape NCHW or None
        :return: network outputs
        """

        return self.session.run(None, {"input.1": blob})

    def _postprocess(
        self, net_outs: list[NDArray[np.float32]], height: int, width: int, threshold: float
    ) -> tuple[list[NDArray[np.float32]], list[NDArray[np.float32]], list[NDArray[np.float32]]]:
        """
        Precompute anchor points for provided image size and process network outputs

        :param net_outs: Network outputs
        :param input_height: Input image height
        :param input_width: Input image width
        :param threshold: Confidence threshold
        :return: filtered bboxes, keypoints and scores
        """

        key = (height, width)

        if not self.center_cache.get(key):
            self.center_cache[key] = self._build_anchors(height, width, self._feat_stride_fpn, self._num_anchors)
        anchor_centers = self.center_cache[key]
        bboxes, kpss, scores = self._process_strides(net_outs, threshold, anchor_centers)
        return bboxes, kpss, scores

    def _process_strides(
        self, net_outs: list[NDArray[np.float32]], threshold: float, anchors: NDArray[np.float32]
    ) -> tuple[list[NDArray[np.float32]], list[NDArray[np.float32]], list[NDArray[np.float32]]]:
        """
        Process network outputs by strides and return results proposals filtered by threshold

        :param net_outs: Network outputs
        :param threshold: Confidence threshold
        :param anchor_centers: Precomputed anchor centers for all strides
        :return: filtered bboxes, keypoints and scores
        """

        batch_size = net_outs[0].shape[0]
        bboxes_by_img = []
        kpss_by_img = []
        scores_by_img = []

        for batch in range(batch_size):
            scores_strided = []
            bboxes_strided = []
            kpss_strided = []
            for idx, stride in enumerate(self._feat_stride_fpn):
                score_blob = net_outs[idx][batch]
                bbox_blob = net_outs[idx + self.fmc][batch]
                kpss_blob = net_outs[idx + self.fmc * 2][batch]
                stride_anchors = anchors[idx]
                score_list, bbox_list, kpss_list = generate_proposals(
                    score_blob,
                    bbox_blob,
                    kpss_blob,
                    stride,
                    stride_anchors,
                    threshold,
                )

                scores_strided.append(score_list)
                bboxes_strided.append(bbox_list)
                kpss_strided.append(kpss_list)
            bboxes_by_img.append(np.concatenate(bboxes_strided, axis=0))
            kpss_by_img.append(np.concatenate(kpss_strided, axis=0))
            scores_by_img.append(np.concatenate(scores_strided, axis=0))

        return bboxes_by_img, kpss_by_img, scores_by_img
