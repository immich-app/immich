from io import BytesIO

from locust import HttpUser, events, task
from PIL import Image


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    global byte_image
    image = Image.new("RGB", (1000, 1000))
    byte_image = BytesIO()
    image.save(byte_image, format="jpeg")


class InferenceLoadTest(HttpUser):
    abstract: bool = True
    host = "http://127.0.0.1:3003"
    data: bytes
    headers: dict[str, str] = {"Content-Type": "image/jpg"}

    # re-use the image across all instances in a process
    def on_start(self):
        global byte_image
        self.data = byte_image.getvalue()


class ClassificationLoadTest(InferenceLoadTest):
    @task
    def classify(self):
        self.client.post(
            "/image-classifier/tag-image", data=self.data, headers=self.headers
        )


class CLIPLoadTest(InferenceLoadTest):
    @task
    def encode_image(self):
        self.client.post(
            "/sentence-transformer/encode-image",
            data=self.data,
            headers=self.headers,
        )


class RecognitionLoadTest(InferenceLoadTest):
    @task
    def recognize(self):
        self.client.post(
            "/facial-recognition/detect-faces",
            data=self.data,
            headers=self.headers,
        )
