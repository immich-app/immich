from pathlib import Path

from .constants import RKNN_SOCS


def _export_platform(
    model_dir: Path,
    target_platform: str,
    inputs: list[str] | None = None,
    input_size_list: list[list[int]] | None = None,
    fuse_matmul_softmax_matmul_to_sdpa: bool = True,
    cache: bool = True,
) -> None:
    from rknn.api import RKNN

    input_path = model_dir / "model.onnx"
    output_path = model_dir / "rknpu" / target_platform / "model.rknn"
    if cache and output_path.exists():
        print(f"Model {input_path} already exists at {output_path}, skipping")
        return

    print(f"Exporting model {input_path} to {output_path}")

    rknn = RKNN(verbose=False)

    rknn.config(
        target_platform=target_platform,
        disable_rules=["fuse_matmul_softmax_matmul_to_sdpa"] if not fuse_matmul_softmax_matmul_to_sdpa else [],
        enable_flash_attention=False,
        model_pruning=True,
    )
    ret = rknn.load_onnx(model=input_path.as_posix(), inputs=inputs, input_size_list=input_size_list)

    if ret != 0:
        raise RuntimeError("Load failed!")

    ret = rknn.build(do_quantization=False)

    if ret != 0:
        raise RuntimeError("Build failed!")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    ret = rknn.export_rknn(output_path.as_posix())
    if ret != 0:
        raise RuntimeError("Export rknn model failed!")


def _export_platforms(
    model_dir: Path,
    inputs: list[str] | None = None,
    input_size_list: list[list[int]] | None = None,
    cache: bool = True,
) -> None:
    fuse_matmul_softmax_matmul_to_sdpa = True
    for soc in RKNN_SOCS:
        try:
            _export_platform(
                model_dir,
                soc,
                inputs=inputs,
                input_size_list=input_size_list,
                fuse_matmul_softmax_matmul_to_sdpa=fuse_matmul_softmax_matmul_to_sdpa,
                cache=cache,
            )
        except Exception as e:
            print(f"Failed to export model for {soc}: {e}")
            if "inputs or 'outputs' must be set" in str(e):
                print("Retrying without fuse_matmul_softmax_matmul_to_sdpa")
                fuse_matmul_softmax_matmul_to_sdpa = False
                _export_platform(
                    model_dir,
                    soc,
                    inputs=inputs,
                    input_size_list=input_size_list,
                    fuse_matmul_softmax_matmul_to_sdpa=fuse_matmul_softmax_matmul_to_sdpa,
                    cache=cache,
                )


def export(model_dir: Path, cache: bool = True) -> None:
    textual = model_dir / "textual"
    visual = model_dir / "visual"
    detection = model_dir / "detection"
    recognition = model_dir / "recognition"

    if textual.is_dir():
        _export_platforms(textual, cache=cache)

    if visual.is_dir():
        _export_platforms(visual, cache=cache)

    if detection.is_dir():
        _export_platforms(detection, inputs=["input.1"], input_size_list=[[1, 3, 640, 640]], cache=cache)

    if recognition.is_dir():
        _export_platforms(recognition, inputs=["input.1"], input_size_list=[[1, 3, 112, 112]], cache=cache)
