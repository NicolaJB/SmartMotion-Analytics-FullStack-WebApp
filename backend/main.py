# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from scipy import stats
from sklearn import svm

app = FastAPI(title="SmartMotion SVM Backend")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "features": features.tolist()  # for SVM
        })
    return segments

@app.post("/predict")
async def predict(
    moving: UploadFile = File(...),
    stationary: UploadFile = File(...)
):
    try:
        df_moving = pd.read_csv(moving.file)
        df_stationary = pd.read_csv(stationary.file)
    except Exception as e:
        return {"error": f"Failed to read CSV: {e}"}

    # Validate columns
    for df, name in zip([df_moving, df_stationary], ["moving", "stationary"]):
        if not set(["X", "Y", "Z"]).issubset(df.columns):
            return {"error": f"{name} CSV missing X, Y, Z columns"}

    # Extract segments
    segments_moving = extract_segment_features(df_moving)
    segments_stationary = extract_segment_features(df_stationary)

    # Prepare SVM training
    X = np.vstack([seg["features"] for seg in segments_moving + segments_stationary])
    y = np.array([0]*len(segments_moving) + [1]*len(segments_stationary))

    # Train SVM
    clf = svm.LinearSVC()
    clf.fit(X, y)
    predictions = clf.predict(X).tolist()

    # Return structured segment info
    all_segments = segments_moving + segments_stationary
    for seg, pred in zip(all_segments, predictions):
        seg["prediction"] = int(pred)

    return {"segments": all_segments}

@app.get("/")
async def root():
    return {"message": "SmartMotion SVM backend is running. Use POST /predict with two CSV files."}