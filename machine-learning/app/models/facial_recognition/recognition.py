from pathlib import Path
from typing import Any

import numpy as np
from insightface.model_zoo import ArcFaceONNX
from insightface.utils.face_align import norm_crop
from numpy.typing import NDArray

from app.config import clean_name
from app.models.transforms import crop_bounding_box, crop_np, decode_cv2, resize_np
from app.schemas import DetectedFaces, ModelSession, ModelTask, ModelType

from ..base import InferenceModel


class FaceRecognizer(InferenceModel):
    _model_task = ModelTask.FACIAL_RECOGNITION
    _model_type = ModelType.RECOGNITION

    def __init__(
        self,
        model_name: str,
        min_score: float = 0.7,
        cache_dir: Path | str | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(clean_name(model_name), cache_dir, **model_kwargs)

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        self.model = ArcFaceONNX(
            self.model_path.with_suffix(".onnx").as_posix(),
            session=session,
        )
        return session

    def _predict(self, inputs: NDArray[np.uint8] | bytes, faces: DetectedFaces, **kwargs: Any) -> NDArray[np.float32]:
        if faces["boxes"].shape[0] == 0:
            return np.empty((0, 512), dtype=np.float32)
        inputs = decode_cv2(inputs)
        embeddings: NDArray[np.float32] = self.model.get_feat(self._crop(inputs, faces))
        return embeddings

    def _crop(self, image: NDArray[np.uint8], faces: DetectedFaces) -> list[NDArray[np.uint8]]:
        batch: list[NDArray[np.uint8]] = []
        for i in range(faces["boxes"].shape[0]):
            if faces["landmarks"] is not None:
                cropped: NDArray[np.uint8] = norm_crop(image, faces["landmarks"][i])
            else:
                cropped = crop_bounding_box(image, faces["boxes"][i])
                cropped = crop_np(resize_np(cropped, 112), 112)
            batch.append(cropped)

        return batch
