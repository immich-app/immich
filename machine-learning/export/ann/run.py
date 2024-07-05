import os
import platform
import subprocess
from tempfile import TemporaryDirectory
from typing import Callable, ClassVar

import onnx
import torch
from onnx2torch import convert
from onnx2torch.node_converters.registry import add_converter
from onnxruntime.tools.onnx_model_utils import fix_output_shapes, make_input_shape_fixed
from tinynn.converter import TFLiteConverter
from huggingface_hub import snapshot_download
from onnx2torch.onnx_graph import OnnxGraph
from onnx2torch.onnx_node import OnnxNode
from onnx2torch.utils.common import OperationConverterResult, onnx_mapping_from_node
from onnx.shape_inference import infer_shapes_path
from huggingface_hub import login, upload_file

# egregious hacks:
# changed `Clip`'s min/max logic to skip empty strings
# changed OnnxSqueezeDynamicAxes to use `sorted` instead of `torch.sort``
# commented out shape inference in `fix_output_shapes``


class ArgMax(torch.nn.Module):
    def __init__(self, dim: int = -1, keepdim: bool = False):
        super().__init__()
        self.dim = dim
        self.keepdim = keepdim

    def forward(self, input: torch.Tensor) -> torch.Tensor:
        return torch.argmax(input, dim=self.dim, keepdim=self.keepdim)


class Erf(torch.nn.Module):
    def forward(self, input: torch.Tensor) -> torch.Tensor:
        return torch.erf(input)


@add_converter(operation_type="ArgMax", version=13)
def _(node: OnnxNode, graph: OnnxGraph) -> OperationConverterResult:
    return OperationConverterResult(
        torch_module=ArgMax(),
        onnx_mapping=onnx_mapping_from_node(node=node),
    )


class ExportBase(torch.nn.Module):
    task: ClassVar[str]

    def __init__(
        self,
        name: str,
        input_shape: tuple[int, ...],
        pretrained: str | None = None,
        optimization_level: int = 5,
    ):
        super().__init__()
        self.name = name
        self.optimize = optimization_level
        self.nchw_transpose = False
        self.input_shape = input_shape
        self.pretrained = pretrained
        self.dummy_param = torch.nn.Parameter(torch.empty(0))
        self.model = self.load().eval()
        for param in self.parameters():
            param.requires_grad_(False)
        self.eval()

    def load(self) -> torch.nn.Module:
        cache_dir = os.path.join(os.environ["CACHE_DIR"], self.model_name)
        task_path = os.path.join(cache_dir, self.task)
        model_path = os.path.join(task_path, "model.onnx")
        if not os.path.isfile(model_path):
            snapshot_download(self.repo_name, cache_dir=cache_dir, local_dir=cache_dir)
        infer_shapes_path(model_path, check_type=True, strict_mode=True, data_prop=True)
        onnx_model = onnx.load_model(model_path)
        make_input_shape_fixed(onnx_model.graph, onnx_model.graph.input[0].name, self.input_shape)
        fix_output_shapes(onnx_model)
        # try:
        # onnx.save(onnx_model, model_path)
        # except:
        # onnx.save(onnx_model, model_path, save_as_external_data=True, all_tensors_to_one_file=False)
        # infer_shapes_path(model_path, check_type=True, strict_mode=True, data_prop=True)
        # onnx_model = onnx.load_model(model_path)
        # onnx_model = infer_shapes(onnx_model, check_type=True, strict_mode=True, data_prop=True)
        return convert(onnx_model)

    def forward(self, *inputs: torch.Tensor) -> torch.Tensor | tuple[torch.Tensor]:
        if self.precision == "fp16":
            inputs = tuple(i.half() for i in inputs)

        out = self._forward(*inputs)
        if self.precision == "fp16":
            if isinstance(out, tuple):
                return tuple(o.float() for o in out)
            return out.float()
        return out

    def _forward(self, *inputs: torch.Tensor) -> torch.Tensor | tuple[torch.Tensor]:
        return self.model(*inputs)

    def to_armnn(self, output_path: str) -> None:
        output_dir = os.path.dirname(output_path)
        os.makedirs(output_dir, exist_ok=True)
        self(*self.dummy_inputs)
        print(f"Exporting {self.model_name} ({self.task}) with {self.precision} precision")
        jit = torch.jit.trace(self, self.dummy_inputs).eval()
        with TemporaryDirectory() as tmpdir:
            tflite_model_path = os.path.join(tmpdir, "model.tflite")
            converter = TFLiteConverter(
                jit,
                self.dummy_inputs,
                tflite_model_path,
                optimize=self.optimize,
                nchw_transpose=self.nchw_transpose,
            )
            # segfaults on ARM, must run on x86_64 / AMD64
            converter.convert()

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
                    output_path,
                ],
                capture_output=True,
            )
        print(f"Finished exporting {self.name} ({self.task}) with {self.precision} precision")

    @property
    def dummy_inputs(self) -> tuple[torch.FloatTensor]:
        return (torch.rand(self.input_shape, device=self.device, dtype=self.dtype),)

    @property
    def model_name(self) -> str:
        return f"{self.name}__{self.pretrained}" if self.pretrained else self.name

    @property
    def repo_name(self) -> str:
        return f"immich-app/{self.model_name}"

    @property
    def device(self) -> torch.device:
        return self.dummy_param.device

    @property
    def dtype(self) -> torch.dtype:
        return self.dummy_param.dtype

    @property
    def precision(self) -> str:
        match self.dtype:
            case torch.float32:
                return "fp32"
            case torch.float16:
                return "fp16"
            case _:
                raise ValueError(f"Unsupported dtype {self.dtype}")


class ArcFace(ExportBase):
    task = "recognition"


class RetinaFace(ExportBase):
    task = "detection"


class OpenClipVisual(ExportBase):
    task = "visual"


class OpenClipTextual(ExportBase):
    task = "textual"

    @property
    def dummy_inputs(self) -> tuple[torch.LongTensor]:
        return (torch.randint(0, 5000, self.input_shape, device=self.device, dtype=torch.int32),)


class MClipTextual(ExportBase):
    task = "textual"

    @property
    def dummy_inputs(self) -> tuple[torch.LongTensor]:
        return (
            torch.randint(0, 5000, self.input_shape, device=self.device, dtype=torch.int32),
            torch.randint(0, 1, self.input_shape, device=self.device, dtype=torch.int32),
        )


def main() -> None:
    if platform.machine() not in ("x86_64", "AMD64"):
        raise RuntimeError(f"Can only run on x86_64 / AMD64, not {platform.machine()}")
    login(token=os.environ["HF_AUTH_TOKEN"])
    os.environ["LD_LIBRARY_PATH"] = "armnn"
    device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
    failed: list[Callable[[], ExportBase]] = [
        lambda: OpenClipVisual("ViT-H-14-378-quickgelu", (1, 3, 378, 378), pretrained="dfn5b"), # flatbuffers: cannot grow buffer beyond 2 gigabytes (will probably work with fp16)
        lambda: OpenClipVisual("ViT-H-14-quickgelu", (1, 3, 224, 224), pretrained="dfn5b"), # flatbuffers: cannot grow buffer beyond 2 gigabytes (will probably work with fp16)
        lambda: OpenClipTextual("nllb-clip-base-siglip", (1, 77), pretrained="v1"), # ERROR (tinynn.converter.base) Unsupported ops: aten::logical_not
        lambda: OpenClipTextual("nllb-clip-large-siglip", (1, 77), pretrained="v1"), # ERROR (tinynn.converter.base) Unsupported ops: aten::logical_not
        lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion2b_e16"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion2b_e16"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion400m_e32"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion400m_e32"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion2b-s34b-b79k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion2b-s34b-b79k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-B-16", (1, 3, 224, 224), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-B-16", (1, 77), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-B-16", (1, 3, 224, 224), pretrained="laion400m_e32"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-B-16", (1, 77), pretrained="laion400m_e32"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-B-16-plus-240", (1, 3, 224, 224), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-B-16-plus-240", (1, 77), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="laion400m_e31"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="laion400m_e32"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="laion400m_e32"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="laion2b-s32b-b82k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="laion2b-s32b-b82k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-H-14", (1, 3, 224, 224), pretrained="laion2b-s32b-b79k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-H-14", (1, 77), pretrained="laion2b-s32b-b79k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("ViT-g-14", (1, 3, 224, 224), pretrained="laion2b-s12b-b42k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipTextual("ViT-g-14", (1, 77), pretrained="laion2b-s12b-b42k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("XLM-Roberta-Large-Vit-B-16Plus", (1, 3, 240, 240)), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("XLM-Roberta-Large-ViT-H-14", (1, 3, 224, 224), pretrained="frozen_laion5b_s13b_b90k"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("nllb-clip-base-siglip", (1, 3, 384, 384), pretrained="v1"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("nllb-clip-large-siglip", (1, 3, 384, 384), pretrained="v1"), # ERROR (tinynn.converter.base) Unsupported ops: aten::erf
        lambda: OpenClipVisual("RN50", (1, 3, 224, 224), pretrained="yfcc15m"), # BatchNorm operation with mean/var output is not implemented
        lambda: OpenClipTextual("RN50", (1, 77), pretrained="yfcc15m"), # BatchNorm operation with mean/var output is not implemented
        lambda: OpenClipVisual("RN50", (1, 3, 224, 224), pretrained="cc12m"), # BatchNorm operation with mean/var output is not implemented
        lambda: OpenClipTextual("RN50", (1, 77), pretrained="cc12m"), # BatchNorm operation with mean/var output is not implemented
        lambda: MClipTextual("XLM-Roberta-Large-Vit-L-14", (1, 77)), # Expected normalized_shape to be at least 1-dimensional, i.e., containing at least one element, but got normalized_shape = []
        lambda: MClipTextual("XLM-Roberta-Large-Vit-B-16Plus", (1, 77)), # Expected normalized_shape to be at least 1-dimensional, i.e., containing at least one element, but got normalized_shape = []
        lambda: MClipTextual("LABSE-Vit-L-14", (1, 77)), # Expected normalized_shape to be at least 1-dimensional, i.e., containing at least one element, but got normalized_shape = []
        lambda: OpenClipTextual("XLM-Roberta-Large-ViT-H-14", (1, 77), pretrained="frozen_laion5b_s13b_b90k"), # Expected normalized_shape to be at least 1-dimensional, i.e., containing at least one element, but got normalized_shape = []
    ]
    
    succeeded: list[Callable[[], ExportBase]] = [
        lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="openai"),
        lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="openai"),
        lambda: OpenClipVisual("ViT-B-16", (1, 3, 224, 224), pretrained="openai"),
        lambda: OpenClipTextual("ViT-B-16", (1, 77), pretrained="openai"),
        lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="openai"),
        lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="openai"),
        lambda: OpenClipVisual("ViT-L-14-336", (1, 3, 336, 336), pretrained="openai"),
        lambda: OpenClipTextual("ViT-L-14-336", (1, 77), pretrained="openai"),
        lambda: OpenClipVisual("RN50", (1, 3, 224, 224), pretrained="openai"),
        lambda: OpenClipTextual("RN50", (1, 77), pretrained="openai"),
        lambda: OpenClipTextual("ViT-H-14-quickgelu", (1, 77), pretrained="dfn5b"),
        lambda: OpenClipTextual("ViT-H-14-378-quickgelu", (1, 77), pretrained="dfn5b"),
        lambda: OpenClipVisual("XLM-Roberta-Large-Vit-L-14", (1, 3, 224, 224)),
        lambda: OpenClipVisual("XLM-Roberta-Large-Vit-B-32", (1, 3, 224, 224)),
        lambda: ArcFace("buffalo_s", (1, 3, 112, 112), optimization_level=3),
        lambda: RetinaFace("buffalo_s", (1, 3, 640, 640), optimization_level=3),
        lambda: ArcFace("buffalo_m", (1, 3, 112, 112), optimization_level=3),
        lambda: RetinaFace("buffalo_m", (1, 3, 640, 640), optimization_level=3),
        lambda: ArcFace("buffalo_l", (1, 3, 112, 112), optimization_level=3),
        lambda: RetinaFace("buffalo_l", (1, 3, 640, 640), optimization_level=3),
        lambda: ArcFace("antelopev2", (1, 3, 112, 112), optimization_level=3),
        lambda: RetinaFace("antelopev2", (1, 3, 640, 640), optimization_level=3),
    ]

    models: list[Callable[[], ExportBase]] = [*failed, *succeeded]
    for _model in succeeded:
        model = _model().to(device)
        try:
            relative_path = os.path.join(model.task, "model.armnn")
            output_path = os.path.join("output", model.model_name, relative_path)
            model.to_armnn(output_path)
            upload_file(path_or_fileobj=output_path, path_in_repo=relative_path, repo_id=model.repo_name)
            if device == torch.device("cuda"):
                model.half()
                relative_path = os.path.join(model.task, "fp16", "model.armnn")
                output_path = os.path.join("output", model.model_name, relative_path)
                model.to_armnn(output_path)
                upload_file(path_or_fileobj=output_path, path_in_repo=relative_path, repo_id=model.repo_name)
            
        except Exception as exc:
            print(f"Failed to export {model.model_name} ({model.task}): {exc}")


if __name__ == "__main__":
    with torch.no_grad():
        main()
