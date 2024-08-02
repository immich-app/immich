import os
import tempfile
import warnings
from pathlib import Path

import torch
from multilingual_clip.pt_multilingual_clip import MultilingualCLIP
from transformers import AutoTokenizer

from .openclip import OpenCLIPModelConfig
from .openclip import to_onnx as openclip_to_onnx
from .util import get_model_path

_MCLIP_TO_OPENCLIP = {
    "M-CLIP/XLM-Roberta-Large-Vit-B-32": OpenCLIPModelConfig("ViT-B-32", "openai"),
    "M-CLIP/XLM-Roberta-Large-Vit-B-16Plus": OpenCLIPModelConfig("ViT-B-16-plus-240", "laion400m_e32"),
    "M-CLIP/LABSE-Vit-L-14": OpenCLIPModelConfig("ViT-L-14", "openai"),
    "M-CLIP/XLM-Roberta-Large-Vit-L-14": OpenCLIPModelConfig("ViT-L-14", "openai"),
}


def to_onnx(
    model_name: str,
    output_dir_visual: Path | str,
    output_dir_textual: Path | str,
) -> tuple[Path, Path]:
    textual_path = get_model_path(output_dir_textual)
    with tempfile.TemporaryDirectory() as tmpdir:
        model = MultilingualCLIP.from_pretrained(model_name, cache_dir=os.environ.get("CACHE_DIR", tmpdir))
        AutoTokenizer.from_pretrained(model_name).save_pretrained(output_dir_textual)

        model.eval()
        for param in model.parameters():
            param.requires_grad_(False)

        export_text_encoder(model, textual_path)
        visual_path, _ = openclip_to_onnx(_MCLIP_TO_OPENCLIP[model_name], output_dir_visual)
        assert visual_path is not None, "Visual model export failed"
    return visual_path, textual_path


def export_text_encoder(model: MultilingualCLIP, output_path: Path | str) -> None:
    output_path = Path(output_path)

    def forward(self: MultilingualCLIP, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        embs = self.transformer(input_ids, attention_mask)[0]
        embs = (embs * attention_mask.unsqueeze(2)).sum(dim=1) / attention_mask.sum(dim=1)[:, None]
        embs = self.LinearTransformation(embs)
        return torch.nn.functional.normalize(embs, dim=-1)

    # unfortunately need to monkeypatch for tracing to work here
    # otherwise it hits the 2GiB protobuf serialization limit
    MultilingualCLIP.forward = forward

    args = (torch.ones(1, 77, dtype=torch.int32), torch.ones(1, 77, dtype=torch.int32))
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        torch.onnx.export(
            model,
            args,
            output_path.as_posix(),
            input_names=["input_ids", "attention_mask"],
            output_names=["embedding"],
            opset_version=17,
            # dynamic_axes={
            #     "input_ids": {0: "batch_size", 1: "sequence_length"},
            #     "attention_mask": {0: "batch_size", 1: "sequence_length"},
            # },
        )
