import os
import numpy as np
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib


# -----------------------------
# Paths
# -----------------------------

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

AUTHENTIC_DIR = os.path.join(
    PROJECT_ROOT,
    "datasets",
    "image_tampering",
    "authentic"
)

TAMPERED_DIR = os.path.join(
    PROJECT_ROOT,
    "datasets",
    "image_tampering",
    "tampered"
)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "tampering_model.pkl"
)


# -----------------------------
# Image feature extraction
# -----------------------------

def extract_features(image_path):

    try:
        image = Image.open(image_path).convert("RGB")

        # Resize image
        image = image.resize((128, 128))

        img_array = np.array(image)

        # Simple statistical features
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

        return features

    except Exception as e:
        print(f"Skipping {image_path}: {e}")
        return None


# -----------------------------
# Load dataset
# -----------------------------

def load_images(folder, label):

    features = []
    labels = []

    valid_extensions = (
        ".jpg",
        ".jpeg",
        ".png",
        ".bmp",
        ".tif",
        ".tiff"
    )

    for root, dirs, files in os.walk(folder):

        # Ignore edgemask folders
        dirs[:] = [
            d for d in dirs
            if d.lower() != "edgemask"
        ]

        for filename in files:

            if filename.lower().endswith(valid_extensions):

                image_path = os.path.join(root, filename)

                feature = extract_features(image_path)

                if feature is not None:
                    features.append(feature)
                    labels.append(label)

    return features, labels
print("Loading Authentic Images...")

auth_features, auth_labels = load_images(
    AUTHENTIC_DIR,
    0
)

print("Authentic images loaded:", len(auth_features))


print("\nLoading Tampered Images...")

tampered_features, tampered_labels = load_images(
    TAMPERED_DIR,
    1
)

print("Tampered images loaded:", len(tampered_features))


# -----------------------------
# Combine dataset
# -----------------------------

X = np.array(auth_features + tampered_features)
y = np.array(auth_labels + tampered_labels)

print("\nTotal usable images:", len(X))


if len(X) == 0:
    raise ValueError(
        "No images found. Check dataset folders."
    )


# -----------------------------
# Train/Test split
# -----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("Training images:", len(X_train))
print("Testing images:", len(X_test))


# -----------------------------
# Train Random Forest
# -----------------------------

print("\nTraining model...")

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

model.fit(X_train, y_train)


# -----------------------------
# Evaluate model
# -----------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("\n==============================")
print("MODEL TRAINING COMPLETE")
print("==============================")

print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        target_names=[
            "Authentic",
            "Tampered"
        ]
    )
)


# -----------------------------
# Save model
# -----------------------------

joblib.dump(
    model,
    MODEL_PATH
)

print("\nModel saved successfully:")
print(MODEL_PATH)