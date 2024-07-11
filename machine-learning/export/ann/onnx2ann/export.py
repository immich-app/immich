import os
import subprocess
from enum import StrEnum

from onnx2ann.helpers import onnx_make_armnn_compatible, onnx_make_inputs_fixed


class ModelType(StrEnum):
    VISUAL = "visual"
    TEXTUAL = "textual"
    RECOGNITION = "recognition"
    DETECTION = "detection"


class Precision(StrEnum):
    FLOAT16 = "float16"
    FLOAT32 = "float32"


class Exporter:
    def __init__(
        self,
        model_name: str,
        model_type: str,
        input_shapes: list[tuple[int, ...]],
        optimization_level: int = 5,
        cache_dir: str = os.environ.get("CACHE_DIR", "~/.cache/huggingface"),
        force_export: bool = False,
    ):
        self.model_name = model_name.split("/")[-1]
        self.model_type = model_type
        self.optimize = optimization_level
        self.input_shapes = input_shapes
        self.cache_dir = os.path.join(cache_dir, self.repo_name)
        self.force_export = force_export

    def download(self) -> str:
        model_path = os.path.join(self.cache_dir, self.model_type, "model.onnx")
        if os.path.isfile(model_path):
            print(f"Model is already downloaded at {model_path}")
            return model_path
        from huggingface_hub import snapshot_download

        snapshot_download(
            self.repo_name, cache_dir=self.cache_dir, local_dir=self.cache_dir, local_dir_use_symlinks=False
        )
        return model_path

    def to_onnx_static(self, precision: Precision) -> str:
        import onnx
        from onnxconverter_common import float16
        onnx_path_original = self.download()
        static_dir = os.path.join(self.cache_dir, self.model_type, "static")

        static_path = os.path.join(static_dir, f"model.onnx")
        if self.force_export and not os.path.isfile(static_path):
            print(f"Making {self} static")
            os.makedirs(static_dir, exist_ok=True)
            onnx_make_inputs_fixed(onnx_path_original, static_path, self.input_shapes)
            onnx_make_armnn_compatible(static_path)
            print(f"Finished making {self} static")

        model = onnx.load(static_path)
        self.inputs = [input_.name for input_ in model.graph.input]
        self.outputs = [output_.name for output_ in model.graph.output]
        if precision == Precision.FLOAT16:
            static_path = os.path.join(static_dir, f"model_{precision}.onnx")
            print(f"Converting {self} to {precision} precision")
            model = float16.convert_float_to_float16(model, keep_io_types=True, disable_shape_infer=True)
            onnx.save(model, static_path)
            print(f"Finished converting {self} to {precision} precision")
        # self.inputs, self.outputs = onnx_get_inputs_outputs(static_path)
        return static_path

    def to_tflite(self, output_dir: str, precision: Precision) -> str:
        onnx_model = self.to_onnx_static(precision)
        tflite_dir = os.path.join(output_dir, precision)
        tflite_model = os.path.join(tflite_dir, f"model_{precision}.tflite")
        if self.force_export or not os.path.isfile(tflite_model):
            import onnx2tf

            print(f"Exporting {self} to TFLite with {precision} precision (this might take a few minutes)")
            onnx2tf.convert(
                input_onnx_file_path=onnx_model,
                output_folder_path=tflite_dir,
                keep_shape_absolutely_input_names=self.inputs,
                # verbosity="warn",
                copy_onnx_input_output_names_to_tflite=True,
                output_signaturedefs=True,
                not_use_onnxsim=True,
            )
            print(f"Finished exporting {self} to TFLite with {precision} precision")

        return tflite_model

    def to_armnn(self, output_dir: str, precision: Precision) -> tuple[str, str]:
        armnn_model = os.path.join(output_dir, "model.armnn")
        if not self.force_export and os.path.isfile(armnn_model):
            return armnn_model

        tflite_model_dir = os.path.join(output_dir, "tflite")
        tflite_model = self.to_tflite(tflite_model_dir, precision)

        args = ["./armnnconverter", "-f", "tflite-binary", "-m", tflite_model, "-p", armnn_model]
        args.append("-i")
        args.extend(self.inputs)
        args.append("-o")
        args.extend(self.outputs)

        print(f"Exporting {self} to ARM NN with {precision} precision")
        try:
            if (stdout := subprocess.check_output(args, stderr=subprocess.STDOUT).decode()):
                print(stdout)
            print(f"Finished exporting {self} to ARM NN with {precision} precision")
        except subprocess.CalledProcessError as e:
            print(e.output.decode())
            try:
                from shutil import rmtree

                rmtree(tflite_model_dir, ignore_errors=True)
            finally:
                raise e

    @property
    def repo_name(self) -> str:
        return f"immich-app/{self.model_name}"

    def __repr__(self) -> str:
        return f"{self.model_name} ({self.model_type})"
