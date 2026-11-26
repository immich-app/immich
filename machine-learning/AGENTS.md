# machine-learning/AGENTS.md

Python 3.12 FastAPI service running ONNX models for CLIP, facial recognition and OCR, managed with uv.

## Rules

- Install with `uv sync --extra cpu`; run tools through `uv run` or the mise tasks.
- `mise //machine-learning:check` is `mypy --strict`, and ruff enforces line length 120. Code must pass both.
- `immich_ml/main.py` is the app (`/predict`, `/ping`); `pipeline.py` composes the Clip, FacialRecognition and Ocr pipelines.

## Skills

- **Add or change a model**: models live in `immich_ml/models/{clip,facial_recognition,ocr}/` and extend `InferenceModel` in `models/base.py`, which downloads weights with Hugging Face `snapshot_download` into the cache folder. Loaded models are kept in `models/cache.py` `ModelCache`, keyed by class, name and graph, with TTL eviction. Execution backends (ONNX Runtime, RKNN, Arm NN) are in `immich_ml/sessions/`.
- **Run tests**: everything is in `test_main.py`. One class with `uv run pytest test_main.py -k TestCache`, one test with `test_main.py::TestCLIP::test_name`. `mise //machine-learning:test-full` downloads real models and runs the prediction endpoint tests.
