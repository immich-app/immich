import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image

from app.schemas import BoundingBox

_PIL_RESAMPLING_METHODS = {resampling.name.lower(): resampling for resampling in Image.Resampling}


def resize_pil(img: Image.Image, size: int) -> Image.Image:
    if img.width < img.height:
        return img.resize((size, int((img.height / img.width) * size)), resample=Image.Resampling.BICUBIC)
    else:
        return img.resize((int((img.width / img.height) * size), size), resample=Image.Resampling.BICUBIC)


def resize_np(img: NDArray[np.uint8], size: int) -> NDArray[np.uint8]:
    height, width = img.shape[:2]
    if width < height:
        res = cv2.resize(img, (size, int((height / width) * size)), interpolation=cv2.INTER_CUBIC)
    else:
        res = cv2.resize(img, (int((width / height) * size), size), interpolation=cv2.INTER_CUBIC)
    return res  # type: ignore


# ported from server
def crop_bounding_box(image: NDArray[np.uint8], bbox: BoundingBox, scale: float = 1.0) -> NDArray[np.uint8]:
    middle_x = (bbox["x1"] + bbox["x2"]) // 2
    middle_y = (bbox["y1"] + bbox["y2"]) // 2

    target_half_size = int(max((bbox["x2"] - bbox["x1"]) / 2, (bbox["y2"] - bbox["y1"]) / 2) * scale)

    new_half_size = min(
        middle_x - max(0, middle_x - target_half_size),
        middle_y - max(0, middle_y - target_half_size),
        min(image.shape[1] - 1, middle_x + target_half_size) - middle_x,
        min(image.shape[0] - 1, middle_y + target_half_size) - middle_y,
    )

    left = int(middle_x - new_half_size)
    top = int(middle_y - new_half_size)
    width = int(new_half_size * 2)
    height = int(new_half_size * 2)

    return image[top : top + height, left : left + width]


# https://stackoverflow.com/a/60883103
def crop_pil(img: Image.Image, size: int) -> Image.Image:
    left = int((img.size[0] / 2) - (size / 2))
    upper = int((img.size[1] / 2) - (size / 2))
    right = left + size
    lower = upper + size

    return img.crop((left, upper, right, lower))


def crop_np(img: NDArray[np.uint8], size: int) -> NDArray[np.uint8]:
    height, width = img.shape[:2]
    left = int((width / 2) - (size / 2))
    upper = int((height / 2) - (size / 2))
    right = left + size
    lower = upper + size

    return img[upper:lower, left:right]


def to_numpy(img: Image.Image) -> NDArray[np.float32]:
    return np.asarray(img if img.mode == "RGB" else img.convert("RGB"), dtype=np.float32) / 255.0


def normalize(
    img: NDArray[np.float32], mean: float | NDArray[np.float32], std: float | NDArray[np.float32]
) -> NDArray[np.float32]:
    return np.divide(img - mean, std, dtype=np.float32)


def get_pil_resampling(resample: str) -> Image.Resampling:
    return _PIL_RESAMPLING_METHODS[resample.lower()]


def decode_cv2(image: NDArray[np.uint8] | bytes) -> NDArray[np.uint8]:
    return cv2.imdecode(np.frombuffer(image, np.uint8), cv2.IMREAD_COLOR) if isinstance(image, bytes) else image  # type: ignore
