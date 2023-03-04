import os
from flask import Flask, request
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
from PIL import Image


server = Flask(__name__)


classifier = pipeline(
    task="image-classification",
    model="microsoft/resnet-50"
)

detector = pipeline(
    task="object-detection",
    model="hustvl/yolos-tiny"
)

sentence_transformer_model = SentenceTransformer('clip-ViT-B-32')


# Environment resolver
is_dev = os.getenv('NODE_ENV') == 'development'
server_port = os.getenv('MACHINE_LEARNING_PORT') or 3003


@server.route("/ping")
def ping():
    return "pong"


@server.route("/object-detection/detect-object", methods=['POST'])
def object_detection():
    assetPath = request.json['thumbnailPath']
    return run_engine(detector, assetPath), 201


@server.route("/image-classifier/tag-image", methods=['POST'])
def image_classification():
    assetPath = request.json['thumbnailPath']
    return run_engine(classifier, assetPath), 201

@server.route("/sentence-transformer/encode-image", methods=['POST'])
def encodeSentence():
    assetPath = request.json['thumbnailPath']
    img_emb = sentence_transformer_model.encode(Image.open(assetPath))
    return img_emb.tolist(), 201

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
    server.run(debug=is_dev, host='0.0.0.0', port=server_port)
