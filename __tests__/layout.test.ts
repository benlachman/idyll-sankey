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
});
