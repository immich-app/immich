from typing import Any

import cv2
import numpy as np
from numpy.typing import NDArray
from PIL import Image

from immich_ml.config import log
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_cv2, normalize, serialize_np_array
from immich_ml.schemas import ModelTask, ModelType, PetDetectionOutput, PetRecognitionOutput


class PetRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.PET_RECOGNITION)]
    identity = (ModelType.RECOGNITION, ModelTask.PET_RECOGNITION)
    hf_repo = "Xenova/clip-vit-base-patch32"
    model_file = "onnx/vision_model.onnx"
    use_type_subfolder = False

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        recognition_model_name = model_kwargs.get("recognitionModelName", model_name)
        if recognition_model_name == "pet-recognition":
            # Default to a compatible model
            model_name = "clip-vit-base-patch32"
            self.hf_repo = "Xenova/clip-vit-base-patch32"
            self.model_file = "onnx/vision_model.onnx"
        elif "/" in recognition_model_name:
            # Allow users to specify a custom Hugging Face repo
            model_name = recognition_model_name
            self.hf_repo = recognition_model_name
            self.model_file = model_kwargs.get("modelFile", "model.onnx")
        else:
            model_name = recognition_model_name

        self.hf_repo = model_kwargs.get("hfRepo", self.hf_repo)
        self.model_file = model_kwargs.get("modelFile", self.model_file)

        super().__init__(model_name, **model_kwargs)

    def _predict(
        self, inputs: NDArray[np.uint8] | bytes | Image.Image, pets: PetDetectionOutput
    ) -> PetRecognitionOutput:
        log.debug(f"Running pet recognition for {len(pets['labels'])} pets...")
        if pets["boxes"].shape[0] == 0:
            return []

        img = decode_cv2(inputs)

        results: PetRecognitionOutput = []
        for (x1, y1, x2, y2), score, label in zip(pets["boxes"], pets["scores"], pets["labels"]):
            # Ensure crop is within bounds
            x1, y1 = max(0, int(x1)), max(0, int(y1))
            x2, y2 = min(img.shape[1], int(x2)), min(img.shape[0], int(y2))

            if x2 <= x1 or y2 <= y1:
                continue

            crop = img[y1:y2, x1:x2]

            # Resize crop to 224x224 for CLIP
            crop_resized = cv2.resize(crop, (224, 224), interpolation=cv2.INTER_CUBIC)
            crop_resized = crop_resized.astype(np.float32) / 255.0

            # CLIP normalization (usually 0.481, 0.457, 0.408 / 0.268, 0.261, 0.275)
            # But let's use standard ImageNet if not specified, it's usually close enough for feature extraction
            mean = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
            std = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)
            crop_normalized = normalize(crop_resized, mean, std)

            crop_input = crop_normalized.transpose(2, 0, 1)  # HWC to CHW
            crop_input = np.expand_dims(crop_input, axis=0)

            outputs = self.session.run(None, {self.session.get_inputs()[0].name: crop_input})
            # CLIP vision_model output is [1, 512]
            embedding: NDArray[np.float32] = outputs[0][0]

            results.append(
                {
                    "boundingBox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "embedding": serialize_np_array(embedding),
                    "score": float(score),
                    "label": int(label),
                }
            )

        return results
