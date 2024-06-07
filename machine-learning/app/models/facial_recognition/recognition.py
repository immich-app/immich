from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from insightface.model_zoo import ArcFaceONNX
from insightface.utils.face_align import norm_crop
from numpy.typing import NDArray
from PIL import Image

from app.config import clean_name, log
from app.models.base import InferenceModel
from app.models.session import ort_add_batch_dim, ort_has_batch_dim
from app.models.transforms import decode_cv2
from app.schemas import FaceDetectionOutput, FacialRecognitionOutput, ModelSession, ModelTask, ModelType


class FaceRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)]
    identity = (ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)

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
        if isinstance(session, ort.InferenceSession) and not ort_has_batch_dim(session):
            log.debug(f"Adding batch dimension to model {self.model_path}")
            ort_add_batch_dim(self.model_path, self.model_path)
            session = self._make_session(self.model_path)
        self.model = ArcFaceONNX(
            self.model_path.with_suffix(".onnx").as_posix(),
            session=session,
        )
        return session

    def _predict(
        self, inputs: NDArray[np.uint8] | bytes | Image.Image, faces: FaceDetectionOutput, **kwargs: Any
    ) -> FacialRecognitionOutput:
        if faces["boxes"].shape[0] == 0:
            return []
        inputs = decode_cv2(inputs)
        embeddings: NDArray[np.float32] = self.model.get_feat(self._crop(inputs, faces))
        return self.postprocess(faces, embeddings)

    def postprocess(self, faces: FaceDetectionOutput, embeddings: NDArray[np.float32]) -> FacialRecognitionOutput:
        return [
            {
                "boundingBox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "embedding": embedding,
                "score": score,
            }
            for (x1, y1, x2, y2), embedding, score in zip(faces["boxes"], embeddings, faces["scores"])
        ]

    def _crop(self, image: NDArray[np.uint8], faces: FaceDetectionOutput) -> list[NDArray[np.uint8]]:
        return [norm_crop(image, landmark) for landmark in faces["landmarks"]]
