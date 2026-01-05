export interface Company {
  name: string;
  accuracy: number;
  color: string;
  icon: string;
  highlighted?: boolean;
}

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  sublabel?: string; // e.g. "95.1% / 423ms"
  color: string;
  size?: number;
  highlighted?: boolean; // true = square icon (Exa), false = circle icon (Others)
  icon?: string; // Logo image (data URL or path)
}

export interface ScatterLegendItem {
  label: string;
  color: string;
  isSquare?: boolean;
}

export type ChartType = 'bar' | 'scatter';

export interface EvalData {
  id: string;
  title: string;
  yAxisLabel: string;
  xAxisLabel?: string;
  chartType: ChartType;
  // Bar chart data
  companies: Company[];
  // Scatter plot data
  scatterPoints?: ScatterPoint[];
  scatterXMin?: number;
  scatterXMax?: number;
  scatterYMin?: number;
  scatterYMax?: number;
  scatterLegend?: ScatterLegendItem[];
}
