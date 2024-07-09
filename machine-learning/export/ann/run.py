import os
import platform
import subprocess
from typing import Callable, ClassVar

import onnx
from onnx_graphsurgeon import Constant, Node, Variable, import_onnx, export_onnx
from onnxruntime.tools.onnx_model_utils import fix_output_shapes, make_input_shape_fixed
from huggingface_hub import snapshot_download
from onnx.shape_inference import infer_shapes_path
from huggingface_hub import login, upload_file
import onnx2tf
import numpy as np
import onnxsim
from shutil import rmtree

# hack: changed Mul op in onnx2tf to skip broadcast if graph_node.o().op == 'Sigmoid'

# i can explain
# armnn only supports up to 4d tranposes, but the model has a 5d transpose due to a redundant unsqueeze
# this function folds the unsqueeze+transpose+squeeze into a single 4d transpose
# it also switches from gather ops to slices since armnn has different dimension semantics for gathers
def onnx_transpose_4d(model_path: str):
    proto = onnx.load(model_path)
    graph = import_onnx(proto)

    gather_idx = 1
    squeeze_idx = 1
    for node in graph.nodes:
        for link1 in node.outputs:
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
                                            link3.shape = [link3.shape[x] for x in [0, 1, 2, 4]]
                                            for node3 in link3.outputs:
                                                for link4 in node3.outputs:
                                                    link4.shape = link3.shape
                                                    try:
                                                        idx = link2.inputs.index(node1)
                                                        link2.inputs[idx] = node
                                                    except ValueError:
                                                        pass

                                                    node.outputs = [link2]
                                                    if "Gather" in link4.name:
                                                        for node4 in link4.outputs:
                                                            axis = node1.attrs.get("axis", 0)
                                                            index = node4.inputs[1].values
                                                            slice_link = Variable(
                                                                f"onnx::Slice_123{gather_idx}",
                                                                dtype=link4.dtype,
                                                                shape=[1] + link3.shape[1:],
                                                            )
                                                            slice_node = Node(
                                                                op="Slice",
                                                                inputs=[
                                                                    link3,
                                                                    Constant(
                                                                        f"SliceStart_123{gather_idx}",
                                                                        np.array([index]),
                                                                    ),
                                                                    Constant(
                                                                        f"SliceEnd_123{gather_idx}",
                                                                        np.array([index + 1]),
                                                                    ),
                                                                    Constant(
                                                                        f"SliceAxis_123{gather_idx}",
                                                                        np.array([axis]),
                                                                    ),
                                                                ],
                                                                outputs=[slice_link],
                                                                name=f"Slice_123{gather_idx}",
                                                            )
                                                            graph.nodes.append(slice_node)
                                                            gather_idx += 1

                                                            for link5 in node4.outputs:
                                                                for node5 in link5.outputs:
                                                                    try:
                                                                        idx = node5.inputs.index(link5)
                                                                        node5.inputs[idx] = slice_link
                                                                    except ValueError:
                                                                        pass
            elif node.op == "LayerNormalization":
                for node1 in link1.outputs:
                    if node1.op == "Gather":
                        for link2 in node1.outputs:
                            for node2 in link2.outputs:
                                axis = node1.attrs.get("axis", 0)
                                index = node1.inputs[1].values
                                slice_link = Variable(
                                    f"onnx::Slice_123{gather_idx}",
                                    dtype=link2.dtype,
                                    shape=[1] + link2.shape,
                                )
                                slice_node = Node(
                                    op="Slice",
                                    inputs=[
                                        node1.inputs[0],
                                        Constant(
                                            f"SliceStart_123{gather_idx}",
                                            np.array([index]),
                                        ),
                                        Constant(
                                            f"SliceEnd_123{gather_idx}",
                                            np.array([index + 1]),
                                        ),
                                        Constant(
                                            f"SliceAxis_123{gather_idx}",
                                            np.array([axis]),
                                        ),
                                    ],
                                    outputs=[slice_link],
                                    name=f"Slice_123{gather_idx}",
                                )
                                graph.nodes.append(slice_node)
                                gather_idx += 1
                                
                                squeeze_link = Variable(
                                    f"onnx::Squeeze_123{squeeze_idx}",
                                    dtype=link2.dtype,
                                    shape=link2.shape,
                                )
                                squeeze_node = Node(
                                    op="Squeeze",
                                    inputs=[slice_link, Constant(f"SqueezeAxis_123{squeeze_idx}",np.array([0]),)],
                                    outputs=[squeeze_link],
                                    name=f"Squeeze_123{squeeze_idx}",
                                )
                                graph.nodes.append(squeeze_node)
                                squeeze_idx += 1
                                try:
                                    idx = node2.inputs.index(link2)
                                    node2.inputs[idx] = squeeze_link
                                except ValueError:
                                    pass

    graph.cleanup(remove_unused_node_outputs=True, recurse_subgraphs=True, recurse_functions=True)
    graph.toposort()
    graph.fold_constants()
    updated = export_onnx(graph)
    onnx.save(updated, model_path)
    # infer_shapes_path(updated, check_type=True, strict_mode=False, data_prop=True)

    # for some reason, reloading the model is necessary to apply the correct shape
    proto = onnx.load(model_path)
    graph = import_onnx(proto)
    for node in graph.nodes:
        if node.op == "Slice":
            for link in node.outputs:
                if "Slice_123" in link.name and link.shape[0] == 3:
                    link.shape[0] = 1

    graph.cleanup(remove_unused_node_outputs=True, recurse_subgraphs=True, recurse_functions=True)
    graph.toposort()
    graph.fold_constants()
    updated = export_onnx(graph)
    onnx.save(updated, model_path)
    infer_shapes_path(model_path, check_type=True, strict_mode=True, data_prop=True)
    

def onnx_make_fixed(input_path: str, output_path: str, input_shape: tuple[int, ...]):
    simplified, success = onnxsim.simplify(input_path)
    if not success:
        raise RuntimeError(f"Failed to simplify {input_path}")
    onnx.save(simplified, output_path, save_as_external_data=True, all_tensors_to_one_file=False)
    infer_shapes_path(output_path, check_type=True, strict_mode=True, data_prop=True)
    model = onnx.load_model(output_path)
    make_input_shape_fixed(model.graph, model.graph.input[0].name, input_shape)
    fix_output_shapes(model)
    onnx.save(model, output_path, save_as_external_data=True, all_tensors_to_one_file=False)
    infer_shapes_path(output_path, check_type=True, strict_mode=True, data_prop=True)


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
        self.cache_dir = os.path.join(os.environ["CACHE_DIR"], self.model_name)
        
    def download(self) -> str:
        model_path = os.path.join(self.cache_dir, self.task, "model.onnx")
        if not os.path.isfile(model_path):
            print(f"Downloading {self.model_name}...")
            snapshot_download(self.repo_name, cache_dir=self.cache_dir, local_dir=self.cache_dir, local_dir_use_symlinks=False)
        return model_path

    def to_onnx_static(self) -> str:
        onnx_path_original = self.download()
        static_dir = os.path.join(self.cache_dir, self.task, "static")
        os.makedirs(static_dir, exist_ok=True)
        
        static_path = os.path.join(static_dir, "model.onnx")
        if not os.path.isfile(static_path):
            print(f"Making {self.model_name} ({self.task}) static")
            onnx_make_fixed(onnx_path_original, static_path, self.input_shape)
            onnx_transpose_4d(static_path)
        static_model = onnx.load_model(static_path)
        self.inputs = [input_.name for input_ in static_model.graph.input]
        self.outputs = [output_.name for output_ in static_model.graph.output]
        return static_path
    
    def to_tflite(self, output_dir: str) -> tuple[str, str]:
        input_path = self.to_onnx_static()
        tflite_fp32 = os.path.join(output_dir, "model_float32.tflite")
        tflite_fp16 = os.path.join(output_dir, "model_float16.tflite")
        if not os.path.isfile(tflite_fp32) or not os.path.isfile(tflite_fp16):
            print(f"Exporting {self.model_name} ({self.task}) to TFLite (this might take a few minutes)")
            onnx2tf.convert(
                input_onnx_file_path=input_path,
                output_folder_path=output_dir,
                keep_shape_absolutely_input_names=self.inputs,
                verbosity="warn",
                copy_onnx_input_output_names_to_tflite=True,
                output_signaturedefs=True,
            )
        
        return tflite_fp32, tflite_fp16

    def to_armnn(self, output_dir: str) -> tuple[str, str]:
        output_dir = os.path.abspath(output_dir)
        tflite_model_dir = os.path.join(output_dir, "tflite")
        tflite_fp32, tflite_fp16 = self.to_tflite(tflite_model_dir)
        
        fp16_dir = os.path.join(output_dir, "fp16")
        os.makedirs(fp16_dir, exist_ok=True)
        armnn_fp32 = os.path.join(output_dir, "model.armnn")
        armnn_fp16 = os.path.join(fp16_dir, "model.armnn")
        
        args = ["./armnnconverter", "-f", "tflite-binary"]
        for input_ in self.inputs:
            args.extend(["-i", input_])
        for output_ in self.outputs:
            args.extend(["-o", output_])
            
        fp32_args = args.copy()
        fp32_args.extend(["-m", tflite_fp32, "-p", armnn_fp32])
        
        print(f"Exporting {self.model_name} ({self.task}) to ARM NN with fp32 precision")
        try:
            print(subprocess.check_output(fp32_args, stderr=subprocess.STDOUT).decode())
        except subprocess.CalledProcessError as e:
            print(e.output.decode())
            try:
                rmtree(tflite_model_dir, ignore_errors=True)
            finally:
                raise e
        print(f"Finished exporting {self.model_name} ({self.task}) with fp32 precision")
        
        fp16_args = args.copy()
        fp16_args.extend(["-m", tflite_fp16, "-p", armnn_fp16])
            
        print(f"Exporting {self.model_name} ({self.task}) to ARM NN with fp16 precision")
        try:
            print(subprocess.check_output(fp16_args, stderr=subprocess.STDOUT).decode())
        except subprocess.CalledProcessError as e:
            print(e.output.decode())
            try:
                rmtree(tflite_model_dir, ignore_errors=True)
            finally:
                raise e
        print(f"Finished exporting {self.model_name} ({self.task}) with fp16 precision")
        
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
    hf_token = os.environ.get("HF_AUTH_TOKEN")
    if hf_token:
        login(token=hf_token)
    os.environ["LD_LIBRARY_PATH"] = "armnn"
    failed: list[Callable[[], ExportBase]] = [
        lambda: OpenClipVisual("ViT-H-14-378-quickgelu", (1, 3, 378, 378), pretrained="dfn5b"), # flatbuffers: cannot grow buffer beyond 2 gigabytes (will probably work with fp16)
        lambda: OpenClipVisual("ViT-H-14-quickgelu", (1, 3, 224, 224), pretrained="dfn5b"), # flatbuffers: cannot grow buffer beyond 2 gigabytes (will probably work with fp16)
        lambda: OpenClipTextual("nllb-clip-base-siglip", (1, 77), pretrained="v1"), # ERROR (tinynn.converter.base) Unsupported ops: aten::logical_not
        lambda: OpenClipTextual("nllb-clip-large-siglip", (1, 77), pretrained="v1"), # ERROR (tinynn.converter.base) Unsupported ops: aten::logical_not
        lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="laion400m_e31"),
        lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="laion400m_e31"),
        lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="laion400m_e32"),
        lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="laion400m_e32"),
        lambda: OpenClipVisual("ViT-L-14", (1, 3, 224, 224), pretrained="laion2b-s32b-b82k"),
        lambda: OpenClipTextual("ViT-L-14", (1, 77), pretrained="laion2b-s32b-b82k"),
        lambda: OpenClipVisual("ViT-H-14", (1, 3, 224, 224), pretrained="laion2b-s32b-b79k"),
        lambda: OpenClipTextual("ViT-H-14", (1, 77), pretrained="laion2b-s32b-b79k"),
        lambda: OpenClipVisual("ViT-g-14", (1, 3, 224, 224), pretrained="laion2b-s12b-b42k"),
        lambda: OpenClipTextual("ViT-g-14", (1, 77), pretrained="laion2b-s12b-b42k"),
        lambda: OpenClipVisual("XLM-Roberta-Large-Vit-B-16Plus", (1, 3, 240, 240)),
        lambda: OpenClipVisual("XLM-Roberta-Large-ViT-H-14", (1, 3, 224, 224), pretrained="frozen_laion5b_s13b_b90k"),
        lambda: OpenClipVisual("nllb-clip-base-siglip", (1, 3, 384, 384), pretrained="v1"),
        lambda: OpenClipVisual("nllb-clip-large-siglip", (1, 3, 384, 384), pretrained="v1"),
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
        # lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion2b_e16"),
        # lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion2b_e16"),
        # lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion400m_e31"),
        # lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion400m_e31"),
        # lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion400m_e32"),
        # lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion400m_e32"),
        # lambda: OpenClipVisual("ViT-B-32", (1, 3, 224, 224), pretrained="laion2b-s34b-b79k"),
        # lambda: OpenClipTextual("ViT-B-32", (1, 77), pretrained="laion2b-s34b-b79k"),
        # lambda: OpenClipVisual("ViT-B-16", (1, 3, 224, 224), pretrained="laion400m_e31"),
        # lambda: OpenClipTextual("ViT-B-16", (1, 77), pretrained="laion400m_e31"),
        # lambda: OpenClipVisual("ViT-B-16", (1, 3, 224, 224), pretrained="laion400m_e32"),
        # lambda: OpenClipTextual("ViT-B-16", (1, 77), pretrained="laion400m_e32"),
        # lambda: OpenClipVisual("ViT-B-16-plus-240", (1, 3, 240, 240), pretrained="laion400m_e31"),
        # lambda: OpenClipTextual("ViT-B-16-plus-240", (1, 77), pretrained="laion400m_e31"),
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
            if hf_token and os.path.isfile(armnn_fp32):
                print(f"Uploading {model.model_name} ({model.task}) ARM NN model with fp32 precision")
                upload_file(path_or_fileobj=armnn_fp32, path_in_repo=relative_fp32, repo_id=model.repo_name)
                print(f"Finished uploading {model.model_name} ({model.task}) ARM NN model with fp32 precision")
            if hf_token and os.path.isfile(armnn_fp16):
                print(f"Uploading {model.model_name} ({model.task}) ARM NN model with fp16 precision")
                upload_file(path_or_fileobj=armnn_fp16, path_in_repo=relative_fp16, repo_id=model.repo_name)
                print(f"Finished uploading {model.model_name} ({model.task}) ARM NN model with fp16 precision")
        except Exception as exc:
            print(f"Failed to export {model.model_name} ({model.task}): {exc}")
            raise exc


if __name__ == "__main__":
    main()
