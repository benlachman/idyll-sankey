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

interface SankeyCanvasState {
  tooltipX: number;
  tooltipY: number;
  tooltipText: string;
  showTooltip: boolean;
}

export class SankeyCanvas extends React.Component<SankeyCanvasProps, SankeyCanvasState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private rafId: number | null = null;
  private hoveredNode: SankeyNode | null = null;
  private hoveredLink: SankeyLink | null = null;
  private linkColorCache = new Map<SankeyLink, LinkColors>();
  private needsRedraw = true;

  constructor(props: SankeyCanvasProps) {
    super(props);
    this.state = {
      tooltipX: 0,
      tooltipY: 0,
      tooltipText: '',
      showTooltip: false,
    };
  }

  componentDidMount() {
    this.precomputeColors();
    this.startRenderLoop();
    this.setupMouseHandlers();
  }

  componentDidUpdate() {
    this.linkColorCache.clear();
    this.precomputeColors();
    this.needsRedraw = true;
  }

  componentWillUnmount() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    // Remove event listeners to prevent memory leaks
    const canvas = this.canvasRef.current;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.handleMouseMove);
      canvas.removeEventListener('mouseleave', this.handleMouseLeave);
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
          link.y1 !== undefined
        ) {
          const linkWidth = link.width || 0;
          const minY = Math.min(link.y0 - linkWidth / 2, (link.y1 || link.y0) - linkWidth / 2);
          const maxY = Math.max(link.y0 + linkWidth / 2, (link.y1 || link.y0) + linkWidth / 2);
          
          if (
            x >= source.x1 &&
            x <= target.x0 &&
            y >= minY &&
            y <= maxY
          ) {
            foundLink = link;
            break;
          }
        }
      }
    }

    // Update tooltip
    if (foundNode) {
      const nodeValue = this.getNodeValue(foundNode);
      this.setState({
        tooltipX: e.clientX,
        tooltipY: e.clientY,
        tooltipText: `${foundNode.id}: ${nodeValue.toFixed(2)}`,
        showTooltip: true,
      });
    } else if (foundLink) {
      const source = typeof foundLink.source === 'number' ? this.props.data.nodes[foundLink.source] : foundLink.source;
      const target = typeof foundLink.target === 'number' ? this.props.data.nodes[foundLink.target] : foundLink.target;
      this.setState({
        tooltipX: e.clientX,
        tooltipY: e.clientY,
        tooltipText: `${source.id} → ${target.id}: ${foundLink.value.toFixed(2)}`,
        showTooltip: true,
      });
    } else {
      this.setState({ showTooltip: false });
    }

    if (foundNode !== this.hoveredNode || foundLink !== this.hoveredLink) {
      this.hoveredNode = foundNode;
      this.hoveredLink = foundLink;
      this.needsRedraw = true;
      canvas.style.cursor = foundNode || foundLink ? 'pointer' : 'default';
    }
  };

  private handleMouseLeave = () => {
    this.hoveredNode = null;
    this.hoveredLink = null;
    this.setState({ showTooltip: false });
    const canvas = this.canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  /**
   * Start requestAnimationFrame render loop
   * Only redraws when needsRedraw flag is set
   */
  private startRenderLoop() {
    const render = () => {
      if (this.needsRedraw) {
        this.draw();
        this.needsRedraw = false;
      }
      this.rafId = requestAnimationFrame(render);
    };
    render();
  }

  /**
   * Get the total value for a node (sum of incoming or outgoing links)
   */
  private getNodeValue(node: SankeyNode): number {
    // Node value is already computed by d3-sankey
    // It's the sum of all links flowing through the node
    const nodeIndex = this.props.data.nodes.indexOf(node);
    if (nodeIndex === -1) return 0;
    
    // Sum all outgoing links from this node
    let value = 0;
    this.props.data.links.forEach((link) => {
      const sourceIndex = typeof link.source === 'number' ? link.source : this.props.data.nodes.indexOf(link.source);
      if (sourceIndex === nodeIndex) {
        value += link.value;
      }
    });
    
    // If no outgoing links, sum incoming links
    if (value === 0) {
      this.props.data.links.forEach((link) => {
        const targetIndex = typeof link.target === 'number' ? link.target : this.props.data.nodes.indexOf(link.target);
        if (targetIndex === nodeIndex) {
          value += link.value;
        }
      });
    }
    
    return value;
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

      // Draw link as a bezier curve
      // link.y0 and link.y1 are the center positions, link.width is the thickness
      const linkWidth = link.width || 0;
      
      // Calculate top and bottom edges at source and target
      const sy0 = link.y0 - linkWidth / 2;  // top edge at source
      const sy1 = link.y0 + linkWidth / 2;  // bottom edge at source
      const ty0 = (link.y1 || link.y0) - linkWidth / 2;  // top edge at target
      const ty1 = (link.y1 || link.y0) + linkWidth / 2;  // bottom edge at target

      // Control points at horizontal midpoint
      const xi = (source.x1 + target.x0) / 2;

      ctx.beginPath();
      // Draw top curve from source to target
      ctx.moveTo(source.x1, sy0);
      ctx.bezierCurveTo(xi, sy0, xi, ty0, target.x0, ty0);
      // Draw along target edge
      ctx.lineTo(target.x0, ty1);
      // Draw bottom curve from target to source
      ctx.bezierCurveTo(xi, ty1, xi, sy1, source.x1, sy1);
      // Close path
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
    const { tooltipX, tooltipY, tooltipText, showTooltip } = this.state;
    
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={this.canvasRef}
          width={width}
          height={height}
          style={{ display: 'block' }}
        />
        {showTooltip && (
          <div
            style={{
              position: 'fixed',
              left: tooltipX + 10,
              top: tooltipY + 10,
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
              whiteSpace: 'nowrap',
            }}
          >
            {tooltipText}
          </div>
        )}
      </div>
    );
  }
}
