# Idyll Sankey

High-performance visualization components for Idyll 5.x, built with TypeScript and Canvas rendering.

## Components

### Sankey Diagram

High-performance Sankey diagram component for visualizing flows.

## Features

- **Canvas rendering** for high performance with `requestAnimationFrame` loop
- **d3-sankey** for layout computation only
- **Hover highlights** with efficient hit testing
- **Multiple color strategies**: source, target, or gradient
- **Label culling** by height threshold
- **TypeScript** implementation with full type safety
- **Negative value support** with dashed rendering
- **Minimum value filtering** to drop hairlines and zeros
- **Label normalization** for consistent display
- **Duplicate aggregation** for cleaner visualizations
- **Performance optimizations** for large datasets (>5k links)

## Usage

### Sankey Diagram

In your Idyll document (`.idyll` file):

```idl
[data name:"flows" source:"flows.csv" /]

[IdyllSankey
  rows:flows
  linkColorStrategy:"gradient"
  labelMinHeight:8
  width:960
  height:600
/]
```

Note: Place your CSV file in the `data/` directory and reference it by filename only in the `source` attribute.

### Props

- `rows` - Array of objects with `source`, `target`, and `value` properties (from `[data]` component)
- `linkColorStrategy` - How to color links: `"source"`, `"target"`, or `"gradient"` (default: `"gradient"`)
- `labelMinHeight` - Minimum node height (in pixels) to show labels (default: `8`)
- `width` - Canvas width in pixels (default: `960`)
- `height` - Canvas height in pixels (default: `600`)
- `allowNegative` - Allow negative values, rendered with dashed strokes (default: `false`)
- `minValue` - Minimum absolute value to include in visualization (default: `0.01`)
- `units` - Optional string to append to tooltip values (e.g., `"Quads"`)
- `aggregateDuplicates` - Aggregate duplicate flows (default: `true`)
- `performanceThreshold` - Number of links above which shadows are disabled for performance (default: `5000`). Set to `0` or `false` to never disable shadows

### Data Format

Your CSV file should have three columns:

```csv
source,target,value
A,B,10
A,C,5
B,D,10
```

### Learning Rates Plot

Canvas-based line plot for visualizing learning rates and cost trends over time.

In your Idyll document (`.idyll` file):

```idl
[data name:"learningRates" source:"learning_rates.csv" /]

[IdyllLearningRates
  rows:learningRates
  width:1000
  height:600
/]
```

#### Props

- `rows` - Array of objects with `year`, `technology`, and `cost_per_unit` properties (from `[data]` component)
- `width` - Canvas width in pixels (default: `960`)
- `height` - Canvas height in pixels (default: `600`)
- `title` - Chart title (default: `"Learning Rates: Cost Decline in Energy Technologies"`)
- `xLabel` - X-axis label (default: `"Year"`)
- `yLabel` - Y-axis label (default: `"Relative Cost per Unit"`)
- `showGrid` - Show grid lines (default: `true`)
- `showLegend` - Show legend (default: `true`)

#### Data Format

Your CSV file should have three columns:

```csv
year,technology,cost_per_unit
1995,Solar,10.00
1996,Solar,9.50
1995,Wind,5.00
1996,Wind,4.85
```

The component automatically:
- Groups data by technology
- Assigns colors based on technology name
- Adds annotations for key milestones
- Enables hover tooltips showing values
- Highlights the hovered series

## Development

### Running Locally

To start a local development server:

```bash
npm install
npm run dev
```

This will compile TypeScript and start the Idyll development server at `http://localhost:3000`.

### Available Pages

- `index.idyll` - Main demo with Sankey diagrams and Learning Rates visualization

This project is designed to work entirely through PRs and GitHub Actions. No local terminal work needed!

### CI/CD

- **ci.yml**: Runs tests on pull requests
- **pages.yml**: Builds and deploys to GitHub Pages on merge to main

### Project Structure

```
.
├── src/
│   ├── lib/
│   │   ├── types.ts       # Type definitions
│   │   ├── color.ts       # Color utilities
│   │   └── layout.ts      # d3-sankey layout wrapper
│   ├── components/
│   │   ├── SankeyCanvas.tsx  # Canvas renderer for Sankey
│   │   └── LineCanvas.tsx    # Canvas renderer for line plots
│   └── idyll/
│       ├── IdyllSankey.tsx         # Idyll wrapper for Sankey
│       └── IdyllLearningRates.tsx  # Idyll wrapper for Learning Rates
├── __tests__/
│   ├── color.test.ts
│   ├── layout.test.ts
│   └── line-plot.test.ts
├── components/
│   ├── IdyllSankey.js         # Bridge to compiled TS
│   └── IdyllLearningRates.js  # Bridge to compiled TS
├── data/
│   ├── flows.csv              # Sample Sankey data
│   └── learning_rates.csv     # Sample learning rates data
├── index.idyl              # Main Idyll document
└── package.json

```

### Build Process

1. TypeScript compiles `src/` to `dist/`
2. `components/IdyllSankey.js` bridges to the compiled output
3. Idyll builds the site to `_site/`
4. GitHub Actions deploys to Pages

## Testing

Tests run automatically in CI using Jest with jest-canvas-mock:

```bash
npm test
```

Tests cover:
- Color utility functions (hashing, mixing, conversion)
- Layout computation (node/link positions, data transformation)
- Line plot data processing and coordinate transformations

## Performance Notes

The implementation is optimized for performance:

- **Canvas batched drawing**: All rendering happens in a single pass
- **Precomputed colors**: Colors and gradients are calculated once, not per frame
- **Efficient hit testing**: Uses simple bounding box checks
- **requestAnimationFrame**: Smooth rendering loop
- **Label culling**: Only draws labels for nodes above minimum height threshold
- **Auto-optimization**: For large datasets, shadows and halos can be automatically disabled (configurable via `performanceThreshold` prop)
- **Smart filtering**: `minValue` prop filters out tiny flows before layout computation
- **Duplicate aggregation**: Reduces layout complexity by combining duplicate source-target pairs

## Live Demo

After merging to main, the site is automatically deployed to GitHub Pages.

## License

Apache-2.0
