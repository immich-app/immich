from typing_extensions import TypedDict


class TranscriptSegment(TypedDict):
    start: float
    end: float
    text: str


class TranscriptionOutput(TypedDict):
    language: str
    segments: list[TranscriptSegment]
