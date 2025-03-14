from pathlib import Path

import typer
from exporters.constants import DELETE_PATTERNS, SOURCE_TO_METADATA, ModelSource
from exporters.onnx import export as onnx_export
from exporters.rknn import export as rknn_export
from tenacity import retry, stop_after_attempt, wait_fixed
from typing_extensions import Annotated

app = typer.Typer(pretty_exceptions_show_locals=False)


def generate_readme(model_name: str, model_source: ModelSource) -> str:
    (name, link, type) = SOURCE_TO_METADATA[model_source]
    match model_source:
        case ModelSource.MCLIP:
            tags = ["immich", "clip", "multilingual"]
        case ModelSource.OPENCLIP:
            tags = ["immich", "clip"]
            lowered = model_name.lower()
            if "xlm" in lowered or "nllb" in lowered:
                tags.append("multilingual")
        case ModelSource.INSIGHTFACE:
            tags = ["immich", "facial-recognition"]
        case _:
            raise ValueError(f"Unsupported model source {model_source}")

    return f"""---
tags:
{" - " + "\n - ".join(tags)}
---
# Model Description

This repo contains ONNX exports for the associated {type} model by {name}. See the [{name}]({link}) repo for more info.

This repo is specifically intended for use with [Immich](https://immich.app/), a self-hosted photo library.
"""


@app.command()
def main(
    model_name: str,
    model_source: ModelSource,
    output_dir: Path = Path("./models"),
    no_cache: bool = False,
    hf_organization: str = "immich-app",
    hf_auth_token: Annotated[str | None, typer.Option(envvar="HF_AUTH_TOKEN")] = None,
):
    hf_model_name = model_name.split("/")[-1]
    hf_model_name = hf_model_name.replace("xlm-roberta-large", "XLM-Roberta-Large")
    hf_model_name = hf_model_name.replace("xlm-roberta-base", "XLM-Roberta-Base")
    output_dir = output_dir / hf_model_name
    match model_source:
        case ModelSource.MCLIP | ModelSource.OPENCLIP:
            output_dir.mkdir(parents=True, exist_ok=True)
            onnx_export(model_name, model_source, output_dir, no_cache=no_cache)
        case ModelSource.INSIGHTFACE:
            from huggingface_hub import snapshot_download

            # TODO: start from insightface dump instead of downloading from HF
            snapshot_download(f"immich-app/{hf_model_name}", local_dir=output_dir)
        case _:
            raise ValueError(f"Unsupported model source {model_source}")

    try:
        rknn_export(output_dir, no_cache=no_cache)
    except Exception as e:
        print(f"Failed to export model {model_name} to rknn: {e}")
        (output_dir / "rknpu").unlink(missing_ok=True)

    readme_path = output_dir / "README.md"
    if no_cache or not readme_path.exists():
        with open(readme_path, "w") as f:
            f.write(generate_readme(model_name, model_source))

    if hf_auth_token is not None:
        from huggingface_hub import create_repo, upload_folder

        repo_id = f"{hf_organization}/{hf_model_name}"

        @retry(stop=stop_after_attempt(5), wait=wait_fixed(5))
        def upload_model():
            create_repo(repo_id, exist_ok=True, token=hf_auth_token)
            upload_folder(
                repo_id=repo_id,
                folder_path=output_dir,
                # remote repo files to be deleted before uploading
                # deletion is in the same commit as the upload, so it's atomic
                delete_patterns=DELETE_PATTERNS,
                token=hf_auth_token,
            )

        upload_model()


if __name__ == "__main__":
    typer.run(main)
