import gc
import os
from tempfile import TemporaryDirectory

from app.models.clip import OpenCLIPEncoder, MCLIPEncoder
from rich.progress import Progress

from huggingface_hub import upload_folder, upload_file, create_repo, login


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
]

login(token=os.environ["HF_AUTH_TOKEN"])

with Progress() as progress:
    task1 = progress.add_task(f"[green]Exporting models...", total=len(models))
    task2 = progress.add_task("[yellow]Uploading models...", total=len(models))
    
    with TemporaryDirectory() as tmpdir:
        for model in models:
            model_name = model.replace("::", "__")
            config_path = tmpdir / model_name / "config.json"

            def upload():
                progress.update(task2, description=f"[yellow]Uploading {model_name}")
                repo_id = f"immich-app/{model_name}"

                create_repo(repo_id, exist_ok=True)
                upload_folder(repo_id=repo_id, folder_path=tmpdir / model_name)
                upload_file(repo_id=repo_id, path_or_fileobj=config_path, path_in_repo="config.json")
                progress.update(task2, advance=1)

            def export():
                progress.update(task1, description=f"[green]Exporting {model_name}")

                if (model_name.startswith("M-CLIP")):
                    clip_encoder = MCLIPEncoder(model, cache_dir=tmpdir / model_name)
                else:
                    clip_encoder = OpenCLIPEncoder(model, cache_dir=tmpdir / model_name)
                clip_encoder.download()
                progress.update(task1, advance=1)
        
                del clip_encoder
                gc.collect()

            export()
            upload()
