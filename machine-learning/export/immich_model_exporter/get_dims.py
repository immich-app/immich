import json
from pathlib import Path

models_dir = Path("models")
model_to_embed_dim = {}
for model_dir in models_dir.iterdir():
    if not model_dir.is_dir():
        continue

    config_path = model_dir / "config.json"
    if not config_path.exists():
        print(f"Skipping {model_dir.name} as it does not have a config.json")
        continue
    with open(config_path) as f:
        config = json.load(f)
        embed_dim = config.get("embed_dim")
        if embed_dim is None:
            print(f"Skipping {model_dir.name} as it does not have an embed_dim")
            continue
        print(f"{model_dir.name}: {embed_dim}")
        model_to_embed_dim[model_dir.name] = {"dimSize": embed_dim}
print(json.dumps(model_to_embed_dim))
