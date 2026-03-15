import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { rgbToHsv, classifyColor } from './colorDetection';
import type { CubeColor } from '@/types/cube';

const SIZE = 270; // resize target (divisible by 3)
const CELL = 90;  // SIZE / 3

// ── Web: HTML5 canvas ─────────────────────────────────────────────────────────
function detectWeb(base64: string): Promise<CubeColor[]> {
  return new Promise((resolve) => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      // Center-crop to square then draw at SIZE×SIZE
      const src = Math.min(img.width, img.height);
      const sx = (img.width - src) / 2;
      const sy = (img.height - src) / 2;
      ctx.drawImage(img, sx, sy, src, src, 0, 0, SIZE, SIZE);
      const colors: CubeColor[] = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const px = ctx.getImageData(col * CELL + CELL / 2, row * CELL + CELL / 2, 1, 1).data;
          colors.push(classifyColor(rgbToHsv({ r: px[0], g: px[1], b: px[2] })));
        }
      }
      resolve(colors);
    };
    img.onerror = () => resolve(Array(9).fill('white') as CubeColor[]);
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

// ── Native: expo-image-manipulator + pngjs ────────────────────────────────────
async function detectNative(photoUri: string): Promise<CubeColor[]> {
  try {
    // Resize + square-crop to SIZE×SIZE, export as PNG with pixel data
    const result = await ImageManipulator.manipulateAsync(
      photoUri,
      [{ resize: { width: SIZE, height: SIZE } }],
      { format: ImageManipulator.SaveFormat.PNG, base64: true },
    );
    if (!result.base64) throw new Error('No base64 from manipulator');

    // pngjs/browser: pure-JS PNG decoder, no Node streams required
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PNG } = require('pngjs/browser') as { PNG: any };
    const buf = Buffer.from(result.base64, 'base64');
    const png = PNG.sync.read(buf);  // { width, height, data: Uint8Array RGBA }

    const colors: CubeColor[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * CELL + Math.floor(CELL / 2);
        const y = row * CELL + Math.floor(CELL / 2);
        const idx = (png.width * y + x) * 4;
        colors.push(
          classifyColor(
            rgbToHsv({ r: png.data[idx], g: png.data[idx + 1], b: png.data[idx + 2] }),
          ),
        );
      }
    }
    return colors;
  } catch (err) {
    console.warn('[detectNative] fallback to white:', err);
    return Array(9).fill('white') as CubeColor[];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Detect the 9 sticker colors from a photo taken by expo-camera.
 * @param photoUri  Local file URI (both platforms)
 * @param base64    Base64 JPEG string (web only, speeds things up)
 */
export async function detectCubeColors(
  photoUri: string,
  base64?: string,
): Promise<CubeColor[]> {
  if (Platform.OS === 'web' && base64) return detectWeb(base64);
  return detectNative(photoUri);
}
