# Evals Plotter

A modern React webapp for visualizing evaluation results with beautiful bar charts.

## Features

- **Interactive Controls**: Real-time chart editing with a side panel
- **Dynamic Data**: Change titles, accuracy values, colors, and more
- **Add/Remove Companies**: Easily manage the number of bars
- **Live Preview**: See changes instantly as you edit
- Clean, minimalist design matching Figma specifications
- ABC Arizona Flare font integration
- Responsive bar charts with company icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Add your ABC Arizona Flare font files to `public/fonts/`:
   - `ABCArizonaFlare-Regular.woff2`
   - `ABCArizonaFlare-Regular.woff`

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

## Project Structure

```
src/
├── components/       # React components
│   ├── EvalChart.tsx    # Main chart component
│   ├── BarColumn.tsx    # Individual bar with icon
│   ├── Legend.tsx        # Top-right legend
│   └── YAxis.tsx        # Y-axis with labels
├── data/
│   └── evals.json       # Evaluation data
├── types/
│   └── eval.types.ts     # TypeScript interfaces
└── assets/
    └── icons/           # Company SVG icons
```

## Using the Interactive Controls

Click the **"Show Controls"** button on the right side to:

1. **Edit Chart Title**: Change the main title
2. **Edit Y-Axis Label**: Customize the axis label
3. **Modify Companies**:
   - Adjust accuracy values with sliders or number inputs
   - Change bar colors with color picker
   - Rename companies
   - Toggle highlighted status
4. **Add/Remove Companies**: Use the + button or X buttons
5. **Reset**: Return to default values anytime

All changes are reflected in real-time on the chart!

## Customizing Data Programmatically

You can also edit `src/data/evals.json` to change default values:

```json
{
  "title": "Your Eval Title",
  "yAxisLabel": "Accuracy (%)",
  "companies": [
    {
      "name": "Company Name",
      "accuracy": 75,
      "color": "#3D3FEE",
      "icon": "company-icon.svg",
      "highlighted": true
    }
  ]
}
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Tech Stack

- React 18
- TypeScript
- Vite
- CSS Modules

