# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from scipy import stats
from sklearn import svm
import os
import logging
import time
from datetime import datetime
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SmartMotion SVM Backend",
    description="Motion classification API using SVM",
    version="1.0.0"
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SEGMENT_SIZE = int(os.getenv("SEGMENT_SIZE", "10"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB

# Feature extraction per segment
def extract_segment_features(df, segment_size=10):
    df = df[['X', 'Y', 'Z']]
    num_segments = len(df) // segment_size
    segments = []

    for i in range(num_segments):
        segment = df.iloc[i*segment_size:(i+1)*segment_size]
        stats_desc = stats.describe(segment)
        features = np.concatenate((
            stats_desc.minmax[0],  # min X,Y,Z
            stats_desc.minmax[1],  # max X,Y,Z
            stats_desc.mean,       # mean X,Y,Z
            stats_desc.variance,   # variance X,Y,Z
            stats_desc.skewness,   # skew X,Y,Z
            stats_desc.kurtosis    # kurtosis X,Y,Z
        ))
        segments.append({
            "min": segment.min().tolist(),
            "max": segment.max().tolist(),
            "mean": segment.mean().tolist(),
            "variance": segment.var().tolist(),
            "skew": segment.skew().tolist(),
            "kurtosis": segment.kurtosis().tolist(),
            "features": features.tolist()
        })
    return segments

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "SmartMotion API",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
async def root():
    return {
        "message": "SmartMotion SVM backend is running. Use POST /predict with two CSV files.",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "docs": "/docs"
        }
    }

@app.post("/predict")
async def predict(
    moving: UploadFile = File(...),
    stationary: UploadFile = File(...)
):
    """
    Predict motion classification from uploaded CSV files.
    """
    start_time = time.time()
    logger.info(f"Prediction request received - Moving: {moving.filename}, Stationary: {stationary.filename}")
    
    try:
        # Validate file sizes
        moving_content = await moving.read()
        stationary_content = await stationary.read()
        
        if len(moving_content) > MAX_FILE_SIZE or len(stationary_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE} bytes"
            )
        
        # Reset file pointers
        await moving.seek(0)
        await stationary.seek(0)
        
        # Read CSV files
        try:
            df_moving = pd.read_csv(moving.file)
            df_stationary = pd.read_csv(stationary.file)
        except Exception as e:
            logger.error(f"CSV read error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to read CSV: {str(e)}"
            )

        # Validate columns
        required_columns = {"X", "Y", "Z"}
        for df, name in zip([df_moving, df_stationary], ["moving", "stationary"]):
            if not required_columns.issubset(df.columns):
                raise HTTPException(
                    status_code=400,
                    detail=f"{name} CSV missing required columns: X, Y, Z"
                )
            
            # Validate data types
            for col in required_columns:
                if not pd.api.types.is_numeric_dtype(df[col]):
                    raise HTTPException(
                        status_code=400,
                        detail=f"{name} CSV column {col} must be numeric"
                    )
            
            # Check minimum data points
            if len(df) < SEGMENT_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"{name} CSV must have at least {SEGMENT_SIZE} rows"
                )

        # Extract segments
        segments_moving = extract_segment_features(df_moving, SEGMENT_SIZE)
        segments_stationary = extract_segment_features(df_stationary, SEGMENT_SIZE)
        
        if not segments_moving or not segments_stationary:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data to create segments. Need more data points."
            )

        # Prepare SVM training
        X = np.vstack([seg["features"] for seg in segments_moving + segments_stationary])
        y = np.array([0]*len(segments_moving) + [1]*len(segments_stationary))

        # Train SVM
        clf = svm.LinearSVC(max_iter=10000)
        clf.fit(X, y)
        predictions = clf.predict(X).tolist()
        
        # Calculate accuracy
        accuracy = clf.score(X, y)

        # Return structured segment info
        all_segments = segments_moving + segments_stationary
        for seg, pred in zip(all_segments, predictions):
            seg["prediction"] = int(pred)

        processing_time = time.time() - start_time
        logger.info(f"Prediction completed - Segments: {len(all_segments)}, Accuracy: {accuracy:.2f}, Time: {processing_time:.2f}s")

        return {
            "segments": all_segments,
            "summary": {
                "total_segments": len(all_segments),
                "moving_segments": len(segments_moving),
                "stationary_segments": len(segments_stationary),
                "predictions": {
                    "moving": predictions.count(0),
                    "stationary": predictions.count(1)
                },
                "model_accuracy": round(accuracy, 4),
                "processing_time_seconds": round(processing_time, 2)
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )