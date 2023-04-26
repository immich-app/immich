import os

import cv2 as cv
import numpy as np
from insightface.app import FaceAnalysis


def get_image(path: str, to_rgb=False) -> np.array:
    """Utility to load images from given path.

    Args:
        path (str): Path to the image
        to_rgb (bool, optional): Whether to convert the image into rgb. Defaults to False.

    Raises:
        FileNotFoundError: File at given path does not exist

    Returns:
        np.array: Image
    """
    if not os.path.exists(path):
        raise FileNotFoundError

    else:
        img = cv.imread(path)

        if to_rgb:
            img = img[:, :, ::-1]

        return img


class FaceProcessor:
    # See for model properties: https://github.com/deepinsight/insightface/tree/master/model_zoo
    def __init__(self,
                 model_size: str = "large",
                 model_dir: str = "./",
                 detection_threshold: float = 0.7,
                 min_face_width_ratio: float = 0.03,
                 min_face_height_ratio: float = 0.05) -> None:

        self.model = self.load_model(model_size, model_dir)
        self.detection_threshold = detection_threshold
        self.min_face_widht_ratio = min_face_width_ratio
        self.min_face_height_ratio = min_face_height_ratio

    def load_model(self, model_size: str, model_dir: str):
        """Loading the model specified in the init method.

        Args:
            model_size (str): Model type / size. Options are xsmall|small|large
            model_dir (str): Root directory where the models are being stored.

        Returns:
            model: a loaded model
        """
        if model_size == "xsmall":
            model_name = "buffalo_sc"

        elif model_size == "small":
            model_name = "buffalo_s"

        elif model_size == "large":
            model_name = "buffalo_l"

        else:
            print("Unable to parse model_size. Using default <small>")
            model_name = "buffalo_s"

        model = FaceAnalysis(
            name=model_name,
            root=model_dir,
            allowed_modules=["detection", "recognition"],
        )
        model.prepare(ctx_id=0, det_size=(640, 640))

        return model

    def process_image(self, image_path: str):
        """Encapsulates the detection and recognition process

        Args:
            image_path (str): Path to the image which should be processed

        Returns:
            list: list of found faces and there attributed.
        """
        img = get_image(image_path)

        faces = self.model.get(img)
        filtered_faces = self.post_process(faces, img)
        results = self.prepare_for_deliver(filtered_faces)
        return results

    def post_process(self, faces: list, img: np.array):
        """Filter faces that appear to small or with low confidence.

        Args:
            faces (list): List of found faces output by the model
            img (np.array): Original image

        Returns:
            list: filtered list of the found faces
        """
        filtered_faces = []
        for face in faces:
            if face.det_score >= self.detection_threshold:

                bbox = face.bbox
                bbox_width_ratio = (bbox[2] - bbox[0]) / img.shape[1]
                bbox_height_ratio = (bbox[3] - bbox[1]) / img.shape[0]
                if (bbox_height_ratio >= self.min_face_height_ratio) and (
                    bbox_width_ratio >= self.min_face_widht_ratio
                ):
                    filtered_faces.append(face)

        return filtered_faces

    def prepare_for_deliver(self, filtered_faces):
        """Converts results from model otuput into JSON serializable format.

        Args:
            filtered_faces (list): List of the found faces.

        Returns:
            list: List of the found faces converted into a JSON serializable format.
        """
        results = []
        for face in filtered_faces:
            bbox = face.bbox.tolist()
            item = {
                "boundingBox": {
                    "x1": round(bbox[0]),
                    "y1": round(bbox[1]),
                    "x2": round(bbox[2]),
                    "y2": round(bbox[3]),
                },
                "score": face.det_score.item(),
                "embedding": face.normed_embedding.tolist()
            }
            results.append(item)

        return results
