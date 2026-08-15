from pathlib import Path
from PIL import Image

dataset = Path("datasets/cnn_dataset")

bad_images = []

for file in dataset.rglob("*"):
    if file.suffix.lower() in {
        ".jpg", ".jpeg", ".png",
        ".bmp", ".tif", ".tiff"
    }:
        try:
            with Image.open(file) as img:
                img.verify()

        except Exception as e:
            bad_images.append(file)
            print("BAD:", file)
            print("ERROR:", e)

print("\nTotal bad images:", len(bad_images))