from pathlib import Path
from typing import Any

import numpy as np
import onnx
import onnxruntime as ort
from numpy.typing import NDArray
from onnx.tools.update_model_dims import update_inputs_outputs_dims
from PIL import Image

from immich_ml.config import log, settings
from immich_ml.models.base import InferenceModel
from immich_ml.models.transforms import decode_pil, normalize, serialize_np_array
from immich_ml.schemas import (
    FaceDetectionOutput,
    FacialRecognitionOutput,
    ModelFormat,
    ModelSession,
    ModelTask,
    ModelType,
)

from ._ops import align_face


class FaceRecognizer(InferenceModel):
    depends = [(ModelType.DETECTION, ModelTask.FACIAL_RECOGNITION)]
    identity = (ModelType.RECOGNITION, ModelTask.FACIAL_RECOGNITION)

    def __init__(self, model_name: str, **model_kwargs: Any) -> None:
        super().__init__(model_name, **model_kwargs)
        max_batch_size = settings.max_batch_size and settings.max_batch_size.facial_recognition
        self.batch_size = max_batch_size if max_batch_size else self._batch_size_default

    def _load(self) -> ModelSession:
        session = self._make_session(self.model_path)
        if (not self.batch_size or self.batch_size > 1) and str(session.get_inputs()[0].shape[0]) != "batch":
            self._add_batch_axis(self.model_path)
            session = self._make_session(self.model_path)
        return session

    def _predict(
        self, inputs: NDArray[np.uint8] | bytes | Image.Image, faces: FaceDetectionOutput
    ) -> FacialRecognitionOutput:
        if faces["boxes"].shape[0] == 0:
            return []
        image = np.asarray(decode_pil(inputs), dtype=np.uint8)
        crops = np.stack([align_face(image, kps).transpose(2, 0, 1) for kps in faces["landmarks"]])
        embeddings = self._predict_batch(normalize(crops, mean=127.5, std=127.5))
        return self.postprocess(faces, embeddings)

    def _predict_batch(self, crops: NDArray[np.float32]) -> NDArray[np.float32]:
        input_name = self.session.get_inputs()[0].name
        if not self.batch_size or crops.shape[0] <= self.batch_size:
            return self.session.run(None, {input_name: crops})[0]

        batches = [
            self.session.run(None, {input_name: crops[i : i + self.batch_size]})[0]
            for i in range(0, crops.shape[0], self.batch_size)
        ]
        return np.concatenate(batches, axis=0)

    def postprocess(self, faces: FaceDetectionOutput, embeddings: NDArray[np.float32]) -> FacialRecognitionOutput:
        return [
            {
                "boundingBox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "embedding": serialize_np_array(embedding),
                "score": score,
            }
            for (x1, y1, x2, y2), embedding, score in zip(faces["boxes"], embeddings, faces["scores"])
        ]

    def _add_batch_axis(self, model_path: Path) -> None:
        log.debug(f"Adding batch axis to model {model_path}")
        proto = onnx.load(model_path)
        static_input_dims = [shape.dim_value for shape in proto.graph.input[0].type.tensor_type.shape.dim[1:]]
        static_output_dims = [shape.dim_value for shape in proto.graph.output[0].type.tensor_type.shape.dim[1:]]
        input_dims = {proto.graph.input[0].name: ["batch"] + static_input_dims}
        output_dims = {proto.graph.output[0].name: ["batch"] + static_output_dims}
        updated_proto = update_inputs_outputs_dims(proto, input_dims, output_dims)
        onnx.save(updated_proto, model_path)

    @property
    def _batch_size_default(self) -> int | None:
        providers = ort.get_available_providers()
        if (
            self.model_format == ModelFormat.ONNX
            and "MIGraphXExecutionProvider" not in providers
            and "OpenVINOExecutionProvider" not in providers
        ):
            return None
        return 1
