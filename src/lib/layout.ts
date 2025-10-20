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
 * Convert CSV rows to Sankey data structure and compute layout
 */
export function computeLayout(
  rows: CSVRow[],
  width: number,
  height: number
): SankeyData {
  // Handle empty data
  if (!rows || rows.length === 0) {
    return { nodes: [], links: [] };
  }

  // Build unique nodes
  const nodeMap = new Map<string, SankeyNode>();
  
  rows.forEach((row) => {
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
  const links: SankeyLink[] = rows.map((row) => ({
    source: nodeIndexMap.get(row.source)!,
    target: nodeIndexMap.get(row.target)!,
    value: row.value,
  }));

  // Compute layout using d3-sankey
  const sankeyGenerator = d3Sankey<SankeyNode, SankeyLink>()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([
      [1, 1],
      [width - 1, height - 5],
    ]);

  const graph = sankeyGenerator({
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({ ...l })),
  });

  return {
    nodes: graph.nodes,
    links: graph.links,
  };
}

/**
 * Get path generator for links (useful for debugging or SVG fallback)
 */
export function getLinkPath() {
  return sankeyLinkHorizontal();
}
