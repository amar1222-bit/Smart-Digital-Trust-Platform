from PIL import Image, ImageChops, ImageEnhance
from pathlib import Path
import io


def analyze_image_tampering(image_path: str):
    path = Path(image_path)

    if not path.exists():
        return {
            "status": "error",
            "message": "Image file not found"
        }

    try:
        original = Image.open(path).convert("RGB")

        buffer = io.BytesIO()
        original.save(buffer, format="JPEG", quality=90)
        buffer.seek(0)

        compressed = Image.open(buffer).convert("RGB")

        difference = ImageChops.difference(
            original,
            compressed
        )

        extrema = difference.getextrema()

        max_difference = max(
            channel[1] for channel in extrema
        )

        enhancer = ImageEnhance.Brightness(difference)
        ela_image = enhancer.enhance(10)

        if max_difference > 80:
            result = "Possibly Tampered"
            confidence = 75
        elif max_difference > 40:
            result = "Suspicious"
            confidence = 55
        else:
            result = "Likely Authentic"
            confidence = 85

        return {
            "status": "success",
            "result": result,
            "confidence": confidence,
            "max_difference": max_difference
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }