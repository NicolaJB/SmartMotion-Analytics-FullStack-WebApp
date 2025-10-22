# SmartMotion Analytics Full Stack Web App
SmartMotion is a motion classification system using FastAPI and Next.js.
It analyses sensor data (accelerometer X, Y, Z and gyroscope Gx, Gy, Gz) to classify segments as moving or stationary via a Linear Support Vector Machine (SVM).

## Features
- FastAPI backend with `/predict` endpoint
- Per-segment feature extraction (min, max, mean, variance, skewness, kurtosis)
- LinearSVC classifier (scikit-learn)
- Next.js frontend for file upload and interactive charts
- Chart.js visualisation of X, Y, Z mean and SVM predictions

## Project Structure
```bash
SmartMotion/
├── backend/
│ ├── main.py
│ ├── model.py
│ └── requirements.txt
├── frontend/
│ ├── pages/
│ │ ├── index.tsx
│ │ └── api/classify.ts
│ ├── package.json
│ └── tsconfig.json
├── .gitignore
└── README.md
```
## Quick Start
### 1. Clone
```bash
git clone https://github.com/<your-username>/SmartMotion.git
cd SmartMotion
```
### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
uvicorn backend.main:app --reload
```
Backend runs at: http://127.0.0.1:8000

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:3000

## Workflow Diagram
```bash
User (uploads CSVs)
       |
       v
   Next.js Frontend
       |
       v
POST /predict (FastAPI)
       |
       v
  Feature extraction
       |
       v
     SVM predicts
       |
       v
  JSON response → Frontend charts
```


## Usage
Upload two CSV files (Moving.csv & Stationary.csv) via the web UI.
CSV format must include:

```bash
X, Y, Z
```

### Frontend Charts
- Coloured lines: mean X/Y/Z acceleration per segment
- Black dashed line: SVM prediction (0 = moving, 1 = stationary)
- Peaks/troughs indicate motion intensity

### API Endpoints
GET /
- Returns backend status:

```json

{
  "message": "SmartMotion SVM backend is running. Use POST /predict with two CSV files."
}
```
POST /predict
- Accepts multipart/form-data with fields: moving, stationary (CSV files)
- Returns segment features and predictions

Example response:
```json
{
  "segments": [
    {
      "min": [-0.5, 0.1, -0.3],
      "max": [0.8, 0.9, 0.6],
      "mean": [0.2, 0.5, 0.1],
      "variance": [0.03, 0.04, 0.02],
      "skew": [0.1, -0.2, 0.05],
      "kurtosis": [2.5, 3.1, 1.8],
      "prediction": 0
    }
  ]
}
```
## Development Notes
- Backend retrains on upload (for demonstration purposes)
- Segment size: 10 samples by default
- Ensure CORS is properly configured if deploying frontend and backend separately
- Validate CSV files (numeric, correct columns)

### Licence
MIT Licence. See LICENSE for details.

### Acknowledgements
- FastAPI — API framework
- scikit-learn — SVM classifier
- Next.js — frontend framework
- Chart.js — charts for visualisation
