import gc
import os
from pathlib import Path
from tempfile import TemporaryDirectory

import torch
from huggingface_hub import create_repo, upload_folder
from models import mclip, openclip
from models.optimize import optimize
from rich.progress import Progress

models = [
    "M-CLIP/LABSE-Vit-L-14",
    "M-CLIP/XLM-Roberta-Large-Vit-B-16Plus",
    "M-CLIP/XLM-Roberta-Large-Vit-B-32",
    "M-CLIP/XLM-Roberta-Large-Vit-L-14",
    "RN101::openai",
    "RN101::yfcc15m",
    "RN50::cc12m",
    "RN50::openai",
    "RN50::yfcc15m",
    "RN50x16::openai",
    "RN50x4::openai",
    "RN50x64::openai",
    "ViT-B-16-SigLIP-256::webli",
    "ViT-B-16-SigLIP-384::webli",
    "ViT-B-16-SigLIP-512::webli",
    "ViT-B-16-SigLIP-i18n-256::webli",
    "ViT-B-16-SigLIP::webli",
    "ViT-B-16-plus-240::laion400m_e31",
    "ViT-B-16-plus-240::laion400m_e32",
    "ViT-B-16::laion400m_e31",
    "ViT-B-16::laion400m_e32",
    "ViT-B-16::openai",
    "ViT-B-32::laion2b-s34b-b79k",
    "ViT-B-32::laion2b_e16",
    "ViT-B-32::laion400m_e31",
    "ViT-B-32::laion400m_e32",
    "ViT-B-32::openai",
    "ViT-H-14-378-quickgelu::dfn5b",
    "ViT-H-14-quickgelu::dfn5b",
    "ViT-H-14::laion2b-s32b-b79k",
    "ViT-L-14-336::openai",
    "ViT-L-14-quickgelu::dfn2b",
    "ViT-L-14::laion2b-s32b-b82k",
    "ViT-L-14::laion400m_e31",
    "ViT-L-14::laion400m_e32",
    "ViT-L-14::openai",
    "ViT-L-16-SigLIP-256::webli",
    "ViT-L-16-SigLIP-384::webli",
    "ViT-SO400M-14-SigLIP-384::webli",
    "ViT-g-14::laion2b-s12b-b42k",
    "nllb-clip-base-siglip::mrl",
    "nllb-clip-base-siglip::v1",
    "nllb-clip-large-siglip::mrl",
    "nllb-clip-large-siglip::v1",
    "xlm-roberta-base-ViT-B-32::laion5b_s13b_b90k",
    "xlm-roberta-large-ViT-H-14::frozen_laion5b_s13b_b90k",
]

# glob to delete old UUID blobs when reuploading models
uuid_char = "[a-fA-F0-9]"
uuid_glob = uuid_char * 8 + "-" + uuid_char * 4 + "-" + uuid_char * 4 + "-" + uuid_char * 4 + "-" + uuid_char * 12

# remote repo files to be deleted before uploading
# deletion is in the same commit as the upload, so it's atomic
delete_patterns = ["**/*onnx*", "**/Constant*", "**/*.weight", "**/*.bias", f"**/{uuid_glob}"]

with Progress() as progress:
    task = progress.add_task("[green]Exporting models...", total=len(models))
    token = os.environ.get("HF_AUTH_TOKEN")
    torch.backends.mha.set_fastpath_enabled(False)
    with TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        for model in models:
            model_name = model.split("/")[-1].replace("::", "__")
            hf_model_name = model_name.replace("xlm-roberta-large", "XLM-Roberta-Large")
            hf_model_name = model_name.replace("xlm-roberta-base", "XLM-Roberta-Base")
            config_path = tmpdir / model_name / "config.json"

            def export() -> None:
                progress.update(task, description=f"[green]Exporting {hf_model_name}")
                visual_dir = tmpdir / hf_model_name / "visual"
                textual_dir = tmpdir / hf_model_name / "textual"
                if model.startswith("M-CLIP"):
                    visual_path, textual_path = mclip.to_onnx(model, visual_dir, textual_dir)
                else:
                    name, _, pretrained = model_name.partition("__")
                    config = openclip.OpenCLIPModelConfig(name, pretrained)
                    visual_path, textual_path = openclip.to_onnx(config, visual_dir, textual_dir)
                progress.update(task, description=f"[green]Optimizing {hf_model_name} (visual)")
                optimize(visual_path)
                progress.update(task, description=f"[green]Optimizing {hf_model_name} (textual)")
                optimize(textual_path)

                gc.collect()

            def upload() -> None:
                progress.update(task, description=f"[yellow]Uploading {hf_model_name}")
                repo_id = f"immich-app/{hf_model_name}"

                create_repo(repo_id, exist_ok=True)
                upload_folder(
                    repo_id=repo_id,
                    folder_path=tmpdir / hf_model_name,
                    delete_patterns=delete_patterns,
                    token=token,
                )

            export()
            if token is not None:
                upload()
            progress.update(task, advance=1)
