from flask import Flask, request, jsonify
import os
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline
from PIL import Image
import image_classification as classification

model = SentenceTransformer('clip-ViT-B-32')
classifier = pipeline(
    task="image-classification",
    model="microsoft/resnet-50"
)


server = Flask(__name__)

# Environment resolver
is_dev = os.getenv('NODE_ENV') == 'development'
port = os.getenv('MACHINE_LEARNING_PORT') or 3003


@server.route("/ping")
def ping():
    return "pong"

# @server.route("/test")
# def test():
#     img_emb = model.encode(Image.open(
#         'upload/3e54a230-5daa-4983-b356-af4fd65292aa/thumb/WEB/bf7d976f-4cbc-4991-a006-b11c0811781c.jpeg'))
#     print(img_emb, flush=True)
#     # # Encode text descriptions
#     text_emb = model.encode(['Couch', 'rug', 'car', 'living room'])

#     # # Compute cosine similarities
#     cos_scores = util.cos_sim(img_emb, text_emb)

#     return f'Score = {cos_scores}\n'


@server.route("/object-detection/detect-object", methods=['POST'])
def object_detection():
    assetPath = request.json['thumbnailPath']
    print("detection", assetPath, flush=True)
    return "Object Detection!\n"


@server.route("/image-classifier/tag-image", methods=['POST'])
def image_classification():
    assetPath = request.json['thumbnailPath']
    return classification.classify_image(classifier, assetPath), 201


if __name__ == "__main__":
    server.run(debug=is_dev, host='0.0.0.0', port=port)
