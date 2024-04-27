import numpy as np
from numpy.typing import NDArray
from PIL import Image

_PIL_RESAMPLING_METHODS = {resampling.name.lower(): resampling for resampling in Image.Resampling}


def resize(img: Image.Image, size: int) -> Image.Image:
    if img.width < img.height:
        return img.resize((size, int((img.height / img.width) * size)), resample=Image.Resampling.BICUBIC)
    else:
        return img.resize((int((img.width / img.height) * size), size), resample=Image.Resampling.BICUBIC)


# https://stackoverflow.com/a/60883103
def crop(img: Image.Image, size: int) -> Image.Image:
    left = int((img.size[0] / 2) - (size / 2))
    upper = int((img.size[1] / 2) - (size / 2))
    right = left + size
    lower = upper + size

    return img.crop((left, upper, right, lower))


def to_numpy(img: Image.Image) -> NDArray[np.float32]:
    return np.asarray(img.convert("RGB")).astype(np.float32) / 255.0


def normalize(
    img: NDArray[np.float32], mean: float | NDArray[np.float32], std: float | NDArray[np.float32]
) -> NDArray[np.float32]:
    return (img - mean) / std


def get_pil_resampling(resample: str) -> Image.Resampling:
    return _PIL_RESAMPLING_METHODS[resample.lower()]
