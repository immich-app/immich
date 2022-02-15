from typing import Optional

from fastapi import FastAPI
from tensorflow.keras.applications.vgg16 import VGG16
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.vgg16 import preprocess_input, decode_predictions
import numpy as np
import os

app = FastAPI()


@app.get("/")
def read_root():

    return os.getcwd()


@app.get("/predict")
def predict():
    model = VGG16(weights='imagenet', include_top=False)

    img_path = './app/upload/db6e94e1-ab1d-4ff0-a3b7-ba7d9e7b9d84/thumb/76f0308a9a53080e/zMGrPdjRoOU.jpeg'
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    features = model.predict(x)

    return "ok"
