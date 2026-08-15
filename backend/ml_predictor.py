from pathlib import Path
import joblib
import numpy as np
from PIL import Image


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "ai_models"
    / "image_tampering"
    / "tampering_model.pkl"
)


# Load trained ML model
model = joblib.load(MODEL_PATH)


def extract_ml_features(image_path: str):
    image = Image.open(image_path).convert("RGB")

    image = image.resize((128, 128))

    img_array = np.array(image)

    features = [
        np.mean(img_array[:, :, 0]),
        np.mean(img_array[:, :, 1]),
        np.mean(img_array[:, :, 2]),

        np.std(img_array[:, :, 0]),
        np.std(img_array[:, :, 1]),
        np.std(img_array[:, :, 2]),

        np.min(img_array),
        np.max(img_array)
    ]

    return np.array(features).reshape(1, -1)


def predict_tampering(image_path: str):

    features = extract_ml_features(image_path)

    prediction = model.predict(features)[0]

    probabilities = model.predict_proba(features)[0]

    confidence = float(max(probabilities) * 100)

    if prediction == 1:
        result = "Tampered"
    else:
        result = "Authentic"

    return {
        "result": result,
        "confidence": round(confidence, 2),
        "authentic_probability": round(
            float(probabilities[0] * 100), 2
        ),
        "tampered_probability": round(
            float(probabilities[1] * 100), 2
        )
    }