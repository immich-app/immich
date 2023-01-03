# Copyright (c) 2020 PaddlePaddle Authors. All Rights Reserved.
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

import requests
import json
import base64
import os

import argparse


def str2bool(v):
    return v.lower() in ("true", "t", "1")


parser = argparse.ArgumentParser(description="args for paddleserving")
parser.add_argument("--image_dir", type=str, default="../../doc/imgs/")
parser.add_argument("--det", type=str2bool, default=True)
parser.add_argument("--rec", type=str2bool, default=True)
parser.add_argument("--url", type=str, default="http://immich-ocr:3004/ocr/prediction")
args = parser.parse_args()


def cv2_to_base64(image):
    return base64.b64encode(image).decode('utf8')


def _check_image_file(path):
    img_end = {'jpg', 'bmp', 'png', 'jpeg', 'rgb', 'tif', 'tiff', 'gif'}
    return any([path.lower().endswith(e) for e in img_end])


url = args.url
test_img_dir = args.image_dir

test_img_list = []
if os.path.isfile(test_img_dir) and _check_image_file(test_img_dir):
    test_img_list.append(test_img_dir)
elif os.path.isdir(test_img_dir):
    for single_file in os.listdir(test_img_dir):
        file_path = os.path.join(test_img_dir, single_file)
        if os.path.isfile(file_path) and _check_image_file(file_path):
            test_img_list.append(file_path)
if len(test_img_list) == 0:
    raise Exception("not found any img file in {}".format(test_img_dir))

for idx, img_file in enumerate(test_img_list):
    with open(img_file, 'rb') as file:
        image_data1 = file.read()
    # print file name
    print('{}{}{}'.format('*' * 10, img_file, '*' * 10))

    image = cv2_to_base64(image_data1)

    data = {"key": ["image"], "value": [image]}
#    print(json.dumps(data))
    r = requests.post(url=url, data=json.dumps(data))
    result = r.json()
    print("erro_no:{}, err_msg:{}".format(result["err_no"], result["err_msg"]))
    # check success
    if result["err_no"] == 0:
        ocr_result = result["value"][0]
        if not args.det:
            print(ocr_result)
        else:
            try:
                for item in eval(ocr_result):
                    # return transcription and points
                    print("{}, {}".format(item[0], item[1]))
            except Exception as e:
                print(ocr_result)
                print("No results")
                continue

    else:
        print(
            "For details about error message, see PipelineServingLogs/pipeline.log"
        )
print("==> total number of test imgs: ", len(test_img_list))
