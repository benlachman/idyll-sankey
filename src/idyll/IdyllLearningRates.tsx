/**
 * Idyll wrapper component for Learning Rates line plot
 * Converts CSV data to scatter plot with trend lines
 */

import * as React from 'react';
import { TimeSeriesRow, LinePlotData, LinePlotSeries, TrendLine } from '../lib/types';
import { LineCanvas } from '../components/LineCanvas';

interface IdyllLearningRatesProps {
  rows?: TimeSeriesRow[];
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

// Color palette for different technologies (matching Our World in Data style)
const TECHNOLOGY_COLORS: { [key: string]: string } = {
  'Solar PV': '#E63946',
  'Onshore wind': '#1D3557',
  'Offshore wind': '#457B9D',
  'Nuclear': '#2A9D8F',
  'Coal': '#8E44AD',
};

/**
 * Calculate linear regression in log-log space to find learning rate
 * Learning rate = 1 - 2^slope
 */
function calculateTrendLine(data: { x: number; y: number }[]): TrendLine | undefined {
  if (data.length < 2) return undefined;

  // Convert to log scale
  const logData = data.map(d => ({
    x: Math.log10(d.x),
    y: Math.log10(d.y),
  }));

  // Calculate linear regression
  const n = logData.length;
  const sumX = logData.reduce((sum, d) => sum + d.x, 0);
  const sumY = logData.reduce((sum, d) => sum + d.y, 0);
  const sumXY = logData.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumXX = logData.reduce((sum, d) => sum + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Convert slope to learning rate
  // In log-log space, slope represents the power law exponent
  // Learning rate = 1 - 2^slope (as capacity doubles, cost changes by 2^slope)
  const learningRate = (1 - Math.pow(2, slope)) * 100;

  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x));

  return {
    slope,
    intercept,
    learningRate,
    startX: minX,
    endX: maxX,
  };
}

class IdyllLearningRates extends React.Component<IdyllLearningRatesProps> {
  static defaultProps = {
    rows: [],
    width: 1000,
    height: 600,
    title: 'Electricity from renewables became cheaper as we increased capacity',
    xLabel: 'Cumulative installed capacity (megawatts)',
    yLabel: 'Price per megawatt hour of electricity',
    showGrid: true,
    showLegend: true,
  };

  /**
   * Convert CSV rows to LinePlotData structure with scatter points and trend lines
   */
  private processData(): LinePlotData {
    const { rows } = this.props;

    if (!rows || rows.length === 0) {
      return { series: [], useLogScale: true };
    }

    // Group data by technology
    const seriesMap = new Map<string, LinePlotSeries>();

    rows.forEach((row) => {
      if (!seriesMap.has(row.technology)) {
        seriesMap.set(row.technology, {
          name: row.technology,
          data: [],
          color: TECHNOLOGY_COLORS[row.technology] || '#000000',
          showPoints: true,
          showLine: false, // We'll show trend lines instead
        });
      }

      const series = seriesMap.get(row.technology)!;
      series.data.push({
        x: row.cumulative_capacity_mw,
        y: row.cost_per_mwh,
        year: row.year,
        label: `${row.year}`,
      });
    });

    // Calculate trend lines for each series
    seriesMap.forEach((series) => {
      // Sort data points by x for proper trend line calculation
      series.data.sort((a, b) => a.x - b.x);
      
      // Calculate trend line
      series.trendLine = calculateTrendLine(series.data);
    });

    return {
      series: Array.from(seriesMap.values()),
      useLogScale: true,
    };
  }

  render() {
    const { rows, width, height, title, xLabel, yLabel, showGrid, showLegend } = this.props;

    // Handle empty data
    if (!rows || rows.length === 0) {
      return (
        <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No data to display</p>
        </div>
      );
    }

    const data = this.processData();

    return (
      <LineCanvas
        data={data}
        width={width!}
        height={height!}
        title={title}
        xLabel={xLabel}
        yLabel={yLabel}
        showGrid={showGrid}
        showLegend={showLegend}
      />
    );
  }
}

export default IdyllLearningRates;
