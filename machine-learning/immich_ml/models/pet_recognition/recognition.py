from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_pil, normalize, serialize_np_array, to_numpy
from immich_ml.schemas import ModelTask, ModelType


class PetRecognizer(InferenceModel):
    depends = []
    identity = (ModelType.RECOGNITION, ModelTask.PET_RECOGNITION)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs)

    def _predict(self, inputs: Image.Image | bytes) -> str:
        img = decode_pil(inputs)
        img = img.resize((384, 384), resample=Image.Resampling.BICUBIC)
        img_np = to_numpy(img)
        
        # ImageNet normalization
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_np = normalize(img_np, mean, std)
        
        img_np = img_np.transpose(2, 0, 1)  # HWC to CHW
        img_np = np.expand_dims(img_np, axis=0)

        outputs = self.session.run(None, {self.session.get_inputs()[0].name: img_np})
        embedding: NDArray[np.float32] = outputs[0][0]
        
        return serialize_np_array(embedding)
