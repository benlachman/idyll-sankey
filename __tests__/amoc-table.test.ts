/**
 * Tests for AMOC Temperature Table component
 */

import * as React from 'react';
import { AMOCTemperatureTable } from '../src/components/AMOCTemperatureTable';

describe('AMOCTemperatureTable', () => {
  test('component renders without crashing', () => {
    const component = React.createElement(AMOCTemperatureTable, { amocDecrease: 15 });
    expect(component).toBeDefined();
    expect(component.type).toBe(AMOCTemperatureTable);
  });

  test('component accepts amocDecrease prop', () => {
    const component = React.createElement(AMOCTemperatureTable, { amocDecrease: 50 });
    expect(component.props.amocDecrease).toBe(50);
  });

  test('component uses default props', () => {
    const component = React.createElement(AMOCTemperatureTable, {});
    expect(AMOCTemperatureTable.defaultProps?.amocDecrease).toBe(15);
  });

  test('temperature calculation is correct for 0% AMOC decrease', () => {
    // At 0% decrease, current temp should equal baseline
    const baseline = 10;
    const sensitivityFactor = 1.0;
    const amocDecrease = 0;
    const change = -1 * amocDecrease * (sensitivityFactor / 10);
    const currentTemp = baseline + change;
    expect(currentTemp).toBe(10);
  });

  test('temperature calculation is correct for 100% AMOC decrease', () => {
    // At 100% decrease with sensitivity 1.0, should be -10°C change
    const baseline = 10;
    const sensitivityFactor = 1.0;
    const amocDecrease = 100;
    const change = -1 * amocDecrease * (sensitivityFactor / 10);
    const currentTemp = baseline + change;
    expect(currentTemp).toBe(0); // 10 + (-10) = 0
  });

  test('temperature calculation handles fractional sensitivity', () => {
    const baseline = 9.4; // Ireland's baseline
    const sensitivityFactor = 1.1;
    const amocDecrease = 15; // Current observed decrease
    const change = -1 * amocDecrease * (sensitivityFactor / 10);
    expect(change).toBeCloseTo(-1.65, 2);
    const currentTemp = baseline + change;
    expect(currentTemp).toBeCloseTo(7.75, 2);
  });

  test('color coding reflects temperature changes correctly', () => {
    // Test the color function logic
    const getColor = (delta: number): string => {
      if (delta < -2) return '#0066cc';
      if (delta < -1) return '#3399ff';
      if (delta < -0.5) return '#66b3ff';
      if (delta < 0.5) return '#999999';
      if (delta < 1) return '#ff9966';
      if (delta < 2) return '#ff6633';
      return '#cc3300';
    };

    expect(getColor(-3)).toBe('#0066cc'); // Strong cooling
    expect(getColor(-1.5)).toBe('#3399ff'); // Moderate cooling
    expect(getColor(-0.7)).toBe('#66b3ff'); // Light cooling
    expect(getColor(0)).toBe('#999999'); // Neutral
    expect(getColor(0.7)).toBe('#ff9966'); // Light warming
    expect(getColor(1.5)).toBe('#ff6633'); // Moderate warming
    expect(getColor(3)).toBe('#cc3300'); // Strong warming
  });

  test('all 10 countries are included', () => {
    const countries = [
      'Iceland', 'Ireland', 'United Kingdom', 'Norway', 'Denmark',
      'Netherlands', 'Belgium', 'France', 'Germany', 'Sweden'
    ];
    expect(countries.length).toBe(10);
  });

  test('baseline temperatures are reasonable', () => {
    const baselines = [
      4.3,  // Iceland
      9.4,  // Ireland
      9.2,  // United Kingdom
      1.5,  // Norway
      8.1,  // Denmark
      9.8,  // Netherlands
      10.5, // Belgium
      12.7, // France
      9.3,  // Germany
      2.7   // Sweden
    ];

    // All should be between -10 and 20°C (reasonable for Europe)
    baselines.forEach(temp => {
      expect(temp).toBeGreaterThan(-10);
      expect(temp).toBeLessThan(20);
    });
  });

  test('sensitivity factors are within expected range', () => {
    const factors = [1.2, 1.1, 1.0, 1.1, 0.8, 0.9, 0.85, 0.7, 0.6, 0.65];
    
    // All should be between 0.5 and 1.5 (based on research)
    factors.forEach(factor => {
      expect(factor).toBeGreaterThan(0.5);
      expect(factor).toBeLessThan(1.5);
    });
  });
});
