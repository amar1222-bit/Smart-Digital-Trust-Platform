from fastapi import FastAPI, UploadFile, File, HTTPException
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
from pathlib import Path
import numpy as np
import io

app = FastAPI(
    title="CNN Tampering Detection Service",
    version="1.0"
)

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "ai_models"
    / "image_tampering"
    / "tampering_cnn.keras"
)

print("Loading CNN model...")
model = load_model(MODEL_PATH)
print("CNN model loaded successfully.")


@app.get("/")
def home():
    return {
        "message": "CNN Tampering Detection Service Running"
    }


@app.post("/predict")
async def predict_image(
    file: UploadFile = File(...)
):
    try:
        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        image = image.resize((224, 224))

        image_array = np.array(
            image,
            dtype=np.float32
        )

        image_array = np.expand_dims(
            image_array,
            axis=0
        )

        image_array = preprocess_input(
            image_array
        )

        prediction = model.predict(
            image_array,
            verbose=0
        )[0][0]

        tampered_probability = float(
            prediction * 100
        )

        authentic_probability = float(
            (1 - prediction) * 100
        )

        if prediction >= 0.5:
            result = "Tampered"
            confidence = tampered_probability
        else:
            result = "Authentic"
            confidence = authentic_probability

        return {
            "result": result,
            "confidence": round(confidence, 2),
            "authentic_probability": round(
                authentic_probability,
                2
            ),
            "tampered_probability": round(
                tampered_probability,
                2
            )
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )