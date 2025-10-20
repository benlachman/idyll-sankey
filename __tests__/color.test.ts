/**
 * Tests for color utilities
 */

import { hashColor, hslToRgb, mixColors, rgbToString } from '../src/lib/color';

describe('color utilities', () => {
  test('hashColor generates consistent colors', () => {
    const color1 = hashColor('test');
    const color2 = hashColor('test');
    expect(color1).toBe(color2);
    expect(color1).toMatch(/^hsl\(\d+, 70%, 60%\)$/);
  });

  test('hashColor generates different colors for different strings', () => {
    const color1 = hashColor('test1');
    const color2 = hashColor('test2');
    expect(color1).not.toBe(color2);
  });

  test('hslToRgb converts HSL to RGB', () => {
    const rgb = hslToRgb('hsl(0, 100%, 50%)');
    expect(rgb).toEqual([255, 0, 0]); // Red
  });

  test('hslToRgb handles invalid input', () => {
    const rgb = hslToRgb('invalid');
    expect(rgb).toEqual([0, 0, 0]);
  });

  test('mixColors blends two colors', () => {
    const rgb1: [number, number, number] = [255, 0, 0]; // Red
    const rgb2: [number, number, number] = [0, 0, 255]; // Blue
    const mixed = mixColors(rgb1, rgb2, 0.5);
    expect(mixed[0]).toBeCloseTo(128, 0);
    expect(mixed[2]).toBeCloseTo(128, 0);
  });

  test('mixColors handles ratio extremes', () => {
    const rgb1: [number, number, number] = [255, 0, 0];
    const rgb2: [number, number, number] = [0, 0, 255];
    
    const mixed0 = mixColors(rgb1, rgb2, 0);
    expect(mixed0).toEqual([255, 0, 0]);
    
    const mixed1 = mixColors(rgb1, rgb2, 1);
    expect(mixed1).toEqual([0, 0, 255]);
  });

  test('rgbToString formats RGB correctly', () => {
    const str = rgbToString([255, 128, 64]);
    expect(str).toBe('rgb(255, 128, 64)');
  });
});
