import type { CubeColor, HSVColor, RGBColor } from "@/types/cube";

/**
 * Convert RGB to HSV color space.
 * HSV is better for color detection under varying lighting conditions.
 */
export function rgbToHsv({ r, g, b }: RGBColor): HSVColor {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return { h, s, v };
}

/**
 * HSV range definitions for each cube color.
 * These will need calibration based on real-world testing.
 */
interface HSVRange {
  hMin: number;
  hMax: number;
  sMin: number;
  sMax: number;
  vMin: number;
  vMax: number;
}

const COLOR_RANGES: Record<CubeColor, HSVRange> = {
  red: { hMin: 0, hMax: 15, sMin: 50, sMax: 100, vMin: 40, vMax: 100 },
  // Red wraps around 360°, handled separately
  orange: { hMin: 15, hMax: 40, sMin: 50, sMax: 100, vMin: 40, vMax: 100 },
  yellow: { hMin: 40, hMax: 75, sMin: 50, sMax: 100, vMin: 40, vMax: 100 },
  green: { hMin: 75, hMax: 165, sMin: 30, sMax: 100, vMin: 25, vMax: 100 },
  blue: { hMin: 195, hMax: 270, sMin: 30, sMax: 100, vMin: 25, vMax: 100 },
  white: { hMin: 0, hMax: 360, sMin: 0, sMax: 25, vMin: 70, vMax: 100 },
};

/**
 * Classify an HSV color into one of the 6 cube colors using the COLOR_RANGES dictionary.
 */
  // Check each color range
export function classifyColor(hsv: HSVColor): CubeColor {
  const { h, s, v } = hsv;

  // 1. Check White first (Low saturation, high brightness)
  if (s <= COLOR_RANGES.white.sMax && v >= COLOR_RANGES.white.vMin) {
    return 'white';
  }

  // 2. Loop through the rest of the dictionary dynamically
  for (const [colorStr, range] of Object.entries(COLOR_RANGES)) {
    const color = colorStr as CubeColor;
    if (color === 'white') continue;

    if (color === 'red') {
      // Red is special because Hue wraps around the 360-degree circle (0 and 360 are both red)
      if (((h >= 0 && h <= 15) || h >= 340) && s >= range.sMin && v >= range.vMin) {
        return 'red';
      }
    } else {
      // Standard check for all other colors
      if (h >= range.hMin && h <= range.hMax && s >= range.sMin && v >= range.vMin) {
        return color;
      }
    }
  }

  // 3. Fallback: If lighting is completely terrible, return white 
  // (Easier for the user to manually correct a white square than a random red one)
  return 'white';
}

/**
 * Detect the cube color from an RGB pixel value.
 */
export function detectColorFromRGB(rgb: RGBColor): CubeColor {
  const hsv = rgbToHsv(rgb);
  return classifyColor(hsv);
}
