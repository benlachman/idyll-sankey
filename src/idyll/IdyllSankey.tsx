/**
 * Idyll wrapper component for Sankey diagram
 * Converts Idyll data rows to layout and renders via Canvas
 */

import * as React from 'react';
import { CSVRow, LinkColorStrategy } from '../lib/types';
import { computeLayout } from '../lib/layout';
import { SankeyCanvas } from '../components/SankeyCanvas';

interface IdyllSankeyProps {
  rows?: CSVRow[];
  linkColorStrategy?: LinkColorStrategy;
  labelMinHeight?: number;
  width?: number;
  height?: number;
  allowNegative?: boolean;
  minValue?: number;
  units?: string;
  aggregateDuplicates?: boolean;
  performanceThreshold?: number | boolean;
  enableSmartLabels?: boolean;
  enableHoverLabels?: boolean;
  enableDetachedLabels?: boolean;
  labelFontSize?: number;
  labelFontFamily?: string;
}

class IdyllSankey extends React.Component<IdyllSankeyProps> {
  static defaultProps = {
    rows: [],
    linkColorStrategy: 'gradient' as LinkColorStrategy,
    labelMinHeight: 8,
    width: 960,
    height: 600,
    allowNegative: false,
    minValue: 0.01,
    aggregateDuplicates: true,
    performanceThreshold: 5000,
    enableSmartLabels: true,
    enableHoverLabels: true,
    enableDetachedLabels: true,
    labelFontSize: 12,
    labelFontFamily: 'sans-serif',
  };

  render() {
    const { 
      rows, 
      linkColorStrategy, 
      labelMinHeight, 
      width, 
      height,
      allowNegative,
      minValue,
      units,
      aggregateDuplicates,
      performanceThreshold,
      enableSmartLabels,
      enableHoverLabels,
      enableDetachedLabels,
      labelFontSize,
      labelFontFamily,
    } = this.props;

    // Handle empty data
    if (!rows || rows.length === 0) {
      return (
        <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No data to display</p>
        </div>
      );
    }

    // Compute layout with options
    const data = computeLayout(rows, width!, height!, {
      allowNegative,
      minValue,
      aggregateDuplicates,
    });

    return (
      <SankeyCanvas
        data={data}
        width={width!}
        height={height!}
        linkColorStrategy={linkColorStrategy!}
        labelMinHeight={labelMinHeight!}
        units={units}
        allowNegative={allowNegative}
        performanceThreshold={performanceThreshold}
        enableSmartLabels={enableSmartLabels}
        enableHoverLabels={enableHoverLabels}
        enableDetachedLabels={enableDetachedLabels}
        labelFontSize={labelFontSize}
        labelFontFamily={labelFontFamily}
      />
    );
  }
}

export default IdyllSankey;
