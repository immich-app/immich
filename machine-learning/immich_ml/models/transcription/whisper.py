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

# Whisper's encoder sees a fixed 30 s of audio at a time, so 30 s is the coarsest useful unit of
# detection and the natural grid to start from.
LANGUAGE_WINDOW_SECONDS = 30
LANGUAGE_WINDOW_SAMPLES = LANGUAGE_WINDOW_SECONDS * SAMPLE_RATE

# Below this the window is treated as possibly containing a switch rather than as a reading of one
# language.
#
# Deliberately not the server's `minLanguageConfidence`, which answers a different question: that
# one decides whether to *believe* a change of language, this one decides whether it is worth
# *looking* for one. Suspecting costs a few encoder passes, so it can afford to be far readier than
# believing.
#
# Measured: single-language windows scored 0.965 to 1.00, windows straddling a real switch scored
# 0.64, 0.67 and 0.79 depending on how the chunk happened to align to the switch. 0.9 sits in the
# gap with margin on both sides -- 0.7 does not, and misses the 0.79 case entirely.
REFINE_BELOW_CONFIDENCE = 0.9

# Length of a probe. Detection costs the same whatever it is given -- the encoder pads to 30 s
# regardless -- so this is chosen for how much speech is enough to judge from, not for speed.
# Measured: 5 s spans of single-language speech detect at 0.97-0.99.
PROBE_SECONDS = 5.0

# Each step halves the interval, so this locates a switch to within about a second of a 30 s
# window. Going further costs a full encoder pass per bit and lands well inside a caption cue.
MAX_BISECTION_STEPS = 4

# An explicit override is a statement of fact rather than a guess, so it is reported at full
# confidence and the caller's stickiness rule becomes a no-op.
OVERRIDE_CONFIDENCE = 1.0


def region_at(regions: list[tuple[float, str, float]], time: float) -> tuple[str, float]:
    """Language and confidence of the region covering `time`, regions being ordered by end time."""
    for end, language, confidence in regions:
        if time < end:
            return language, confidence
    # A segment can overrun the audio it was transcribed from by a fraction of a second.
    _, language, confidence = regions[-1]
    return language, confidence


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

        A window can resolve to more than one region when it is found to straddle a switch, so a
        segment is placed by its midpoint rather than taking the window's reading wholesale.
        """
        segments = list(segments)
        if self.language is not None:
            return [(self.language, OVERRIDE_CONFIDENCE)] * len(segments)

        resolved: dict[int, list[tuple[float, str, float]]] = {}
        detections = []
        duration = audio.size / SAMPLE_RATE
        last_window = max((audio.size - 1) // LANGUAGE_WINDOW_SAMPLES, 0)
        for segment in segments:
            # The midpoint picks the window holding most of a segment, so one straddling a boundary
            # is labelled by the window it mostly belongs to rather than by where it happens to
            # start. Clamping guards the case where a model overruns the audio it was given.
            midpoint = (segment.start + segment.end) / 2
            window = min(int(midpoint * SAMPLE_RATE) // LANGUAGE_WINDOW_SAMPLES, last_window)
            if window not in resolved:
                resolved[window] = self._resolve_window(audio, window, duration)
            detections.append(region_at(resolved[window], midpoint))

        return detections

    def _resolve_window(
        self, audio: "np.ndarray[Any, np.dtype[np.float32]]", window: int, duration: float
    ) -> list[tuple[float, str, float]]:
        """
        Reads one window as a list of (end time, language, confidence) regions.

        A window the model is sure about is one region and costs one pass, which is what a
        monolingual recording pays and is why refinement is free on all but the videos that need
        it. A window it is unsure about may be one that straddles a language switch, and the only
        way to tell is to look: the two ends are probed, and if they disagree the switch between
        them is bisected. Music and silence, the other cause of an unsure reading, never reach here
        -- voice activity detection removes them before any segment exists to label.
        """
        start = window * LANGUAGE_WINDOW_SECONDS
        end = min(start + LANGUAGE_WINDOW_SECONDS, duration)
        language, confidence = self._detect(audio, start, end)

        # Two probes that overlap cannot tell the ends of the window apart, so there is nothing to
        # be learned from a window this short.
        if confidence >= REFINE_BELOW_CONFIDENCE or end - start < 2 * PROBE_SECONDS:
            return [(end, language, confidence)]

        left = self._detect(audio, start, start + PROBE_SECONDS)
        right = self._detect(audio, end - PROBE_SECONDS, end)
        if left[0] != right[0]:
            boundary = self._locate_switch(audio, start, end, left[0])
            return [(boundary, *left), (end, *right)]

        # Both ends read the same language, so whatever made the window unsure is not a switch
        # between them. The reading is reported with the window's own hesitation rather than the
        # probes' confidence, because the audio between the probes remains unaccounted for.
        return [(end, left[0], confidence)]

    def _locate_switch(
        self, audio: "np.ndarray[Any, np.dtype[np.float32]]", start: float, end: float, before: str
    ) -> float:
        """Bisects `start`..`end` for the point at which the language stops being `before`."""
        lo, hi = start, end
        for _ in range(MAX_BISECTION_STEPS):
            middle = (lo + hi) / 2
            language, _ = self._detect(audio, max(middle - PROBE_SECONDS, start), middle)
            if language == before:
                lo = middle
            else:
                hi = middle

        # A probe reports the whole span ending at its candidate, so it only changes its answer
        # once the switch is half a probe behind that candidate. The search therefore settles that
        # far late, and correcting for it stops the first seconds of the new language being
        # attributed to the old one.
        return min(max((lo + hi) / 2 - PROBE_SECONDS / 2, start), end)

    def _detect(self, audio: "np.ndarray[Any, np.dtype[np.float32]]", start: float, end: float) -> tuple[str, float]:
        language, confidence, _ = self.model.detect_language(audio[int(start * SAMPLE_RATE) : int(end * SAMPLE_RATE)])
        return language, confidence

    @property
    def model_path(self) -> Path:
        return self.model_dir

    @property
    def cached(self) -> bool:
        return (self.model_path / "model.bin").is_file()
