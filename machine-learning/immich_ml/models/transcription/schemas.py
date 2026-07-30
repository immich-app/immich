from typing_extensions import TypedDict


class TranscriptSegment(TypedDict):
    start: float
    end: float
    text: str
    # Raw detection, deliberately unsmoothed: deciding when to trust a language switch is the
    # caller's job, and it needs the confidence to make that decision.
    language: str
    languageConfidence: float


class TranscriptionOutput(TypedDict):
    language: str
    segments: list[TranscriptSegment]
