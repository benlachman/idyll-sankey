/**
 * Type definitions for Sankey diagram data structures
 */

export interface CSVRow {
  source: string;
  target: string;
  value: number;
}

export interface SankeyNode {
  id: string;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

export interface SankeyLink {
  source: SankeyNode | number;
  target: SankeyNode | number;
  value: number;
  y0?: number;
  y1?: number;
  width?: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export type LinkColorStrategy = 'source' | 'target' | 'gradient';
