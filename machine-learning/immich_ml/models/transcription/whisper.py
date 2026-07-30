import io
from pathlib import Path
from typing import Any, ClassVar

from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download

from immich_ml.config import clean_name, log
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelIdentity, ModelSession, ModelTask, ModelType

from .schemas import TranscriptionOutput


class WhisperTranscriber(InferenceModel):
    depends: ClassVar[list[ModelIdentity]] = []
    identity: ClassVar[ModelIdentity] = (ModelType.RECOGNITION, ModelTask.TRANSCRIPTION)

    def __init__(self, model_name: str, cpu_threads: int = 4, **model_kwargs: Any) -> None:
        self.cpu_threads = model_kwargs.get("cpuThreads", cpu_threads)
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)

    def _download(self) -> None:
        snapshot_download(
            f"Systran/faster-whisper-{clean_name(self.model_name)}",
            cache_dir=self.cache_dir,
            local_dir=self.model_path,
        )

    def _load(self) -> ModelSession:
        log.info(f"Loading transcription model '{self.model_name}' with {self.cpu_threads} CPU thread(s)")
        self.model = WhisperModel(
            str(self.model_path),
            device="cpu",
            compute_type="int8",
            cpu_threads=self.cpu_threads,
        )
        return self.model  # type: ignore[return-value]

    def _predict(self, inputs: bytes) -> TranscriptionOutput:
        audio = io.BytesIO(inputs)
        segments, info = self.model.transcribe(audio, vad_filter=True, multilingual=True)
        return {
            "language": info.language,
            "segments": [
                {"start": segment.start, "end": segment.end, "text": segment.text.strip()} for segment in segments
            ],
        }

    @property
    def model_path(self) -> Path:
        return self.model_dir

    @property
    def cached(self) -> bool:
        return (self.model_path / "model.bin").is_file()
