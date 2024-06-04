from io import BytesIO
from typing import IO

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image

_PIL_RESAMPLING_METHODS = {resampling.name.lower(): resampling for resampling in Image.Resampling}


def resize_pil(img: Image.Image, size: int) -> Image.Image:
    if img.width < img.height:
        return img.resize((size, int((img.height / img.width) * size)), resample=Image.Resampling.BICUBIC)
    else:
        return img.resize((int((img.width / img.height) * size), size), resample=Image.Resampling.BICUBIC)


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
    return np.divide(img - mean, std, dtype=np.float32)


def get_pil_resampling(resample: str) -> Image.Resampling:
    return _PIL_RESAMPLING_METHODS[resample.lower()]


def pil_to_cv2(image: Image.Image) -> NDArray[np.uint8]:
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)  # type: ignore


def decode_pil(image_bytes: bytes | IO[bytes] | Image.Image) -> Image.Image:
    if isinstance(image_bytes, Image.Image):
        return image_bytes
    image = Image.open(BytesIO(image_bytes) if isinstance(image_bytes, bytes) else image_bytes)
    image.load()  # type: ignore
    if not image.mode == "RGB":
        image = image.convert("RGB")
    return image


def decode_cv2(image_bytes: NDArray[np.uint8] | bytes | Image.Image) -> NDArray[np.uint8]:
    if isinstance(image_bytes, bytes):
        image_bytes = decode_pil(image_bytes)  # pillow is much faster than cv2
    if isinstance(image_bytes, Image.Image):
        return pil_to_cv2(image_bytes)
    return image_bytes
