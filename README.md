# SmartMotion Analytics Full Stack Web App

SmartMotion is a production-ready motion classification system using FastAPI and Next.js. It analyses sensor data (accelerometer X, Y, Z) to classify segments as moving or stationary via a Linear Support Vector Machine (SVM).

## Features

- FastAPI backend with RESTful API endpoints
- Per-segment feature extraction (min, max, mean, variance, skewness, kurtosis)
- LinearSVC classifier (scikit-learn) for motion classification
- Next.js frontend with TypeScript for file upload and interactive charts
- Chart.js visualisation of X, Y, Z mean values and SVM predictions
- Docker containerisation for easy deployment
- CI/CD pipeline with GitHub Actions
- Production-ready with logging, health checks, and error handling
- Cloud deployment ready (Render, DockerHub)

## Project Structure

SmartMotion/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── model.py             # ML model utilities
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── pages/
│   │   ├── index.tsx        # Main UI component
│   │   └── api/
│   ├── package.json
│   ├── next.config.js       # Next.js configuration
│   └── tsconfig.json
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI/CD
├── Dockerfile.backend        # Backend Docker image
├── Dockerfile.frontend      # Frontend Docker image
├── .dockerignore
└── README.md

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker (optional, for containerised deployment)

### Local Development

#### 1. Clone Repository
```bash
git clone https://github.com/NicolaJB/SmartMotion-Analytics-FullStack-WebApp.git
cd SmartMotion-Analytics-FullStack-WebApp
```

#### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate          # Windows

pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at: http://127.0.0.1:8000
- API Docs: http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/health

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

## Docker Deployment

### Build Images
# Build backend
docker build -f Dockerfile.backend -t smartmotion-backend:latest .

# Build frontend
docker build -f Dockerfile.frontend -t smartmotion-frontend:latest .

### Run with Docker
# Backend
docker run -p 8000:8000 smartmotion-backend:latest

# Frontend (set API URL)
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 smartmotion-frontend:latest

## Cloud Deployment

### Deploy to Render

1. Backend Service:
   - Create new Web Service
   - Connect GitHub repository
   - Environment: Docker
   - Dockerfile Path: Dockerfile.backend
   - Environment Variables:
     - ALLOWED_ORIGINS: Your frontend URL
     - SEGMENT_SIZE: 10
     - MAX_FILE_SIZE: 10485760

2. Frontend Service:
   - Create new Web Service
   - Connect GitHub repository
   - Environment: Docker
   - Dockerfile Path: Dockerfile.frontend
   - Environment Variables:
     - NEXT_PUBLIC_API_URL: Your backend URL
     - NODE_ENV: production

### Push to DockerHub
# Login
docker login

# Tag and push backend
docker build -f Dockerfile.backend -t YOUR_USERNAME/smartmotion-backend:latest .
docker push YOUR_USERNAME/smartmotion-backend:latest

# Tag and push frontend
docker build -f Dockerfile.frontend -t YOUR_USERNAME/smartmotion-frontend:latest .
docker push YOUR_USERNAME/smartmotion-frontend:latest

## Usage

### Upload Data
Upload two CSV files (Moving.csv & Stationary.csv) via the web UI.

CSV Format:
X, Y, Z
0.1, 0.2, 0.3
0.2, 0.3, 0.4
...

### Frontend Charts
- Coloured lines: Mean X (red), Y (blue), Z (green) acceleration per segment
- Black dashed line: SVM prediction (0 = moving, 1 = stationary)
- Peaks/troughs: Indicate motion intensity

## API Endpoints

### GET /
Returns backend status and available endpoints.

Response:
{
  "message": "SmartMotion SVM backend is running...",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "predict": "/predict",
    "docs": "/docs"
  }
}

### GET /health
Health check endpoint for monitoring.

Response:
{
  "status": "healthy",
  "service": "SmartMotion API",
  "timestamp": "2025-01-27T14:18:44.873209"
}

### POST /predict
Accepts multipart/form-data with fields: moving, stationary (CSV files).

Response:
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
  ],
  "summary": {
    "total_segments": 50,
    "moving_segments": 25,
    "stationary_segments": 25,
    "predictions": {
      "moving": 25,
      "stationary": 25
    },
    "model_accuracy": 1.0,
    "processing_time_seconds": 0.15
  }
}

## CI/CD Pipeline

The project includes GitHub Actions workflow (.github/workflows/ci.yml) that:
- Tests backend dependencies and Docker build
- Tests frontend build and Docker build
- Runs on every push to main/master branch

View workflow status: https://github.com/NicolaJB/SmartMotion-Analytics-FullStack-WebApp/actions

## Development Notes

- Backend retrains SVM on each upload (for demonstration purposes)
- Segment size: 10 samples by default (configurable via SEGMENT_SIZE env var)
- Maximum file size: 10MB (configurable via MAX_FILE_SIZE env var)
- CORS configured for production deployment
- Comprehensive error handling and validation
- Structured logging for production monitoring

## Environment Variables

### Backend
- ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins (default: "*")
- SEGMENT_SIZE: Number of samples per segment (default: 10)
- MAX_FILE_SIZE: Maximum file size in bytes (default: 10485760)

### Frontend
- NEXT_PUBLIC_API_URL: Backend API URL (default: http://127.0.0.1:8000)

## Testing

# Test backend health
curl http://localhost:8000/health

# Test API docs
open http://localhost:8000/docs

## License

MIT License. See LICENSE for details.

## Acknowledgements

- FastAPI — Modern API framework
- scikit-learn — Machine learning library
- Next.js — React framework
- Chart.js — Data visualisation
- Docker — Containerisation
- Render — Cloud hosting platform
