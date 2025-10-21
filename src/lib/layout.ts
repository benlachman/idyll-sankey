/**
 * Layout utilities for Sankey diagram
 * Uses d3-sankey for computing node and link positions
 */

import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  SankeyNode as D3SankeyNode,
  SankeyLink as D3SankeyLink,
} from 'd3-sankey';
import { CSVRow, SankeyData, SankeyNode, SankeyLink } from './types';

/**
 * Normalize label text (title case)
 */
function normalizeLabel(label: string): string {
  return label
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      // Title case for all words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Convert CSV rows to Sankey data structure and compute layout
 */
export function computeLayout(
  rows: CSVRow[],
  width: number,
  height: number,
  options: {
    allowNegative?: boolean;
    minValue?: number;
    aggregateDuplicates?: boolean;
  } = {}
): SankeyData {
  const {
    allowNegative = false,
    minValue = 0.01,
    aggregateDuplicates = true,
  } = options;

  // Handle empty data
  if (!rows || rows.length === 0) {
    return { nodes: [], links: [] };
  }

  // Filter and process rows
  let processedRows = rows
    .map(row => ({
      ...row,
      // Clamp negative values if not allowed
      value: allowNegative ? row.value : Math.max(0, row.value),
      // Normalize labels
      source: normalizeLabel(row.source),
      target: normalizeLabel(row.target),
    }))
    .filter(row => Math.abs(row.value) >= minValue); // Filter by minValue

  // Aggregate duplicates if enabled
  if (aggregateDuplicates) {
    const aggregateMap = new Map<string, CSVRow>();
    
    processedRows.forEach(row => {
      const key = `${row.source}|${row.target}`;
      if (aggregateMap.has(key)) {
        const existing = aggregateMap.get(key)!;
        existing.value += row.value;
      } else {
        aggregateMap.set(key, { ...row });
      }
    });
    
    processedRows = Array.from(aggregateMap.values());
  }

  // Build unique nodes
  const nodeMap = new Map<string, SankeyNode>();
  
  processedRows.forEach((row) => {
    if (!nodeMap.has(row.source)) {
      nodeMap.set(row.source, { id: row.source });
    }
    if (!nodeMap.has(row.target)) {
      nodeMap.set(row.target, { id: row.target });
    }
  });

  const nodes = Array.from(nodeMap.values());
  
  // Create index map for O(1) lookup
  const nodeIndexMap = new Map<string, number>();
  nodes.forEach((node, index) => {
    nodeIndexMap.set(node.id, index);
  });

  // Build links using the index map
  const links: SankeyLink[] = processedRows.map((row) => ({
    source: nodeIndexMap.get(row.source)!,
    target: nodeIndexMap.get(row.target)!,
    value: row.value,
  }));

  // Compute layout using d3-sankey
  // First, do an initial layout pass to determine node depths
  const initialGenerator = d3Sankey<SankeyNode, SankeyLink>()
    .nodeWidth(15)
    .nodePadding(10) // Use default padding for first pass
    .extent([
      [1, 1],
      [width - 1, height - 5],
    ]);

  const initialGraph = initialGenerator({
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({ ...l })),
  });

  // Count nodes per depth from the initial layout
  const nodesPerDepth = new Map<number, number>();
  initialGraph.nodes.forEach(node => {
    const depth = node.depth || 0;
    nodesPerDepth.set(depth, (nodesPerDepth.get(depth) || 0) + 1);
  });

  const maxNodesPerDepth = Math.max(...Array.from(nodesPerDepth.values()));
  
  // Calculate appropriate padding based on actual depth distribution
  // Reserve enough space so nodes don't have zero height
  const availableHeight = height - 6; // Account for extent margins
  const minHeightPerNode = 5; // Minimum height per node in pixels
  const minPadding = 1;
  const defaultPadding = 10;
  
  // Calculate the maximum padding that leaves room for node rectangles
  const maxPadding = Math.floor((availableHeight - (maxNodesPerDepth * minHeightPerNode)) / maxNodesPerDepth);
  const nodePadding = Math.max(minPadding, Math.min(defaultPadding, maxPadding));

  // Only recompute if padding changed significantly
  if (nodePadding < 8) {
    const finalGenerator = d3Sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(nodePadding)
      .extent([
        [1, 1],
        [width - 1, height - 5],
      ]);

    const finalGraph = finalGenerator({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    });

    return {
      nodes: finalGraph.nodes,
      links: finalGraph.links,
    };
  }

  // Use initial graph if padding is fine
  return {
    nodes: initialGraph.nodes,
    links: initialGraph.links,
  };
}

/**
 * Get path generator for links (useful for debugging or SVG fallback)
 */
export function getLinkPath() {
  return sankeyLinkHorizontal();
}
