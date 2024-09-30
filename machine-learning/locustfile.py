import json
from argparse import ArgumentParser
from io import BytesIO
from typing import Any

from locust import HttpUser, events, task
from locust.env import Environment
from PIL import Image

byte_image = BytesIO()

@events.init_command_line_parser.add_listener
def _(parser: ArgumentParser) -> None:
    parser.add_argument("--clip-model", type=str, default="ViT-B-32::openai")
    parser.add_argument("--face-model", type=str, default="buffalo_l")
    parser.add_argument("--tag-min-score", type=float, default=0.0, 
                        help="Returns all tags at or above this score.")
    parser.add_argument("--face-min-score", type=float, default=0.034, 
                        help="Returns faces at or above this score.")
    parser.add_argument("--image-size", type=int, default=1000)

@events.test_start.add_listener
def on_test_start(environment: Environment, **kwargs: Any) -> None:
    global byte_image
    assert environment.parsed_options is not None
    image = Image.new("RGB", (environment.parsed_options.image_size, environment.parsed_options.image_size))
    image.save(byte_image, format="jpeg")

@events.request_failure.add_listener
def on_request_failure(request_type, name, response_time, response_length, exception, **kwargs):
    print(f"Request failed: {request_type} {name}, Exception: {exception}")

class InferenceLoadTest(HttpUser):
    abstract: bool = True
    host = "http://127.0.0.1:3003"
    data: bytes

    def on_start(self) -> None:
        self.data = byte_image.getvalue()

class CLIPTextFormDataLoadTest(InferenceLoadTest):
    @task
    def encode_text(self) -> None:
        request = {"clip": {"textual": {"modelName": self.environment.parsed_options.clip_model}}}
        data = [("entries", json.dumps(request)), ("text", "test search query")]
        try:
            response = self.client.post("/predict", data=data)
            response.raise_for_status()
        except Exception as e:
            print(f"Error in encode_text: {e}")

class CLIPVisionFormDataLoadTest(InferenceLoadTest):
    @task
    def encode_image(self) -> None:
        request = {"clip": {"visual": {"modelName": self.environment.parsed_options.clip_model, "options": {}}}}
        data = [("entries", json.dumps(request))]
        files = {"image": self.data}
        try:
            response = self.client.post("/predict", data=data, files=files)
            response.raise_for_status()
        except Exception as e:
            print(f"Error in encode_image: {e}")

class RecognitionFormDataLoadTest(InferenceLoadTest):
    @task
    def recognize(self) -> None:
        request = {
            "facial-recognition": {
                "recognition": {
                    "modelName": self.environment.parsed_options.face_model,
                    "options": {"minScore": self.environment.parsed_options.face_min_score},
                },
                "detection": {
                    "modelName": self.environment.parsed_options.face_model,
                },
            }
        }
        data = [("entries", json.dumps(request))]
        files = {"image": self.data}
        try:
            response = self.client.post("/predict", data=data, files=files)
            response.raise_for_status()
        except Exception as e:
            print(f"Error in recognize: {e}")
