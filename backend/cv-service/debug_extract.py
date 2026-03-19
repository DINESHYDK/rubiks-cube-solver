"""Debug: Save square-center-cropped face images with grid overlay."""
import cv2
import numpy as np
import os

IMG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cube-images")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cube-images", "debug")
os.makedirs(OUT_DIR, exist_ok=True)


def center_square_crop(img, inner_pct=0.60):
    h, w = img.shape[:2]
    side = int(min(h, w) * inner_pct)
    cx, cy = w // 2, h // 2
    x1, y1 = cx - side // 2, cy - side // 2
    cropped = img[max(0, y1):min(h, y1 + side), max(0, x1):min(w, x1 + side)]
    return cv2.resize(cropped, (300, 300))


for fname in sorted(os.listdir(IMG_DIR)):
    if not fname.lower().endswith(".jpg"):
        continue
    img = cv2.imread(os.path.join(IMG_DIR, fname))
    if img is None:
        continue
    max_dim = 800
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))

    face = center_square_crop(img, 0.60)
    grid = face.copy()
    for i in range(1, 3):
        cv2.line(grid, (i * 100, 0), (i * 100, 300), (0, 255, 0), 2)
        cv2.line(grid, (0, i * 100), (300, i * 100), (0, 255, 0), 2)
    # Also mark cell centers
    for r in range(3):
        for c in range(3):
            cv2.circle(grid, (c * 100 + 50, r * 100 + 50), 5, (0, 0, 255), -1)
    cv2.imwrite(os.path.join(OUT_DIR, f"{fname}_sq60_grid.jpg"), grid)
    print(f"  {fname}: {img.shape[1]}x{img.shape[0]} -> square crop saved")

print(f"\nDebug images saved to: {OUT_DIR}")
