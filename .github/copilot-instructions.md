# GitHub Copilot Instructions for idyll-sankey

This repository contains a high-performance Sankey diagram component for Idyll 5.x, built with TypeScript and Canvas rendering.

## Technology Stack

- **Language**: TypeScript 5.x
- **Framework**: Idyll 5.x (static site generator)
- **UI Library**: React 16.14.0
- **Visualization**: d3-sankey for layout computation
- **Rendering**: Canvas API with requestAnimationFrame
- **Testing**: Jest with ts-jest and jest-canvas-mock
- **Build Tool**: TypeScript compiler (tsc)

## Project Structure

```
.
├── src/
│   ├── lib/
│   │   ├── types.ts       # Core type definitions
│   │   ├── color.ts       # Color utilities (hashing, mixing, conversion)
│   │   └── layout.ts      # d3-sankey layout wrapper
│   ├── components/
│   │   └── SankeyCanvas.tsx  # Canvas renderer with hit testing
│   └── idyll/
│       └── IdyllSankey.tsx   # Idyll wrapper component
├── __tests__/
│   ├── color.test.ts
│   ├── layout.test.ts
│   ├── hit-tracking.test.ts
│   ├── rendering.test.ts
│   └── performance.test.ts
├── components/
│   └── IdyllSankey.js     # Bridge to compiled TypeScript
├── data/
│   ├── flows.csv          # Small sample dataset
│   └── flows_from_connections.csv  # Large sample dataset
├── index.idyll            # Main Idyll document
└── package.json
```

## Build & Development

- **Development server**: `npm run dev` - Compiles TypeScript and starts Idyll dev server
- **Production build**: `npm run build` - Compiles TypeScript and builds to `_site/`
- **Run tests**: `npm test` - Runs Jest test suite
- **Pre-build**: TypeScript compilation is automatically run before builds

## Code Guidelines

### TypeScript

- **Strict mode enabled**: All code must satisfy TypeScript strict checking
- **Type definitions**: Use explicit types; avoid `any` unless absolutely necessary
- **Interfaces**: Defined in `src/lib/types.ts` for shared types
- **Module system**: CommonJS (`module: "commonjs"` in tsconfig)
- **Target**: ES2015 with DOM lib support

### Component Structure

- **Canvas rendering**: Main rendering logic in `SankeyCanvas.tsx` using Canvas API
- **Performance focus**: Use `requestAnimationFrame`, batch operations, minimize redraws
- **Props validation**: All React components should have proper TypeScript prop types
- **Idyll integration**: Wrapper components in `src/idyll/` bridge to Idyll's component system

### Testing

- **Test framework**: Jest with ts-jest
- **Mock canvas**: Uses jest-canvas-mock for Canvas API testing
- **Coverage areas**: Color utilities, layout computation, hit tracking, rendering, performance
- **Test location**: All tests in `__tests__/` directory
- **Naming convention**: `*.test.ts` files
- **Run mode**: `--runInBand` for consistent execution

### Performance Considerations

- **Canvas optimization**: Batch drawing operations, precompute colors/gradients
- **Large datasets**: Auto-disable shadows/effects when links exceed threshold (default: 5000)
- **Label culling**: Only render labels for nodes above minimum height
- **Efficient hit testing**: Use simple bounding box checks
- **Data preprocessing**: Filter minimum values and aggregate duplicates before layout

### Code Style

- **Indentation**: Follow existing code style (2 spaces)
- **Imports**: Group by external, internal, types
- **Comments**: Prefer self-documenting code; use comments for complex algorithms
- **Function length**: Keep functions focused and reasonably sized
- **Error handling**: Gracefully handle edge cases (empty data, invalid values, etc.)

## Data Format

CSV files in `data/` directory with three columns:
- `source`: Source node label (string)
- `target`: Target node label (string)
- `value`: Flow value (number, can be negative if `allowNegative` is true)

## CI/CD Pipeline

- **ci.yml**: Runs tests on all pull requests
- **pages.yml**: Builds and deploys to GitHub Pages on merge to main
- **Node version**: 20.x LTS
- **Package manager**: npm with `npm ci` for reproducible installs

## Common Tasks

### Adding a new prop to IdyllSankey

1. Add prop type to `IdyllSankey.tsx` component props interface
2. Pass prop through to `SankeyCanvas` component
3. Update `SankeyCanvas.tsx` to handle the new prop
4. Add tests if the prop affects layout or rendering
5. Document in README.md under Props section

### Adding a new color strategy

1. Add strategy type to `src/lib/types.ts`
2. Implement logic in `src/lib/color.ts`
3. Update `SankeyCanvas.tsx` to use new strategy
4. Add tests in `__tests__/color.test.ts`
5. Document in README.md

### Modifying layout algorithm

1. Update `src/lib/layout.ts` wrapper functions
2. Add/update tests in `__tests__/layout.test.ts`
3. Consider performance implications for large datasets
4. Test with various data sizes and configurations

## Important Notes

- **No local terminal work needed**: Project designed for PR-based workflow via GitHub Actions
- **Canvas rendering**: Direct DOM manipulation should be avoided; use Canvas API
- **React version**: Locked to 16.14.0 for Idyll 5.x compatibility
- **Performance threshold**: Configurable via `performanceThreshold` prop (default: 5000 links)
- **Negative values**: Supported via `allowNegative` prop, rendered with dashed strokes
- **Duplicate aggregation**: Enabled by default to reduce layout complexity

## Dependencies

### Core Dependencies
- `idyll` and `idyll-components`: Static site generation framework
- `react` and `react-dom`: UI library (pinned to 16.14.0)
- `d3-sankey`: Layout computation only (not for rendering)

### Dev Dependencies
- `typescript`: Type checking and compilation
- `jest`, `ts-jest`: Testing framework
- `jest-canvas-mock`: Canvas API mocking for tests
- Type definitions for all major libraries

## When Making Changes

1. **Always run tests**: `npm test` before committing
2. **Type check**: Ensure `tsc` compiles without errors
3. **Test locally**: Use `npm run dev` to verify visual changes
4. **Update docs**: Keep README.md in sync with code changes
5. **Performance**: Consider impact on large datasets (>5k links)
6. **Backward compatibility**: Maintain existing prop interfaces unless major version bump

## Troubleshooting

- **Canvas mock errors**: Ensure jest-canvas-mock is properly configured in jest.config.cjs
- **Type errors**: Check tsconfig.json settings and installed type definitions
- **Build failures**: Clear `dist/` directory and rebuild with `tsc`
- **Test failures**: Run with `--verbose` flag for detailed output
- **Memory issues**: Consider disabling shadows/effects for large datasets
