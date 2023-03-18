import os
from flask import Flask, request
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
from PIL import Image

is_dev = os.getenv('NODE_ENV') == 'development'
server_port = os.getenv('MACHINE_LEARNING_PORT', 3003)
server_host = os.getenv('MACHINE_LEARNING_HOST', '0.0.0.0')

classification_model = os.getenv('MACHINE_LEARNING_CLASSIFICATION_MODEL', 'microsoft/resnet-50')
object_model = os.getenv('MACHINE_LEARNING_OBJECT_MODEL', 'hustvl/yolos-tiny')
clip_image_model = os.getenv('MACHINE_LEARNING_CLIP_IMAGE_MODEL', 'clip-ViT-B-32')
clip_text_model = os.getenv('MACHINE_LEARNING_CLIP_TEXT_MODEL', 'clip-ViT-B-32')

_model_cache = {}
def _get_model(model, task=None):
  global _model_cache
  key = '|'.join([model, str(task)])
  if key not in _model_cache:
    if task:
      _model_cache[key] = pipeline(model=model, task=task)
    else:
      _model_cache[key] = SentenceTransformer(model)
  return _model_cache[key]

server = Flask(__name__)

@server.route("/ping")
def ping():
    return "pong"

@server.route("/object-detection/detect-object", methods=['POST'])
def object_detection():
    model = _get_model(object_model, 'object-detection')
    assetPath = request.json['thumbnailPath']
    return run_engine(model, assetPath), 200

@server.route("/image-classifier/tag-image", methods=['POST'])
def image_classification():
    model = _get_model(classification_model, 'image-classification')
    assetPath = request.json['thumbnailPath']
    return run_engine(model, assetPath), 200

@server.route("/sentence-transformer/encode-image", methods=['POST'])
def clip_encode_image():
    model = _get_model(clip_image_model)
    assetPath = request.json['thumbnailPath']
    return model.encode(Image.open(assetPath)).tolist(), 200

@server.route("/sentence-transformer/encode-text", methods=['POST'])
def clip_encode_text():
    model = _get_model(clip_text_model)
    text = request.json['text']
    return model.encode(text).tolist(), 200

def run_engine(engine, path):
    result = []
    predictions = engine(path)

    for index, pred in enumerate(predictions):
        tags = pred['label'].split(', ')
        if (pred['score'] > 0.9):
            result = [*result, *tags]

    if (len(result) > 1):
        result = list(set(result))

    return result


if __name__ == "__main__":
    server.run(debug=is_dev, host=server_host, port=server_port)
