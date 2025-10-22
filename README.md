# Idyll Sankey

High-performance Sankey diagram component for Idyll 5.x, built with TypeScript and Canvas rendering.

## Features

- **Canvas rendering** for high performance with `requestAnimationFrame` loop
- **d3-sankey** for layout computation only
- **Hover highlights** with efficient hit testing
- **Multiple color strategies**: source, target, or gradient
- **Smart label placement** with collision detection and whitespace optimization
- **Hover labels** for small flows that can't display labels directly
- **Detached labels** with leader lines to maximize label visibility
- **Label culling** by height threshold
- **TypeScript** implementation with full type safety
- **Negative value support** with dashed rendering
- **Minimum value filtering** to drop hairlines and zeros
- **Label normalization** for consistent display
- **Duplicate aggregation** for cleaner visualizations
- **Performance optimizations** for large datasets (>5k links)

## Usage

In your Idyll document (`.idyll` file):

```idl
[data name:"flows" source:"flows.csv" /]

[IdyllSankey
  rows:flows
  linkColorStrategy:"gradient"
  labelMinHeight:8
  width:960
  height:600
  enableSmartLabels:true
  enableHoverLabels:true
  enableDetachedLabels:true
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

#### Smart Label Props (NEW!)

- `enableSmartLabels` - Enable collision detection and intelligent label placement (default: `true`)
- `enableHoverLabels` - Show labels on hover for small flows that can't display labels directly (default: `true`)
- `enableDetachedLabels` - Allow labels to detach from nodes and float in whitespace with leader lines (default: `true`)
- `labelFontSize` - Font size for labels in pixels (default: `12`)
- `labelFontFamily` - Font family for labels (default: `"sans-serif"`)

### Data Format

Your CSV file should have three columns:

```csv
source,target,value
A,B,10
A,C,5
B,D,10
```

## Development

### Running Locally

To start a local development server:

```bash
npm install
npm run dev
```

This will compile TypeScript and start the Idyll development server at `http://localhost:3000`.

### Available Pages

- `index.idyll` - Main demo with both small and large datasets

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
│   │   └── SankeyCanvas.tsx  # Canvas renderer
│   └── idyll/
│       └── IdyllSankey.tsx   # Idyll wrapper component
├── __tests__/
│   ├── color.test.ts
│   └── layout.test.ts
├── components/
│   └── IdyllSankey.js     # Bridge to compiled TS
├── data/
│   └── flows.csv          # Sample data
├── index.idl              # Main Idyll document
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

## Performance Notes

The implementation is optimized for performance:

- **Canvas batched drawing**: All rendering happens in a single pass
- **Precomputed colors**: Colors and gradients are calculated once, not per frame
- **Efficient hit testing**: Uses simple bounding box checks for nodes and bezier curve sampling for links
- **Spatial indexing**: Labels use grid-based collision detection for O(1) lookups
- **Text measurement caching**: Avoids repeated canvas text measurements
- **requestAnimationFrame**: Smooth rendering loop with dirty-flag optimization
- **Label culling**: Only draws labels for nodes above minimum height threshold
- **Greedy label placement**: Prioritizes larger nodes for better whitespace utilization
- **Auto-optimization**: For large datasets, shadows and halos can be automatically disabled (configurable via `performanceThreshold` prop)
- **Smart filtering**: `minValue` prop filters out tiny flows before layout computation
- **Duplicate aggregation**: Reduces layout complexity by combining duplicate source-target pairs

### Performance Characteristics

- **10k+ links**: No noticeable lag with smart labels enabled
- **Label placement**: Completes in <1 second for 100+ nodes
- **Memory efficient**: Spatial grid and caches are cleared and recomputed only when data changes

## Live Demo

After merging to main, the site is automatically deployed to GitHub Pages.

## License

Apache-2.0
