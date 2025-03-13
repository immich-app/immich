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

RKNN_SOCS = ["rk3566", "rk3576", "rk3588"]

# the builder hangs when using flash attention with these models
RKNN_VISUAL_FLASH_ATTENTION_BLACKLIST = {
    "ViT-H-14-378-quickgelu__dfn5b",
    "ViT-L-16-SigLIP-384__webli",
    "ViT-L-16-SigLIP2-384__webli",
    "ViT-L-16-SigLIP2-512__webli",
    "ViT-SO400M-14-SigLIP-384__webli",
    "ViT-SO400M-14-SigLIP2-378__webli",
    "ViT-SO400M-16-SigLIP2-378__webli",
    "ViT-SO400M-16-SigLIP2-512__webli",
}


# glob to delete old UUID blobs when reuploading models
_uuid_char = "[a-fA-F0-9]"
_uuid_glob = _uuid_char * 8 + "-" + _uuid_char * 4 + "-" + _uuid_char * 4 + "-" + _uuid_char * 4 + "-" + _uuid_char * 12
DELETE_PATTERNS = [
    "**/*onnx*",
    "**/Constant*",
    "**/*.weight",
    "**/*.bias",
    "**/*.proj",
    "**/*in_proj_bias",
    "**/*.npy",
    "**/*.latent",
    "**/*.pos_embed",
    f"**/{_uuid_glob}",
]
