import * as ImageManipulator from "expo-image-manipulator";
import { API_BASE_URL } from "./constants";
import type { CubeColor } from "@/types/cube";

// Base64 decoding lookup table
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

function decodeBase64(base64: string): Uint8Array {
  let bufferLength = base64.length * 0.75;
  const len = base64.length;
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;

  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);

  for (let i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (p < bufferLength) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return bytes;
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

// Hue circular distance
function hueDistance(h1: number, h2: number) {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Target color references in HSV
const COLOR_REFS = [
  { name: 'white',  ref: { h: 0, s: 0, v: 100 } },
  { name: 'red',    ref: { h: 355, s: 90, v: 75 } },
  { name: 'green',  ref: { h: 140, s: 85, v: 65 } },
  { name: 'yellow', ref: { h: 50, s: 90, v: 95 } },
  { name: 'orange', ref: { h: 25, s: 95, v: 90 } },
  { name: 'blue',   ref: { h: 215, s: 90, v: 70 } },
] as const;

function classifyHsv(h: number, s: number, v: number): CubeColor {
  // White detection: low saturation, relatively high value
  if (s < 18 && v > 50) return 'white';

  let bestColor: CubeColor = 'white';
  let bestDist = Infinity;

  for (const item of COLOR_REFS) {
    let dist = 0;
    if (item.name === 'white') {
      dist = s * 1.8 + (100 - v) * 1.5;
    } else {
      const hDist = hueDistance(h, item.ref.h);
      const sDist = Math.abs(s - item.ref.s);
      const vDist = Math.abs(v - item.ref.v);
      dist = hDist * 3.0 + sDist * 0.8 + vDist * 0.8;
    }

    if (dist < bestDist) {
      bestDist = dist;
      bestColor = item.name;
    }
  }

  return bestColor;
}

/**
 * Fallback local image parsing if server is offline.
 */
async function localDetectColors(photoUri: string): Promise<CubeColor[]> {
  try {
    // 1. Get photo dimension info
    const info = await ImageManipulator.manipulateAsync(photoUri, [], {});
    const w = info.width;
    const h = info.height;

    // 2. Crop to center square (75% size to reduce background noise) and downscale to 3x3 pixels
    const cropSize = Math.round(Math.min(w, h) * 0.75);
    const originX = Math.round((w - cropSize) / 2);
    const originY = Math.round((h - cropSize) / 2);

    const cropped = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        { crop: { originX, originY, width: cropSize, height: cropSize } },
        { resize: { width: 3, height: 3 } }
      ],
      { format: ImageManipulator.SaveFormat.PNG, base64: true }
    );

    if (!cropped.base64) throw new Error("No base64 returned");

    // 3. Decode PNG using pngjs browser standalone bundle
    const { PNG } = require('pngjs/browser');
    const binary = decodeBase64(cropped.base64);
    const pngObj = PNG.sync.read(binary);

    const detectedColors: CubeColor[] = [];
    const pixels = pngObj.data; // Uint8Array of size 36 (3x3x4 RGBA)

    for (let i = 0; i < 9; i++) {
      const idx = i * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      const hsv = rgbToHsv(r, g, b);
      detectedColors.push(classifyHsv(hsv.h, hsv.s, hsv.v));
    }

    return detectedColors;
  } catch (err) {
    console.warn("[localDetectColors] Local offline parsing failed, returning white:", err);
    return Array(9).fill("white") as CubeColor[];
  }
}

/**
 * Detect the 9 sticker colors from a photo taken by expo-camera.
 * Try online FastAPI server first, fallback to client-side HSV classifier if offline.
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

    // Try online FastAPI server with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const resp = await fetch(`${API_BASE_URL}/api/detect-colors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: result.base64 }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`Server ${resp.status}`);
    }

    const data = (await resp.json()) as { colors: CubeColor[] };
    return data.colors;
  } catch (err) {
    console.warn("[detectCubeColors] Online detection failed, running local offline fallback:", err);
    return await localDetectColors(photoUri);
  }
}
