# 🛡️ Smart Digital Trust Platform

## AI-Powered Image Authenticity & Tampering Detection System

Smart Digital Trust Platform is an AI-based web application designed to analyze digital images and detect possible image manipulation or tampering.

The system combines multiple image-analysis techniques including **Convolutional Neural Network (CNN), Random Forest Machine Learning, and Error Level Analysis (ELA)** to generate a final authenticity verdict and trust score.

---

## 🎯 Project Objective

The main objective of this project is to develop an intelligent platform that can:

- Detect possible image tampering.
- Analyze digital images using AI and forensic techniques.
- Provide an authenticity trust score.
- Maintain analysis history for users.
- Provide a secure and easy-to-use web interface.
- Help users evaluate the reliability of digital images.

---

## 🚀 Key Features

### 🔐 User Authentication
- User Registration
- Secure Login
- JWT Authentication
- Protected user-specific data

### 🖼️ Image Management
- JPG, PNG and WEBP upload support
- Image preview
- Image metadata
- My Images dashboard
- Delete uploaded images

### 🧠 AI Image Analysis

The system uses three analysis methods:

#### 1. CNN Analysis
A Convolutional Neural Network analyzes image patterns and predicts whether an image is authentic or tampered.

#### 2. Random Forest Analysis
A trained Random Forest machine-learning model analyzes extracted image features and calculates authentic and tampered probabilities.

#### 3. Error Level Analysis (ELA)
ELA analyzes JPEG/image compression differences and detects unusual regions that may indicate image modification.

---

## ⚖️ Final Trust Score

When CNN analysis is available, the final trust score is calculated using:

Final Trust Score =

- CNN = 50%
- Random Forest = 20%
- ELA = 30%

The final classification is:

- **70–100% → Likely Authentic**
- **45–69.99% → Suspicious**
- **Below 45% → Likely Tampered**

If the CNN service is unavailable, the system uses a fallback combination of Random Forest and ELA.

---

## 📊 Dashboard

The dashboard displays:

- Total Uploaded Images
- Total Analyses
- Likely Authentic Images
- Suspicious Images
- Likely Tampered Images
- Average Confidence
- Result Distribution Chart
- Confidence Overview Chart

---

## 📜 Analysis History

Users can:

- View previous analyses
- View filename
- View final result
- View confidence score
- View analysis date and time
- Open detailed analysis information
- Clear analysis history

---

## 🗑️ Data Management

The platform supports:

- Delete Image
- Delete linked analysis records
- Clear Analysis History
- Automatic dashboard statistics refresh

Deleting an image removes its associated analysis records, while clearing history keeps uploaded images.

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
- SQLAlchemy
- JWT Authentication

### Artificial Intelligence / Machine Learning

- Convolutional Neural Network (CNN)
- Random Forest
- Error Level Analysis (ELA)
- Image Feature Extraction

### Libraries

- TensorFlow / Keras
- Scikit-learn
- Pillow
- NumPy
- HTTPX
- Passlib
- Python-JOSE

### Database

- SQLite

---

## 🏗️ System Architecture

User  
↓  
React Frontend  
↓  
FastAPI Backend  
↓  
Authentication & Image Management  
↓  
Image Analysis Engine  
↓  
CNN + Random Forest + ELA  
↓  
Trust Score Aggregation  
↓  
Final Authenticity Verdict  
↓  
Database / History / Dashboard Analytics

---

## 📁 Major Project Components

```text
Smart-Digital-Trust-Platform/
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── image_analysis.py
│   ├── ml_predictor.py
│   ├── uploads/
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── ...
│
├── ai_models/
│   └── image_tampering/
│
└── README.md