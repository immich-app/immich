from pathlib import Path
from typing import Any, ClassVar

import numpy as np
from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download

from immich_ml.config import clean_name, log
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelIdentity, ModelSession, ModelTask, ModelType

from .schemas import TranscriptionOutput

# Audio arrives as raw little-endian signed 16-bit mono PCM at 16 kHz. That is what
# faster-whisper feeds to the encoder anyway, so accepting it directly removes a
# container decode from the request path.
INT16_FULL_SCALE = 32768.0


def decode_pcm(inputs: bytes) -> "np.ndarray[Any, np.dtype[np.float32]]":
    # A trailing odd byte cannot form a sample; np.frombuffer would raise on it.
    usable = len(inputs) - len(inputs) % 2
    samples: np.ndarray[Any, np.dtype[np.int16]] = np.frombuffer(inputs[:usable], dtype="<i2")
    return samples.astype(np.float32) / INT16_FULL_SCALE


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
        segments, info = self.model.transcribe(decode_pcm(inputs), vad_filter=True, multilingual=True)
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
