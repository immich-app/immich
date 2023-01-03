# Copyright (c) 2021 PaddlePaddle Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from paddle_serving_server.web_service import WebService, Op

import logging
import numpy as np
import copy
import cv2
import base64
import json
# from paddle_serving_app.reader import OCRReader
from ocr_reader import OCRReader, DetResizeForTest, ArgsParser
from paddle_serving_app.reader import Sequential, ResizeByFactor
from paddle_serving_app.reader import Div, Normalize, Transpose
from paddle_serving_app.reader import DBPostProcess, FilterBoxes, GetRotateCropImage, SortedBoxes

_LOGGER = logging.getLogger()


class DetOp(Op):
    def init_op(self):
        self.det_preprocess = Sequential([
            DetResizeForTest(), Div(255),
            Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]), Transpose(
                (2, 0, 1))
        ])
        self.filter_func = FilterBoxes(10, 10)
        self.post_func = DBPostProcess({
            "thresh": 0.3,
            "box_thresh": 0.6,
            "max_candidates": 1000,
            "unclip_ratio": 1.5,
            "min_size": 3
        })

    def preprocess(self, input_dicts, data_id, log_id):
        (_, input_dict), = input_dicts.items()
        data = base64.b64decode(input_dict["image"].encode('utf8'))
        self.raw_im = data
        data = np.fromstring(data, np.uint8)
        # Note: class variables(self.var) can only be used in process op mode
        im = cv2.imdecode(data, cv2.IMREAD_COLOR)
        self.ori_h, self.ori_w, _ = im.shape
        det_img = self.det_preprocess(im)
        _, self.new_h, self.new_w = det_img.shape
        return {"x": det_img[np.newaxis, :].copy()}, False, None, ""

    def postprocess(self, input_dicts, fetch_dict, data_id, log_id):
        det_out = list(fetch_dict.values())[0]
        ratio_list = [
            float(self.new_h) / self.ori_h, float(self.new_w) / self.ori_w
        ]
        dt_boxes_list = self.post_func(det_out, [ratio_list])
        dt_boxes = self.filter_func(dt_boxes_list[0], [self.ori_h, self.ori_w])
        out_dict = {"dt_boxes": dt_boxes, "image": self.raw_im}
        return out_dict, None, ""


class RecOp(Op):
    def init_op(self):
        self.ocr_reader = OCRReader(
            char_dict_path="../../ppocr/utils/ppocr_keys_v1.txt")

        self.get_rotate_crop_image = GetRotateCropImage()
        self.sorted_boxes = SortedBoxes()

    def preprocess(self, input_dicts, data_id, log_id):
        (_, input_dict), = input_dicts.items()
        raw_im = input_dict["image"]
        data = np.frombuffer(raw_im, np.uint8)
        im = cv2.imdecode(data, cv2.IMREAD_COLOR)
        self.dt_list = input_dict["dt_boxes"]
        self.dt_list = self.sorted_boxes(self.dt_list)
        # deepcopy to save origin dt_boxes
        dt_boxes = copy.deepcopy(self.dt_list)
        feed_list = []
        img_list = []
        max_wh_ratio = 320 / 48.
        ## Many mini-batchs, the type of feed_data is list.
        max_batch_size = 6  # len(dt_boxes)

        # If max_batch_size is 0, skipping predict stage
        if max_batch_size == 0:
            return {}, True, None, ""
        boxes_size = len(dt_boxes)
        batch_size = boxes_size // max_batch_size
        rem = boxes_size % max_batch_size
        for bt_idx in range(0, batch_size + 1):
            imgs = None
            boxes_num_in_one_batch = 0
            if bt_idx == batch_size:
                if rem == 0:
                    continue
                else:
                    boxes_num_in_one_batch = rem
            elif bt_idx < batch_size:
                boxes_num_in_one_batch = max_batch_size
            else:
                _LOGGER.error("batch_size error, bt_idx={}, batch_size={}".
                              format(bt_idx, batch_size))
                break

            start = bt_idx * max_batch_size
            end = start + boxes_num_in_one_batch
            img_list = []
            for box_idx in range(start, end):
                boximg = self.get_rotate_crop_image(im, dt_boxes[box_idx])
                img_list.append(boximg)
                h, w = boximg.shape[0:2]
                wh_ratio = w * 1.0 / h
                max_wh_ratio = max(max_wh_ratio, wh_ratio)
            _, w, h = self.ocr_reader.resize_norm_img(img_list[0],
                                                      max_wh_ratio).shape

            imgs = np.zeros((boxes_num_in_one_batch, 3, w, h)).astype('float32')
            for id, img in enumerate(img_list):
                norm_img = self.ocr_reader.resize_norm_img(img, max_wh_ratio)
                imgs[id] = norm_img
            feed = {"x": imgs.copy()}
            feed_list.append(feed)
        return feed_list, False, None, ""

    def postprocess(self, input_dicts, fetch_data, data_id, log_id):
        rec_list = []
        dt_num = len(self.dt_list)
        if isinstance(fetch_data, dict):
            if len(fetch_data) > 0:
                rec_batch_res = self.ocr_reader.postprocess(
                    fetch_data, with_score=True)
                for res in rec_batch_res:
                    rec_list.append([str(res[0]),np.float(res[1])])
                    #rec_list.append([[res[0]],[np.float(res[1])]])
        elif isinstance(fetch_data, list):
            for one_batch in fetch_data:
                one_batch_res = self.ocr_reader.postprocess(
                    one_batch, with_score=True)
                for res in one_batch_res:
                    rec_list.append([str(res[0]),np.float(res[1])])
                    #rec_list.append([res[0],np.float(res[1])])
                    #rec_list.append([[res[0]],[np.float(res[1])]])
                    #rec_list.append([res[0],res[1]])
                    #rec_list.append(res)
        result_list = []
        for i in range(dt_num):
            text = rec_list[i]
            dt_box = self.dt_list[i]
            if text[1] >= 0.5:
                result_list.append([text, dt_box.tolist()])
        res = {"result": json.dumps(result_list)}
        return res, None, ""


class OcrService(WebService):
    def get_pipeline_response(self, read_op):
        det_op = DetOp(name="det", input_ops=[read_op])
        rec_op = RecOp(name="rec", input_ops=[det_op])
        return rec_op


uci_service = OcrService(name="ocr")
FLAGS = ArgsParser().parse_args()
uci_service.prepare_pipeline_config(yml_dict=FLAGS.conf_dict)
uci_service.run_service()
