from typing import Any
import torch  # note: this must be called before onnxruntime if using cuda, as ort relies on the cuda libraries loaded by torch
import onnxruntime as ort
from onnx.utils import extract_model
import onnx
from insightface.app import FaceAnalysis
from transformers.pipelines import pipeline
# from optimum.pipelines import pipeline
from optimum.onnxruntime import ORTModelForImageClassification
from transformers import AutoImageProcessor, AutoTokenizer, ImageClassificationPipeline
from optimum.exporters.onnx import main_export
from pathlib import Path
import os
from onnx_graphsurgeon import import_onnx, export_onnx
import warnings
from transformers import logging
logging.set_verbosity_error()

cache_folder = os.getenv("MACHINE_LEARNING_CACHE_FOLDER", "/cache")
device = "cuda" if "CUDAExecutionProvider" in ort.get_available_providers() else "cpu"
providers = (
    ["CUDAExecutionProvider", "CPUExecutionProvider"]
    if device == "cuda"
    else ["CPUExecutionProvider"]
)  # TODO possibly support more providers


def _get_model_dir(model_name: str, model_type: str) -> Path:
    return Path(cache_folder, device, model_type, model_name)


def _prepare_hf_model(model_name: str, task: str) -> Path:
    model_dir = _get_model_dir(model_name, task)
    if not model_dir.exists():
        export_hf_model(model_name, task, model_dir)

    return model_dir


def init_image_classifier(model_name: str) -> ImageClassificationPipeline:
    """
    Instantiates an image classification pipeline from Hugging Face with an ONNX backend.

    Args:
        model_name: The name of the model in the HF Model Hub.

    Returns:
        model: A HF pipeline of the chosen model.
    """

    with warnings.catch_warnings():  # some models still use feature extractors instead of image processors
        warnings.simplefilter("ignore", category=FutureWarning)
        model_dir = _prepare_hf_model(model_name, "image-classification")
        image_classifier = ORTModelForImageClassification.from_pretrained(
            model_dir, provider=providers[0], use_io_binding=False
        )
        processor = AutoImageProcessor.from_pretrained(model_name)
        image_classifier_pipeline: ImageClassificationPipeline = pipeline(
            model=image_classifier,
            image_processor=processor,
            task="image-classification",
        )  # type: ignore

    return image_classifier_pipeline


def init_facial_recognition(model_name: str) -> FaceAnalysis:
    """
    Instantiates a facial recognition model from Insightface with an ONNX backend.

    Args:
        model_name: The name of the model in the Insightface model zoo.

    Returns:
        model: The model as a FaceAnalysis session.
    """

    model_dir = _get_model_dir(model_name, "facial-recognition")
    face_model = FaceAnalysis(
        name=model_name,
        root=model_dir.as_posix(),
        allowed_modules=["detection", "recognition"],
        providers=providers,
    )
    face_model.prepare(ctx_id=0, det_size=(640, 640))
    return face_model


def init_clip_vision(model_name: str) -> ort.InferenceSession:
    """
    Instantiates a CLIP vision model in ONNX format.
    If the specified model is not found in the cache folder,
    this will first download it from Hugging Face,
    export it to ONNX format, and extract the vision model from it.

    Args:
        model_name: The name of the model in the HF Model Hub.

    Returns:
        session: The model as an ONNX Runtime InferenceSession.
    """

    model_dir = _prepare_hf_model(model_name, "default")
    full_model = Path(model_dir, "model.onnx")
    vision_model = Path(model_dir, "vision_model.onnx")

    if not vision_model.exists():
        extract_model(
            full_model.as_posix(),
            output_path=vision_model.as_posix(),
            input_names=["pixel_values"],
            output_names=["image_embeds"],
        )

    return start_inference_session(vision_model)


def init_clip_text(model_name: str) -> ort.InferenceSession:
    """
    Instantiates a CLIP text model in ONNX format.
    If the specified model is not found in the cache folder,
    this will first download it from Hugging Face,
    export it to ONNX format, and extract the text model from it.

    Args:
        model_name: The name of the model in the HF Model Hub.

    Returns:
        session: The model as an ONNX Runtime InferenceSession.
    """

    model_dir = _prepare_hf_model(model_name, "default")
    full_model = Path(model_dir, "model.onnx")
    text_model = Path(model_dir, "text_model.onnx")

    if not text_model.exists():
        extract_model(
            full_model.as_posix(),
            output_path=text_model.as_posix(),
            input_names=["input_ids", "attention_mask"],
            output_names=["text_embeds"],
        )

    return start_inference_session(text_model)


def start_inference_session(model_path: Path | str) -> ort.InferenceSession:
    """
    Loads an ONNX model with ONNX Runtime and optimizes it.

    Args:
        model_path: Path to the ONNX file.
        
    Returns:
        session: The model as an ONNX Runtime InferenceSession.
    """

    if isinstance(model_path, Path):
        model_path = model_path.as_posix()
    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    return ort.InferenceSession(
        model_path, providers=providers, sess_options=sess_options
    )


def export_hf_model(model_name: str, task: str, model_dir: Path | str | None = None) -> None:
    """
    Exports a Hugging Face model to ONNX format.

    Args:
        model_name: The name of the model in the HF Model Hub.
        task: A model task as used by HF.
        model_dir: Overrides the default cache directory.
    """

    if model_dir is None:
        model_dir = _get_model_dir(model_name, task)
    else:
        model_dir = Path(model_dir)

    main_export(
        model_name,
        output=model_dir,
        task=task,
    )

    model_path = Path(model_dir, "model.onnx")
    model_proto = onnx.load(model_path.open("rb"))
    model_graph = import_onnx(model_proto)

    # this applies more general optimizations that work cross-platform
    # any device-specific optimizations should be distinguished from the original model
    model_graph = model_graph.toposort().fold_constants().cleanup()
    model_proto = export_onnx(model_graph)

    onnx.save(model_proto, model_path.open("wb"))


# TODO make this more modular
def get_model(model_name: str, model_type: str) -> Any:
    """
    Loads the specified model into memory.
    If the model isn't in the cache dir, this will also
    download, compile, and save the model before loading it.

    Args:
        model_name: Name of model in the model zoo used for the task.
        model_type:
            Model type or task, which determines which model zoo is used.
            `facial-recognition` uses Insightface, while all other models use the HF Model Hub.
         
            Options:
                `image-classification`, `clip-vision`, `clip-text`, `facial-recognition`, `tokenizer`, `processor`
    Raises:
        ValueError: If an unsupported `model_type` is chosen.

    Returns:
        model: The requested model.
    """

    match model_type:
        case "image-classification":
            model = init_image_classifier(model_name)
        case "clip-vision":
            model = init_clip_vision(model_name)
        case "clip-text":
            model = init_clip_text(model_name)
        case "facial-recognition":
            model = init_facial_recognition(model_name)
        case "tokenizer":
            model = AutoTokenizer.from_pretrained(model_name)
        case "processor":
            model = AutoImageProcessor.from_pretrained(model_name)
        case _:
            raise ValueError(f"Unsupported task specified: {model_type}")

    return model
