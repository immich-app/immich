import os
import platform
import subprocess
from typing import Callable, ClassVar

import onnx
from onnx_graphsurgeon import import_onnx, export_onnx
from onnxruntime.tools.onnx_model_utils import fix_output_shapes, make_input_shape_fixed
from huggingface_hub import snapshot_download
from onnx.shape_inference import infer_shapes_path
from huggingface_hub import login, upload_file
import onnx2tf

# i can explain
# armnn only supports up to 4d tranposes, but the model has a 5d transpose due to a redundant unsqueeze
# this function folds the unsqueeze+transpose+squeeze into a single 4d transpose
def onnx_transpose_4d(model_path: str):
    proto = onnx.load(model_path)
    graph = import_onnx(proto)

    for node in graph.nodes:
        for i, link1 in enumerate(node.outputs):
            if "Unsqueeze" in link1.name:
                for node1 in link1.outputs:
                    for link2 in node1.outputs:
                        if "Transpose" in link2.name:
                            for node2 in link2.outputs:
                                if node2.attrs.get("perm") == [3, 1, 2, 0, 4]:
                                    node2.attrs["perm"] = [2, 0, 1, 3]
                                    link2.shape = link1.shape
                                    for link3 in node2.outputs:
                                        if "Squeeze" in link3.name:
                                            for node3 in link3.outputs:
                                                for link4 in node3.outputs:
                                                    link4.shape = [link3.shape[x] for x in [0, 1, 2, 4]]
                                                    for inputs in link4.inputs:
                                                        if inputs.name == node3.name:
                                                            i = link2.inputs.index(node1)
                                                            if i >= 0:
                                                                link2.inputs[i] = node
                                                            
                                                            i = link4.inputs.index(node3)
                                                            if i >= 0:
                                                                link4.inputs[i] = node2
                                                            
                                                            node.outputs = [link2]
                                                            node1.inputs = []
                                                            node1.outputs = []
                                                            node3.inputs = []
                                                            node3.outputs = []
                                                            
    graph.cleanup(remove_unused_node_outputs=True, recurse_subgraphs=True, recurse_functions=True)
    graph.toposort()
    graph.fold_constants()
    updated = export_onnx(graph)
    onnx.save(updated, model_path, save_as_external_data=True, all_tensors_to_one_file=False)
    infer_shapes_path(model_path, check_type=True, strict_mode=True, data_prop=True)


class ExportBase:
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

    def to_onnx_static(self) -> str:
        cache_dir = os.path.join(os.environ["CACHE_DIR"], self.model_name)
        task_path = os.path.join(cache_dir, self.task)
        model_path = os.path.join(task_path, "model.onnx")
        if not os.path.isfile(model_path):
            print(f"Downloading {self.model_name}...")
            snapshot_download(self.repo_name, cache_dir=cache_dir, local_dir=cache_dir)
            
        static_dir = os.path.join(task_path, "static")
        static_path = os.path.join(static_dir, "model.onnx")
        os.makedirs(static_dir, exist_ok=True)
        
        if not os.path.isfile(static_path):
            print(f"Making {self.model_name} ({self.task}) static")
            infer_shapes_path(onnx_path_original, check_type=True, strict_mode=True, data_prop=True)
            onnx_path_original = os.path.join(cache_dir, "model.onnx")
            static_model = onnx.load_model(onnx_path_original)
            make_input_shape_fixed(static_model.graph, static_model.graph.input[0].name, (1, 3, 224, 224))
            fix_output_shapes(static_model)
            onnx.save(static_model, static_path, save_as_external_data=True, all_tensors_to_one_file=False)
            infer_shapes_path(static_path, check_type=True, strict_mode=True, data_prop=True)
            onnx_transpose_4d(static_path)
        return static_path
    
    def to_tflite(self, output_dir: str) -> tuple[str, str]:
        input_path = self.to_onnx_static()
        os.makedirs(output_dir, exist_ok=True)
        tflite_fp32 = os.path.join(output_dir, "model_float32.tflite")
        tflite_fp16 = os.path.join(output_dir, "model_float16.tflite")
        if not os.path.isfile(tflite_fp32) or not os.path.isfile(tflite_fp16):
            print(f"Exporting {self.model_name} ({self.task}) to TFLite")
            onnx2tf.convert(
                input_onnx_file_path=input_path,
                output_folder_path=output_dir,
                copy_onnx_input_output_names_to_tflite=True,
            )
        
        return tflite_fp32, tflite_fp16

    def to_armnn(self, output_dir: str) -> tuple[str, str]:
        tflite_model_dir = os.path.join(output_dir, "tflite")
        tflite_fp32, tflite_fp16 = self.to_tflite(tflite_model_dir)
        
        fp16_dir = os.path.join(output_dir, "fp16")
        os.makedirs(fp16_dir, exist_ok=True)
        armnn_fp32 = os.path.join(output_dir, "model.armnn")
        armnn_fp16 = os.path.join(fp16_dir, "model.armnn")
        
        print(f"Exporting {self.model_name} ({self.task}) to ARM NN with fp32 precision")
        subprocess.run(
            [
                "./armnnconverter",
                "-f",
                "tflite-binary",
                "-m",
                tflite_fp32,
                "-i",
                "input_tensor",
                "-o",
                "output_tensor",
                "-p",
                armnn_fp32,
            ],
            capture_output=True,
        )
        print(f"Finished exporting {self.name} ({self.task}) with fp32 precision")
        
        print(f"Exporting {self.model_name} ({self.task}) to ARM NN with fp16 precision")
        subprocess.run(
            [
                "./armnnconverter",
                "-f",
                "tflite-binary",
                "-m",
                tflite_fp16,
                "-i",
                "input_tensor",
                "-o",
                "output_tensor",
                "-p",
                armnn_fp16,
            ],
            capture_output=True,
        )
        print(f"Finished exporting {self.name} ({self.task}) with fp16 precision")
        
        return armnn_fp32, armnn_fp16

    @property
    def model_name(self) -> str:
        return f"{self.name}__{self.pretrained}" if self.pretrained else self.name

    @property
    def repo_name(self) -> str:
        return f"immich-app/{self.model_name}"

class ArcFace(ExportBase):
    task = "recognition"


class RetinaFace(ExportBase):
    task = "detection"


class OpenClipVisual(ExportBase):
    task = "visual"


class OpenClipTextual(ExportBase):
    task = "textual"


class MClipTextual(ExportBase):
    task = "textual"


def main() -> None:
    if platform.machine() not in ("x86_64", "AMD64"):
        raise RuntimeError(f"Can only run on x86_64 / AMD64, not {platform.machine()}")
    upload_to_hf = "HF_AUTH_TOKEN" in os.environ
    if upload_to_hf:
        login(token=os.environ["HF_AUTH_TOKEN"])
    os.environ["LD_LIBRARY_PATH"] = "armnn"
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
        # lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="openai"),
        # lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="openai"),
        lambda: OpenClipVisual("ViT-B-16", (1, 3, 224, 224), pretrained="openai"),
        lambda: OpenClipTextual("ViT-B-16", (1, 77), pretrained="openai"),
        # lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="openai"),
        # lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="openai"),
        # lambda: OpenClipVisual("ViT-L-14-336", (1, 3, 336, 336), pretrained="openai"),
        # lambda: OpenClipTextual("ViT-L-14-336", (1, 77), pretrained="openai"),
        # lambda: OpenClipVisual("RN50", (1, 3, 224, 224), pretrained="openai"),
        # lambda: OpenClipTextual("RN50", (1, 77), pretrained="openai"),
        # lambda: OpenClipTextual("ViT-H-14-quickgelu", (1, 77), pretrained="dfn5b"),
        # lambda: OpenClipTextual("ViT-H-14-378-quickgelu", (1, 77), pretrained="dfn5b"),
        # lambda: OpenClipVisual("XLM-Roberta-Large-Vit-L-14", (1, 3, 224, 224)),
        # lambda: OpenClipVisual("XLM-Roberta-Large-Vit-B-32", (1, 3, 224, 224)),
        # lambda: ArcFace("buffalo_s", (1, 3, 112, 112), optimization_level=3),
        # lambda: RetinaFace("buffalo_s", (1, 3, 640, 640), optimization_level=3),
        # lambda: ArcFace("buffalo_m", (1, 3, 112, 112), optimization_level=3),
        # lambda: RetinaFace("buffalo_m", (1, 3, 640, 640), optimization_level=3),
        # lambda: ArcFace("buffalo_l", (1, 3, 112, 112), optimization_level=3),
        # lambda: RetinaFace("buffalo_l", (1, 3, 640, 640), optimization_level=3),
        # lambda: ArcFace("antelopev2", (1, 3, 112, 112), optimization_level=3),
        # lambda: RetinaFace("antelopev2", (1, 3, 640, 640), optimization_level=3),
    ]

    models: list[Callable[[], ExportBase]] = [*failed, *succeeded]
    for _model in succeeded:
        model = _model()
        try:
            model_dir = os.path.join("output", model.model_name)
            output_dir = os.path.join(model_dir, model.task)
            armnn_fp32, armnn_fp16 = model.to_armnn(output_dir)
            relative_fp32 = os.path.relpath(armnn_fp32, start=model_dir)
            relative_fp16 = os.path.relpath(armnn_fp16, start=model_dir)
            if upload_to_hf and os.path.isfile(armnn_fp32):
                upload_file(path_or_fileobj=armnn_fp32, path_in_repo=relative_fp32, repo_id=model.repo_name)
            if upload_to_hf and os.path.isfile(armnn_fp16):
                upload_file(path_or_fileobj=armnn_fp16, path_in_repo=relative_fp16, repo_id=model.repo_name)
        except Exception as exc:
            print(f"Failed to export {model.model_name} ({model.task}): {exc}")


if __name__ == "__main__":
    main()
