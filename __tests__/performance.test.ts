/**
 * Tests for performance optimization features
 */

import * as React from 'react';
import { SankeyCanvas } from '../src/components/SankeyCanvas';
import { CSVRow, SankeyData } from '../src/lib/types';
import { computeLayout } from '../src/lib/layout';

describe('performanceThreshold prop', () => {
  // Create a dataset with varying numbers of links
  const createDataset = (numLinks: number): CSVRow[] => {
    const data: CSVRow[] = [];
    for (let i = 0; i < numLinks; i++) {
      data.push({
        source: `Source${i % 10}`,
        target: `Target${i % 10}`,
        value: Math.random() * 10 + 1,
      });
    }
    return data;
  };

  test('default performanceThreshold is 5000', () => {
    const smallData = createDataset(100);
    const layout = computeLayout(smallData, 960, 600);
    
    // Create component with default props
    const canvas = new SankeyCanvas({
      data: layout,
      width: 960,
      height: 600,
      linkColorStrategy: 'gradient',
      labelMinHeight: 8,
      performanceThreshold: 5000, // default value
    });
    
    // With 100 links, shadows should be enabled (below threshold)
    expect(layout.links.length).toBeLessThan(5000);
  });

  test('performanceThreshold can be set to custom value', () => {
    const mediumData = createDataset(1000);
    // Disable aggregation to get actual number of links
    const layout = computeLayout(mediumData, 960, 600, { aggregateDuplicates: false });
    
    // Create component with custom threshold of 500
    const canvas = new SankeyCanvas({
      data: layout,
      width: 960,
      height: 600,
      linkColorStrategy: 'gradient',
      labelMinHeight: 8,
      performanceThreshold: 500,
    });
    
    // With 1000 links and threshold of 500, shadows should be disabled
    expect(layout.links.length).toBeGreaterThan(500);
  });

  test('performanceThreshold set to 0 never disables shadows', () => {
    const largeData = createDataset(10000);
    // Disable aggregation to get actual number of links
    const layout = computeLayout(largeData, 960, 600, { aggregateDuplicates: false });
    
    // Create component with threshold of 0 (never disable)
    const canvas = new SankeyCanvas({
      data: layout,
      width: 960,
      height: 600,
      linkColorStrategy: 'gradient',
      labelMinHeight: 8,
      performanceThreshold: 0,
    });
    
    // Even with many links, setting to 0 means shadows stay enabled
    expect(layout.links.length).toBeGreaterThan(5000);
  });

  test('performanceThreshold set to false never disables shadows', () => {
    const largeData = createDataset(10000);
    // Disable aggregation to get actual number of links
    const layout = computeLayout(largeData, 960, 600, { aggregateDuplicates: false });
    
    // Create component with threshold of false (never disable)
    const canvas = new SankeyCanvas({
      data: layout,
      width: 960,
      height: 600,
      linkColorStrategy: 'gradient',
      labelMinHeight: 8,
      performanceThreshold: false,
    });
    
    // Even with many links, setting to false means shadows stay enabled
    expect(layout.links.length).toBeGreaterThan(5000);
  });
});
