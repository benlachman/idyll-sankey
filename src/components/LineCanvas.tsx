/**
 * Canvas-based scatter plot renderer with logarithmic axes
 * High-performance rendering using Canvas API with requestAnimationFrame
 * Implements hover highlights for both data points and trend lines
 */

import * as React from 'react';
import { LinePlotData, LinePlotSeries, LinePlotDataPoint } from '../lib/types';

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
  hoveredPointIndex: number | null;
  hoveredTrendLine: boolean;
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
  private plotBounds: PlotBounds = { left: 80, right: 200, top: 80, bottom: 80 };
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
      hoveredPointIndex: null,
      hoveredTrendLine: false,
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
   * Compute the min/max bounds for x and y axes in log space
   */
  private computeDataBounds() {
    const { data } = this.props;
    
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    data.series.forEach((series) => {
      series.data.forEach((point) => {
        if (point.x > 0 && point.y > 0) { // Only consider positive values for log scale
          xMin = Math.min(xMin, point.x);
          xMax = Math.max(xMax, point.x);
          yMin = Math.min(yMin, point.y);
          yMax = Math.max(yMax, point.y);
        }
      });
    });

    // Round to nice log scale bounds
    this.xMin = Math.pow(10, Math.floor(Math.log10(xMin)));
    this.xMax = Math.pow(10, Math.ceil(Math.log10(xMax)));
    this.yMin = Math.pow(10, Math.floor(Math.log10(yMin)));
    this.yMax = Math.pow(10, Math.ceil(Math.log10(yMax)));
  }

  /**
   * Convert data coordinates to canvas coordinates (log scale)
   */
  private dataToCanvas(x: number, y: number): { cx: number; cy: number } {
    const { width, height } = this.props;
    const plotWidth = width - this.plotBounds.left - this.plotBounds.right;
    const plotHeight = height - this.plotBounds.top - this.plotBounds.bottom;

    const logX = Math.log10(x);
    const logY = Math.log10(y);
    const logXMin = Math.log10(this.xMin);
    const logXMax = Math.log10(this.xMax);
    const logYMin = Math.log10(this.yMin);
    const logYMax = Math.log10(this.yMax);

    const cx = this.plotBounds.left + ((logX - logXMin) / (logXMax - logXMin)) * plotWidth;
    const cy = this.plotBounds.top + plotHeight - ((logY - logYMin) / (logYMax - logYMin)) * plotHeight;

    return { cx, cy };
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

    const { data } = this.props;

    // First, check for hover on data points
    let foundPoint: { seriesIndex: number; pointIndex: number; point: LinePlotDataPoint; series: LinePlotSeries } | undefined;
    let closestPointDist = Infinity;

    data.series.forEach((series, seriesIndex) => {
      series.data.forEach((point, pointIndex) => {
        const { cx: px, cy: py } = this.dataToCanvas(point.x, point.y);
        const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
        if (dist < closestPointDist && dist < 8) { // 8px threshold for points
          closestPointDist = dist;
          foundPoint = { seriesIndex, pointIndex, point, series };
        }
      });
    });

    if (foundPoint) {
      // Hovering on a data point
      const costStr = `$${foundPoint.point.y}/MWh`;
      const yearStr = foundPoint.point.year || '';
      this.setState({
        tooltipX: e.clientX,
        tooltipY: e.clientY,
        tooltipText: `${foundPoint.series.name} ${yearStr}: ${costStr}`,
        showTooltip: true,
        hoveredSeriesIndex: foundPoint.seriesIndex,
        hoveredPointIndex: foundPoint.pointIndex,
        hoveredTrendLine: false,
      });
    } else {
      // Check for hover on trend lines
      let foundTrendLine: { seriesIndex: number; series: LinePlotSeries } | undefined;
      let closestTrendDist = Infinity;

      data.series.forEach((series, seriesIndex) => {
        if (series.trendLine) {
          // Check if mouse is near the trend line
          const { startX, endX, slope, intercept } = series.trendLine;
          
          // Sample points along the trend line and check distance
          const numSamples = 50;
          for (let i = 0; i <= numSamples; i++) {
            const logX = Math.log10(startX) + (Math.log10(endX) - Math.log10(startX)) * (i / numSamples);
            const logY = slope * logX + intercept;
            const x = Math.pow(10, logX);
            const y = Math.pow(10, logY);
            
            const { cx: px, cy: py } = this.dataToCanvas(x, y);
            const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
            
            if (dist < closestTrendDist && dist < 10) { // 10px threshold for trend lines
              closestTrendDist = dist;
              foundTrendLine = { seriesIndex, series };
            }
          }
        }
      });

      if (foundTrendLine) {
        const learningRate = foundTrendLine.series.trendLine!.learningRate;
        const lrText = learningRate > 0 
          ? `Learning rate: ${learningRate.toFixed(0)}%` 
          : `No learning rate - costs increased`;
        
        this.setState({
          tooltipX: e.clientX,
          tooltipY: e.clientY,
          tooltipText: `${foundTrendLine.series.name}\n${lrText}`,
          showTooltip: true,
          hoveredSeriesIndex: foundTrendLine.seriesIndex,
          hoveredPointIndex: null,
          hoveredTrendLine: true,
        });
      } else {
        this.setState({ 
          showTooltip: false, 
          hoveredSeriesIndex: null,
          hoveredPointIndex: null,
          hoveredTrendLine: false,
        });
      }
    }

    this.needsRedraw = true;
  };

  private handleMouseLeave = () => {
    this.setState({ 
      showTooltip: false, 
      hoveredSeriesIndex: null,
      hoveredPointIndex: null,
      hoveredTrendLine: false,
    });
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
   * Draw the scatter plot with trend lines on canvas
   */
  private draw() {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { data, width, height, xLabel, yLabel, title, showGrid, showLegend } = this.props;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw title
    if (title) {
      ctx.fillStyle = '#333';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const maxWidth = width - this.plotBounds.left - this.plotBounds.right;
      this.wrapText(ctx, title, this.plotBounds.left, 20, maxWidth, 22);
    }

    // Draw grid
    if (showGrid) {
      this.drawLogGrid(ctx);
    }

    // Draw axes
    this.drawLogAxes(ctx);

    // Draw axis labels
    if (xLabel) {
      ctx.fillStyle = '#666';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(xLabel, (this.plotBounds.left + width - this.plotBounds.right) / 2, height - 35);
    }

    if (yLabel) {
      ctx.save();
      ctx.fillStyle = '#666';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.translate(25, (this.plotBounds.top + height - this.plotBounds.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    // Draw trend lines first (behind points)
    data.series.forEach((series, index) => {
      if (series.trendLine) {
        const isHovered = index === this.state.hoveredSeriesIndex && this.state.hoveredTrendLine;
        this.drawTrendLine(ctx, series, isHovered);
      }
    });

    // Draw scatter points on top
    data.series.forEach((series, index) => {
      const isSeriesHovered = index === this.state.hoveredSeriesIndex;
      this.drawScatterPoints(ctx, series, index, isSeriesHovered);
    });

    // Draw legend
    if (showLegend !== false) {
      this.drawLegend(ctx);
    }
  }

  /**
   * Wrap text to multiple lines
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  /**
   * Draw logarithmic grid lines
   */
  private drawLogGrid(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.props;
    const plotWidth = width - this.plotBounds.left - this.plotBounds.right;
    const plotHeight = height - this.plotBounds.top - this.plotBounds.bottom;

    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    // Draw vertical grid lines at each power of 10
    const logXMin = Math.log10(this.xMin);
    const logXMax = Math.log10(this.xMax);
    
    for (let logX = Math.ceil(logXMin); logX <= Math.floor(logXMax); logX++) {
      const x = Math.pow(10, logX);
      const { cx } = this.dataToCanvas(x, this.yMin);
      
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, this.plotBounds.top);
      ctx.lineTo(cx, this.plotBounds.top + plotHeight);
      ctx.stroke();
    }

    // Draw horizontal grid lines at each power of 10
    const logYMin = Math.log10(this.yMin);
    const logYMax = Math.log10(this.yMax);
    
    for (let logY = Math.ceil(logYMin); logY <= Math.floor(logYMax); logY++) {
      const y = Math.pow(10, logY);
      const { cy } = this.dataToCanvas(this.xMin, y);
      
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.plotBounds.left, cy);
      ctx.lineTo(this.plotBounds.left + plotWidth, cy);
      ctx.stroke();
    }
  }

  /**
   * Format number with SI suffix (K, M)
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(num >= 10000000 ? 0 : 1) + ' M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + ' K';
    }
    return num.toFixed(0);
  }

  /**
   * Draw logarithmic axes with ticks and labels
   */
  private drawLogAxes(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.props;
    const plotWidth = width - this.plotBounds.left - this.plotBounds.right;
    const plotHeight = height - this.plotBounds.top - this.plotBounds.bottom;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;

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

    // Draw x-axis ticks and labels (powers of 10)
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const logXMin = Math.log10(this.xMin);
    const logXMax = Math.log10(this.xMax);
    
    for (let logX = Math.ceil(logXMin); logX <= Math.floor(logXMax); logX++) {
      const x = Math.pow(10, logX);
      const { cx } = this.dataToCanvas(x, this.yMin);
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, this.plotBounds.top + plotHeight);
      ctx.lineTo(cx, this.plotBounds.top + plotHeight + 6);
      ctx.stroke();
      
      ctx.fillText(this.formatNumber(x) + ' MW', cx, this.plotBounds.top + plotHeight + 10);
    }

    // Draw y-axis ticks and labels (powers of 10)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const logYMin = Math.log10(this.yMin);
    const logYMax = Math.log10(this.yMax);
    
    // Draw major ticks at powers of 10
    for (let logY = Math.ceil(logYMin); logY <= Math.floor(logYMax); logY++) {
      const y = Math.pow(10, logY);
      const { cy } = this.dataToCanvas(this.xMin, y);
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.plotBounds.left - 6, cy);
      ctx.lineTo(this.plotBounds.left, cy);
      ctx.stroke();
      
      ctx.fillText('$' + y.toFixed(0), this.plotBounds.left - 10, cy);
    }
  }

  /**
   * Draw trend line for a series
   */
  private drawTrendLine(ctx: CanvasRenderingContext2D, series: LinePlotSeries, isHovered: boolean) {
    if (!series.trendLine) return;

    const { slope, intercept, startX, endX } = series.trendLine;

    ctx.strokeStyle = series.color;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.globalAlpha = isHovered ? 0.9 : 0.7;
    ctx.setLineDash([]);

    ctx.beginPath();
    let firstPoint = true;

    // Draw trend line by sampling points in log space
    const numPoints = 100;
    const logStartX = Math.log10(startX);
    const logEndX = Math.log10(endX);

    for (let i = 0; i <= numPoints; i++) {
      const logX = logStartX + (logEndX - logStartX) * (i / numPoints);
      const logY = slope * logX + intercept;
      const x = Math.pow(10, logX);
      const y = Math.pow(10, logY);

      // Only draw if within visible bounds
      if (x >= this.xMin && x <= this.xMax && y >= this.yMin && y <= this.yMax) {
        const { cx, cy } = this.dataToCanvas(x, y);
        
        if (firstPoint) {
          ctx.moveTo(cx, cy);
          firstPoint = false;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Draw scatter points for a series
   */
  private drawScatterPoints(ctx: CanvasRenderingContext2D, series: LinePlotSeries, seriesIndex: number, isSeriesHovered: boolean) {
    const { hoveredSeriesIndex, hoveredPointIndex } = this.state;

    series.data.forEach((point, pointIndex) => {
      const { cx, cy } = this.dataToCanvas(point.x, point.y);
      
      const isThisPointHovered = seriesIndex === hoveredSeriesIndex && pointIndex === hoveredPointIndex;
      const radius = isThisPointHovered ? 5 : 3.5;
      const strokeWidth = isThisPointHovered ? 2.5 : 1.5;

      // Draw point with white border
      ctx.fillStyle = series.color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = strokeWidth;
      
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  }

  /**
   * Draw legend
   */
  private drawLegend(ctx: CanvasRenderingContext2D) {
    const { data, width } = this.props;
    const legendX = width - this.plotBounds.right + 10;
    const legendY = this.plotBounds.top;
    const lineHeight = 28;

    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    data.series.forEach((series, index) => {
      const y = legendY + index * lineHeight;

      // Draw colored circle
      ctx.fillStyle = series.color;
      ctx.beginPath();
      ctx.arc(legendX + 6, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw series name
      ctx.fillStyle = '#333';
      ctx.fillText(series.name, legendX + 18, y);

      // Draw learning rate if available
      if (series.trendLine) {
        const lr = series.trendLine.learningRate;
        const lrText = lr > 0 
          ? `${lr.toFixed(0)}%` 
          : 'increasing';
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.fillText(`Learning rate: ${lrText}`, legendX + 18, y + 12);
        ctx.font = '12px sans-serif';
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
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
              whiteSpace: 'pre-line',
              maxWidth: '200px',
            }}
          >
            {tooltipText}
          </div>
        )}
      </div>
    );
  }
}
