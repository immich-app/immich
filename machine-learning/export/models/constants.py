from export.models.openclip import OpenCLIPModelConfig


MCLIP_TO_OPENCLIP = {
    "XLM-Roberta-Large-Vit-B-32": OpenCLIPModelConfig("ViT-B-32", "openai"),
    "XLM-Roberta-Large-Vit-B-16Plus": OpenCLIPModelConfig("ViT-B-16-plus-240", "laion400m_e32"),
    "LABSE-Vit-L-14": OpenCLIPModelConfig("ViT-L-14", "openai"),
    "XLM-Roberta-Large-Vit-L-14": OpenCLIPModelConfig("ViT-L-14", "openai"),
}
