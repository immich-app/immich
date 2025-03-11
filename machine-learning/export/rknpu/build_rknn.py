import argparse
from pathlib import Path

from rknn.api import RKNN

parser = argparse.ArgumentParser("ONNX to RKNN model converter")
parser.add_argument(
    "model", help="Directory of the model that will be exported to RKNN ex:ViT-B-32__openai.", type=Path
)
parser.add_argument("target_platform", help="target platform ex:rk3566", type=str)
args = parser.parse_args()


def ConvertModel(model_dir: Path, target_platform: str, dynamic_input=None):
    input_path = model_dir / "model.onnx"
    print(f"Converting model {input_path}")
    rknn = RKNN(verbose=False)

    rknn.config(
        target_platform=target_platform,
        dynamic_input=dynamic_input,
        enable_flash_attention=True,
        # remove_reshape=True,
        # model_pruning=True
    )
    ret = rknn.load_onnx(model=input_path.as_posix())

    if ret != 0:
        print("Load failed!")
        exit(ret)

    ret = rknn.build(do_quantization=False)

    if ret != 0:
        print("Build failed!")
        exit(ret)

    output_path = model_dir / "rknpu" / target_platform / "model.rknn"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Exporting model {model_dir} to {output_path}")
    ret = rknn.export_rknn(output_path.as_posix())
    if ret != 0:
        print("Export rknn model failed!")
        exit(ret)


textual = args.model / "textual"
visual = args.model / "visual"
detection = args.model / "detection"
recognition = args.model / "recognition"

is_dir = [textual.is_dir(), visual.is_dir(), detection.is_dir(), recognition.is_dir()]
if not any(is_dir):
    print("Unknown model")
    exit(1)

is_textual, is_visual, is_detection, is_recognition = is_dir

if is_textual:
    ConvertModel(textual, target_platform=args.target_platform)

if is_visual:
    ConvertModel(visual, target_platform=args.target_platform)

if is_detection:
    ConvertModel(detection, args.target_platform, [[[1, 3, 640, 640]]])

if is_recognition:
    ConvertModel(recognition, args.target_platform, [[[1, 3, 112, 112]]])
