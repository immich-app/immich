from pathlib import Path
from typing import Any

import numpy as np
import onnx
from insightface.model_zoo import ArcFaceONNX
from insightface.utils.face_align import norm_crop
from numpy.typing import NDArray
from onnx.tools.update_model_dims import update_inputs_outputs_dims
from PIL import Image

from app.config import log
from app.models.base import InferenceModel
from app.models.transforms import decode_cv2
from app.schemas import FaceDetectionOutput, FacialRecognitionOutput, ModelFormat, ModelSession, ModelTask, ModelType


class FaceRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)]
    identity = (ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)

    def __init__(self, model_name: str, min_score: float = 0.7, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs)
        self.min_score = model_kwargs.pop("minScore", min_score)
        self.batch = self.model_format == ModelFormat.ONNX

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        if self.batch and str(session.get_inputs()[0].shape[0]) != "batch":
            self._add_batch_axis(self.model_path)
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
        cropped_faces = self._crop(inputs, faces)
        embeddings = self._predict_batch(cropped_faces) if self.batch else self._predict_single(cropped_faces)
        return self.postprocess(faces, embeddings)

    def _predict_batch(self, cropped_faces: list[NDArray[np.uint8]]) -> NDArray[np.float32]:
        embeddings: NDArray[np.float32] = self.model.get_feat(cropped_faces)
        return embeddings

    def _predict_single(self, cropped_faces: list[NDArray[np.uint8]]) -> NDArray[np.float32]:
        embeddings: list[NDArray[np.float32]] = []
        for face in cropped_faces:
            embeddings.append(self.model.get_feat(face))
        return np.concatenate(embeddings, axis=0)

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

    def _add_batch_axis(self, model_path: Path) -> None:
        log.debug(f"Adding batch axis to model {model_path}")
        proto = onnx.load(model_path)
        static_input_dims = [shape.dim_value for shape in proto.graph.input[0].type.tensor_type.shape.dim[1:]]
        static_output_dims = [shape.dim_value for shape in proto.graph.output[0].type.tensor_type.shape.dim[1:]]
        input_dims = {proto.graph.input[0].name: ["batch"] + static_input_dims}
        output_dims = {proto.graph.output[0].name: ["batch"] + static_output_dims}
        updated_proto = update_inputs_outputs_dims(proto, input_dims, output_dims)
        onnx.save(updated_proto, model_path)
