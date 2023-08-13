from typing import Any

from PIL.Image import Image
from sentence_transformers import SentenceTransformer
from sentence_transformers.util import snapshot_download

from ..schemas import ModelType
from .base import InferenceModel


class CLIPSTEncoder(InferenceModel):
    _model_type = ModelType.CLIP

    def _download(self, **model_kwargs: Any) -> None:
        repo_id = self.model_name if "/" in self.model_name else f"sentence-transformers/{self.model_name}"
        snapshot_download(
            cache_dir=self.cache_dir,
            repo_id=repo_id,
            library_name="sentence-transformers",
            ignore_files=["flax_model.msgpack", "rust_model.ot", "tf_model.h5"],
        )

    def _load(self, **model_kwargs: Any) -> None:
        self.model = SentenceTransformer(
            self.model_name,
            cache_folder=self.cache_dir.as_posix(),
            **model_kwargs,
        )

    def _predict(self, image_or_text: Image | str) -> list[float]:
        return self.model.encode(image_or_text).tolist()
