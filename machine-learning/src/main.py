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
clip_model = os.getenv('MACHINE_LEARNING_CLIP_MODEL', 'clip-ViT-B-32')

classifier = pipeline(
    task="image-classification",
    model=classification_model
)

detector = pipeline(
    task="object-detection",
    model=object_model
)

sentence_transformer_model = SentenceTransformer(clip_model)

server = Flask(__name__)

@server.route("/ping")
def ping():
    return "pong"

@server.route("/object-detection/detect-object", methods=['POST'])
def object_detection():
    assetPath = request.json['thumbnailPath']
    return run_engine(detector, assetPath), 200

@server.route("/image-classifier/tag-image", methods=['POST'])
def image_classification():
    assetPath = request.json['thumbnailPath']
    return run_engine(classifier, assetPath), 200

@server.route("/sentence-transformer/encode-image", methods=['POST'])
def clip_encode_image():
    assetPath = request.json['thumbnailPath']
    emb = sentence_transformer_model.encode(Image.open(assetPath))
    return emb.tolist(), 200

@server.route("/sentence-transformer/encode-text", methods=['POST'])
def clip_encode_text():
    text = request.json['text']
    emb = sentence_transformer_model.encode(text)
    return emb.tolist(), 200

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
