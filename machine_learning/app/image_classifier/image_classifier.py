from tensorflow.keras.applications import InceptionV3
from tensorflow.keras.applications.inception_v3 import preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import cv2
IMG_SIZE = 299
PREDICTION_MODEL = InceptionV3(weights='imagenet')


def classify_image(image_path: str):
    img_path = f'./app/{image_path}'
    # img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))

    target_image = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    resized_target_image = cv2.resize(target_image, (IMG_SIZE, IMG_SIZE))

    x = image.img_to_array(resized_target_image)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    preds = PREDICTION_MODEL.predict(x)
    result = decode_predictions(preds, top=3)[0]
    payload = []
    for _, value, _ in result:
        payload.append(value)

    return payload


def warm_up():
    img_path = f'./app/test.png'
    img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    PREDICTION_MODEL.predict(x)
