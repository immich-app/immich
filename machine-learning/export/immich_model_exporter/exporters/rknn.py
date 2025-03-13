from pathlib import Path

from .constants import RKNN_SOCS


def _export_platform(
    model_dir: Path,
    target_platform: str,
    dynamic_input=None,
    fuse_matmul_softmax_matmul_to_sdpa: bool = True,
    no_cache: bool = False,
):
    from rknn.api import RKNN

    input_path = model_dir / "model.onnx"
    output_path = model_dir / "rknpu" / target_platform / "model.rknn"
    if not no_cache and output_path.exists():
        print(f"Model {input_path} already exists at {output_path}, skipping")
        return

    print(f"Exporting model {input_path} to {output_path}")

    rknn = RKNN(verbose=False)

    rknn.config(
        target_platform=target_platform,
        dynamic_input=dynamic_input,
        disable_rules=["fuse_matmul_softmax_matmul_to_sdpa"] if not fuse_matmul_softmax_matmul_to_sdpa else [],
        enable_flash_attention=False,
        model_pruning=True,
    )
    ret = rknn.load_onnx(model=input_path.as_posix())

    if ret != 0:
        raise RuntimeError("Load failed!")

    ret = rknn.build(do_quantization=False)

    if ret != 0:
        raise RuntimeError("Build failed!")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    ret = rknn.export_rknn(output_path.as_posix())
    if ret != 0:
        raise RuntimeError("Export rknn model failed!")


def _export_platforms(model_dir: Path, dynamic_input=None, no_cache: bool = False):
    fuse_matmul_softmax_matmul_to_sdpa = True
    for soc in RKNN_SOCS:
        try:
            _export_platform(model_dir, soc, dynamic_input, fuse_matmul_softmax_matmul_to_sdpa, no_cache=no_cache)
        except Exception as e:
            print(f"Failed to export model for {soc}: {e}")
            if "inputs or 'outputs' must be set" in str(e):
                print("Retrying without fuse_matmul_softmax_matmul_to_sdpa")
                fuse_matmul_softmax_matmul_to_sdpa = False
                _export_platform(model_dir, soc, dynamic_input, fuse_matmul_softmax_matmul_to_sdpa, no_cache=no_cache)


def export(model_dir: Path, no_cache: bool = False):
    textual = model_dir / "textual"
    visual = model_dir / "visual"
    detection = model_dir / "detection"
    recognition = model_dir / "recognition"

    if textual.is_dir():
        _export_platforms(textual, no_cache=no_cache)

    if visual.is_dir():
        _export_platforms(visual, no_cache=no_cache)

    if detection.is_dir():
        _export_platforms(detection, dynamic_input=[[[1, 3, 640, 640]]], no_cache=no_cache)

    if recognition.is_dir():
        _export_platforms(recognition, dynamic_input=[[[1, 3, 112, 112]]], no_cache=no_cache)
