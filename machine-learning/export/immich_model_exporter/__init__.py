import json
import resource
from pathlib import Path
from time import time

import typer
from tenacity import retry, stop_after_attempt, wait_fixed
from typing_extensions import Annotated

from .exporters.constants import DELETE_PATTERNS, SOURCE_TO_METADATA, ModelSource, ModelTask
from .exporters.onnx import export as onnx_export
from .exporters.rknn import export as rknn_export

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


def clean_name(model_name: str) -> str:
    hf_model_name = model_name.split("/")[-1]
    hf_model_name = hf_model_name.replace("xlm-roberta-large", "XLM-Roberta-Large")
    hf_model_name = hf_model_name.replace("xlm-roberta-base", "XLM-Roberta-Base")
    return hf_model_name


@app.command()
def export(model_name: str, model_source: ModelSource, output_dir: Path = Path("models"), cache: bool = True) -> None:
    hf_model_name = clean_name(model_name)
    output_dir = output_dir / hf_model_name
    match model_source:
        case ModelSource.MCLIP | ModelSource.OPENCLIP:
            output_dir.mkdir(parents=True, exist_ok=True)
            onnx_export(model_name, model_source, output_dir, cache=cache)
        case ModelSource.INSIGHTFACE:
            from huggingface_hub import snapshot_download

            # TODO: start from insightface dump instead of downloading from HF
            snapshot_download(f"immich-app/{hf_model_name}", local_dir=output_dir)
        case _:
            raise ValueError(f"Unsupported model source {model_source}")

    try:
        rknn_export(output_dir, cache=cache)
    except Exception as e:
        print(f"Failed to export model {model_name} to rknn: {e}")
        (output_dir / "rknpu").unlink(missing_ok=True)

    readme_path = output_dir / "README.md"
    if not (cache or readme_path.exists()):
        with open(readme_path, "w") as f:
            f.write(generate_readme(model_name, model_source))


@app.command()
def profile(model_dir: Path, model_task: ModelTask, output_path: Path) -> None:
    from timeit import timeit

    import numpy as np
    import onnxruntime as ort

    np.random.seed(0)

    sess_options = ort.SessionOptions()
    sess_options.enable_cpu_mem_arena = False
    providers = ["CPUExecutionProvider"]
    provider_options = [{"arena_extend_strategy": "kSameAsRequested"}]
    match model_task:
        case ModelTask.SEARCH:
            textual = ort.InferenceSession(
                model_dir / "textual" / "model.onnx",
                sess_options=sess_options,
                providers=providers,
                provider_options=provider_options,
            )
            tokens = {node.name: np.random.rand(*node.shape).astype(np.int32) for node in textual.get_inputs()}

            visual = ort.InferenceSession(
                model_dir / "visual" / "model.onnx",
                sess_options=sess_options,
                providers=providers,
                provider_options=provider_options,
            )
            image = {node.name: np.random.rand(*node.shape).astype(np.float32) for node in visual.get_inputs()}

            def predict() -> None:
                textual.run(None, tokens)
                visual.run(None, image)
        case ModelTask.FACIAL_RECOGNITION:
            detection = ort.InferenceSession(
                model_dir / "detection" / "model.onnx",
                sess_options=sess_options,
                providers=providers,
                provider_options=provider_options,
            )
            image = {node.name: np.random.rand(1, 3, 640, 640).astype(np.float32) for node in detection.get_inputs()}

            recognition = ort.InferenceSession(
                model_dir / "recognition" / "model.onnx",
                sess_options=sess_options,
                providers=providers,
                provider_options=provider_options,
            )
            face = {node.name: np.random.rand(1, 3, 112, 112).astype(np.float32) for node in recognition.get_inputs()}

            def predict() -> None:
                detection.run(None, image)
                recognition.run(None, face)
        case _:
            raise ValueError(f"Unsupported model task {model_task}")
    predict()
    ms = timeit(predict, number=100)
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    json.dump({"pretrained_model": model_dir.name, "peak_rss": rss, "exec_time_ms": ms}, output_path.open("w"))
    print(f"Model {model_dir.name} took {ms:.2f}ms per iteration using {rss / 1024:.2f}MiB of memory")


@app.command()
def upload(
    model_dir: Path,
    hf_organization: str = "immich-app",
    hf_auth_token: Annotated[str | None, typer.Option(envvar="HF_AUTH_TOKEN")] = None,
) -> None:
    from huggingface_hub import create_repo, upload_folder

    repo_id = f"{hf_organization}/{model_dir.name}"

    @retry(stop=stop_after_attempt(5), wait=wait_fixed(5))
    def upload_model() -> None:
        create_repo(repo_id, exist_ok=True, token=hf_auth_token)
        upload_folder(
            repo_id=repo_id,
            folder_path=model_dir,
            # remote repo files to be deleted before uploading
            # deletion is in the same commit as the upload, so it's atomic
            delete_patterns=DELETE_PATTERNS,
            token=hf_auth_token,
        )

    upload_model()
