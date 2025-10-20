/**
 * Canvas-based Sankey diagram renderer
 * High-performance rendering using Canvas API with requestAnimationFrame
 * Implements hover highlights with hit testing
 */

import * as React from 'react';
import { SankeyData, SankeyNode, SankeyLink, LinkColorStrategy } from '../lib/types';
import { hashColor, hslToRgb, mixColors, rgbToString } from '../lib/color';

interface SankeyCanvasProps {
  data: SankeyData;
  width: number;
  height: number;
  linkColorStrategy: LinkColorStrategy;
  labelMinHeight: number;
}

interface LinkColors {
  sourceColor: string;
  targetColor: string;
  gradientColor: string;
}

export class SankeyCanvas extends React.Component<SankeyCanvasProps> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private rafId: number | null = null;
  private hoveredNode: SankeyNode | null = null;
  private hoveredLink: SankeyLink | null = null;
  private linkColorCache = new Map<SankeyLink, LinkColors>();

  componentDidMount() {
    this.precomputeColors();
    this.startRenderLoop();
    this.setupMouseHandlers();
  }

  componentDidUpdate() {
    this.linkColorCache.clear();
    this.precomputeColors();
  }

  componentWillUnmount() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  /**
   * Precompute colors for all links to avoid per-frame work
   */
  private precomputeColors() {
    const { data } = this.props;
    
    data.links.forEach((link) => {
      const source = typeof link.source === 'number' ? data.nodes[link.source] : link.source;
      const target = typeof link.target === 'number' ? data.nodes[link.target] : link.target;
      
      const sourceColor = hashColor(source.id);
      const targetColor = hashColor(target.id);
      
      // Mix colors for gradient
      const sourceRgb = hslToRgb(sourceColor);
      const targetRgb = hslToRgb(targetColor);
      const mixedRgb = mixColors(sourceRgb, targetRgb, 0.5);
      const gradientColor = rgbToString(mixedRgb);
      
      this.linkColorCache.set(link, { sourceColor, targetColor, gradientColor });
    });
  }

  /**
   * Setup mouse handlers for hover detection
   */
  private setupMouseHandlers() {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleMouseMove = (e: MouseEvent) => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Hit test nodes
    let foundNode: SankeyNode | null = null;
    for (const node of this.props.data.nodes) {
      if (
        node.x0 !== undefined &&
        node.x1 !== undefined &&
        node.y0 !== undefined &&
        node.y1 !== undefined &&
        x >= node.x0 &&
        x <= node.x1 &&
        y >= node.y0 &&
        y <= node.y1
      ) {
        foundNode = node;
        break;
      }
    }

    // Hit test links (approximate bounding box)
    let foundLink: SankeyLink | null = null;
    if (!foundNode) {
      for (const link of this.props.data.links) {
        const source = typeof link.source === 'number' ? this.props.data.nodes[link.source] : link.source;
        const target = typeof link.target === 'number' ? this.props.data.nodes[link.target] : link.target;
        
        if (
          source.x1 !== undefined &&
          target.x0 !== undefined &&
          link.y0 !== undefined &&
          link.y1 !== undefined &&
          x >= source.x1 &&
          x <= target.x0 &&
          y >= Math.min(link.y0, link.y1 || 0) &&
          y <= Math.max(link.y0, link.y1 || 0)
        ) {
          foundLink = link;
          break;
        }
      }
    }

    if (foundNode !== this.hoveredNode || foundLink !== this.hoveredLink) {
      this.hoveredNode = foundNode;
      this.hoveredLink = foundLink;
      canvas.style.cursor = foundNode || foundLink ? 'pointer' : 'default';
    }
  };

  private handleMouseLeave = () => {
    this.hoveredNode = null;
    this.hoveredLink = null;
    const canvas = this.canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  /**
   * Start requestAnimationFrame render loop
   */
  private startRenderLoop() {
    const render = () => {
      this.draw();
      this.rafId = requestAnimationFrame(render);
    };
    render();
  }

  /**
   * Draw the Sankey diagram on canvas
   */
  private draw() {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { data, width, height, linkColorStrategy, labelMinHeight } = this.props;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw links
    data.links.forEach((link) => {
      const source = typeof link.source === 'number' ? data.nodes[link.source] : link.source;
      const target = typeof link.target === 'number' ? data.nodes[link.target] : link.target;
      
      if (
        source.x1 === undefined ||
        target.x0 === undefined ||
        link.y0 === undefined ||
        link.y1 === undefined
      ) {
        return;
      }

      const colors = this.linkColorCache.get(link);
      if (!colors) return;

      let color: string;
      switch (linkColorStrategy) {
        case 'source':
          color = colors.sourceColor;
          break;
        case 'target':
          color = colors.targetColor;
          break;
        case 'gradient':
        default:
          color = colors.gradientColor;
          break;
      }

      // Highlight on hover
      const isHovered = link === this.hoveredLink;
      ctx.globalAlpha = isHovered ? 0.8 : 0.4;
      ctx.fillStyle = color;

      // Draw link as a simple trapezoid
      const linkWidth = link.width || Math.abs((link.y1 || 0) - link.y0);
      const sy0 = link.y0;
      const sy1 = link.y0 + linkWidth;
      const ty0 = link.y1 || link.y0;
      const ty1 = ty0 + linkWidth;

      ctx.beginPath();
      ctx.moveTo(source.x1, sy0);
      ctx.lineTo(target.x0, ty0);
      ctx.lineTo(target.x0, ty1);
      ctx.lineTo(source.x1, sy1);
      ctx.closePath();
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Draw nodes
    data.nodes.forEach((node) => {
      if (
        node.x0 === undefined ||
        node.x1 === undefined ||
        node.y0 === undefined ||
        node.y1 === undefined
      ) {
        return;
      }

      const isHovered = node === this.hoveredNode;
      ctx.fillStyle = isHovered ? hashColor(node.id) : '#333';
      ctx.fillRect(node.x0, node.y0, node.x1 - node.x0, node.y1 - node.y0);

      // Draw label if node is tall enough
      const nodeHeight = node.y1 - node.y0;
      if (nodeHeight >= labelMinHeight) {
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.textBaseline = 'middle';
        
        const labelX = node.x0 < width / 2 ? node.x1 + 6 : node.x0 - 6;
        const labelY = (node.y0 + node.y1) / 2;
        ctx.textAlign = node.x0 < width / 2 ? 'left' : 'right';
        ctx.fillText(node.id, labelX, labelY);
      }
    });
  }

  render() {
    const { width, height } = this.props;
    return (
      <canvas
        ref={this.canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    );
  }
}
