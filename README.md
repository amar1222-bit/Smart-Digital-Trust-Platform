# 🛡️ Smart Digital Trust Platform

An AI-powered digital image authenticity verification platform that analyzes images using **CNN, Random Forest, and Error Level Analysis (ELA)** to help identify potentially manipulated digital images.

---

## 📌 Project Overview

The **Smart Digital Trust Platform** is a web-based image authenticity analysis system designed to evaluate whether a digital image is likely authentic or potentially manipulated.

Instead of depending on a single detection method, the platform combines multiple analysis techniques:

- 🧠 Convolutional Neural Network (CNN)
- 🌲 Random Forest Machine Learning
- 🔍 Error Level Analysis (ELA)
- 📊 Combined Trust Score

The system provides an interactive dashboard where users can upload images, perform authenticity analysis, view results, check previous analyses, and manage their image history.

---

## ✨ Key Features

- 🔐 User Registration and Login
- 🔑 JWT-based Authentication
- 📤 Image Upload and Preview
- 🧠 CNN-based Image Analysis
- 🌲 Random Forest Classification
- 🔍 Error Level Analysis (ELA)
- 📊 Combined Final Trust Score
- ✅ Likely Authentic Detection
- ⚠️ Suspicious Image Detection
- ❌ Likely Tampered Detection
- 📈 Dashboard Statistics
- 📊 Analysis Charts
- 🖼️ My Images Section
- 📜 Analysis History
- 🔎 View Detailed Analysis
- 🗑️ Delete Individual Images
- 🧹 Clear Analysis History
- 🔄 CNN Service Fallback Handling
- 📱 Responsive User Interface

---

## 🧠 AI-Based Analysis

### 1. Convolutional Neural Network (CNN)

The CNN component performs deep-learning-based image classification by learning visual patterns associated with authentic and manipulated images.

### 2. Random Forest

Random Forest provides an additional machine-learning prediction using extracted image features.

### 3. Error Level Analysis (ELA)

ELA analyzes differences in JPEG compression levels. Unusual compression differences may indicate that parts of an image have been modified.

### 4. Final Trust Score

Predictions from the available analysis methods are combined to generate a final trust score.

The final result is represented using categories such as:

- **Likely Authentic**
- **Suspicious**
- **Likely Tampered**

> The platform is an academic prototype and its predictions should not be treated as definitive forensic evidence.

---

## 🏗️ System Architecture

```text
                ┌──────────────────────┐
                │        User          │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   React Frontend     │
                │      + Vite          │
                └──────────┬───────────┘
                           │
                           │ REST API
                           ▼
                ┌──────────────────────┐
                │   FastAPI Backend    │
                └───────┬─────┬────────┘
                        │     │
             ┌──────────┘     └──────────────┐
             ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ Random Forest   │             │   CNN Service   │
    │      + ELA      │             │ Deep Learning   │
    └────────┬────────┘             └────────┬────────┘
             │                               │
             └──────────────┬────────────────┘
                            ▼
                  ┌────────────────────┐
                  │ Final Trust Score  │
                  └─────────┬──────────┘
                            ▼
                  ┌────────────────────┐
                  │ SQLite Database    │
                  └────────────────────┘
```

---

## 🛠️ Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Recharts

### Backend

- Python
- FastAPI
- Uvicorn
- REST API

### Artificial Intelligence & Machine Learning

- Convolutional Neural Network (CNN)
- Random Forest
- Error Level Analysis (ELA)
- TensorFlow / Keras
- Scikit-learn
- NumPy
- Pillow

### Database & Security

- SQLite
- SQLAlchemy
- JWT Authentication
- Password Hashing

---

## 📂 Project Structure

```text
Smart-Digital-Trust-Platform/
│
├── ai_models/
│   └── image_tampering/
│       ├── check_images.py
│       ├── convert_tiff_to_png.py
│       ├── train_cnn.py
│       └── train_model.py
│
├── backend/
│   ├── cnn_service.py
│   ├── database.py
│   ├── image_analysis.py
│   ├── main.py
│   ├── ml_predictor.py
│   ├── models.py
│   └── schemas.py
│
├── frontend/
│   ├── public/
│   │   └── trust-logo.png
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/amar1222-bit/Smart-Digital-Trust-Platform.git
```

```bash
cd Smart-Digital-Trust-Platform
```

### 2. Create Python Virtual Environment

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

### 3. Install Backend Dependencies

Install the Python dependencies required by the backend and AI components.

Example:

```bash
pip install fastapi uvicorn sqlalchemy python-jose passlib pillow numpy scikit-learn python-multipart
```

Additional CNN dependencies may be required depending on the Python and TensorFlow environment.

---

## 🔐 Environment Configuration

Create a `.env` file in the project root.

Example:

```env
SECRET_KEY=your-own-secure-secret-key
```

Never upload the real `.env` file or production secrets to GitHub.

---

## ▶️ Running the Project

The complete application uses three services.

### Terminal 1 — Backend API

```bash
cd backend
python -m uvicorn main:app --reload --port 8002
```

Backend:

```text
http://127.0.0.1:8002
```

FastAPI Swagger documentation:

```text
http://127.0.0.1:8002/docs
```

### Terminal 2 — CNN Service

Activate the CNN environment and start the CNN prediction service:

```bash
cd backend
python -m uvicorn cnn_service:app --reload --port 8001
```

CNN service:

```text
http://127.0.0.1:8001
```

### Terminal 3 — React Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔄 Application Workflow

```text
User Registration / Login
          ↓
JWT Authentication
          ↓
Upload Digital Image
          ↓
Image Validation
          ↓
 ┌────────┼─────────┐
 ↓        ↓         ↓
CNN    Random     ELA
       Forest
 └────────┼─────────┘
          ↓
Combine Analysis Results
          ↓
Calculate Final Trust Score
          ↓
Authenticity Classification
          ↓
Store Analysis Result
          ↓
Dashboard / History / Details
```

---

## 📊 Dashboard

The dashboard provides statistics such as:

- Total uploaded images
- Total analyses
- Likely authentic images
- Suspicious images
- Likely tampered images
- Average confidence
- Result distribution
- Confidence overview

---

## 🧪 Testing

The system was tested for:

- User registration
- User login
- JWT authentication
- Image uploading
- Image validation
- CNN prediction
- Random Forest prediction
- ELA analysis
- Final score generation
- Analysis history
- Dashboard statistics
- Image deletion
- History clearing
- Frontend/backend integration

---

## 📈 Model Results

During development, the CNN achieved a recorded validation accuracy of approximately:

**77.78%**

Random Forest performance varied according to dataset preparation and feature extraction.

The final platform therefore combines multiple analysis signals instead of treating the output of a single model as absolute evidence.

---

## 🚀 Future Scope

Future improvements can include:

- Advanced deep-learning architectures
- Larger and more diverse training datasets
- AI-generated image detection
- Deepfake detection
- Tampered-region localization
- Explainable AI
- EXIF and metadata analysis
- Image provenance verification
- Improved ensemble learning
- Cloud deployment
- Mobile application support
- Real-time media verification

---

## ⚠️ Disclaimer

This project is developed for **academic, educational, and research purposes**.

The authenticity predictions generated by the system are probabilistic and should not be considered definitive forensic, legal, or investigative evidence.

---

## 👨‍💻 Author

**Amar Mohite**

B.Tech — Artificial Intelligence & Data Science

Areas of Interest:

- Artificial Intelligence
- Machine Learning
- Deep Learning
- Computer Vision
- Data Science
- Generative AI

---

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐.

Contributions, suggestions, and improvements are welcome.