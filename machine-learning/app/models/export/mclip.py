import tempfile
import warnings
from pathlib import Path

import torch
from multilingual_clip.pt_multilingual_clip import MultilingualCLIP

from app.models.export.optimize import optimize_ort

from ...config import log


def to_onnx(
    model_name: str,
    output_dir_textual: Path | str,
) -> None:
    output_dir_textual = Path(output_dir_textual)
    output_dir_textual.mkdir(parents=True, exist_ok=True)

    textual_path = output_dir_textual / "model.onnx"

    with tempfile.TemporaryDirectory() as tmpdir:
        model = MultilingualCLIP.from_pretrained(model_name, cache_dir=tmpdir)

        for param in model.parameters():
            param.requires_grad_(False)

        log.info("Exporting clip model to ONNX")
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            export_text_encoder(model, textual_path)

        log.info("Optimizing clip model")
        optimize_ort(textual_path, textual_path)


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
    torch.onnx.export(
        model,
        args,
        output_path.as_posix(),
        input_names=["input_ids", "attention_mask"],
        output_names=["text_embedding"],
        opset_version=17,
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
        },
    )
