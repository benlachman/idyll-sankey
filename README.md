# Idyll Sankey

High-performance Sankey diagram component for Idyll 5.x, built with TypeScript and Canvas rendering.

## Features

- **Canvas rendering** for high performance with `requestAnimationFrame` loop
- **d3-sankey** for layout computation only
- **Hover highlights** with efficient hit testing
- **Multiple color strategies**: source, target, or gradient
- **Label culling** by height threshold
- **TypeScript** implementation with full type safety

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
/]
```

Note: Place your CSV file in the `data/` directory and reference it by filename only in the `source` attribute.

### Props

- `rows` - Array of objects with `source`, `target`, and `value` properties (from `[data]` component)
- `linkColorStrategy` - How to color links: `"source"`, `"target"`, or `"gradient"` (default: `"gradient"`)
- `labelMinHeight` - Minimum node height (in pixels) to show labels (default: `8`)
- `width` - Canvas width in pixels (default: `960`)
- `height` - Canvas height in pixels (default: `600`)

### Data Format

Your CSV file should have three columns:

```csv
source,target,value
A,B,10
A,C,5
B,D,10
```

## Development

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
- **Efficient hit testing**: Uses simple bounding box checks
- **requestAnimationFrame**: Smooth rendering loop
- **Label culling**: Only draws labels for nodes above minimum height threshold

## Live Demo

After merging to main, the site is automatically deployed to GitHub Pages.

## License

Apache-2.0
