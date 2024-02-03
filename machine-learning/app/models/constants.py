from app.config import clean_name

_OPENCLIP_MODELS = {
    "RN50__openai",
    "RN50__yfcc15m",
    "RN50__cc12m",
    "RN101__openai",
    "RN101__yfcc15m",
    "RN50x4__openai",
    "RN50x16__openai",
    "RN50x64__openai",
    "ViT-B-32__openai",
    "ViT-B-32__laion2b_e16",
    "ViT-B-32__laion400m_e31",
    "ViT-B-32__laion400m_e32",
    "ViT-B-32__laion2b-s34b-b79k",
    "ViT-B-16__openai",
    "ViT-B-16__laion400m_e31",
    "ViT-B-16__laion400m_e32",
    "ViT-B-16-plus-240__laion400m_e31",
    "ViT-B-16-plus-240__laion400m_e32",
    "ViT-L-14__openai",
    "ViT-L-14__laion400m_e31",
    "ViT-L-14__laion400m_e32",
    "ViT-L-14__laion2b-s32b-b82k",
    "ViT-L-14-336__openai",
    "ViT-H-14__laion2b-s32b-b79k",
    "ViT-g-14__laion2b-s12b-b42k",
    "ViT-L-14-quickgelu__dfn2b",
    "ViT-H-14-quickgelu__dfn5b",
    "ViT-H-14-378-quickgelu__dfn5b",
    "XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k",
    "nllb-clip-base-siglip__v1",
    "nllb-clip-large-siglip__v1",
}


_MCLIP_MODELS = {
    "LABSE-Vit-L-14",
    "XLM-Roberta-Large-Vit-B-32",
    "XLM-Roberta-Large-Vit-B-16Plus",
    "XLM-Roberta-Large-Vit-L-14",
}


_INSIGHTFACE_MODELS = {
    "antelopev2",
    "buffalo_l",
    "buffalo_m",
    "buffalo_s",
}


SUPPORTED_PROVIDERS = ["CUDAExecutionProvider", "OpenVINOExecutionProvider", "CPUExecutionProvider"]


STATIC_INPUT_PROVIDERS = ["OpenVINOExecutionProvider"]


def is_openclip(model_name: str) -> bool:
    return clean_name(model_name) in _OPENCLIP_MODELS


def is_mclip(model_name: str) -> bool:
    return clean_name(model_name) in _MCLIP_MODELS


def is_insightface(model_name: str) -> bool:
    return clean_name(model_name) in _INSIGHTFACE_MODELS
