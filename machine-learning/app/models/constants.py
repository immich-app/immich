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
    "nb_NO": "nob_Latn",
    "nl": "nld_Latn",
    "pl": "pol_Latn",
    "pt_BR": "por_Latn",
    "pt": "por_Latn",
    "ro": "ron_Latn",
    "ru": "rus_Cyrl",
    "sk": "slk_Latn",
    "sl": "slv_Latn",
    "sr_Cyrl": "srp_Cyrl",
    "sv": "swe_Latn",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "th": "tha_Thai",
    "tr": "tur_Latn",
    "uk": "ukr_Cyrl",
    "vi": "vie_Latn",
    "zh-CN": "zho_Hans",
    "zh-TW": "zho_Hant",
    "zh_Hant": "zho_Hant",
    "zh_SIMPLIFIED": "zho_Hans",
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
