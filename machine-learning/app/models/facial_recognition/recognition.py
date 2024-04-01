from pathlib import Path
from typing import Any

import cv2
import numpy as np
from insightface.model_zoo import ArcFaceONNX
from insightface.utils.face_align import norm_crop
from numpy.typing import NDArray

from app.config import clean_name
from app.models.transforms import crop_np, crop_bounding_box, resize_np
from app.schemas import DetectedFace, ModelTask, RecognizedFace, ModelSession, ModelType, is_ndarray

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

    # def _predict(self, img: Any, **kwargs: Any) -> Any:
    def _predict(
        self, inputs: NDArray[np.uint8] | bytes, faces: list[DetectedFace] = [], **kwargs: Any
    ) -> list[RecognizedFace]:
        if isinstance(inputs, bytes):
            decoded_image = cv2.imdecode(np.frombuffer(inputs, np.uint8), cv2.IMREAD_COLOR)
        else:
            decoded_image = inputs
        assert is_ndarray(decoded_image, np.float32)

        results: list[RecognizedFace] = []
        for detected_face in faces:
            landmarks = detected_face.get("landmarks", None)
            if landmarks is not None:
                cropped_img = norm_crop(decoded_image, np.asarray(landmarks))
            else:
                cropped_img = crop_bounding_box(decoded_image, detected_face["box"])
                cropped_img = crop_np(resize_np(cropped_img, 112), 112)
            assert is_ndarray(cropped_img, np.uint8)

            embedding = self.model.get_feat(cropped_img)[0]
            assert is_ndarray(embedding, np.float32)

            face: RecognizedFace = {"box": detected_face["box"], "embedding": embedding}
            results.append(face)

        return results
