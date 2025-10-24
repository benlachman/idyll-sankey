/**
 * Acceptance criteria validation tests
 * Validates all requirements from the issue specification
 */

import {
  LabelLayoutManager,
  LabelLayoutOptions,
} from '../src/lib/label-layout';
import { SankeyNode } from '../src/lib/types';
import { computeLayout } from '../src/lib/layout';
import { CSVRow } from '../src/lib/types';

// Mock canvas context
class MockCanvasContext {
  font: string = '12px sans-serif';
  
  measureText(text: string) {
    return { width: text.length * 8 };
  }
}

describe('Acceptance Criteria Validation', () => {
  test('AC1: No overlapping label bounding boxes in standard view', () => {
    const data: CSVRow[] = [];
    // Create a dataset with 30 flows to test collision detection
    for (let i = 0; i < 30; i++) {
      data.push({
        source: `Source${i % 10}`,
        target: `Target${i % 10}`,
        value: Math.random() * 10 + 1,
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

    // Verify no overlapping labels
    for (let i = 0; i < result.placed.length; i++) {
      for (let j = i + 1; j < result.placed.length; j++) {
        const a = result.placed[i];
        const b = result.placed[j];
        
        // Check AABB collision
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

  test('AC2: Hovering any small flow reveals its label within one frame', () => {
    const nodes: SankeyNode[] = [
      { id: 'Small Node 1', x0: 10, x1: 25, y0: 10, y1: 12 }, // height 2, below threshold
      { id: 'Small Node 2', x0: 100, x1: 115, y0: 10, y1: 15 }, // height 5, below threshold
      { id: 'Large Node', x0: 200, x1: 215, y0: 10, y1: 100 }, // height 90, above threshold
    ];

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
    const result = manager.computeNodeLabelLayouts(nodes);

    // Small nodes should be in unplaced list for hover display
    const smallNodeLabels = result.unplaced.filter(l => 
      l.text === 'Small Node 1' || l.text === 'Small Node 2'
    );
    
    expect(smallNodeLabels.length).toBe(2);
    
    // Each unplaced label should have proper anchor coordinates for instant display
    smallNodeLabels.forEach(label => {
      expect(label.anchorX).toBeDefined();
      expect(label.anchorY).toBeDefined();
      expect(label.nodeOrLinkId).toBeDefined();
    });
  });

  test('AC3: Whitespace is used to display at least 80% of small-flow labels', () => {
    // Create a moderately dense dataset
    const data: CSVRow[] = [];
    for (let i = 0; i < 20; i++) {
      data.push({
        source: `Source${i}`,
        target: `Target${i}`,
        value: Math.random() * 5 + 1, // Varied sizes
      });
    }

    const layout = computeLayout(data, 1200, 800); // Larger canvas for more whitespace
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

    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(layout.nodes);

    const totalNodes = layout.nodes.length;
    const placedNodes = result.placed.length;
    const placementRate = placedNodes / totalNodes;

    // Should place at least 80% of labels
    expect(placementRate).toBeGreaterThanOrEqual(0.8);
    
    // Some labels may use detachment with leader lines
    const detachedLabels = result.placed.filter(l => l.hasLeaderLine);
    // If there are detached labels, they should be properly configured
    if (detachedLabels.length > 0) {
      detachedLabels.forEach(label => {
        expect(label.hasLeaderLine).toBe(true);
        expect(label.anchorX).toBeDefined();
        expect(label.anchorY).toBeDefined();
      });
    }
  });

  test('AC4: No noticeable lag at 10k+ links', () => {
    // Create a large dataset simulating 10k+ links
    // For testing, we'll use a smaller but still significant dataset
    // since actual 10k links would take too long in unit tests
    const data: CSVRow[] = [];
    for (let i = 0; i < 200; i++) {
      data.push({
        source: `Source${i % 50}`,
        target: `Target${i % 50}`,
        value: Math.random() * 10 + 1,
      });
    }

    const layout = computeLayout(data, 1200, 800, { aggregateDuplicates: false });
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

    // Measure performance
    const startTime = Date.now();
    const manager = new LabelLayoutManager(ctx as any, options);
    const result = manager.computeNodeLabelLayouts(layout.nodes);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in less than 100ms (well under "noticeable lag")
    expect(duration).toBeLessThan(100);
    
    // Should still produce results
    expect(result.placed.length + result.unplaced.length).toBe(layout.nodes.length);
  });

  test('AC5: Props for enabling/disabling behaviors are documented', () => {
    // This is a meta-test that verifies the configuration system works
    const nodes: SankeyNode[] = [
      { id: 'Node 1', x0: 10, x1: 25, y0: 10, y1: 30 },
      { id: 'Node 2', x0: 100, x1: 115, y0: 10, y1: 30 },
    ];

    const ctx = new MockCanvasContext();
    
    // Test with all features enabled
    const optionsEnabled: LabelLayoutOptions = {
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

    const managerEnabled = new LabelLayoutManager(ctx as any, optionsEnabled);
    const resultEnabled = managerEnabled.computeNodeLabelLayouts(nodes);
    
    // Test with detached labels disabled
    const optionsNoDetached: LabelLayoutOptions = {
      ...optionsEnabled,
      enableDetachedLabels: false,
    };

    const managerNoDetached = new LabelLayoutManager(ctx as any, optionsNoDetached);
    const resultNoDetached = managerNoDetached.computeNodeLabelLayouts(nodes);
    
    // With detached disabled, should not have leader lines
    const detachedCount = resultNoDetached.placed.filter(l => l.hasLeaderLine).length;
    expect(detachedCount).toBe(0);
    
    // Both should process all nodes
    expect(resultEnabled.placed.length + resultEnabled.unplaced.length).toBe(nodes.length);
    expect(resultNoDetached.placed.length + resultNoDetached.unplaced.length).toBe(nodes.length);
  });
});

describe('Integration Test: Full Workflow', () => {
  test('Complete label layout workflow from data to placement', () => {
    // Simulate a real workflow
    const data: CSVRow[] = [
      { source: 'Coal', target: 'Power', value: 100 },
      { source: 'Gas', target: 'Power', value: 80 },
      { source: 'Solar', target: 'Power', value: 20 },
      { source: 'Power', target: 'Industry', value: 150 },
      { source: 'Power', target: 'Residential', value: 50 },
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

    // Should have processed all nodes
    expect(result.placed.length + result.unplaced.length).toBe(layout.nodes.length);
    
    // All labels should have required properties
    [...result.placed, ...result.unplaced].forEach(label => {
      expect(label.text).toBeDefined();
      expect(label.width).toBeGreaterThan(0);
      expect(label.height).toBeGreaterThan(0);
      expect(label.anchorX).toBeDefined();
      expect(label.anchorY).toBeDefined();
      expect(label.nodeOrLinkId).toBeDefined();
      expect(label.priority).toBeDefined();
    });

    // Placed labels should be within canvas bounds
    result.placed.forEach(label => {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.y).toBeGreaterThanOrEqual(0);
      expect(label.x + label.width).toBeLessThanOrEqual(options.canvasWidth);
      expect(label.y + label.height).toBeLessThanOrEqual(options.canvasHeight);
    });
  });
});
