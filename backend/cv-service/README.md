# Rubik's Cube CV Service

Python + OpenCV microservice for detecting cube face colors from photos.

## Setup

```bash
cd backend/cv-service
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

## API

### POST /detect
Send a base64-encoded photo, get back 9 detected colors.

```json
{
  "image": "base64_encoded_jpeg..."
}
```

Response:
```json
{
  "colors": ["white", "red", "green", "blue", "orange", "yellow", "red", "white", "green"],
  "debug": { "method": "contour_detection", "face_found": true }
}
```

### GET /health
Returns `{"ok": true, "service": "cv-service"}`
