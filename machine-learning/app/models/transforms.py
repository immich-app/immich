import numpy as np
from PIL import Image

from app.schemas import ndarray

_PIL_RESAMPLING_METHODS = {resampling.name.lower(): resampling for resampling in Image.Resampling}


def resize(img: Image.Image, size: int) -> Image.Image:
    if img.width < img.height:
        return img.resize((size, int((img.height / img.width) * size)), resample=Image.BICUBIC)
    else:
        return img.resize((int((img.width / img.height) * size), size), resample=Image.BICUBIC)


# https://stackoverflow.com/a/60883103
def crop(img: Image.Image, size: int) -> Image.Image:
    left = int((img.size[0] / 2) - (size / 2))
    upper = int((img.size[1] / 2) - (size / 2))
    right = left + size
    lower = upper + size

    return img.crop((left, upper, right, lower))


def to_numpy(img: Image.Image) -> ndarray:
    return np.asarray(img.convert("RGB")).transpose(2, 0, 1) / 255.0


def normalize(img: ndarray, mean: float, std: float) -> ndarray:
    return (img - mean) / std


def get_pil_resampling(resample: str) -> Image.Resampling:
    return _PIL_RESAMPLING_METHODS[resample.lower()]
