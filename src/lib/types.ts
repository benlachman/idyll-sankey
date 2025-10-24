/**
 * Type definitions for Sankey diagram data structures
 */

export interface CSVRow {
  source: string;
  target: string;
  value: number;
  group?: string;
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

/**
 * Type definitions for line plot data structures
 */

export interface TimeSeriesRow {
  year: number;
  technology: string;
  cost_per_mwh: number;
  cumulative_capacity_mw: number;
}

export interface LinePlotDataPoint {
  x: number;
  y: number;
  year?: number;
  label?: string;
}

export interface TrendLine {
  slope: number;
  intercept: number;
  learningRate: number;
  startX: number;
  endX: number;
}

export interface LinePlotSeries {
  name: string;
  data: LinePlotDataPoint[];
  color: string;
  trendLine?: TrendLine;
  showPoints?: boolean;
  showLine?: boolean;
}

export interface LinePlotAnnotation {
  x: number;
  y: number;
  text: string;
  series?: string;
}

export interface LinePlotData {
  series: LinePlotSeries[];
  annotations?: LinePlotAnnotation[];
  useLogScale?: boolean;
}
