import os
import platform
from typing import Annotated, Optional

import typer

from onnx2ann.export import Exporter, ModelType, Precision

app = typer.Typer(add_completion=False, pretty_exceptions_show_locals=False)


@app.command()
def export(
    model_name: Annotated[
        str, typer.Argument(..., help="The name of the model to be exported as it exists in Hugging Face.")
    ],
    model_type: Annotated[ModelType, typer.Option(..., "--type", "-t", help="The type of model to be exported.")],
    input_shapes: Annotated[
        list[str],
        typer.Option(
            ...,
            "--input-shape",
            "-s",
            help="The shape of an input tensor to the model, each dimension separated by commas. "
            "Multiple shapes can be provided for multiple inputs.",
        ),
    ],
    precision: Annotated[
        Precision,
        typer.Option(
            ...,
            "--precision",
            "-p",
            help="The precision of the exported model. `float16` requires a GPU.",
        ),
    ] = Precision.FLOAT32,
    cache_dir: Annotated[
        str,
        typer.Option(
            ...,
            "--cache-dir",
            "-c",
            help="Directory where pre-export models will be stored.",
            envvar="CACHE_DIR",
            show_envvar=True,
        ),
    ] = "~/.cache/huggingface",
    output_dir: Annotated[
        str,
        typer.Option(
            ...,
            "--output-dir",
            "-o",
            help="Directory where exported models will be stored.",
        ),
    ] = "output",
    auth_token: Annotated[
        Optional[str],
        typer.Option(
            ...,
            "--auth-token",
            "-t",
            help="If uploading models to Hugging Face, the auth token of the user or organisation.",
            envvar="HF_AUTH_TOKEN",
            show_envvar=True,
        ),
    ] = None,
    force_export: Annotated[
        bool,
        typer.Option(
            ...,
            "--force-export",
            "-f",
            help="Export the model even if an exported model already exists in the output directory.",
        ),
    ] = False,
) -> None:
    if platform.machine() not in ("x86_64", "AMD64"):
        msg = f"Can only run on x86_64 / AMD64, not {platform.machine()}"
        raise RuntimeError(msg)
    os.environ.setdefault("LD_LIBRARY_PATH", "armnn")
    parsed_input_shapes = [tuple(map(int, shape.split(","))) for shape in input_shapes]
    model = Exporter(
        model_name, model_type, input_shapes=parsed_input_shapes, cache_dir=cache_dir, force_export=force_export
    )
    model_dir = os.path.join("output", model_name)
    output_dir = os.path.join(model_dir, model_type)
    armnn_model = model.to_armnn(output_dir, precision)

    if not auth_token:
        return

    from huggingface_hub import upload_file

    relative_path = os.path.relpath(armnn_model, start=model_dir)
    upload_file(path_or_fileobj=armnn_model, path_in_repo=relative_path, repo_id=model.repo_name, token=auth_token)


app()
