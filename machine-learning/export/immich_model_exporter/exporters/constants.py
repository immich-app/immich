from enum import StrEnum
from typing import NamedTuple


class ModelSource(StrEnum):
    INSIGHTFACE = "insightface"
    MCLIP = "mclip"
    OPENCLIP = "openclip"


class SourceMetadata(NamedTuple):
    name: str
    link: str
    type: str


SOURCE_TO_METADATA = {
    ModelSource.MCLIP: SourceMetadata("M-CLIP", "https://huggingface.co/M-CLIP", "CLIP"),
    ModelSource.OPENCLIP: SourceMetadata("OpenCLIP", "https://github.com/mlfoundations/open_clip", "CLIP"),
    ModelSource.INSIGHTFACE: SourceMetadata(
        "InsightFace", "https://github.com/deepinsight/insightface/tree/master", "facial recognition"
    ),
}
