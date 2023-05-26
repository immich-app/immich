import torch  # note: this must be called before onnxruntime if using cuda, as ort relies on the cuda libraries loaded by torch
import onnxruntime as ort
from onnx.utils import extract_model
import onnx
from onnxsim import simplify
from insightface.app import FaceAnalysis
from optimum.pipelines import pipeline
from optimum.onnxruntime import ORTModelForImageClassification
from transformers import AutoImageProcessor
from optimum.exporters.onnx import main_export
from pathlib import Path
import os


cache_folder = os.getenv("MACHINE_LEARNING_CACHE_FOLDER", "/cache")
device = "cuda" if "CUDAExecutionProvider" in ort.get_available_providers() else "cpu"
providers = (
    ["CUDAExecutionProvider", "CPUExecutionProvider"]
    if device == "cuda"
    else ["CPUExecutionProvider"]
)


def get_model_dir(model_name: str, task: str):
    return Path(cache_folder, task, model_name)


def init_image_classifier(model_name: str):
    image_classifier_dir = get_model_dir(model_name, "image-classification")

    if not image_classifier_dir.exists():
        export_hf_model(
            model_name, task="image-classification", model_dir=image_classifier_dir
        )

    processor = AutoImageProcessor.from_pretrained(model_name)
    image_classifier = ORTModelForImageClassification.from_pretrained(
        image_classifier_dir, provider=providers[0], use_io_binding=False
    )

    image_classifier_pipeline = pipeline(
        model=image_classifier,
        feature_extractor=processor,
        image_processor=processor,
        task="image-classification",
    )

    return image_classifier_pipeline


def init_facial_recognition(model_name: str):
    model_dir = get_model_dir(model_name, "facial-recognition")
    face_model = FaceAnalysis(
        name=model_name,
        root=model_dir.as_posix(),
        allowed_modules=["detection", "recognition"],
        providers=providers,
    )
    face_model.prepare(ctx_id=0, det_size=(640, 640))
    return face_model


def init_clip_vision(model_name: str) -> ort.InferenceSession:
    model_dir = get_model_dir(model_name, "default")
    full_model = Path(model_dir, "model.onnx")
    vision_model = Path(model_dir, "vision_model.onnx")

    if not full_model.exists():
        export_hf_model(model_name, "default", model_dir)
    if not vision_model.exists():
        extract_model(
            full_model.as_posix(),
            output_path=vision_model.as_posix(),
            input_names=["pixel_values"],
            output_names=["image_embeds"],
        )

    return start_inference_session(vision_model)


def init_clip_text(model_name: str) -> ort.InferenceSession:
    model_dir = get_model_dir(model_name, "default")
    full_model = Path(model_dir, "model.onnx")
    text_model = Path(model_dir, "text_model.onnx")

    if not full_model.exists():
        export_hf_model(model_name, "default", model_dir)
    if not text_model.exists():
        extract_model(
            full_model.as_posix(),
            output_path=text_model.as_posix(),
            input_names=["input_ids", "attention_mask"],
            output_names=["text_embeds"],
        )

    return start_inference_session(text_model)


def start_inference_session(model_path: Path | str):
    if isinstance(model_path, Path):
        model_path = model_path.as_posix()
    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    return ort.InferenceSession(
        model_path, providers=providers, sess_options=sess_options
    )


def export_hf_model(model_name: str, task: str, model_dir=None):
    if model_dir is None:
        model_dir = get_model_dir(model_name, task)
    else:
        model_dir = Path(model_dir)

    main_export(
        model_name,
        output=model_dir,
        task=task,
    )

    model_path = Path(model_dir, "model.onnx")
    model_proto = onnx.load(model_path.open("rb"))

    # this applies more general optimizations that work cross-platform
    # any device-specific optimizations should be distinguished from the original model
    model_proto, _ = simplify(model_proto, include_subgraph=True)
    onnx.save(model_proto, model_path.as_posix())
