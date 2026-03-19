import { API_BASE_URL } from './constants';
import type { CubeColor } from '@/types/cube';

/**
 * Send a base64 JPEG to the Python CV backend and get back 9 sticker colors.
 * Used by detectFromImage.ts — this is the ONLY remaining backend route.
 */
export async function detectColorsFromBase64(base64: string): Promise<CubeColor[]> {
  const resp = await fetch(`${API_BASE_URL}/api/detect-colors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`CV backend ${resp.status}: ${text}`);
  }

  const data = (await resp.json()) as { colors: CubeColor[] };
  return data.colors;
}
