from typing_extensions import TypedDict


class TranscriptSegment(TypedDict):
    start: float
    end: float
    text: str
    # Raw detection, deliberately unsmoothed: deciding when to trust a language switch is the
    # caller's job, and it needs the confidence to make that decision.
    language: str
    languageConfidence: float
    # Quality signals, reported for every segment and judged by nobody here. Recognition run on
    # near-silence does not return nothing: it returns its training data's most common captions,
    # confidently and with plausible timings. These three numbers are what separates those from
    # real speech — how likely the model thought the audio held no speech at all, how confident it
    # was in the tokens it emitted anyway, and how repetitive the result is. The thresholds live at
    # read time so they can be retuned without re-running inference, which is exactly why the model
    # has to report even the segments that are about to be rejected.
    noSpeechProbability: float
    avgLogProbability: float
    compressionRatio: float


class TranscriptionOutput(TypedDict):
    language: str
    segments: list[TranscriptSegment]
