import string
from io import BytesIO

import cv2
import numpy as np
import orjson
from numpy.typing import NDArray
from PIL import Image

_PIL_RESAMPLING_METHODS = {resampling.name.lower(): resampling for resampling in Image.Resampling}
_PUNCTUATION_TRANS = str.maketrans("", "", string.punctuation)


def resize_pil(img: Image.Image, size: int, resample: Image.Resampling = Image.Resampling.BICUBIC) -> Image.Image:
    if img.width < img.height:
        return img.resize((size, int((img.height / img.width) * size)), resample=resample)
    return img.resize((int((img.width / img.height) * size), size), resample=resample)


# https://stackoverflow.com/a/60883103
def crop_pil(img: Image.Image, size: int) -> Image.Image:
    left = int((img.size[0] / 2) - (size / 2))
    upper = int((img.size[1] / 2) - (size / 2))
    right = left + size
    lower = upper + size

    return img.crop((left, upper, right, lower))


def to_numpy(img: Image.Image) -> NDArray[np.float32]:
    return np.asarray(img if img.mode == "RGB" else img.convert("RGB"), dtype=np.float32) / 255.0


def normalize(
    img: NDArray[np.float32], mean: float | NDArray[np.float32], std: float | NDArray[np.float32]
) -> NDArray[np.float32]:
    img *= 1.0 / std
    img -= mean / std
    return img


def get_pil_resampling(resample: str) -> Image.Resampling:
    return _PIL_RESAMPLING_METHODS[resample.lower()]


def pil_to_cv2(image: Image.Image) -> NDArray[np.uint8]:
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)  # type: ignore


def decode_pil(image_bytes: bytes | Image.Image | NDArray[np.uint8]) -> Image.Image:
    image: Image.Image
    match image_bytes:
        case Image.Image():
            image = image_bytes
        case np.ndarray():
            image = Image.fromarray(image_bytes)
        case bytes():
            image = Image.open(BytesIO(image_bytes))
    image.load()
    if not image.mode == "RGB":
        image = image.convert("RGB")
    return image


def clean_text(text: str, canonicalize: bool = False) -> str:
    text = " ".join(text.split())
    if canonicalize:
        text = text.translate(_PUNCTUATION_TRANS).lower()
    return text


# this allows the client to use the array as a string without deserializing only to serialize back to a string
# TODO: use this in a less invasive way
def serialize_np_array(arr: NDArray[np.float32]) -> str:
    return orjson.dumps(arr, option=orjson.OPT_SERIALIZE_NUMPY).decode()


def letterbox(image: NDArray[np.uint8] | Image.Image, size: int) -> tuple[NDArray[np.uint8], float]:
    if isinstance(image, Image.Image):
        image = np.asarray(image)
    height, width = image.shape[:2]
    if height > width:
        new_height, new_width = size, int(size * width / height)
    else:
        new_width, new_height = size, int(size * height / width)

    canvas = np.zeros((size, size, 3), dtype=np.uint8)
    cv2.resize(image, (new_width, new_height), dst=canvas[:new_height, :new_width])
    return canvas, new_height / height


def ensure_dims(array: NDArray[np.float32], ndim: int) -> NDArray[np.float32]:
    return array if array.ndim >= ndim else np.expand_dims(array, axis=tuple(range(ndim - array.ndim)))
