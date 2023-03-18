import os

import cv2 as cv
import numpy as np
from insightface.app import FaceAnalysis


def get_image(path: str, to_rgb=False) -> np.array:
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
                 model_size: str = "xsmall",
                 model_dir: str = "./",
                 detection_threshold : float = 0.7,
                 min_face_width_ratio : float = 0.03,
                 min_face_height_ratio : float = 0.05) -> None:
        
        self.model = self.load_model(model_size, model_dir)
        self.detection_threshold = detection_threshold
        self.min_face_widht_ratio = min_face_width_ratio
        self.min_face_height_ratio = min_face_height_ratio

    def load_model(self, model_size: str, model_dir: str):
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
        img = get_image(image_path)

        faces = self.model.get(img)
        filtered_faces = self.post_process(faces, img)
        results = self.prepare_for_deliver(filtered_faces)
        return results

    def post_process(self, faces: list, img: np.array):
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
        results = []
        for face in filtered_faces:
            item = {
                "bbox" : face.bbox.tolist(),
                "det_score" : face.det_score.item(),
                "normed_embedding" : face.normed_embedding.tolist()
            }
            results.append(item)
            
        return results