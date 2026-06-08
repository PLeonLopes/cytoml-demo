# CytoML Demo – AI-Powered Cytology Cell Detection

CytoML Demo is a full-stack application that uses a YOLO v26 model to detect and analyze cells in cytology microscopy images. Upload an image, get instant detection results with bounding boxes, confidence scores, and inference metrics — all through a clean, responsive web interface.

## Overview

This project showcases an end-to-end computer vision pipeline for cytological analysis. The frontend provides an intuitive image upload experience and renders annotated results in real time. The backend runs a YOLO v26 model in ONNX format, handling preprocessing, inference, and postprocessing entirely server-side before returning the annotated image and structured detection data.

---

## Live Demos

| Service | URL | Host |
|---------|-----|------|
| Frontend (primary) | https://cytoml-demo.vercel.app | Vercel |
| Frontend (mirror) | https://cytoml-demo.onrender.com | Render |
| Backend API | https://cytoml-api-762616154335.southamerica-east1.run.app | GCP Cloud Run |

---

## Key Features

* **Real-Time Cell Detection:** Submits an image to YOLO v8 and returns an annotated result with bounding boxes drawn directly on the original image.
* **Inference Metrics:** Each analysis returns total detections, inference time (ms), and confidence statistics (avg, min, max).
* **Structured Detection Data:** Individual cell detections include class, confidence score, and bounding box coordinates.
* **Containerized Backend:** The Django API and ONNX runtime are fully containerized and ready to run with a single Docker Compose command.
* **Multi-environment Config:** Supports local development and cloud deployment through environment variables.

---

## Technologies Used

**Frontend:**
* [React 19](https://react.dev/) - UI framework
* [Vite 8](https://vitejs.dev/) - build tool and dev server
* [Tailwind CSS 4](https://tailwindcss.com/) - utility-first styling
* [React Router v7](https://reactrouter.com/) - client-side routing
* [Axios](https://axios-http.com/) - HTTP client

**Backend:**
* [Django 5.2](https://www.djangoproject.com/) + [Django REST Framework](https://www.django-rest-framework.org/) - REST API
* [ONNX Runtime](https://onnxruntime.ai/) - model inference
* [OpenCV](https://opencv.org/) - image preprocessing and annotation
* [Gunicorn](https://gunicorn.org/) - production WSGI server

**Model:**
* [YOLO v26](https://docs.ultralytics.com/) in ONNX format — end-to-end detection with built-in NMS, 640×640 input

---

## Getting Started

### 1. Prerequisites

* **Docker** and **Docker Compose** — to run the backend container
* **Node.js 18+** and **npm 9+** — for frontend local development

### 2. Clone the Repository

```bash
git clone https://github.com/PLeonLopes/cytoml-demo.git
cd cytoml-demo
```

### 3. Configure Environment Variables

```bash
cp .example.env .env
```

Open `.env` and fill in the required values:

| Variable | Description |
|----------|-------------|
| `DEBUG` | Django debug mode (`True` / `False`) |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts |
| `YOLO_MODEL_PATH` | Path to ONNX model (default: `models/best.onnx`) |

### 4. Start the Backend

```bash
docker compose up --build
```

The API will be available at `http://localhost:8080`.

### 5. Start the Frontend

See [frontend/README.md](frontend/README.md) for frontend-specific setup instructions.

---

## Project Structure

```
cytoml-demo/
├── frontend/          # React + Vite SPA
├── backend/           # Django REST API + YOLO v8 inference
├── docker-compose.yml # Local orchestration (backend)
└── .example.env       # Environment variable template
```

---

## API Reference

Base URL (local): `http://localhost:8080`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analysis/health/` | Health check |
| `POST` | `/api/analysis/analyze/` | Analyze an image |

### POST `/api/analysis/analyze/`

**Request:** `multipart/form-data` with an `image` field.

**Response:**
```json
{
  "annotated_image": "data:image/png;base64,...",
  "analysis": {
    "total_detections": 12,
    "inference_time_ms": 145.3,
    "avg_confidence": 0.87,
    "min_confidence": 0.61,
    "max_confidence": 0.96
  },
  "detections": [
    {
      "id": 1,
      "class_id": 0,
      "class_name": "cell",
      "confidence": 0.94,
      "bbox": [120, 80, 200, 160]
    }
  ]
}
```
