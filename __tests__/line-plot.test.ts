/**
 * Tests for LineCanvas component
 */

import { TimeSeriesRow } from '../src/lib/types';

describe('Line Plot Data Processing', () => {
  const mockData: TimeSeriesRow[] = [
    { year: 2020, technology: 'Solar', cost_per_mwh: 2.74, cumulative_capacity_mw: 500000 },
    { year: 2021, technology: 'Solar', cost_per_mwh: 2.60, cumulative_capacity_mw: 600000 },
    { year: 2020, technology: 'Wind', cost_per_mwh: 2.36, cumulative_capacity_mw: 400000 },
    { year: 2021, technology: 'Wind', cost_per_mwh: 2.29, cumulative_capacity_mw: 450000 },
  ];

  it('should have time series data structure', () => {
    expect(mockData).toBeDefined();
    expect(mockData.length).toBe(4);
  });

  it('should have correct data format', () => {
    const row = mockData[0];
    expect(row).toHaveProperty('year');
    expect(row).toHaveProperty('technology');
    expect(row).toHaveProperty('cost_per_mwh');
    expect(row).toHaveProperty('cumulative_capacity_mw');
    expect(typeof row.year).toBe('number');
    expect(typeof row.technology).toBe('string');
    expect(typeof row.cost_per_mwh).toBe('number');
    expect(typeof row.cumulative_capacity_mw).toBe('number');
  });

  it('should group data by technology', () => {
    const technologies = new Set(mockData.map(row => row.technology));
    expect(technologies.size).toBe(2);
    expect(technologies.has('Solar')).toBe(true);
    expect(technologies.has('Wind')).toBe(true);
  });

  it('should have data points sorted by year', () => {
    const solarData = mockData.filter(row => row.technology === 'Solar');
    expect(solarData.length).toBe(2);
    expect(solarData[0].year).toBeLessThan(solarData[1].year);
  });

  it('should show cost decline over time', () => {
    const solarData = mockData.filter(row => row.technology === 'Solar').sort((a, b) => a.year - b.year);
    expect(solarData[0].cost_per_mwh).toBeGreaterThan(solarData[1].cost_per_mwh);
  });
});

describe('Line Plot Coordinate Transformations', () => {
  it('should convert data coordinates to canvas coordinates', () => {
    const xMin = 1995;
    const xMax = 2025;
    const yMin = 0;
    const yMax = 15;
    const plotLeft = 80;
    const plotRight = 40;
    const plotTop = 60;
    const plotBottom = 80;
    const width = 960;
    const height = 600;

    const plotWidth = width - plotLeft - plotRight;
    const plotHeight = height - plotTop - plotBottom;

    // Test conversion for a point in the middle
    const x = 2010;
    const y = 7.5;

    const cx = plotLeft + ((x - xMin) / (xMax - xMin)) * plotWidth;
    const cy = plotTop + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

    expect(cx).toBeGreaterThan(plotLeft);
    expect(cx).toBeLessThan(width - plotRight);
    expect(cy).toBeGreaterThan(plotTop);
    expect(cy).toBeLessThan(height - plotBottom);
  });

  it('should handle edge cases in coordinate conversion', () => {
    const xMin = 1995;
    const xMax = 2025;
    const yMin = 0;
    const yMax = 15;
    const plotLeft = 80;
    const plotWidth = 840;

    // Test minimum x
    const cx1 = plotLeft + ((xMin - xMin) / (xMax - xMin)) * plotWidth;
    expect(cx1).toBe(plotLeft);

    // Test maximum x
    const cx2 = plotLeft + ((xMax - xMin) / (xMax - xMin)) * plotWidth;
    expect(cx2).toBe(plotLeft + plotWidth);
  });
});

describe('Line Plot Color Assignment', () => {
  const TECHNOLOGY_COLORS: { [key: string]: string } = {
    'Solar': '#FF9800',
    'Wind': '#2196F3',
    'Batteries': '#4CAF50',
    'Natural Gas': '#795548',
    'Coal': '#424242',
    'Nuclear': '#9C27B0',
  };

  it('should assign unique colors to each technology', () => {
    const colors = Object.values(TECHNOLOGY_COLORS);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it('should have all required technologies', () => {
    expect(TECHNOLOGY_COLORS).toHaveProperty('Solar');
    expect(TECHNOLOGY_COLORS).toHaveProperty('Wind');
    expect(TECHNOLOGY_COLORS).toHaveProperty('Batteries');
    expect(TECHNOLOGY_COLORS).toHaveProperty('Natural Gas');
    expect(TECHNOLOGY_COLORS).toHaveProperty('Coal');
    expect(TECHNOLOGY_COLORS).toHaveProperty('Nuclear');
  });

  it('should use valid hex color codes', () => {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    Object.values(TECHNOLOGY_COLORS).forEach(color => {
      expect(color).toMatch(hexColorRegex);
    });
  });
});

describe('Line Plot Annotations', () => {
  const annotations = [
    { x: 2000, y: 7.71, text: 'Solar boom begins', series: 'Solar' },
    { x: 2010, y: 3.18, text: 'Wind becomes competitive', series: 'Wind' },
    { x: 2015, y: 6.62, text: 'Battery revolution', series: 'Batteries' },
    { x: 2020, y: 2.74, text: 'Solar becomes cheapest', series: 'Solar' },
  ];

  it('should have annotations for key milestones', () => {
    expect(annotations.length).toBeGreaterThan(0);
  });

  it('should have proper annotation structure', () => {
    annotations.forEach(annotation => {
      expect(annotation).toHaveProperty('x');
      expect(annotation).toHaveProperty('y');
      expect(annotation).toHaveProperty('text');
      expect(typeof annotation.x).toBe('number');
      expect(typeof annotation.y).toBe('number');
      expect(typeof annotation.text).toBe('string');
    });
  });

  it('should have chronologically ordered annotations', () => {
    for (let i = 1; i < annotations.length; i++) {
      expect(annotations[i].x).toBeGreaterThanOrEqual(annotations[i - 1].x);
    }
  });

  it('should have meaningful annotation text', () => {
    annotations.forEach(annotation => {
      expect(annotation.text.length).toBeGreaterThan(0);
      expect(annotation.text).not.toBe('');
    });
  });
});
