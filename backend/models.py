from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)


class UploadedImage(Base):
    __tablename__ = "uploaded_images"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    original_filename = Column(String, nullable=False)
    saved_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    image_format = Column(String, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)

class ImageAnalysisResult(Base):
    __tablename__ = "image_analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    result = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False)
    max_difference = Column(Integer, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=True
    )