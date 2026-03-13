# Pet Detection

Immich can automatically detect pets and other animals in your photos using YOLO11 object detection. Detected animals appear in the **People** section alongside human faces, making it easy to browse all photos of a specific pet.

## How It Works

When a photo is uploaded or reprocessed, the machine learning service runs a YOLO11 model to detect animals. Each detected animal is cropped and added to the People section as a recognizable entity, similar to how face detection works for people.

The model detects the following animal categories: bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, and giraffe.

## Model Options

Three model sizes are available, trading accuracy for speed:

| Model     | Parameters | Accuracy (mAP) | Speed    |
| --------- | ---------- | -------------- | -------- |
| `yolo11n` | 2.6M       | 39.5           | Fastest  |
| `yolo11s` | 9.4M       | 47.0           | Balanced |
| `yolo11m` | 20.1M      | 51.5           | Slowest  |

The default model is **yolo11s**, which offers a good balance between accuracy and performance.

## Configuration

### Admin Settings

1. Go to **Administration** > **Machine Learning Settings**.
2. Under **Pet Detection**, choose your preferred model from the dropdown.
3. Adjust the **minimum confidence score** if needed (default: 0.6).

### Re-running Detection

To detect pets in existing photos that were uploaded before pet detection was enabled:

1. Go to **Administration** > **Jobs**.
2. Run the **Pet Detection** job for all assets.

## Tips

- **yolo11n** is fast but can misclassify some animals (e.g., dogs as bears). If you see incorrect detections, try switching to **yolo11s** or **yolo11m**.
- Higher confidence thresholds reduce false positives but may miss some detections. The default of 0.6 works well for most libraries.
- Detected pets can be renamed and merged in the People section, just like human faces.
