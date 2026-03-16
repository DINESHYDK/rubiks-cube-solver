import { Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { rgbToHsv, classifyColor } from "./colorDetection";
import { API_BASE_URL } from "./constants";
import type { CubeColor } from "@/types/cube";

const SIZE = 270;
const CELL = 90;

// ── Web: HTML5 canvas (works in browser) ──────────────────────────────────────
function detectWeb(base64: string): Promise<CubeColor[]> {
  return new Promise((resolve) => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;
      const src = Math.min(img.width, img.height);
      const sx = (img.width - src) / 2;
      const sy = (img.height - src) / 2;
      ctx.drawImage(img, sx, sy, src, src, 0, 0, SIZE, SIZE);
      const colors: CubeColor[] = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const px = ctx.getImageData(
            col * CELL + CELL / 2,
            row * CELL + CELL / 2,
            1,
            1,
          ).data;
          colors.push(
            classifyColor(rgbToHsv({ r: px[0], g: px[1], b: px[2] })),
          );
        }
      }
      resolve(colors);
    };
    img.onerror = () => resolve(Array(9).fill("white") as CubeColor[]);
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

// ── Native: send photo to backend for server-side detection via sharp ─────────
async function detectNative(photoUri: string): Promise<CubeColor[]> {
  try {
    // Get base64 JPEG from the photo
    const result = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ resize: { width: 800 } }],
      { format: ImageManipulator.SaveFormat.JPEG, base64: true, compress: 0.8 },
    );
    if (!result.base64) throw new Error("No base64 from ImageManipulator");

    console.log("[detectNative] Sending image to backend...");

    // Send to backend for server-side color detection
    const resp = await fetch(`${API_BASE_URL}/detect-colors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: result.base64 }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Server ${resp.status}: ${errText}`);
    }

    const data = (await resp.json()) as { colors: CubeColor[] };
    console.log("[detectNative] Server detected:", data.colors);
    return data.colors;
  } catch (err) {
    console.warn(
      "[detectNative] Server detection failed, fallback to white:",
      err,
    );
    return Array(9).fill("white") as CubeColor[];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Detect the 9 sticker colors from a photo taken by expo-camera.
 * Web: client-side canvas. Native: sends to Express backend (sharp).
 */
export async function detectCubeColors(
  photoUri: string,
  base64?: string,
): Promise<CubeColor[]> {
  if (Platform.OS === "web" && base64) return detectWeb(base64);
  return detectNative(photoUri);
}
