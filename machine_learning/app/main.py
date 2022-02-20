from typing import Optional
from pydantic import BaseModel
import numpy as np
from fastapi import FastAPI
import tensorflow as tf
from tensorflow.keras.applications import InceptionV3
from tensorflow.keras.applications.inception_v3 import preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
from tf2_yolov4.anchors import YOLOV4_ANCHORS
from tf2_yolov4.model import YOLOv4

IMG_SIZE = 299
PREDICTION_MODEL = InceptionV3(weights='imagenet')
HEIGHT, WIDTH = (640, 960)


def warm_up():
    img_path = f'./app/test.png'
    img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    PREDICTION_MODEL.predict(x)


# Warm up model
warm_up()
app = FastAPI()


class TagImagePayload(BaseModel):
    thumbnail_path: str


@app.post("/tagImage")
async def post_root(payload: TagImagePayload):
    imagePath = payload.thumbnail_path

    if imagePath[0] == '.':
        imagePath = imagePath[2:]

    img_path = f'./app/{imagePath}'
    img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    preds = PREDICTION_MODEL.predict(x)
    result = decode_predictions(preds, top=3)[0]
    payload = []
    for _, value, _ in result:
        payload.append(value)

    return payload


@app.get("/")
async def test():
    image = tf.io.read_file("./app/cars.jpg")
    image = tf.image.decode_image(image)
    image = tf.image.resize(image, (HEIGHT, WIDTH))
    images = tf.expand_dims(image, axis=0) / 255.0

    model = YOLOv4(
        (HEIGHT, WIDTH, 3),
        80,
        YOLOV4_ANCHORS,
        "darknet",
    )

    # model.load_weights()

    print(model.summary())

    # c, b, a = model.predict(images)

    # print(b)
