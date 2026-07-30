from pathlib import Path
from typing import Any, ClassVar, Iterable, cast

import numpy as np
from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download

from immich_ml.config import clean_name, log
from immich_ml.models.base import InferenceModel
from immich_ml.schemas import ModelFormat, ModelIdentity, ModelSession, ModelTask, ModelType

from .schemas import TranscriptionOutput, TranscriptSegment

# Audio arrives as raw little-endian signed 16-bit mono PCM at 16 kHz. That is what
# faster-whisper feeds to the encoder anyway, so accepting it directly removes a
# container decode from the request path.
INT16_FULL_SCALE = 32768.0
SAMPLE_RATE = 16_000

# Whisper's encoder sees a fixed 30 s of audio at a time, so 30 s is the finest granularity at
# which the model has an opinion about which language is being spoken.
LANGUAGE_WINDOW_SAMPLES = 30 * SAMPLE_RATE

# An explicit override is a statement of fact rather than a guess, so it is reported at full
# confidence and the caller's stickiness rule becomes a no-op.
OVERRIDE_CONFIDENCE = 1.0


def decode_pcm(inputs: bytes) -> "np.ndarray[Any, np.dtype[np.float32]]":
    # A trailing odd byte cannot form a sample; np.frombuffer would raise on it.
    usable = len(inputs) - len(inputs) % 2
    samples: np.ndarray[Any, np.dtype[np.int16]] = np.frombuffer(inputs[:usable], dtype="<i2")
    return samples.astype(np.float32) / INT16_FULL_SCALE


class WhisperTranscriber(InferenceModel):
    depends: ClassVar[list[ModelIdentity]] = []
    identity: ClassVar[ModelIdentity] = (ModelType.RECOGNITION, ModelTask.TRANSCRIPTION)

    def __init__(self, model_name: str, cpu_threads: int = 4, language: str | None = None, **model_kwargs: Any) -> None:
        self.cpu_threads = model_kwargs.get("cpuThreads", cpu_threads)
        self.language = model_kwargs.get("language", language)
        super().__init__(model_name, **model_kwargs, model_format=ModelFormat.ONNX)

    def configure(self, **kwargs: Any) -> None:
        # Options only reach an already-cached model through here, so without this an override
        # changed in the administrator settings would not apply until the model expired. `None` is
        # a meaningful value — it means detect — so absence, not falsity, is what leaves it alone.
        if "language" in kwargs:
            self.language = kwargs["language"]

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
        return cast(ModelSession, self.model)

    def _predict(self, inputs: bytes) -> TranscriptionOutput:
        audio = decode_pcm(inputs)
        # `multilingual` re-detects the language at every encoder window instead of deciding once
        # for the whole request, which is what makes a recording that switches language mid-way
        # transcribe correctly past the switch. An override turns detection off entirely.
        segments, info = self.model.transcribe(
            audio,
            language=self.language,
            vad_filter=True,
            multilingual=self.language is None,
        )
        decoded = list(segments)
        detections = self._detect_languages(audio, decoded)
        return {
            "language": self.language or info.language,
            "segments": [
                TranscriptSegment(
                    start=segment.start,
                    end=segment.end,
                    text=segment.text.strip(),
                    language=language,
                    languageConfidence=confidence,
                    # Passed through as decoded. faster-whisper applies thresholds of its own
                    # while decoding, but only to choose a temperature to retry at; it emits the
                    # segment either way. Whether one is worth showing is decided at read time.
                    noSpeechProbability=segment.no_speech_prob,
                    avgLogProbability=segment.avg_logprob,
                    compressionRatio=segment.compression_ratio,
                )
                for segment, (language, confidence) in zip(decoded, detections)
            ],
        }

    def _detect_languages(
        self, audio: "np.ndarray[Any, np.dtype[np.float32]]", segments: Iterable[Any]
    ) -> list[tuple[str, float]]:
        """
        Labels each segment with the language detected over the encoder window it falls in.

        faster-whisper detects per window internally when `multilingual` is set but keeps the
        result to itself, so the detection is repeated here to surface it. That costs one extra
        encoder pass per window, which is why windows are detected lazily and shared between every
        segment that falls in one: silent and music-only stretches produce no segments and so are
        never detected at all.
        """
        segments = list(segments)
        if self.language is not None:
            return [(self.language, OVERRIDE_CONFIDENCE)] * len(segments)

        detected: dict[int, tuple[str, float]] = {}
        detections = []
        last_window = max((audio.size - 1) // LANGUAGE_WINDOW_SAMPLES, 0)
        for segment in segments:
            # The midpoint picks the window holding most of a segment, so one straddling a boundary
            # is labelled by the window it mostly belongs to rather than by where it happens to
            # start. Clamping guards the case where a model overruns the audio it was given.
            midpoint = (segment.start + segment.end) / 2
            window = min(int(midpoint * SAMPLE_RATE) // LANGUAGE_WINDOW_SAMPLES, last_window)
            if window not in detected:
                samples = audio[window * LANGUAGE_WINDOW_SAMPLES : (window + 1) * LANGUAGE_WINDOW_SAMPLES]
                language, confidence, _ = self.model.detect_language(samples)
                detected[window] = (language, confidence)
            detections.append(detected[window])

        return detections

    @property
    def model_path(self) -> Path:
        return self.model_dir

    @property
    def cached(self) -> bool:
        return (self.model_path / "model.bin").is_file()
