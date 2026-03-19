"""
Calibration script v3: Uses saturation-based cube detection to find the face,
then extracts BGR medians for each cell and calibrates reference centroids.
"""
import cv2
import numpy as np
import os
from collections import defaultdict

IMG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cube-images")

# Labels based on 60% square center crop debug images.
# "?" = uncertain/background — skipped during calibration.
LABELS = {
    "White.jpg": ["blue", "yellow", "red", "white", "white", "yellow", "green", "yellow", "green"],
    "Red.jpg": ["orange", "green", "blue", "green", "red", "blue", "white", "orange", "orange"],
    "Green.jpg": ["yellow", "orange", "red", "red", "green", "?", "yellow", "red", "white"],
    "Yellow.jpg": ["blue", "yellow", "?", "yellow", "white", "red", "?", "?", "?"],
    "Orange.jpg": ["white", "orange", "green", "yellow", "orange", "red", "?", "?", "?"],
    "Blue.jpg": ["blue", "yellow", "white", "red", "blue", "orange", "green", "green", "white"],
}


def bgr_to_lab(bgr):
    pixel = np.uint8([[bgr.astype(np.uint8)]])
    return cv2.cvtColor(pixel, cv2.COLOR_BGR2LAB)[0][0].astype(np.float32)


def center_square_crop(img, inner_pct=0.60):
    """
    Crop a SQUARE region from the center of the image (inner_pct of shorter side).
    This avoids distortion from landscape/portrait aspect ratios.
    """
    h, w = img.shape[:2]
    side = int(min(h, w) * inner_pct)
    cx, cy = w // 2, h // 2
    x1, y1 = cx - side // 2, cy - side // 2
    x2, y2 = x1 + side, y1 + side
    cropped = img[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
    return cv2.resize(cropped, (300, 300))


def main():
    # Step 1: Extract real BGR values from all photos using saturation-based detection
    print("STEP 1: Extract BGR values with saturation-based cube detection")
    print("=" * 70)

    color_bgr_samples = defaultdict(list)
    all_cells = []  # (filename, row, col, expected, median_bgr)

    for filename, labels in LABELS.items():
        path = os.path.join(IMG_DIR, filename)
        if not os.path.exists(path):
            continue

        img = cv2.imread(path)
        max_dim = 800
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)))

        face = center_square_crop(img, 0.60)

        face = cv2.GaussianBlur(face, (5, 5), 0)
        cell = 100
        radius = 18

        print(f"\n--- {filename} ---")
        for idx, expected in enumerate(labels):
            if expected == "?":
                continue
            row, col = idx // 3, idx % 3
            cx, cy = col * cell + cell // 2, row * cell + cell // 2
            region = face[cy - radius:cy + radius, cx - radius:cx + radius]
            median_bgr = np.median(region.reshape(-1, 3), axis=0).astype(np.float32)
            color_bgr_samples[expected].append(median_bgr)
            all_cells.append((filename, row, col, expected, median_bgr))
            print(f"  [{row},{col}] {expected:>8s}: BGR=({median_bgr[0]:.0f},{median_bgr[1]:.0f},{median_bgr[2]:.0f})")

    # Step 2: Compute optimal centroids
    print(f"\n{'=' * 70}")
    print("STEP 2: Optimal BGR centroids from real data")
    print("=" * 70)

    ref_bgr = {}
    ref_lab = {}
    for color in ["white", "red", "orange", "yellow", "green", "blue"]:
        arr = np.array(color_bgr_samples[color])
        median = np.median(arr, axis=0).astype(np.float32)
        ref_bgr[color] = median
        ref_lab[color] = bgr_to_lab(median)
        print(f'    "{color}":  np.array([{median[0]:.0f}, {median[1]:.0f}, {median[2]:.0f}], dtype=np.float32),')

    # Step 3: Test classification accuracy using the computed centroids
    print(f"\n{'=' * 70}")
    print("STEP 3: Classification accuracy with calibrated centroids")
    print("=" * 70)

    total, correct = 0, 0
    for filename, row, col, expected, median_bgr in all_cells:
        lab = bgr_to_lab(median_bgr)
        best, best_d = "white", float("inf")
        for name, ref in ref_lab.items():
            d = np.linalg.norm(lab - ref)
            if d < best_d:
                best, best_d = name, d

        ok = "✓" if best == expected else "✗"
        if best == expected:
            correct += 1
        total += 1
        if best != expected:
            print(f"  {filename} [{row},{col}] expect={expected:>8s} got={best:>8s} {ok} "
                  f"BGR=({median_bgr[0]:.0f},{median_bgr[1]:.0f},{median_bgr[2]:.0f}) dist={best_d:.1f}")

    print(f"\n  ACCURACY: {correct}/{total} = {100 * correct / total:.1f}%")
    print(f"  Correct: {correct}, Wrong: {total - correct}")


if __name__ == "__main__":
    main()
