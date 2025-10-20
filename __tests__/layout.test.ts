/**
 * Tests for layout utilities
 */

import { computeLayout } from '../src/lib/layout';
import { CSVRow } from '../src/lib/types';

describe('layout utilities', () => {
  const sampleData: CSVRow[] = [
    { source: 'A', target: 'B', value: 10 },
    { source: 'A', target: 'C', value: 5 },
    { source: 'B', target: 'D', value: 10 },
  ];

  test('computeLayout creates nodes from data', () => {
    const layout = computeLayout(sampleData, 960, 600);
    expect(layout.nodes.length).toBe(4); // A, B, C, D
    
    const nodeIds = layout.nodes.map((n) => n.id).sort();
    expect(nodeIds).toEqual(['A', 'B', 'C', 'D']);
  });

  test('computeLayout creates links from data', () => {
    const layout = computeLayout(sampleData, 960, 600);
    expect(layout.links.length).toBe(3);
  });

  test('computeLayout assigns positions to nodes', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    layout.nodes.forEach((node) => {
      expect(node.x0).toBeDefined();
      expect(node.x1).toBeDefined();
      expect(node.y0).toBeDefined();
      expect(node.y1).toBeDefined();
      
      // Check positions are within bounds
      expect(node.x0!).toBeGreaterThanOrEqual(0);
      expect(node.x1!).toBeLessThanOrEqual(960);
      expect(node.y0!).toBeGreaterThanOrEqual(0);
      expect(node.y1!).toBeLessThanOrEqual(600);
    });
  });

  test('computeLayout assigns positions to links', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    layout.links.forEach((link) => {
      expect(link.y0).toBeDefined();
      expect(link.y1).toBeDefined();
      expect(link.width).toBeDefined();
    });
  });

  test('computeLayout handles empty data', () => {
    const layout = computeLayout([], 960, 600);
    expect(layout.nodes.length).toBe(0);
    expect(layout.links.length).toBe(0);
  });

  test('computeLayout preserves link values', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    expect(layout.links[0].value).toBe(10);
    expect(layout.links[1].value).toBe(5);
    expect(layout.links[2].value).toBe(10);
  });

  test('computeLayout filters by minValue', () => {
    const dataWithSmallValues: CSVRow[] = [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'C', value: 0.005 },
      { source: 'B', target: 'D', value: 0.02 },
    ];
    
    const layout = computeLayout(dataWithSmallValues, 960, 600, { minValue: 0.01 });
    expect(layout.links.length).toBe(2); // Only values >= 0.01
  });

  test('computeLayout clamps negative values when allowNegative is false', () => {
    const dataWithNegatives: CSVRow[] = [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'C', value: -5 },
      { source: 'B', target: 'D', value: 8 },
    ];
    
    const layout = computeLayout(dataWithNegatives, 960, 600, { allowNegative: false, minValue: 0.01 });
    // Negative value should be clamped to 0, then filtered by minValue (0.01), so only 2 links remain
    expect(layout.links.length).toBe(2);
    // All remaining links should be positive
    layout.links.forEach(link => {
      expect(link.value).toBeGreaterThan(0);
    });
  });

  test('computeLayout allows negative values when allowNegative is true', () => {
    const dataWithNegatives: CSVRow[] = [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'C', value: -5 },
      { source: 'B', target: 'D', value: 8 },
    ];
    
    const layout = computeLayout(dataWithNegatives, 960, 600, { allowNegative: true, minValue: 0 });
    expect(layout.links.length).toBe(3);
    const negativeLink = layout.links.find(l => l.value < 0);
    expect(negativeLink).toBeDefined();
    expect(negativeLink?.value).toBe(-5);
  });

  test('computeLayout aggregates duplicates when enabled', () => {
    const dataWithDuplicates: CSVRow[] = [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'B', value: 5 },
      { source: 'A', target: 'C', value: 8 },
    ];
    
    const layout = computeLayout(dataWithDuplicates, 960, 600, { aggregateDuplicates: true });
    expect(layout.links.length).toBe(2); // A->B aggregated, A->C separate
    const aggregatedLink = layout.links.find(l => {
      const source = typeof l.source === 'number' ? layout.nodes[l.source] : l.source;
      const target = typeof l.target === 'number' ? layout.nodes[l.target] : l.target;
      return source.id === 'A' && target.id === 'B';
    });
    expect(aggregatedLink?.value).toBe(15);
  });

  test('computeLayout does not aggregate duplicates when disabled', () => {
    const dataWithDuplicates: CSVRow[] = [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'B', value: 5 },
      { source: 'A', target: 'C', value: 8 },
    ];
    
    const layout = computeLayout(dataWithDuplicates, 960, 600, { aggregateDuplicates: false });
    expect(layout.links.length).toBe(3);
  });

  test('computeLayout normalizes labels', () => {
    const dataWithMixedCase: CSVRow[] = [
      { source: 'produced and distributed', target: 'ENERGY', value: 10 },
      { source: 'PRODUCED AND DISTRIBUTED', target: 'energy', value: 5 },
    ];
    
    const layout = computeLayout(dataWithMixedCase, 960, 600, { aggregateDuplicates: true });
    // After normalization, both should be "Produced And Distributed" -> "Energy"
    // So we should have 2 nodes and 1 link (aggregated)
    expect(layout.nodes.length).toBe(2);
    
    const nodeIds = layout.nodes.map(n => n.id).sort();
    expect(nodeIds).toContain('Produced And Distributed');
    expect(nodeIds).toContain('Energy');
    
    expect(layout.links.length).toBe(1);
    expect(layout.links[0].value).toBe(15);
  });
});
