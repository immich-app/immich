import zipfile
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import onnxruntime as ort
from insightface.model_zoo import ArcFaceONNX, RetinaFace
from insightface.utils.face_align import norm_crop
from insightface.utils.storage import BASE_REPO_URL, download_file

from ..schemas import ModelType, ndarray
from .base import InferenceModel

import onnx
from onnx.tools import update_model_dims


class FaceRecognizer(InferenceModel):
    _model_type = ModelType.FACIAL_RECOGNITION

    def __init__(
        self,
        model_name: str,
        min_score: float = 0.7,
        cache_dir: Path | str | None = None,
        **model_kwargs: Any,
    ) -> None:
        self.min_score = model_kwargs.pop("minScore", min_score)
        super().__init__(model_name, cache_dir, **model_kwargs)

    def _download(self) -> None:
        zip_file = self.cache_dir / f"{self.model_name}.zip"
        download_file(f"{BASE_REPO_URL}/{self.model_name}.zip", zip_file)
        with zipfile.ZipFile(zip_file, "r") as zip:
            members = zip.namelist()
            det_file = next(model for model in members if model.startswith("det_"))
            rec_file = next(model for model in members if model.startswith("w600k_"))
            zip.extractall(self.cache_dir, members=[det_file, rec_file])
        zip_file.unlink()

        self._add_batch_dimension(self.cache_dir / rec_file)

    def _load(self) -> None:
        try:
            det_file = next(self.cache_dir.glob("det_*.onnx"))
            rec_file = next(self.cache_dir.glob("w600k_*.onnx"))
        except StopIteration:
            raise FileNotFoundError("Facial recognition models not found in cache directory")

        det_session = ort.InferenceSession(
            det_file.as_posix(),
            sess_options=self.sess_options,
            providers=self.providers,
            provider_options=self.provider_options,
        )
        self.det_model = RetinaFace(session=det_session)
        self.det_model.prepare(
            ctx_id=0,
            det_thresh=self.min_score,
            input_size=(640, 640),
        )

        rec_session = ort.InferenceSession(
            rec_file.as_posix(),
            sess_options=self.sess_options,
            providers=self.providers,
            provider_options=self.provider_options,
        )
        print(rec_session.get_inputs())
        if rec_session.get_inputs()[0].shape[0] != "batch":
            del rec_session
            self._add_batch_dimension(rec_file)
            rec_session = ort.InferenceSession(
                rec_file.as_posix(),
                sess_options=self.sess_options,
                providers=self.providers,
                provider_options=self.provider_options,
            )
        self.rec_model = ArcFaceONNX(rec_file.as_posix(), session=rec_session)
        self.rec_model.prepare(ctx_id=0)

    def _predict(self, image: np.ndarray[int, np.dtype[Any]] | bytes) -> list[dict[str, Any]]:
        if isinstance(image, bytes):
            image = cv2.imdecode(np.frombuffer(image, np.uint8), cv2.IMREAD_COLOR)
        bboxes, kpss = self.det_model.detect(image)
        if bboxes.size == 0:
            return []
        assert isinstance(image, np.ndarray) and isinstance(kpss, np.ndarray)

        scores = bboxes[:, 4].tolist()
        bboxes = bboxes[:, :4].round().tolist()

        results = []
        height, width, _ = image.shape
        for (x1, y1, x2, y2), score, kps in zip(bboxes, scores, kpss):
            cropped_img = norm_crop(image, kps)
            embedding = self.rec_model.get_feat(cropped_img)[0].tolist()
            results.append(
                {
                    "imageWidth": width,
                    "imageHeight": height,
                    "boundingBox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    },
                    "score": score,
                    "embedding": embedding,
                }
            )
        return results

    def _predict_batch(self, images: list[cv2.Mat]) -> list[list[dict[str, Any]]]:
        for i, image in enumerate(images):
            if isinstance(image, bytes):
                images[i] = cv2.imdecode(np.frombuffer(image, np.uint8), cv2.IMREAD_COLOR)

        batch_det, batch_kpss = self._detect(images)
        batch_cropped_images, batch_offsets = self._preprocess(images, batch_kpss)
        if batch_cropped_images:
            batch_embeddings = self.rec_model.get_feat(images)
            results = self._postprocess(images, batch_det, batch_embeddings, batch_offsets)
        else:
            results = self._postprocess(images, batch_det)
        return results

    def _detect(self, images: list[cv2.Mat]) -> tuple[list[ndarray], ...]:
        batch_det: list[ndarray] = []
        batch_kpss: list[ndarray] = []
        # detection model doesn't support batching, but recognition model does
        for image in images:
            bboxes, kpss = self.det_model.detect(image)
            batch_det.append(bboxes)
            batch_kpss.append(kpss)
        return batch_det, batch_kpss

    def _preprocess(self, images: list[cv2.Mat], batch_kpss: list[ndarray]) -> tuple[list[cv2.Mat], list[int]]:
        batch_cropped_images = []
        batch_offsets = []
        total_faces = 0
        for i, image in enumerate(images):
            kpss = batch_kpss[i]
            total_faces += kpss.shape[0]
            batch_offsets.append(total_faces)
            for kps in kpss:
                batch_cropped_images.append(norm_crop(image, kps))
        return batch_cropped_images, batch_offsets

    def _postprocess(
        self,
        images: list[cv2.Mat],
        batch_det: list[ndarray],
        batch_embeddings: ndarray | None = None,
        batch_offsets: list[int] | None = None,
    ) -> list[list[dict[str, Any]]]:
        if batch_embeddings is not None and batch_offsets is not None:
            image_embeddings: list[ndarray] | None = np.array_split(batch_embeddings, batch_offsets)
        else:
            image_embeddings = None

        batch_faces: list[list[dict[str, Any]]] = []
        for i, image in enumerate(images):
            faces: list[dict[str, Any]] = []
            batch_faces.append(faces)
            if image_embeddings is None or image_embeddings[i].shape[0] == 0:
                continue

            height, width, _ = image.shape

            embeddings = image_embeddings[i].tolist()
            bboxes = batch_det[i][:, :4].round().tolist()
            det_scores = batch_det[i][:, 4].tolist()
            for (x1, y1, x2, y2), embedding, det_score in zip(bboxes, embeddings, det_scores):
                face = {
                    "imageWidth": width,
                    "imageHeight": height,
                    "boundingBox": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                    },
                    "score": det_score,
                    "embedding": embedding,
                }

                faces.append(face)
        return batch_faces
    
    def _add_batch_dimension(self, model_path: Path) -> None:
        rec_proto = onnx.load(model_path.as_posix())
        inputs = {input.name: ['batch'] + [shape.dim_value for shape in input.type.tensor_type.shape.dim[1:]] for input in rec_proto.graph.input}
        outputs = {output.name: ['batch'] + [shape.dim_value for shape in output.type.tensor_type.shape.dim[1:]] for output in rec_proto.graph.output}
        rec_proto = update_model_dims.update_inputs_outputs_dims(rec_proto, inputs, outputs)
        onnx.save(rec_proto, model_path.open("wb"))

    @property
    def cached(self) -> bool:
        return self.cache_dir.is_dir() and any(self.cache_dir.glob("*.onnx"))

    def configure(self, **model_kwargs: Any) -> None:
        self.det_model.det_thresh = model_kwargs.pop("minScore", self.det_model.det_thresh)
