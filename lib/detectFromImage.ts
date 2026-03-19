import * as ImageManipulator from "expo-image-manipulator";
import { API_BASE_URL } from "./constants";
import type { CubeColor } from "@/types/cube";

/**
 * Detect the 9 sticker colors from a photo taken by expo-camera.
 * All platforms send to Python FastAPI backend for OpenCV-based detection.
 */
export async function detectCubeColors(
  photoUri: string,
): Promise<CubeColor[]> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ resize: { width: 800 } }],
      { format: ImageManipulator.SaveFormat.JPEG, base64: true, compress: 0.8 },
    );
    if (!result.base64) throw new Error("No base64 from ImageManipulator");

    const resp = await fetch(`${API_BASE_URL}/api/detect-colors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: result.base64 }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Server ${resp.status}: ${errText}`);
    }

    const data = (await resp.json()) as { colors: CubeColor[] };
    return data.colors;
  } catch (err) {
    console.warn("[detectCubeColors] Detection failed, fallback to white:", err);
    return Array(9).fill("white") as CubeColor[];
  }
}
