import logging
import os
import platform
import subprocess
from abc import abstractmethod

import onnx
import open_clip
import torch
from onnx2torch import convert
from onnxruntime.tools.onnx_model_utils import fix_output_shapes, make_input_shape_fixed
from tinynn.converter import TFLiteConverter


class ExportBase(torch.nn.Module):
    input_shape: tuple[int, ...]

    def __init__(self, device: torch.device, name: str):
        super().__init__()
        self.device = device
        self.name = name
        self.optimize = 5
        self.nchw_transpose = False

    @abstractmethod
    def forward(self, input_tensor: torch.Tensor) -> torch.Tensor | tuple[torch.Tensor]:
        pass

    def dummy_input(self) -> torch.FloatTensor:
        return torch.rand((1, 3, 224, 224), device=self.device)


class ArcFace(ExportBase):
    input_shape = (1, 3, 112, 112)

    def __init__(self, onnx_model_path: str, device: torch.device):
        name, _ = os.path.splitext(os.path.basename(onnx_model_path))
        super().__init__(device, name)
        onnx_model = onnx.load_model(onnx_model_path)
        make_input_shape_fixed(onnx_model.graph, onnx_model.graph.input[0].name, self.input_shape)
        fix_output_shapes(onnx_model)
        self.model = convert(onnx_model).to(device)
        if self.device.type == "cuda":
            self.model = self.model.half()

    def forward(self, input_tensor: torch.Tensor) -> torch.FloatTensor:
        embedding: torch.FloatTensor = self.model(
            input_tensor.half() if self.device.type == "cuda" else input_tensor
        ).float()
        assert isinstance(embedding, torch.FloatTensor)
        return embedding

    def dummy_input(self) -> torch.FloatTensor:
        return torch.rand(self.input_shape, device=self.device)


class RetinaFace(ExportBase):
    input_shape = (1, 3, 640, 640)

    def __init__(self, onnx_model_path: str, device: torch.device):
        name, _ = os.path.splitext(os.path.basename(onnx_model_path))
        super().__init__(device, name)
        self.optimize = 3
        self.model = convert(onnx_model_path).eval().to(device)
        if self.device.type == "cuda":
            self.model = self.model.half()

    def forward(self, input_tensor: torch.Tensor) -> tuple[torch.FloatTensor]:
        out: torch.Tensor = self.model(input_tensor.half() if self.device.type == "cuda" else input_tensor)
        return tuple(o.float() for o in out)

    def dummy_input(self) -> torch.FloatTensor:
        return torch.rand(self.input_shape, device=self.device)


class ClipVision(ExportBase):
    input_shape = (1, 3, 224, 224)

    def __init__(self, model_name: str, weights: str, device: torch.device):
        super().__init__(device, model_name + "__" + weights)
        self.model = open_clip.create_model(
            model_name,
            weights,
            precision="fp16" if device.type == "cuda" else "fp32",
            jit=False,
            require_pretrained=True,
            device=device,
        )

    def forward(self, input_tensor: torch.Tensor) -> torch.FloatTensor:
        embedding: torch.Tensor = self.model.encode_image(
            input_tensor.half() if self.device.type == "cuda" else input_tensor,
            normalize=True,
        ).float()
        return embedding


def export(model: ExportBase) -> None:
    model.eval()
    for param in model.parameters():
        param.requires_grad = False
    dummy_input = model.dummy_input()
    model(dummy_input)
    jit = torch.jit.trace(model, dummy_input)  # type: ignore[no-untyped-call,attr-defined]
    tflite_model_path = f"output/{model.name}.tflite"
    os.makedirs("output", exist_ok=True)

    converter = TFLiteConverter(
        jit,
        dummy_input,
        tflite_model_path,
        optimize=model.optimize,
        nchw_transpose=model.nchw_transpose,
    )
    # segfaults on ARM, must run on x86_64 / AMD64
    converter.convert()

    armnn_model_path = f"output/{model.name}.armnn"
    os.environ["LD_LIBRARY_PATH"] = "armnn"
    subprocess.run(
        [
            "./armnnconverter",
            "-f",
            "tflite-binary",
            "-m",
            tflite_model_path,
            "-i",
            "input_tensor",
            "-o",
            "output_tensor",
            "-p",
            armnn_model_path,
        ]
    )


def main() -> None:
    if platform.machine() not in ("x86_64", "AMD64"):
        raise RuntimeError(f"Can only run on x86_64 / AMD64, not {platform.machine()}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type != "cuda":
        logging.warning(
            "No CUDA available, cannot create fp16 model! proceeding to create a fp32 model (use only for testing)"
        )
    models = [
        ClipVision("ViT-B-32", "openai", device),
        ArcFace("buffalo_l_rec.onnx", device),
        RetinaFace("buffalo_l_det.onnx", device),
    ]
    for model in models:
        export(model)


if __name__ == "__main__":
    with torch.no_grad():
        main()
