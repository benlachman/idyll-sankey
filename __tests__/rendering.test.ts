/**
 * Tests for rendering logic
 * Ensures flows align correctly with nodes and labelMinHeight works
 */

import { computeLayout } from '../src/lib/layout';
import { CSVRow } from '../src/lib/types';

describe('rendering correctness', () => {
  const sampleData: CSVRow[] = [
    { source: 'A', target: 'B', value: 10 },
    { source: 'A', target: 'C', value: 5 },
    { source: 'B', target: 'D', value: 10 },
  ];

  test('flows are properly bounded within source nodes', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    layout.links.forEach((link) => {
      const source = typeof link.source === 'number' ? layout.nodes[link.source] : link.source;
      
      // link.y0 is the center position of the link at the source
      // The link spans from (center - width/2) to (center + width/2)
      const linkWidth = link.width || 0;
      const linkTop = link.y0! - linkWidth / 2;
      const linkBottom = link.y0! + linkWidth / 2;
      
      // The link's bounds must be within the source node's bounds
      expect(linkTop).toBeGreaterThanOrEqual(source.y0!);
      expect(linkBottom).toBeLessThanOrEqual(source.y1!);
    });
  });

  test('flows are properly bounded within target nodes', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    layout.links.forEach((link) => {
      const target = typeof link.target === 'number' ? layout.nodes[link.target] : link.target;
      
      // link.y1 is the center position of the link at the target
      const linkWidth = link.width || 0;
      const linkTop = (link.y1 || link.y0!) - linkWidth / 2;
      const linkBottom = (link.y1 || link.y0!) + linkWidth / 2;
      
      // The link's bounds must be within the target node's bounds
      expect(linkTop).toBeGreaterThanOrEqual(target.y0!);
      expect(linkBottom).toBeLessThanOrEqual(target.y1!);
    });
  });

  test('link width matches the link value proportionally', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    // All links should have a width property
    layout.links.forEach((link) => {
      expect(link.width).toBeDefined();
      expect(link.width).toBeGreaterThan(0);
    });
    
    // Links with higher values should have proportionally larger widths
    const link1 = layout.links.find((l) => {
      const source = typeof l.source === 'number' ? layout.nodes[l.source] : l.source;
      const target = typeof l.target === 'number' ? layout.nodes[l.target] : l.target;
      return source.id === 'A' && target.id === 'B';
    });
    
    const link2 = layout.links.find((l) => {
      const source = typeof l.source === 'number' ? layout.nodes[l.source] : l.source;
      const target = typeof l.target === 'number' ? layout.nodes[l.target] : l.target;
      return source.id === 'A' && target.id === 'C';
    });
    
    // link1 has value 10, link2 has value 5, so link1 width should be ~2x link2 width
    if (link1 && link2) {
      const ratio = link1.width! / link2.width!;
      expect(ratio).toBeCloseTo(2, 1);
    }
  });
});

describe('labelMinHeight functionality', () => {
  const sampleData: CSVRow[] = [
    { source: 'A', target: 'B', value: 10 },
    { source: 'C', target: 'D', value: 1 },  // Small flow
  ];

  test('nodes have varying heights', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    const nodeHeights = layout.nodes.map((node) => node.y1! - node.y0!);
    
    // Should have at least 2 different heights (one large, one small)
    const uniqueHeights = new Set(nodeHeights);
    expect(uniqueHeights.size).toBeGreaterThan(1);
  });

  test('labelMinHeight threshold makes sense', () => {
    const layout = computeLayout(sampleData, 960, 600);
    
    // Default labelMinHeight is 8px
    const labelMinHeight = 8;
    
    // Count how many nodes would show labels
    const nodesWithLabels = layout.nodes.filter((node) => {
      const height = node.y1! - node.y0!;
      return height >= labelMinHeight;
    });
    
    // Should have at least one node tall enough for a label
    expect(nodesWithLabels.length).toBeGreaterThan(0);
  });

  test('very small labelMinHeight shows all labels', () => {
    const layout = computeLayout(sampleData, 960, 600);
    const labelMinHeight = 1; // Very small threshold
    
    const nodesWithLabels = layout.nodes.filter((node) => {
      const height = node.y1! - node.y0!;
      return height >= labelMinHeight;
    });
    
    // All nodes should be tall enough for labels
    expect(nodesWithLabels.length).toBe(layout.nodes.length);
  });

  test('very large labelMinHeight hides all labels', () => {
    const layout = computeLayout(sampleData, 960, 600);
    const labelMinHeight = 1000; // Very large threshold
    
    const nodesWithLabels = layout.nodes.filter((node) => {
      const height = node.y1! - node.y0!;
      return height >= labelMinHeight;
    });
    
    // No nodes should be tall enough for labels
    expect(nodesWithLabels.length).toBe(0);
  });
});
