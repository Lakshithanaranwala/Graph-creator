# Project: SheetChart

A browser-only web app that turns a spreadsheet into a publication-quality chart.

## User flow
1. User drags in an .xlsx / .xls / .csv file
2. App parses it, picks a sheet, and profiles every column
3. User picks a chart type (only valid types are offered)
4. User maps columns to encodings (X, Y, series/colour, aggregation)
5. Chart renders live
6. User downloads PNG (high DPI), SVG, or PDF

## Hard constraints
- NO BACKEND. Everything runs client-side. The file never leaves the user's machine.
  This is a deliberate product decision (privacy + zero hosting cost), not a limitation.
  Do not add a server, an API route, or a cloud upload at any point unless I explicitly ask.
- NO PAID SERVICES. No API keys, no accounts, no metered anything.
- Deployable as a static bundle to Cloudflare Pages / GitHub Pages.
- Must handle a 50,000-row sheet without freezing the UI.

## Stack
- Vite + React + TypeScript (strict mode on)
- Tailwind CSS
- Zustand for state
- SheetJS for parsing. IMPORTANT: the `xlsx` package on the npm registry is stale.
  Install from the official CDN tarball instead:
  npm i https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz
- Plotly.js (react-plotly.js) for rendering AND for image export
- idb (IndexedDB wrapper) for storing parsed datasets locally
- Vitest for unit tests

## The chart spec is the core abstraction
Everything flows through one serialisable object. The renderer, the exporter, the
saved-chart feature and the shareable URL all consume this same object.

type ChartSpec = {
  id: string
  datasetId: string
  sheetName: string
  chartType: 'bar' | 'line' | 'scatter' | 'pie' | 'area' | 'histogram' | 'box' | 'heatmap'
  encodings: {
    x: string | null
    y: string[]
    color?: string | null
    size?: string | null
    agg?: 'none' | 'sum' | 'mean' | 'count' | 'min' | 'max' | 'median'
  }
  filters: Array<{ column: string; op: string; value: unknown }>
  style: {
    title?: string
    xLabel?: string
    yLabel?: string
    palette: string
    showLegend: boolean
    showGrid: boolean
  }
}

Never let chart config live in scattered component state. One spec, one store.

## Code rules
- Small files. If a component passes ~150 lines, split it.
- Every module that transforms data (parsing, profiling, aggregation) gets unit tests.
- No `any`. Use discriminated unions for chart types.
- Heavy work (parsing, aggregation over 10k+ rows) runs in a Web Worker.
- Comments explain *why*, never *what*.

## Working style
- At the start of a phase, tell me your plan in 5 bullets and wait for my "go".
- Build only what the current phase asks for. Do not scaffold future phases.
- When a phase is done, run `npm run build`, list what I should manually verify, and stop.
