from enum import StrEnum
import gc
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Optional

from huggingface_hub import create_repo, upload_folder
from export.models import mclip, openclip, insightface
from export.models.util import clean_name
from rich.progress import Progress
import typer


app = typer.Typer()


class ModelLibrary(StrEnum):
    MCLIP = "mclip"
    OPENCLIP = "openclip"
    INSIGHTFACE = "insightface"


def _export(model_name: str, library: ModelLibrary, export_dir: Path) -> None:
    visual_dir = export_dir / "visual"
    textual_dir = export_dir / "textual"
    match library:
        case ModelLibrary.MCLIP:
            insightface.to_onnx(model_name, visual_dir, textual_dir)
        case ModelLibrary.OPENCLIP:
            mclip.to_onnx(model_name, visual_dir, textual_dir)
        case ModelLibrary.INSIGHTFACE:
            name, _, pretrained = model_name.partition("__")
            openclip.to_onnx(openclip.OpenCLIPModelConfig(name, pretrained), visual_dir, textual_dir)

    gc.collect()


def _upload(repo_id: str, upload_dir: Path, auth_token: str | None = os.environ.get("HF_AUTH_TOKEN", None)) -> None:
    create_repo(repo_id, exist_ok=True, token=auth_token)
    upload_folder(repo_id=repo_id, folder_path=upload_dir, token=auth_token)


@app.command()
def export(
    models: list[str] = typer.Argument(
        ..., help="The model(s) to be exported. Model names should be the same as used in the associated library."
    ),
    library: ModelLibrary = typer.Option(
        ..., "--library", "-l", help="The library associated with the models to be exported."
    ),
    output_dir: Optional[Path] = typer.Option(
        None,
        "--output-dir",
        "-o",
        help="Directory where exported models will be stored. Defaults to a temporary directory.",
    ),
    should_upload: bool = typer.Option(False, "--upload", "-u", help="Whether to upload the exported models."),
    auth_token: Optional[str] = typer.Option(
        os.environ.get("HF_AUTH_TOKEN", None),
        "--auth_token",
        "-t",
        help="If uploading models to Hugging Face, the auth token of the user or organisation.",
    ),
    repo_prefix: str = typer.Option(
        "immich-app",
        "--repo_prefix",
        "-p",
        help="If uploading models to Hugging Face, the prefix to put before the model name. Can be a username or organisation.",
    ),
) -> None:
    if not models:
        raise ValueError("No models specified")

    with Progress() as progress:
        task1 = progress.add_task("[green]Exporting model(s)...", total=len(models))

        with TemporaryDirectory() as tmp:
            output_dir = output_dir if output_dir else Path(tmp)
            for model_name in models:
                cleaned_name = clean_name(model_name)
                model_dir = output_dir / cleaned_name
                progress.update(task1, description=f"[green]Exporting {cleaned_name}")
                _export(model_name, library, model_dir)
                progress.update(task1, advance=1, description=f"[green]Exported {cleaned_name}")

            if should_upload:
                upload(models, output_dir, auth_token, repo_prefix)


@app.command()
def upload(
    models: list[str] = typer.Argument(
        ..., help="The model(s) to be uploaded. Model names should be the same as used in the associated library."
    ),
    output_dir: Optional[Path] = typer.Option(
        None,
        "--output-dir",
        "-o",
        help="Directory where exported models will be stored. Defaults to a temporary directory.",
    ),
    auth_token: Optional[str] = typer.Option(
        os.environ.get("HF_AUTH_TOKEN", None),
        "--auth_token",
        "-t",
        help="The Hugging Face auth token of the user or organisation.",
    ),
    repo_prefix: str = typer.Option(
        "immich-app",
        "--repo_prefix",
        "-p",
        help="The name to put before the model name to form the Hugging Face repo name. Can be a username or organisation.",
    ),
) -> None:
    if not models:
        raise ValueError("No models specified")

    with Progress() as progress:
        task2 = progress.add_task("[yellow]Uploading models...", total=len(models))
        for model_name in models:
            cleaned_name = clean_name(model_name)
            repo_id = f"{repo_prefix}/{cleaned_name}"
            model_dir = output_dir / cleaned_name

            progress.update(task2, description=f"[yellow]Uploading {cleaned_name}")
            _upload(repo_id, model_dir, auth_token)
            progress.update(task2, advance=1, description=f"[yellow]Uploaded {cleaned_name}")


if __name__ == "__main__":
    app()
