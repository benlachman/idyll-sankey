/**
 * Color utilities for Sankey diagram
 * Provides hashing, gradient prep, and color mixing helpers
 */

/**
 * Simple hash function to generate a color from a string
 */
export function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 60%)`;
}

/**
 * Convert hex color to RGB array
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Convert HSL string to RGB array
 */
export function hslToRgb(hsl: string): [number, number, number] {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return [0, 0, 0];

  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Mix two RGB colors
 */
export function mixColors(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
  ratio: number
): [number, number, number] {
  const r = Math.round(rgb1[0] * (1 - ratio) + rgb2[0] * ratio);
  const g = Math.round(rgb1[1] * (1 - ratio) + rgb2[1] * ratio);
  const b = Math.round(rgb1[2] * (1 - ratio) + rgb2[2] * ratio);
  return [r, g, b];
}

/**
 * Convert RGB array to CSS rgb string
 */
export function rgbToString(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
