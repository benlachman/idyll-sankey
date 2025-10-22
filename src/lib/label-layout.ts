/**
 * Label layout system with collision detection and whitespace optimization
 * Implements greedy placement with spatial indexing for performance
 */

import { SankeyNode, SankeyLink } from './types';

/**
 * Represents a positioned label with collision bounds
 */
export interface LabelLayout {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;  // Original anchor point (node/link position)
  anchorY: number;
  hasLeaderLine: boolean;
  nodeOrLinkId: string;
  priority: number; // Higher priority labels are placed first
}

/**
 * Configuration options for label layout
 */
export interface LabelLayoutOptions {
  minLabelHeight: number;
  fontSize: number;
  fontFamily: string;
  padding: number;
  leaderLineThreshold: number; // Max distance from anchor to use leader line
  canvasWidth: number;
  canvasHeight: number;
  enableHoverLabels: boolean;
  enableDetachedLabels: boolean;
}

/**
 * Simple spatial grid for O(1) collision detection
 */
class SpatialGrid {
  private grid: Map<string, LabelLayout[]>;
  private cellSize: number;
  
  constructor(cellSize: number = 50) {
    this.grid = new Map();
    this.cellSize = cellSize;
  }
  
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  private getCellsForBounds(x: number, y: number, width: number, height: number): string[] {
    const cells: string[] = [];
    const minCellX = Math.floor(x / this.cellSize);
    const maxCellX = Math.floor((x + width) / this.cellSize);
    const minCellY = Math.floor(y / this.cellSize);
    const maxCellY = Math.floor((y + height) / this.cellSize);
    
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        cells.push(`${cx},${cy}`);
      }
    }
    return cells;
  }
  
  insert(label: LabelLayout): void {
    const cells = this.getCellsForBounds(label.x, label.y, label.width, label.height);
    cells.forEach(cell => {
      if (!this.grid.has(cell)) {
        this.grid.set(cell, []);
      }
      this.grid.get(cell)!.push(label);
    });
  }
  
  checkCollision(x: number, y: number, width: number, height: number): boolean {
    const cells = this.getCellsForBounds(x, y, width, height);
    
    for (const cell of cells) {
      const labels = this.grid.get(cell);
      if (!labels) continue;
      
      for (const label of labels) {
        // Check AABB collision
        if (
          x < label.x + label.width &&
          x + width > label.x &&
          y < label.y + label.height &&
          y + height > label.y
        ) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  clear(): void {
    this.grid.clear();
  }
}

/**
 * Text measurement cache to avoid repeated canvas measurements
 */
class TextMeasurementCache {
  private cache: Map<string, number>;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  
  constructor(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    this.cache = new Map();
    this.ctx = ctx;
  }
  
  measureText(text: string, font: string): number {
    const key = `${font}:${text}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    this.ctx.font = font;
    const width = this.ctx.measureText(text).width;
    this.cache.set(key, width);
    return width;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Compute optimal label layouts with collision avoidance
 */
export class LabelLayoutManager {
  private spatialGrid: SpatialGrid;
  private textCache: TextMeasurementCache;
  private options: LabelLayoutOptions;
  
  constructor(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: LabelLayoutOptions
  ) {
    this.spatialGrid = new SpatialGrid();
    this.textCache = new TextMeasurementCache(ctx);
    this.options = options;
  }
  
  /**
   * Compute label layouts for nodes
   */
  computeNodeLabelLayouts(
    nodes: SankeyNode[],
    existingLabels: LabelLayout[] = []
  ): { placed: LabelLayout[], unplaced: LabelLayout[] } {
    // Reset spatial grid
    this.spatialGrid.clear();
    
    // Insert existing labels (e.g., from links)
    existingLabels.forEach(label => this.spatialGrid.insert(label));
    
    const placed: LabelLayout[] = [];
    const unplaced: LabelLayout[] = [];
    
    // Sort nodes by size (larger nodes get priority)
    const sortedNodes = [...nodes].sort((a, b) => {
      const aHeight = (a.y1 || 0) - (a.y0 || 0);
      const bHeight = (b.y1 || 0) - (b.y0 || 0);
      return bHeight - aHeight;
    });
    
    const font = `${this.options.fontSize}px ${this.options.fontFamily}`;
    
    for (const node of sortedNodes) {
      if (
        node.x0 === undefined ||
        node.x1 === undefined ||
        node.y0 === undefined ||
        node.y1 === undefined
      ) {
        continue;
      }
      
      const nodeHeight = node.y1 - node.y0;
      
      // Skip if node is too small (will be handled by hover)
      if (nodeHeight < this.options.minLabelHeight) {
        const textWidth = this.textCache.measureText(node.id, font);
        unplaced.push({
          text: node.id,
          x: 0,
          y: 0,
          width: textWidth + this.options.padding * 2,
          height: this.options.fontSize + this.options.padding * 2,
          anchorX: (node.x0 + node.x1) / 2,
          anchorY: (node.y0 + node.y1) / 2,
          hasLeaderLine: false,
          nodeOrLinkId: node.id,
          priority: nodeHeight,
        });
        continue;
      }
      
      // Try to place label next to node
      const label = this.tryPlaceNodeLabel(node, font);
      
      if (label) {
        placed.push(label);
        this.spatialGrid.insert(label);
      } else if (this.options.enableDetachedLabels) {
        // Try detached placement
        const detachedLabel = this.tryDetachedPlacement(node, font);
        if (detachedLabel) {
          placed.push(detachedLabel);
          this.spatialGrid.insert(detachedLabel);
        } else {
          // Mark as unplaced for hover display
          const textWidth = this.textCache.measureText(node.id, font);
          unplaced.push({
            text: node.id,
            x: 0,
            y: 0,
            width: textWidth + this.options.padding * 2,
            height: this.options.fontSize + this.options.padding * 2,
            anchorX: (node.x0 + node.x1) / 2,
            anchorY: (node.y0 + node.y1) / 2,
            hasLeaderLine: false,
            nodeOrLinkId: node.id,
            priority: nodeHeight,
          });
        }
      }
    }
    
    return { placed, unplaced };
  }
  
  /**
   * Try to place a label next to a node (standard position)
   */
  private tryPlaceNodeLabel(node: SankeyNode, font: string): LabelLayout | null {
    if (
      node.x0 === undefined ||
      node.x1 === undefined ||
      node.y0 === undefined ||
      node.y1 === undefined
    ) {
      return null;
    }
    
    const text = node.id;
    const textWidth = this.textCache.measureText(text, font);
    const labelWidth = textWidth + this.options.padding * 2;
    const labelHeight = this.options.fontSize + this.options.padding * 2;
    
    const nodeHeight = node.y1 - node.y0;
    const anchorX = (node.x0 + node.x1) / 2;
    const anchorY = (node.y0 + node.y1) / 2;
    
    // Try right side first (if node is on left half)
    const isLeftSide = node.x0 < this.options.canvasWidth / 2;
    
    const positions = isLeftSide
      ? [
          { x: node.x1 + 6, y: anchorY - labelHeight / 2 }, // right
          { x: node.x0 - labelWidth - 6, y: anchorY - labelHeight / 2 }, // left
        ]
      : [
          { x: node.x0 - labelWidth - 6, y: anchorY - labelHeight / 2 }, // left
          { x: node.x1 + 6, y: anchorY - labelHeight / 2 }, // right
        ];
    
    for (const pos of positions) {
      // Check bounds
      if (
        pos.x < 0 ||
        pos.x + labelWidth > this.options.canvasWidth ||
        pos.y < 0 ||
        pos.y + labelHeight > this.options.canvasHeight
      ) {
        continue;
      }
      
      // Check collision
      if (!this.spatialGrid.checkCollision(pos.x, pos.y, labelWidth, labelHeight)) {
        return {
          text,
          x: pos.x,
          y: pos.y,
          width: labelWidth,
          height: labelHeight,
          anchorX,
          anchorY,
          hasLeaderLine: false,
          nodeOrLinkId: node.id,
          priority: nodeHeight,
        };
      }
    }
    
    return null;
  }
  
  /**
   * Try to place a label in detached whitespace with leader line
   */
  private tryDetachedPlacement(node: SankeyNode, font: string): LabelLayout | null {
    if (
      node.x0 === undefined ||
      node.x1 === undefined ||
      node.y0 === undefined ||
      node.y1 === undefined
    ) {
      return null;
    }
    
    const text = node.id;
    const textWidth = this.textCache.measureText(text, font);
    const labelWidth = textWidth + this.options.padding * 2;
    const labelHeight = this.options.fontSize + this.options.padding * 2;
    
    const anchorX = (node.x0 + node.x1) / 2;
    const anchorY = (node.y0 + node.y1) / 2;
    
    // Try positions in a spiral pattern around the anchor
    const maxDistance = this.options.leaderLineThreshold;
    const step = 15;
    
    for (let distance = step; distance <= maxDistance; distance += step) {
      // Try 8 directions
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      
      for (const angle of angles) {
        const rad = (angle * Math.PI) / 180;
        const x = anchorX + Math.cos(rad) * distance - labelWidth / 2;
        const y = anchorY + Math.sin(rad) * distance - labelHeight / 2;
        
        // Check bounds
        if (
          x < 0 ||
          x + labelWidth > this.options.canvasWidth ||
          y < 0 ||
          y + labelHeight > this.options.canvasHeight
        ) {
          continue;
        }
        
        // Check collision
        if (!this.spatialGrid.checkCollision(x, y, labelWidth, labelHeight)) {
          return {
            text,
            x,
            y,
            width: labelWidth,
            height: labelHeight,
            anchorX,
            anchorY,
            hasLeaderLine: true,
            nodeOrLinkId: node.id,
            priority: (node.y1 - node.y0),
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Clear all caches
   */
  clear(): void {
    this.spatialGrid.clear();
    this.textCache.clear();
  }
}

/**
 * Check if text color has sufficient contrast with background
 */
export function getContrastColor(bgColor: string): string {
  // Parse RGB from various formats
  let r = 0, g = 0, b = 0;
  
  if (bgColor.startsWith('#')) {
    // Hex format
    const hex = bgColor.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else if (bgColor.startsWith('rgb')) {
    // RGB format
    const match = bgColor.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    }
  }
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Truncate text with ellipsis to fit within max width
 */
export function truncateText(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string
): string {
  ctx.font = font;
  const fullWidth = ctx.measureText(text).width;
  
  if (fullWidth <= maxWidth) {
    return text;
  }
  
  const ellipsis = '...';
  const ellipsisWidth = ctx.measureText(ellipsis).width;
  
  let truncated = text;
  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    const width = ctx.measureText(truncated + ellipsis).width;
    if (width <= maxWidth) {
      return truncated + ellipsis;
    }
  }
  
  return ellipsis;
}
