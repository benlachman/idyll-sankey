/**
 * Canvas-based line plot renderer
 * High-performance rendering using Canvas API with requestAnimationFrame
 * Implements hover highlights and annotations
 */

import * as React from 'react';
import { LinePlotData, LinePlotSeries, LinePlotDataPoint, LinePlotAnnotation } from '../lib/types';

interface LineCanvasProps {
  data: LinePlotData;
  width: number;
  height: number;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

interface LineCanvasState {
  tooltipX: number;
  tooltipY: number;
  tooltipText: string;
  showTooltip: boolean;
  hoveredSeriesIndex: number | null;
}

interface PlotBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class LineCanvas extends React.Component<LineCanvasProps, LineCanvasState> {
  private canvasRef = React.createRef<HTMLCanvasElement>();
  private rafId: number | null = null;
  private needsRedraw = true;
  private plotBounds: PlotBounds = { left: 80, right: 40, top: 60, bottom: 80 };
  private xMin = 0;
  private xMax = 0;
  private yMin = 0;
  private yMax = 0;

  constructor(props: LineCanvasProps) {
    super(props);
    this.state = {
      tooltipX: 0,
      tooltipY: 0,
      tooltipText: '',
      showTooltip: false,
      hoveredSeriesIndex: null,
    };
  }

  componentDidMount() {
    this.computeDataBounds();
    this.startRenderLoop();
    this.setupMouseHandlers();
  }

  componentDidUpdate() {
    this.computeDataBounds();
    this.needsRedraw = true;
  }

  componentWillUnmount() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    const canvas = this.canvasRef.current;
    if (canvas) {
      canvas.removeEventListener('mousemove', this.handleMouseMove);
      canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    }
  }

  /**
   * Compute the min/max bounds for x and y axes
   */
  private computeDataBounds() {
    const { data } = this.props;
    
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    data.series.forEach((series) => {
      series.data.forEach((point) => {
        xMin = Math.min(xMin, point.x);
        xMax = Math.max(xMax, point.x);
        yMin = Math.min(yMin, point.y);
        yMax = Math.max(yMax, point.y);
      });
    });

    // Add padding to y-axis
    const yPadding = (yMax - yMin) * 0.1;
    this.yMin = Math.max(0, yMin - yPadding);
    this.yMax = yMax + yPadding;
    this.xMin = xMin;
    this.xMax = xMax;
  }

  /**
   * Convert data coordinates to canvas coordinates
   */
  private dataToCanvas(x: number, y: number): { cx: number; cy: number } {
    const { width, height } = this.props;
    const plotWidth = width - this.plotBounds.left - this.plotBounds.right;
    const plotHeight = height - this.plotBounds.top - this.plotBounds.bottom;

    const cx = this.plotBounds.left + ((x - this.xMin) / (this.xMax - this.xMin)) * plotWidth;
    const cy = this.plotBounds.top + plotHeight - ((y - this.yMin) / (this.yMax - this.yMin)) * plotHeight;

    return { cx, cy };
  }

  /**
   * Convert canvas coordinates to data coordinates
   */
  private canvasToData(cx: number, cy: number): { x: number; y: number } {
    const { width, height } = this.props;
    const plotWidth = width - this.plotBounds.left - this.plotBounds.right;
    const plotHeight = height - this.plotBounds.top - this.plotBounds.bottom;

    const x = this.xMin + ((cx - this.plotBounds.left) / plotWidth) * (this.xMax - this.xMin);
    const y = this.yMin + ((this.plotBounds.top + plotHeight - cy) / plotHeight) * (this.yMax - this.yMin);

    return { x, y };
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
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Find closest point on any series
    const { data } = this.props;
    let closestDist = Infinity;
    let found: { series: LinePlotSeries; point: LinePlotDataPoint; seriesIndex: number } | undefined;

    data.series.forEach((series, seriesIndex) => {
      series.data.forEach((point) => {
        const { cx: px, cy: py } = this.dataToCanvas(point.x, point.y);
        const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
        if (dist < closestDist && dist < 20) { // 20px threshold
          closestDist = dist;
          found = { series, point, seriesIndex };
        }
      });
    });

    if (found) {
      this.setState({
        tooltipX: e.clientX,
        tooltipY: e.clientY,
        tooltipText: `${found.series.name} (${found.point.x}): ${found.point.y.toFixed(2)}`,
        showTooltip: true,
        hoveredSeriesIndex: found.seriesIndex,
      });
    } else {
      this.setState({ showTooltip: false, hoveredSeriesIndex: null });
    }

    this.needsRedraw = true;
  };

  private handleMouseLeave = () => {
    this.setState({ showTooltip: false, hoveredSeriesIndex: null });
    this.needsRedraw = true;
  };

  /**
   * Start requestAnimationFrame render loop
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
   * Draw the line plot on canvas
   */
  private draw() {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { data, width, height, xLabel, yLabel, title, showGrid, showLegend } = this.props;
    const { hoveredSeriesIndex } = this.state;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw title
    if (title) {
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, width / 2, 10);
    }

    // Draw grid
    if (showGrid) {
      this.drawGrid(ctx);
    }

    // Draw axes
    this.drawAxes(ctx);

    // Draw axis labels
    if (xLabel) {
      ctx.fillStyle = '#000';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(xLabel, width / 2, height - 30);
    }

    if (yLabel) {
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.translate(20, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    // Draw lines
    data.series.forEach((series, index) => {
      const isHovered = index === hoveredSeriesIndex;
      this.drawLine(ctx, series, isHovered);
    });

    // Draw annotations
    if (data.annotations) {
      this.drawAnnotations(ctx, data.annotations);
    }

    // Draw legend
    if (showLegend !== false) {
      this.drawLegend(ctx);
    }
  }

  /**
   * Draw grid lines
   */
  private drawGrid(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.props;
    const plotWidth = width - this.plotBounds.left - this.plotBounds.right;
    const plotHeight = height - this.plotBounds.top - this.plotBounds.bottom;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines (every 5 years)
    const xStep = 5;
    for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
      const { cx } = this.dataToCanvas(x, 0);
      ctx.beginPath();
      ctx.moveTo(cx, this.plotBounds.top);
      ctx.lineTo(cx, this.plotBounds.top + plotHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    const yStep = Math.ceil((this.yMax - this.yMin) / 6);
    for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
      const { cy } = this.dataToCanvas(0, y);
      ctx.beginPath();
      ctx.moveTo(this.plotBounds.left, cy);
      ctx.lineTo(this.plotBounds.left + plotWidth, cy);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  /**
   * Draw axes with ticks and labels
   */
  private drawAxes(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.props;
    const plotWidth = width - this.plotBounds.left - this.plotBounds.right;
    const plotHeight = height - this.plotBounds.top - this.plotBounds.bottom;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    // Draw x-axis
    ctx.beginPath();
    ctx.moveTo(this.plotBounds.left, this.plotBounds.top + plotHeight);
    ctx.lineTo(this.plotBounds.left + plotWidth, this.plotBounds.top + plotHeight);
    ctx.stroke();

    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(this.plotBounds.left, this.plotBounds.top);
    ctx.lineTo(this.plotBounds.left, this.plotBounds.top + plotHeight);
    ctx.stroke();

    // Draw x-axis ticks and labels (every 5 years)
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xStep = 5;
    for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
      const { cx } = this.dataToCanvas(x, 0);
      ctx.beginPath();
      ctx.moveTo(cx, this.plotBounds.top + plotHeight);
      ctx.lineTo(cx, this.plotBounds.top + plotHeight + 5);
      ctx.stroke();
      ctx.fillText(x.toString(), cx, this.plotBounds.top + plotHeight + 8);
    }

    // Draw y-axis ticks and labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yStep = Math.ceil((this.yMax - this.yMin) / 6);
    for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
      const { cy } = this.dataToCanvas(0, y);
      ctx.beginPath();
      ctx.moveTo(this.plotBounds.left - 5, cy);
      ctx.lineTo(this.plotBounds.left, cy);
      ctx.stroke();
      ctx.fillText(y.toFixed(1), this.plotBounds.left - 8, cy);
    }
  }

  /**
   * Draw a single line series
   */
  private drawLine(ctx: CanvasRenderingContext2D, series: LinePlotSeries, isHovered: boolean) {
    if (series.data.length === 0) return;

    ctx.strokeStyle = series.color;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.globalAlpha = isHovered ? 1 : 0.8;

    ctx.beginPath();
    let firstPoint = true;
    series.data.forEach((point) => {
      const { cx, cy } = this.dataToCanvas(point.x, point.y);
      if (firstPoint) {
        ctx.moveTo(cx, cy);
        firstPoint = false;
      } else {
        ctx.lineTo(cx, cy);
      }
    });
    ctx.stroke();

    // Draw data points if hovered
    if (isHovered) {
      ctx.fillStyle = series.color;
      series.data.forEach((point) => {
        const { cx, cy } = this.dataToCanvas(point.x, point.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    ctx.globalAlpha = 1;
  }

  /**
   * Draw annotations on the plot
   */
  private drawAnnotations(ctx: CanvasRenderingContext2D, annotations: LinePlotAnnotation[]) {
    ctx.fillStyle = '#333';
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'bottom';

    annotations.forEach((annotation) => {
      const { cx, cy } = this.dataToCanvas(annotation.x, annotation.y);
      
      // Draw annotation line
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - 25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw annotation text
      ctx.textAlign = 'center';
      ctx.fillText(annotation.text, cx, cy - 27);
    });
  }

  /**
   * Draw legend
   */
  private drawLegend(ctx: CanvasRenderingContext2D) {
    const { data, width } = this.props;
    const legendX = width - this.plotBounds.right - 150;
    const legendY = this.plotBounds.top + 10;
    const lineHeight = 20;

    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    data.series.forEach((series, index) => {
      const y = legendY + index * lineHeight;

      // Draw line sample
      ctx.strokeStyle = series.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(legendX, y);
      ctx.lineTo(legendX + 30, y);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#000';
      ctx.fillText(series.name, legendX + 35, y);
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
