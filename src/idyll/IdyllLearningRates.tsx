/**
 * Idyll wrapper component for Learning Rates line plot
 * Converts CSV data to line plot format and renders via Canvas
 */

import * as React from 'react';
import { TimeSeriesRow, LinePlotData, LinePlotSeries, LinePlotAnnotation } from '../lib/types';
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

// Color palette for different technologies
const TECHNOLOGY_COLORS: { [key: string]: string } = {
  'Solar': '#FF9800',
  'Wind': '#2196F3',
  'Batteries': '#4CAF50',
  'Natural Gas': '#795548',
  'Coal': '#424242',
  'Nuclear': '#9C27B0',
};

class IdyllLearningRates extends React.Component<IdyllLearningRatesProps> {
  static defaultProps = {
    rows: [],
    width: 960,
    height: 600,
    title: 'Learning Rates: Cost Decline in Energy Technologies',
    xLabel: 'Year',
    yLabel: 'Relative Cost per Unit',
    showGrid: true,
    showLegend: true,
  };

  /**
   * Convert CSV rows to LinePlotData structure
   */
  private processData(): LinePlotData {
    const { rows } = this.props;

    if (!rows || rows.length === 0) {
      return { series: [] };
    }

    // Group data by technology
    const seriesMap = new Map<string, LinePlotSeries>();

    rows.forEach((row) => {
      if (!seriesMap.has(row.technology)) {
        seriesMap.set(row.technology, {
          name: row.technology,
          data: [],
          color: TECHNOLOGY_COLORS[row.technology] || '#000000',
        });
      }

      const series = seriesMap.get(row.technology)!;
      series.data.push({
        x: row.year,
        y: row.cost_per_unit,
      });
    });

    // Sort data points by year for each series
    seriesMap.forEach((series) => {
      series.data.sort((a, b) => a.x - b.x);
    });

    // Create annotations for notable points
    const annotations: LinePlotAnnotation[] = [
      {
        x: 2000,
        y: 7.71,
        text: 'Solar boom begins',
        series: 'Solar',
      },
      {
        x: 2010,
        y: 3.18,
        text: 'Wind becomes competitive',
        series: 'Wind',
      },
      {
        x: 2015,
        y: 6.62,
        text: 'Battery revolution',
        series: 'Batteries',
      },
      {
        x: 2020,
        y: 2.74,
        text: 'Solar becomes cheapest',
        series: 'Solar',
      },
    ];

    return {
      series: Array.from(seriesMap.values()),
      annotations,
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
