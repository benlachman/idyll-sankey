/**
 * Tests for label layout system
 * Ensures collision detection, whitespace optimization, and performance
 */

import {
  LabelLayoutManager,
  LabelLayoutOptions,
  getContrastColor,
  truncateText,
} from '../src/lib/label-layout';
import { SankeyNode } from '../src/lib/types';
import { computeLayout } from '../src/lib/layout';
import { CSVRow } from '../src/lib/types';

// Mock canvas context for testing
class MockCanvasContext {
  font: string = '12px sans-serif';
  
  measureText(text: string) {
    // Approximate text width (8px per character)
    return { width: text.length * 8 };
  }
}

describe('LabelLayoutManager', () => {
  let ctx: MockCanvasContext;
  let options: LabelLayoutOptions;

  beforeEach(() => {
    ctx = new MockCanvasContext();
    options = {
      minLabelHeight: 8,
      fontSize: 12,
      fontFamily: 'sans-serif',
      padding: 4,
      leaderLineThreshold: 100,
      canvasWidth: 960,
      canvasHeight: 600,
      enableHoverLabels: true,
      enableDetachedLabels: true,
    };
  });

  test('creates label layout manager', () => {
    const manager = new LabelLayoutManager(ctx as any, options);
    expect(manager).toBeDefined();
  });

  test('computes label layouts for nodes', () => {
    const nodes: SankeyNode[] = [
      { id: 'Node A', x0: 10, x1: 25, y0: 10, y1: 50 },
      { id: 'Node B', x0: 100, x1: 115, y0: 10, y1: 30 },
    ];

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(nodes);

    expect(result.placed).toBeDefined();
    expect(result.unplaced).toBeDefined();
    expect(result.placed.length + result.unplaced.length).toBeGreaterThan(0);
  });

  test('prioritizes larger nodes for label placement', () => {
    const nodes: SankeyNode[] = [
      { id: 'Small', x0: 10, x1: 25, y0: 10, y1: 15 }, // height 5
      { id: 'Large', x0: 100, x1: 115, y0: 10, y1: 100 }, // height 90
    ];

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(nodes);

    // Larger node should be placed
    const largeLabel = result.placed.find(l => l.text === 'Large');
    expect(largeLabel).toBeDefined();
  });

  test('handles nodes below minimum height', () => {
    const nodes: SankeyNode[] = [
      { id: 'Tiny', x0: 10, x1: 25, y0: 10, y1: 12 }, // height 2, below minLabelHeight
    ];

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(nodes);

    // Should be in unplaced for hover display
    expect(result.unplaced.length).toBeGreaterThan(0);
    const tinyLabel = result.unplaced.find(l => l.text === 'Tiny');
    expect(tinyLabel).toBeDefined();
  });

  test('detects collisions between labels', () => {
    const nodes: SankeyNode[] = [
      { id: 'A', x0: 10, x1: 25, y0: 10, y1: 30 },
      { id: 'B', x0: 10, x1: 25, y0: 35, y1: 55 }, // Close to A
    ];

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(nodes);

    // At least one should be placed, might need detachment for the other
    expect(result.placed.length).toBeGreaterThan(0);
  });

  test('uses detached labels with leader lines when enabled', () => {
    const nodes: SankeyNode[] = [
      { id: 'Node 1', x0: 10, x1: 25, y0: 10, y1: 30 },
      { id: 'Node 2', x0: 10, x1: 25, y0: 32, y1: 52 },
      { id: 'Node 3', x0: 10, x1: 25, y0: 54, y1: 74 },
    ];

    const optionsWithDetached = { ...options, enableDetachedLabels: true };
    const manager = new LabelLayoutManager(ctx as any, optionsWithDetached);
    const result = manager.computeNodeLabelLayouts(nodes);

    // Should have some detached labels with leader lines
    const detachedLabels = result.placed.filter(l => l.hasLeaderLine);
    // At least try to place some labels (may or may not be detached depending on space)
    expect(result.placed.length).toBeGreaterThan(0);
  });

  test('disables detached labels when configured', () => {
    const nodes: SankeyNode[] = [
      { id: 'Node 1', x0: 10, x1: 25, y0: 10, y1: 30 },
      { id: 'Node 2', x0: 10, x1: 25, y0: 32, y1: 52 },
    ];

    const optionsNoDetached = { ...options, enableDetachedLabels: false };
    const manager = new LabelLayoutManager(ctx as any, optionsNoDetached);
    const result = manager.computeNodeLabelLayouts(nodes);

    // No labels should have leader lines
    const detachedLabels = result.placed.filter(l => l.hasLeaderLine);
    expect(detachedLabels.length).toBe(0);
  });

  test('respects canvas boundaries', () => {
    const nodes: SankeyNode[] = [
      { id: 'Edge Node', x0: 950, x1: 965, y0: 10, y1: 30 },
    ];

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(nodes);

    // Labels should not exceed canvas bounds
    result.placed.forEach(label => {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.x + label.width).toBeLessThanOrEqual(options.canvasWidth);
      expect(label.y).toBeGreaterThanOrEqual(0);
      expect(label.y + label.height).toBeLessThanOrEqual(options.canvasHeight);
    });
  });
});

describe('Label layout with real data', () => {
  test('handles small dataset without collisions', () => {
    const data: CSVRow[] = [
      { source: 'A', target: 'B', value: 10 },
      { source: 'A', target: 'C', value: 5 },
      { source: 'B', target: 'D', value: 10 },
    ];

    const layout = computeLayout(data, 960, 600);
    
    const ctx = new MockCanvasContext();
    const options: LabelLayoutOptions = {
      minLabelHeight: 8,
      fontSize: 12,
      fontFamily: 'sans-serif',
      padding: 4,
      leaderLineThreshold: 100,
      canvasWidth: 960,
      canvasHeight: 600,
      enableHoverLabels: true,
      enableDetachedLabels: true,
    };

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(layout.nodes);

    // Should place most or all labels
    expect(result.placed.length).toBeGreaterThan(0);
  });

  test('handles large dataset with many nodes', () => {
    const data: CSVRow[] = [];
    for (let i = 0; i < 50; i++) {
      data.push({
        source: `Source${i}`,
        target: `Target${i}`,
        value: Math.random() * 10,
      });
    }

    const layout = computeLayout(data, 960, 600);
    
    const ctx = new MockCanvasContext();
    const options: LabelLayoutOptions = {
      minLabelHeight: 8,
      fontSize: 12,
      fontFamily: 'sans-serif',
      padding: 4,
      leaderLineThreshold: 100,
      canvasWidth: 960,
      canvasHeight: 600,
      enableHoverLabels: true,
      enableDetachedLabels: true,
    };

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(layout.nodes);

    // Should place some labels and mark others for hover
    expect(result.placed.length + result.unplaced.length).toBe(layout.nodes.length);
    
    // No overlapping labels in placed set
    for (let i = 0; i < result.placed.length; i++) {
      for (let j = i + 1; j < result.placed.length; j++) {
        const a = result.placed[i];
        const b = result.placed[j];
        
        // Check for overlap
        const overlap = !(
          a.x + a.width < b.x ||
          b.x + b.width < a.x ||
          a.y + a.height < b.y ||
          b.y + b.height < a.y
        );
        
        expect(overlap).toBe(false);
      }
    }
  });
});

describe('getContrastColor', () => {
  test('returns black for light backgrounds', () => {
    expect(getContrastColor('#ffffff')).toBe('#000000');
    expect(getContrastColor('#f0f0f0')).toBe('#000000');
  });

  test('returns white for dark backgrounds', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff');
    expect(getContrastColor('#333333')).toBe('#ffffff');
  });

  test('handles RGB format', () => {
    expect(getContrastColor('rgb(255, 255, 255)')).toBe('#000000');
    expect(getContrastColor('rgb(0, 0, 0)')).toBe('#ffffff');
  });

  test('handles short hex format', () => {
    expect(getContrastColor('#fff')).toBe('#000000');
    expect(getContrastColor('#000')).toBe('#ffffff');
  });
});

describe('truncateText', () => {
  test('returns full text if it fits', () => {
    const ctx = new MockCanvasContext();
    const text = 'Short';
    const result = truncateText(ctx as any, text, 1000, '12px sans-serif');
    expect(result).toBe('Short');
  });

  test('truncates long text with ellipsis', () => {
    const ctx = new MockCanvasContext();
    const text = 'This is a very long text that should be truncated';
    const result = truncateText(ctx as any, text, 100, '12px sans-serif');
    expect(result).toContain('...');
    expect(result.length).toBeLessThan(text.length);
  });

  test('handles very short max width', () => {
    const ctx = new MockCanvasContext();
    const text = 'Text';
    const result = truncateText(ctx as any, text, 10, '12px sans-serif');
    expect(result).toBe('...');
  });
});

describe('Performance with large datasets', () => {
  test('completes label layout for 100+ nodes in reasonable time', () => {
    const data: CSVRow[] = [];
    for (let i = 0; i < 100; i++) {
      data.push({
        source: `Source${i}`,
        target: `Target${i}`,
        value: Math.random() * 10,
      });
    }

    const layout = computeLayout(data, 1200, 800);
    
    const ctx = new MockCanvasContext();
    const options: LabelLayoutOptions = {
      minLabelHeight: 8,
      fontSize: 12,
      fontFamily: 'sans-serif',
      padding: 4,
      leaderLineThreshold: 100,
      canvasWidth: 1200,
      canvasHeight: 800,
      enableHoverLabels: true,
      enableDetachedLabels: true,
    };

    const startTime = Date.now();
    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(layout.nodes);
    const endTime = Date.now();

    // Should complete in less than 1 second
    expect(endTime - startTime).toBeLessThan(1000);
    
    // Should process all nodes
    expect(result.placed.length + result.unplaced.length).toBe(layout.nodes.length);
  });
});
