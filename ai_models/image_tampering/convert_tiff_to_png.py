from pathlib import Path
from PIL import Image

dataset = Path("datasets/cnn_dataset")

converted = 0
failed = 0

for file in dataset.rglob("*"):
    if file.suffix.lower() in {".tif", ".tiff"}:
        try:
            with Image.open(file) as img:
                img = img.convert("RGB")

                output_file = file.with_suffix(".png")

                img.save(
                    output_file,
                    format="PNG"
                )

                converted += 1
                print("Converted:", file.name)

        except Exception as e:
            failed += 1
            print("FAILED:", file)
            print("ERROR:", e)

print("\nConverted:", converted)
print("Failed:", failed)