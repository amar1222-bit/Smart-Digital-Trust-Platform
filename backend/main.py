from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    File,
    UploadFile
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from passlib.context import CryptContext

from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

import httpx
import models
import schemas
import os

from database import engine, get_db
from image_analysis import analyze_image_tampering
from ml_predictor import predict_tampering


# =========================================================
# APP CONFIGURATION
# =========================================================

app = FastAPI(
    title="Smart Digital Trust Platform",
    version="2.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

models.Base.metadata.create_all(
    bind=engine
)


# =========================================================
# PASSWORD HASHING
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()


# =========================================================
# INDIA STANDARD TIME
# =========================================================

IST = timezone(
    timedelta(
        hours=5,
        minutes=30
    )
)


# =========================================================
# FILE UPLOAD CONFIGURATION
# =========================================================

BACKEND_DIR = (
    Path(__file__)
    .resolve()
    .parent
)

UPLOAD_DIR = (
    BACKEND_DIR
    / "uploads"
)

UPLOAD_DIR.mkdir(
    exist_ok=True
)

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}

MAX_FILE_SIZE = (
    5 * 1024 * 1024
)


# =========================================================
# CNN SERVICE CONFIGURATION
# =========================================================

CNN_SERVICE_URL = (
    "http://127.0.0.1:8001/predict"
)


# =========================================================
# CREATE JWT ACCESS TOKEN
# =========================================================

def create_access_token(
    data: dict
):

    to_encode = data.copy()

    expire = (
        datetime.now(
            timezone.utc
        )
        +
        timedelta(
            minutes=
            ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================================================
# GET CURRENT LOGGED-IN USER
# =========================================================

def get_current_user(
    credentials:
        HTTPAuthorizationCredentials
        = Depends(security),

    db: Session
        = Depends(get_db)
):

    token = (
        credentials.credentials
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ]
        )

        user_id = payload.get(
            "sub"
        )

        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail=
                    "Invalid authentication token"
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail=
                "Invalid or expired token"
        )

    try:

        user_id = int(
            user_id
        )

    except (
        TypeError,
        ValueError
    ):

        raise HTTPException(
            status_code=401,
            detail=
                "Invalid authentication token"
        )

    user = db.query(
        models.User
    ).filter(
        models.User.id
        == user_id
    ).first()

    if user is None:

        raise HTTPException(
            status_code=401,
            detail=
                "User not found"
        )

    return user


# =========================================================
# CNN SERVICE HELPER
# =========================================================

async def get_cnn_prediction(
    image_path: str
):

    try:

        path = Path(
            image_path
        )

        if not path.is_absolute():

            path = (
                BACKEND_DIR
                / path
            )

        if not path.exists():

            return {
                "status": "error",
                "message":
                    "Image file not found for CNN analysis"
            }

        image_bytes = (
            path.read_bytes()
        )

        suffix = (
            path.suffix
            .lower()
        )

        if suffix in {
            ".jpg",
            ".jpeg"
        }:

            content_type = (
                "image/jpeg"
            )

        elif suffix == ".png":

            content_type = (
                "image/png"
            )

        elif suffix == ".webp":

            content_type = (
                "image/webp"
            )

        else:

            content_type = (
                "application/octet-stream"
            )

        files = {
            "file": (
                path.name,
                image_bytes,
                content_type
            )
        }

        async with httpx.AsyncClient(
            timeout=30.0
        ) as client:

            response = (
                await client.post(
                    CNN_SERVICE_URL,
                    files=files
                )
            )

        response.raise_for_status()

        result = (
            response.json()
        )

        result[
            "status"
        ] = "success"

        return result

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message":
            "Smart Digital Trust Platform Backend Running Successfully",

        "version":
            "2.0"
    }


# =========================================================
# REGISTER
# =========================================================

@app.post("/register")
def register_user(
    user:
        schemas.UserRegister,

    db:
        Session
        = Depends(get_db)
):

    existing_user = (
        db.query(
            models.User
        )
        .filter(
            models.User.email
            == user.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail=
                "Email already registered"
        )

    hashed_password = (
        pwd_context.hash(
            user.password
        )
    )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(
        new_user
    )

    db.commit()

    db.refresh(
        new_user
    )

    return {
        "message":
            "User registered successfully",

        "user_id":
            new_user.id,

        "name":
            new_user.name,

        "email":
            new_user.email
    }


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login_user(
    user:
        schemas.UserLogin,

    db:
        Session
        = Depends(get_db)
):

    db_user = (
        db.query(
            models.User
        )
        .filter(
            models.User.email
            == user.email
        )
        .first()
    )

    if not db_user:

        raise HTTPException(
            status_code=401,
            detail=
                "Invalid email or password"
        )

    if not pwd_context.verify(
        user.password,
        db_user.password
    ):

        raise HTTPException(
            status_code=401,
            detail=
                "Invalid email or password"
        )

    access_token = (
        create_access_token(
            data={
                "sub":
                    str(
                        db_user.id
                    ),

                "email":
                    db_user.email
            }
        )
    )

    return {
        "message":
            "Login successful",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user_id":
            db_user.id,

        "name":
            db_user.name,

        "email":
            db_user.email
    }


# =========================================================
# PROFILE
# =========================================================

@app.get("/profile")
def get_profile(
    current_user:
        models.User
        = Depends(
            get_current_user
        )
):

    return {
        "message":
            "Protected profile accessed successfully",

        "user_id":
            current_user.id,

        "name":
            current_user.name,

        "email":
            current_user.email
    }


# =========================================================
# UPLOAD IMAGE
# =========================================================

@app.post("/upload-image")
async def upload_image(
    file:
        UploadFile
        = File(...),

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(get_db)
):

    if (
        file.content_type
        not in ALLOWED_TYPES
    ):

        raise HTTPException(
            status_code=400,
            detail=
                "Only JPG, PNG and WEBP images are allowed."
        )

    content = (
        await file.read()
    )

    if len(content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail=
                "Image size must be less than 5 MB."
        )

    extension = (
        Path(
            file.filename
            or "image.jpg"
        )
        .suffix
        .lower()
    )

    new_filename = (
        f"{uuid4().hex}{extension}"
    )

    file_path = (
        UPLOAD_DIR
        / new_filename
    )

    file_path.write_bytes(
        content
    )

    try:

        with Image.open(
            file_path
        ) as image:

            width, height = (
                image.size
            )

            image_format = (
                image.format
            )

            image.verify()

    except (
        UnidentifiedImageError,
        OSError
    ):

        file_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=400,
            detail=
                "Uploaded file is not a valid image."
        )

    image_record = (
        models.UploadedImage(
            user_id=
                current_user.id,

            original_filename=
                file.filename,

            saved_filename=
                new_filename,

            file_path=
                str(file_path),

            image_format=
                image_format,

            width=
                width,

            height=
                height
        )
    )

    db.add(
        image_record
    )

    db.commit()

    db.refresh(
        image_record
    )

    return {
        "status":
            "success",

        "image_id":
            image_record.id,

        "user_id":
            current_user.id,

        "original_filename":
            file.filename,

        "saved_filename":
            new_filename,

        "format":
            image_format,

        "width":
            width,

        "height":
            height,

        "size_bytes":
            len(content)
    }


# =========================================================
# MY IMAGES
# =========================================================

@app.get("/my-images")
def get_my_images(
    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(get_db)
):

    images = (
        db.query(
            models.UploadedImage
        )
        .filter(
            models.UploadedImage.user_id
            == current_user.id
        )
        .all()
    )

    return {
        "user_id":
            current_user.id,

        "total_images":
            len(images),

        "images": [

            {
                "image_id":
                    image.id,

                "original_filename":
                    image.original_filename,

                "saved_filename":
                    image.saved_filename,

                "file_path":
                    image.file_path,

                "format":
                    image.image_format,

                "width":
                    image.width,

                "height":
                    image.height
            }

            for image
            in images
        ]
    }


# =========================================================
# COMPLETE IMAGE ANALYSIS
# CNN + RANDOM FOREST + ELA
# =========================================================

@app.post(
    "/analyze-image/{image_id}"
)
async def analyze_image(
    image_id:
        int,

    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(get_db)
):

    # -----------------------------------------------------
    # FIND IMAGE
    # -----------------------------------------------------

    image = (
        db.query(
            models.UploadedImage
        )
        .filter(
            models.UploadedImage.id
            == image_id,

            models.UploadedImage.user_id
            == current_user.id
        )
        .first()
    )

    if image is None:

        raise HTTPException(
            status_code=404,
            detail=
                "Image not found"
        )


    # -----------------------------------------------------
    # 1. FORENSIC / ELA ANALYSIS
    # -----------------------------------------------------

    ela_analysis = (
        analyze_image_tampering(
            image.file_path
        )
    )

    if (
        ela_analysis.get(
            "status"
        )
        != "success"
    ):

        raise HTTPException(
            status_code=400,
            detail=
                ela_analysis
        )


    # -----------------------------------------------------
    # 2. RANDOM FOREST ANALYSIS
    # -----------------------------------------------------

    ml_analysis = (
        predict_tampering(
            image.file_path
        )
    )


    # -----------------------------------------------------
    # 3. CNN ANALYSIS
    # -----------------------------------------------------

    cnn_analysis = (
        await get_cnn_prediction(
            image.file_path
        )
    )


    # -----------------------------------------------------
    # 4. AUTHENTICITY SCORES
    # -----------------------------------------------------

    rf_auth_score = float(
        ml_analysis[
            "authentic_probability"
        ]
    )

    if (
        ela_analysis[
            "result"
        ]
        ==
        "Likely Authentic"
    ):

        ela_auth_score = float(
            ela_analysis[
                "confidence"
            ]
        )

    else:

        ela_auth_score = (
            100.0
            -
            float(
                ela_analysis[
                    "confidence"
                ]
            )
        )


    # -----------------------------------------------------
    # 5. FINAL TRUST SCORE
    # -----------------------------------------------------

    if (
        cnn_analysis.get(
            "status"
        )
        ==
        "success"
    ):

        cnn_auth_score = float(
            cnn_analysis[
                "authentic_probability"
            ]
        )

        final_trust_score = round(
            (
                0.50
                *
                cnn_auth_score
            )
            +
            (
                0.20
                *
                rf_auth_score
            )
            +
            (
                0.30
                *
                ela_auth_score
            ),
            2
        )

        analysis_mode = (
            "CNN + Random Forest + ELA"
        )

    else:

        final_trust_score = round(
            (
                0.40
                *
                rf_auth_score
            )
            +
            (
                0.60
                *
                ela_auth_score
            ),
            2
        )

        analysis_mode = (
            "Random Forest + ELA Fallback"
        )


    # -----------------------------------------------------
    # 6. FINAL VERDICT
    # -----------------------------------------------------

    if (
        final_trust_score
        >= 70
    ):

        final_verdict = (
            "Likely Authentic"
        )

    elif (
        final_trust_score
        >= 45
    ):

        final_verdict = (
            "Suspicious"
        )

    else:

        final_verdict = (
            "Likely Tampered"
        )


    # -----------------------------------------------------
    # 7. SAVE RESULT IN DATABASE
    # -----------------------------------------------------

    analysis_record = (
        models.ImageAnalysisResult(
            image_id=
                image.id,

            user_id=
                current_user.id,

            result=
                final_verdict,

            confidence=
                int(
                    round(
                        final_trust_score
                    )
                ),

            max_difference=
                ela_analysis[
                    "max_difference"
                ],

            created_at=
                datetime.now(
                    IST
                ).replace(
                    tzinfo=None
                )
        )
    )

    db.add(
        analysis_record
    )

    db.commit()

    db.refresh(
        analysis_record
    )


    # -----------------------------------------------------
    # 8. FINAL RESPONSE
    # -----------------------------------------------------

    return {
        "analysis_id":
            analysis_record.id,

        "image_id":
            image.id,

        "filename":
            image.original_filename,

        "analysis_mode":
            analysis_mode,

        "created_at":
            (
                analysis_record
                .created_at
                .isoformat()
                if
                analysis_record.created_at
                else None
            ),

        "final_result": {
            "verdict":
                final_verdict,

            "trust_score":
                final_trust_score
        },

        "cnn_analysis":
            cnn_analysis,

        "random_forest_analysis": {
            "result":
                ml_analysis[
                    "result"
                ],

            "confidence":
                ml_analysis[
                    "confidence"
                ],

            "authentic_probability":
                ml_analysis[
                    "authentic_probability"
                ],

            "tampered_probability":
                ml_analysis[
                    "tampered_probability"
                ]
        },

        "forensic_analysis": {
            "result":
                ela_analysis[
                    "result"
                ],

            "confidence":
                ela_analysis[
                    "confidence"
                ],

            "max_difference":
                ela_analysis[
                    "max_difference"
                ]
        }
    }


# =========================================================
# ANALYSIS HISTORY
# =========================================================

@app.get(
    "/analysis-history"
)
def get_analysis_history(
    current_user:
        models.User
        = Depends(
            get_current_user
        ),

    db:
        Session
        = Depends(get_db)
):

    results = (
        db.query(
            models.ImageAnalysisResult
        )
        .filter(
            models.ImageAnalysisResult.user_id
            == current_user.id
        )
        .all()
    )

    history = []

    for result in results:

        image = (
            db.query(
                models.UploadedImage
            )
            .filter(
                models.UploadedImage.id
                == result.image_id
            )
            .first()
        )

        history.append({
            "analysis_id":
                result.id,

            "image_id":
                result.image_id,

            "filename":
                (
                    image.original_filename
                    if image
                    else "Unknown"
                ),

            "result":
                result.result,

            "confidence":
                result.confidence,

            "max_difference":
                result.max_difference,

            "created_at":
                (
                    result.created_at.isoformat()
                    if result.created_at
                    else None
                )
        })

    return {
        "user_id":
            current_user.id,

        "total_analyses":
            len(history),

        "history":
            history
    }

# =========================================================
# DASHBOARD STATS
# =========================================================

@app.get("/dashboard-stats")
def get_dashboard_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_images = db.query(
        models.UploadedImage
    ).filter(
        models.UploadedImage.user_id == current_user.id
    ).count()

    results = db.query(
        models.ImageAnalysisResult
    ).filter(
        models.ImageAnalysisResult.user_id == current_user.id
    ).all()

    total_analyses = len(results)

    authentic_count = sum(
        1
        for result in results
        if result.result == "Likely Authentic"
    )

    suspicious_count = sum(
        1
        for result in results
        if result.result == "Suspicious"
    )

    tampered_count = sum(
        1
        for result in results
        if result.result == "Likely Tampered"
    )

    if total_analyses > 0:
        average_confidence = round(
            sum(
                result.confidence
                for result in results
            ) / total_analyses,
            2
        )
    else:
        average_confidence = 0

    return {
        "total_images": total_images,
        "total_analyses": total_analyses,
        "likely_authentic": authentic_count,
        "suspicious": suspicious_count,
        "likely_tampered": tampered_count,
        "average_confidence": average_confidence
    }

# =========================================================
# DELETE IMAGE
# Deletes the selected user's image, its analysis records,
# and the uploaded file from disk.
# =========================================================

@app.delete("/my-images/{image_id}")
def delete_my_image(
    image_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image = (
        db.query(models.UploadedImage)
        .filter(
            models.UploadedImage.id == image_id,
            models.UploadedImage.user_id == current_user.id
        )
        .first()
    )

    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )

    analysis_count = (
        db.query(models.ImageAnalysisResult)
        .filter(
            models.ImageAnalysisResult.image_id == image.id,
            models.ImageAnalysisResult.user_id == current_user.id
        )
        .delete(synchronize_session=False)
    )

    file_path = Path(image.file_path)

    if not file_path.is_absolute():
        file_path = BACKEND_DIR / file_path

    db.delete(image)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete image from database."
        )

    file_deleted = False

    try:
        if file_path.exists():
            file_path.unlink()
            file_deleted = True
    except OSError:
        # DB deletion has already succeeded. Do not fail the request
        # only because the physical file could not be removed.
        file_deleted = False

    return {
        "message": "Image deleted successfully",
        "image_id": image_id,
        "deleted_analysis_records": analysis_count,
        "file_deleted": file_deleted
    }


# =========================================================
# CLEAR ANALYSIS HISTORY
# Keeps uploaded images; removes only the logged-in user's
# saved analysis-result records.
# =========================================================

@app.delete("/analysis-history")
def clear_analysis_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deleted_count = (
        db.query(models.ImageAnalysisResult)
        .filter(
            models.ImageAnalysisResult.user_id == current_user.id
        )
        .delete(synchronize_session=False)
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not clear analysis history."
        )

    return {
        "message": "Analysis history cleared successfully",
        "deleted_analyses": deleted_count
    }
