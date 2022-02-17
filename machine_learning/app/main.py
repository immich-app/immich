from typing import Optional
import numpy as np
from fastapi import FastAPI
import tensorflow as tf
from tensorflow.keras.applications import InceptionV3
from tensorflow.keras.applications.inception_v3 import preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image

IMG_SIZE = 299
PREDICTION_MODEL = InceptionV3(weights='imagenet')
app = FastAPI()


@app.get("/")
def read_root():

    return "ok"


@app.get("/predict/{image_name}")
def predict(image_name: str):

    img_path = f'./app/upload/eb077301-2773-4ef1-aa2a-215ceb8a4383/thumb/C37F22E9-5F07-4DCA-A3EB-5BCCE93270C0/{image_name}'
    img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    preds = PREDICTION_MODEL.predict(x)
    result = decode_predictions(preds, top=3)[0]
    print(result)
    payload = []
    for _, value, _ in result:
        payload.append(value)

    return payload


def setup():
    pass
