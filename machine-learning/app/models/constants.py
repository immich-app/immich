from app.config import clean_name
from app.schemas import ModelSource

_OPENCLIP_MODELS = {
    "RN101__openai",
    "RN101__yfcc15m",
    "RN50__cc12m",
    "RN50__openai",
    "RN50__yfcc15m",
    "RN50x16__openai",
    "RN50x4__openai",
    "RN50x64__openai",
    "ViT-B-16-SigLIP-256__webli",
    "ViT-B-16-SigLIP-384__webli",
    "ViT-B-16-SigLIP-512__webli",
    "ViT-B-16-SigLIP-i18n-256__webli",
    "ViT-B-16-SigLIP__webli",
    "ViT-B-16-plus-240__laion400m_e31",
    "ViT-B-16-plus-240__laion400m_e32",
    "ViT-B-16__laion400m_e31",
    "ViT-B-16__laion400m_e32",
    "ViT-B-16__openai",
    "ViT-B-32__laion2b-s34b-b79k",
    "ViT-B-32__laion2b_e16",
    "ViT-B-32__laion400m_e31",
    "ViT-B-32__laion400m_e32",
    "ViT-B-32__openai",
    "ViT-H-14-378-quickgelu__dfn5b",
    "ViT-H-14-quickgelu__dfn5b",
    "ViT-H-14__laion2b-s32b-b79k",
    "ViT-L-14-336__openai",
    "ViT-L-14-quickgelu__dfn2b",
    "ViT-L-14__laion2b-s32b-b82k",
    "ViT-L-14__laion400m_e31",
    "ViT-L-14__laion400m_e32",
    "ViT-L-14__openai",
    "ViT-L-16-SigLIP-256__webli",
    "ViT-L-16-SigLIP-384__webli",
    "ViT-SO400M-14-SigLIP-384__webli",
    "ViT-g-14__laion2b-s12b-b42k",
    "XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k",
    "XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k",
    "nllb-clip-base-siglip__mrl",
    "nllb-clip-base-siglip__v1",
    "nllb-clip-large-siglip__mrl",
    "nllb-clip-large-siglip__v1",
    "ViT-B-16-SigLIP2__webli",
    "ViT-B-32-SigLIP2-256__webli",
    "ViT-L-16-SigLIP2-256__webli",
    "ViT-L-16-SigLIP2-384__webli",
    "ViT-L-16-SigLIP2-512__webli",
    "ViT-SO400M-14-SigLIP2-378__webli",
    "ViT-SO400M-14-SigLIP2__webli",
    "ViT-SO400M-16-SigLIP2-256__webli",
    "ViT-SO400M-16-SigLIP2-384__webli",
    "ViT-SO400M-16-SigLIP2-512__webli",
    "ViT-gopt-16-SigLIP2-256__webli",
    "ViT-gopt-16-SigLIP2-384__webli",
}


_MCLIP_MODELS = {
    "LABSE-Vit-L-14",
    "XLM-Roberta-Large-Vit-B-16Plus",
    "XLM-Roberta-Large-Vit-B-32",
    "XLM-Roberta-Large-Vit-L-14",
}


_INSIGHTFACE_MODELS = {
    "antelopev2",
    "buffalo_s",
    "buffalo_m",
    "buffalo_l",
}


SUPPORTED_PROVIDERS = ["CUDAExecutionProvider", "OpenVINOExecutionProvider", "CPUExecutionProvider"]

RKNN_SUPPORTED_SOCS = ["rk3566", "rk3568", "rk3576", "rk3588"]
RKNN_COREMASK_SUPPORTED_SOCS = ["rk3576", "rk3588"]


def get_model_source(model_name: str) -> ModelSource | None:
    cleaned_name = clean_name(model_name)

    if cleaned_name in _INSIGHTFACE_MODELS:
        return ModelSource.INSIGHTFACE

    if cleaned_name in _MCLIP_MODELS:
        return ModelSource.MCLIP

    if cleaned_name in _OPENCLIP_MODELS:
        return ModelSource.OPENCLIP

    return None
