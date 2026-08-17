export type Palette = {
  key: string
  label: string
  purpose: string
  colors: string[]
}

export const PALETTES: Palette[] = [
  {
    key: 'okabe',
    label: 'Colourblind-safe',
    purpose: 'Okabe-Ito — safe for all common colour-vision deficiencies and prints distinctly in greyscale',
    colors: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000'],
  },
  {
    key: 'categorical',
    label: 'Categorical',
    purpose: 'High-contrast hues for comparing unordered categories',
    colors: ['#4C72B0', '#DD8452', '#55A868', '#C44E52', '#8172B2', '#937860', '#DA8BC3', '#8C8C8C'],
  },
  {
    key: 'sequential',
    label: 'Sequential',
    purpose: 'Single-hue blue ramp for ordered numeric or temporal data',
    colors: ['#08306B', '#08519C', '#2171B5', '#4292C6', '#6BAED6', '#9ECAE1', '#C6DBEF', '#DEEBF7'],
  },
  {
    key: 'diverging',
    label: 'Diverging',
    purpose: 'Red–blue ramp for data with a meaningful midpoint (e.g. above/below average)',
    colors: ['#67001F', '#B2182B', '#D6604D', '#F4A582', '#92C5DE', '#4393C3', '#2166AC', '#053061'],
  },
  {
    key: 'greyscale',
    label: 'Greyscale',
    purpose: 'For print or single-colour reproduction',
    colors: ['#000000', '#3D3D3D', '#595959', '#737373', '#8C8C8C', '#A6A6A6', '#BFBFBF', '#D9D9D9'],
  },
]

export const DEFAULT_PALETTE = 'okabe'

export function getPalette(key: string): Palette {
  return PALETTES.find((p) => p.key === key) ?? PALETTES[0]!
}

// Heatmap colorscale for Plotly: array of [fraction, color] pairs
export function toColorscale(palette: Palette): [number, string][] {
  return palette.colors.map((c, i) => [i / Math.max(1, palette.colors.length - 1), c])
}
