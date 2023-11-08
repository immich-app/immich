import gc
import os
from pathlib import Path
from tempfile import TemporaryDirectory

from huggingface_hub import create_repo, login, upload_folder
from models import mclip, openclip
from rich.progress import Progress

models = [
    "RN50::openai",
    "RN50::yfcc15m",
    "RN50::cc12m",
    "RN101::openai",
    "RN101::yfcc15m",
    "RN50x4::openai",
    "RN50x16::openai",
    "RN50x64::openai",
    "ViT-B-32::openai",
    "ViT-B-32::laion2b_e16",
    "ViT-B-32::laion400m_e31",
    "ViT-B-32::laion400m_e32",
    "ViT-B-32::laion2b-s34b-b79k",
    "ViT-B-16::openai",
    "ViT-B-16::laion400m_e31",
    "ViT-B-16::laion400m_e32",
    "ViT-B-16-plus-240::laion400m_e31",
    "ViT-B-16-plus-240::laion400m_e32",
    "ViT-L-14::openai",
    "ViT-L-14::laion400m_e31",
    "ViT-L-14::laion400m_e32",
    "ViT-L-14::laion2b-s32b-b82k",
    "ViT-L-14-336::openai",
    "ViT-H-14::laion2b-s32b-b79k",
    "ViT-g-14::laion2b-s12b-b42k",
    "M-CLIP/LABSE-Vit-L-14",
    "M-CLIP/XLM-Roberta-Large-Vit-B-32",
    "M-CLIP/XLM-Roberta-Large-Vit-B-16Plus",
    "M-CLIP/XLM-Roberta-Large-Vit-L-14",
]

login(token=os.environ["HF_AUTH_TOKEN"])

with Progress() as progress:
    task1 = progress.add_task("[green]Exporting models...", total=len(models))
    task2 = progress.add_task("[yellow]Uploading models...", total=len(models))

    with TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        for model in models:
            model_name = model.split("/")[-1].replace("::", "__")
            config_path = tmpdir / model_name / "config.json"

            def upload() -> None:
                progress.update(task2, description=f"[yellow]Uploading {model_name}")
                repo_id = f"immich-app/{model_name}"

                create_repo(repo_id, exist_ok=True)
                upload_folder(repo_id=repo_id, folder_path=tmpdir / model_name)
                progress.update(task2, advance=1)

            def export() -> None:
                progress.update(task1, description=f"[green]Exporting {model_name}")
                visual_dir = tmpdir / model_name / "visual"
                textual_dir = tmpdir / model_name / "textual"
                if model.startswith("M-CLIP"):
                    mclip.to_onnx(model, visual_dir, textual_dir)
                else:
                    name, _, pretrained = model_name.partition("__")
                    openclip.to_onnx(openclip.OpenCLIPModelConfig(name, pretrained), visual_dir, textual_dir)

                progress.update(task1, advance=1)
                gc.collect()

            export()
            upload()
