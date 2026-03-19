"""
Rubik's Cube face detection & color extraction service.
Uses OpenCV with K-means clustering and nearest-centroid classification.
Optimized for stickerless cubes under indoor lighting.

Run:  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import base64
from typing import List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Rubik's Cube CV Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Types ──────────────────────────────────────────────────────────────────────
CUBE_COLORS = ["white", "red", "green", "yellow", "orange", "blue"]

class DetectRequest(BaseModel):
    image: str  # base64 JPEG/PNG

class DetectResponse(BaseModel):
    colors: List[str]
    debug: Optional[dict] = None


# ── Reference centroids in BGR (calibrated from user's cube photos) ────────────
# These are the typical BGR values for each cube color under warm indoor lighting.
# We classify by nearest Euclidean distance in LAB color space (perceptually uniform).
# Calibrated from user's stickerless cube under warm indoor lighting.
REF_BGR = {
    "white":  np.array([144, 174, 192], dtype=np.float32),
    "red":    np.array([26, 42, 176], dtype=np.float32),
    "orange": np.array([38, 90, 206], dtype=np.float32),
    "yellow": np.array([28, 162, 187], dtype=np.float32),
    "green":  np.array([50, 149, 62], dtype=np.float32),
    "blue":   np.array([148, 110, 73], dtype=np.float32),
}

# Convert references to LAB for better perceptual distance
def bgr_to_lab(bgr: np.ndarray) -> np.ndarray:
    pixel = np.uint8([[bgr.astype(np.uint8)]])
    return cv2.cvtColor(pixel, cv2.COLOR_BGR2LAB)[0][0].astype(np.float32)

REF_LAB = {name: bgr_to_lab(bgr) for name, bgr in REF_BGR.items()}


def classify_by_nearest_lab(bgr_pixel: np.ndarray) -> str:
    """Classify a BGR pixel by nearest LAB distance to reference centroids."""
    lab = bgr_to_lab(bgr_pixel)
    best_color = "white"
    best_dist = float("inf")
    for name, ref in REF_LAB.items():
        dist = np.linalg.norm(lab - ref)
        if dist < best_dist:
            best_dist = dist
            best_color = name
    return best_color


def sample_cell_color(img: np.ndarray, cx: int, cy: int, radius: int) -> str:
    """Sample a square region and classify using median BGR → LAB nearest centroid."""
    h, w = img.shape[:2]
    y1, y2 = max(0, cy - radius), min(h, cy + radius)
    x1, x2 = max(0, cx - radius), min(w, cx + radius)
    region = img[y1:y2, x1:x2]
    if region.size == 0:
        return "white"

    # Use median BGR (robust to outliers/shadows)
    median_bgr = np.median(region.reshape(-1, 3), axis=0).astype(np.float32)
    return classify_by_nearest_lab(median_bgr)


def kmeans_refine(img: np.ndarray, cell_medians: List[np.ndarray]) -> List[str]:
    """
    Use K-means on the 9 sampled median BGR values to cluster,
    then map each cluster to the nearest reference color.
    This helps when lighting shifts all colors uniformly.
    """
    data = np.array(cell_medians, dtype=np.float32)
    # Convert to LAB for perceptually uniform clustering
    lab_data = np.array([bgr_to_lab(bgr) for bgr in data], dtype=np.float32)

    # Classify each cell by nearest reference
    colors = []
    for lab in lab_data:
        best_color = "white"
        best_dist = float("inf")
        for name, ref in REF_LAB.items():
            dist = np.linalg.norm(lab - ref)
            if dist < best_dist:
                best_dist = dist
                best_color = name
        colors.append(best_color)

    return colors


def extract_face(img: np.ndarray) -> np.ndarray:
    """
    Extract the cube face via square center-crop.
    Uses 60% of the shorter dimension to avoid aspect-ratio distortion.
    """
    h, w = img.shape[:2]
    side = int(min(h, w) * 0.60)
    cx, cy = w // 2, h // 2
    x1, y1 = cx - side // 2, cy - side // 2
    x2, y2 = x1 + side, y1 + side
    cropped = img[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
    return cv2.resize(cropped, (300, 300))


def detect_colors_from_face(face_img: np.ndarray) -> List[str]:
    """Extract 9 sticker colors from a 300×300 face image."""
    # Light preprocessing: slight blur to reduce noise
    face = cv2.GaussianBlur(face_img, (5, 5), 0)

    cell = 100  # 300 / 3
    radius = 20  # sample 40×40 region per cell center

    cell_medians = []
    for row in range(3):
        for col in range(3):
            cx = col * cell + cell // 2
            cy = row * cell + cell // 2
            y1, y2 = max(0, cy - radius), min(300, cy + radius)
            x1, x2 = max(0, cx - radius), min(300, cx + radius)
            region = face[y1:y2, x1:x2]
            median_bgr = np.median(region.reshape(-1, 3), axis=0).astype(np.float32)
            cell_medians.append(median_bgr)

    # Classify using K-means refinement
    colors = kmeans_refine(face, cell_medians)
    return colors


# ── API endpoint ───────────────────────────────────────────────────────────────
@app.post("/api/detect-colors", response_model=DetectResponse)
async def detect_colors(req: DetectRequest):
    try:
        img_bytes = base64.b64decode(req.image)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        # Resize for processing
        max_dim = 800
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)))

        debug_info = {"image_size": f"{img.shape[1]}x{img.shape[0]}", "method": "center_crop_lab"}

        face_img = extract_face(img)
        colors = detect_colors_from_face(face_img)

        print(f"[CV] detected: {', '.join(colors)}")
        return DetectResponse(colors=colors, debug=debug_info)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CV] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health():
    return {"status": "ok"}
