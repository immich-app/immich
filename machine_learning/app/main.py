from pydantic import BaseModel
from fastapi import FastAPI

from .object_detection import object_detection
from .image_classifier import image_classifier

from tf2_yolov4.anchors import YOLOV4_ANCHORS
from tf2_yolov4.model import YOLOv4


HEIGHT, WIDTH = (640, 960)

# Warm up model
image_classifier.warm_up()
app = FastAPI()


class TagImagePayload(BaseModel):
    thumbnail_path: str


@app.post("/tagImage")
async def post_root(payload: TagImagePayload):
    image_path = payload.thumbnail_path

    if image_path[0] == '.':
        image_path = image_path[2:]

    return image_classifier.classify_image(image_path=image_path)


@app.get("/")
async def test():

    object_detection.run_detection()
    # image = tf.io.read_file("./app/cars.jpg")
    # image = tf.image.decode_image(image)
    # image = tf.image.resize(image, (HEIGHT, WIDTH))
    # images = tf.expand_dims(image, axis=0) / 255.0

    # model = YOLOv4(
    #     (HEIGHT, WIDTH, 3),
    #     80,
    #     YOLOV4_ANCHORS,
    #     "darknet",
    # )
