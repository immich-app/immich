import tempfile
from pathlib import Path

import tensorflow as tf
from transformers import TFCLIPModel

from .util import ModelType, get_model_path


class _CLIPWrapper(tf.Module):
    def __init__(self, model_name: str):
        super(_CLIPWrapper)
        self.model = TFCLIPModel.from_pretrained(model_name)

    @tf.function()
    def encode_image(self, input_tensor):
        return self.model.get_image_features(input_tensor)

    @tf.function()
    def encode_text(self, input_tensor):
        return self.model.get_text_features(input_tensor)


# exported model signatures use batch size 2 because of the following reasons:
# 1. ARM-NN cannot use dynamic batch sizes for complex models like CLIP ViT
# 2. batch size 1 creates a larger TF-Lite model that uses a lot (50%) more RAM
# 3. batch size 2 is ~50% faster on GPU than 1 while 4 (or larger) are not really faster
# 4. batch size >2 wastes more computation if only a single image is processed
BATCH_SIZE_IMAGE = 2
# On most small-scale systems there will only be one query at a time, no sense in batching
BATCH_SIZE_TEXT = 1

SIGNATURE_TEXT = "encode_text"
SIGNATURE_IMAGE = "encode_image"


def to_tflite(
    model_name,
    output_path_image: Path | str | None,
    output_path_text: Path | str | None,
    context_length: int = 77,
):
    with tempfile.TemporaryDirectory() as tmpdir:
        _export_temporary_tf_model(model_name, tmpdir, context_length)
        if output_path_image is not None:
            image_path = get_model_path(output_path_image, ModelType.TFLITE)
            _export_tflite_model(tmpdir, SIGNATURE_IMAGE, image_path.as_posix())
        if output_path_text is not None:
            text_path = get_model_path(output_path_text, ModelType.TFLITE)
            _export_tflite_model(tmpdir, SIGNATURE_TEXT, text_path.as_posix())


def _export_temporary_tf_model(model_name, tmp_path: str, context_length: int):
    wrapper = _CLIPWrapper(model_name)
    conf = wrapper.model.config.vision_config
    spec_visual = tf.TensorSpec(
        shape=(BATCH_SIZE_IMAGE, conf.num_channels, conf.image_size, conf.image_size), dtype=tf.float32
    )
    encode_image = wrapper.encode_image.get_concrete_function(spec_visual)
    spec_text = tf.TensorSpec(shape=(BATCH_SIZE_TEXT, context_length), dtype=tf.int32)
    encode_text = wrapper.encode_text.get_concrete_function(spec_text)
    signatures = {SIGNATURE_IMAGE: encode_image, SIGNATURE_TEXT: encode_text}
    tf.saved_model.save(wrapper, tmp_path, signatures)


def _export_tflite_model(tmp_path: str, signature: str, output_path: str):
    converter = tf.lite.TFLiteConverter.from_saved_model(tmp_path, signature_keys=[signature])
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    tflite_model = converter.convert()
    with open(output_path, "wb") as f:
        f.write(tflite_model)
