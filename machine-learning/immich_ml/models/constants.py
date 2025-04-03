from immich_ml.config import clean_name
from immich_ml.schemas import ModelSource

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


SUPPORTED_PROVIDERS = [
    "CUDAExecutionProvider",
    "ROCMExecutionProvider",
    "OpenVINOExecutionProvider",
    "CPUExecutionProvider",
]

RKNN_SUPPORTED_SOCS = ["rk3566", "rk3568", "rk3576", "rk3588"]
RKNN_COREMASK_SUPPORTED_SOCS = ["rk3576", "rk3588"]


WEBLATE_TO_FLORES200 = {
    "af": "afr_Latn",
    "ar": "arb_Arab",
    "az": "azj_Latn",
    "be": "bel_Cyrl",
    "bg": "bul_Cyrl",
    "ca": "cat_Latn",
    "cs": "ces_Latn",
    "da": "dan_Latn",
    "de": "deu_Latn",
    "el": "ell_Grek",
    "en": "eng_Latn",
    "es": "spa_Latn",
    "et": "est_Latn",
    "fa": "pes_Arab",
    "fi": "fin_Latn",
    "fr": "fra_Latn",
    "he": "heb_Hebr",
    "hi": "hin_Deva",
    "hr": "hrv_Latn",
    "hu": "hun_Latn",
    "hy": "hye_Armn",
    "id": "ind_Latn",
    "it": "ita_Latn",
    "ja": "jpn_Hira",
    "kmr": "kmr_Latn",
    "ko": "kor_Hang",
    "lb": "ltz_Latn",
    "lt": "lit_Latn",
    "lv": "lav_Latn",
    "mfa": "zsm_Latn",
    "mk": "mkd_Cyrl",
    "mn": "khk_Cyrl",
    "mr": "mar_Deva",
    "ms": "zsm_Latn",
    "nb-NO": "nob_Latn",
    "nn": "nno_Latn",
    "nl": "nld_Latn",
    "pl": "pol_Latn",
    "pt-BR": "por_Latn",
    "pt": "por_Latn",
    "ro": "ron_Latn",
    "ru": "rus_Cyrl",
    "sk": "slk_Latn",
    "sl": "slv_Latn",
    "sr-Cyrl": "srp_Cyrl",
    "sv": "swe_Latn",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "th": "tha_Thai",
    "tr": "tur_Latn",
    "uk": "ukr_Cyrl",
    "ur": "urd_Arab",
    "vi": "vie_Latn",
    "zh-CN": "zho_Hans",
    "zh-Hans": "zho_Hans",
    "zh-TW": "zho_Hant",
}


def get_model_source(model_name: str) -> ModelSource | None:
    cleaned_name = clean_name(model_name)

    if cleaned_name in _INSIGHTFACE_MODELS:
        return ModelSource.INSIGHTFACE

    if cleaned_name in _MCLIP_MODELS:
        return ModelSource.MCLIP

    if cleaned_name in _OPENCLIP_MODELS:
        return ModelSource.OPENCLIP

    return None
