import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import domtoimage from 'dom-to-image-more';
import { EvalData } from '../types/eval.types';
import Legend from './Legend';
import styles from './EvalChart.module.css';

interface EvalChartProps {
  data: EvalData;
  onSelectionChange?: (isSelected: boolean) => void;
}

export interface EvalChartRef {
  exportToPng: () => Promise<void>;
  isSelected: boolean;
}

interface IconPosition {
  name: string;
  x: number;
  y: number;
  src: string;
  size?: number;
}

const iconMap: Record<string, string> = {
  'Exa': '/images/Logo1.png',
  'Brave': '/images/Logo2.png',
  'Parallel': '/images/Logo3.png',
};

const scatterIconMap: Record<string, string> = {
  'Exa': '/images/exablue.png',
  'Brave': '/images/Logo2.png',
  'Parallel': '/images/Logo3.png',
};

const EvalChart = forwardRef<EvalChartRef, EvalChartProps>(({ data, onSelectionChange }, ref) => {
  const gridSvgRef = useRef<SVGSVGElement>(null);
  const barsSvgRef = useRef<SVGSVGElement>(null);
  const chartContentRef = useRef<HTMLDivElement>(null);
  const [iconPositions, setIconPositions] = useState<IconPosition[]>([]);
  const [isSelected, setIsSelected] = useState(false);

  // Helper function to check if a color is blue
  const isBlueColor = (color: string) => {
    const blueColors = ['#3D3FEE', '#0000FF', '#0066FF', '#2563EB', '#3B82F6', '#1D4ED8', '#1E40AF'];
    const lowerColor = color.toLowerCase();
    // Check if it's in the known blue colors list or has high blue component
    return blueColors.map(c => c.toLowerCase()).includes(lowerColor) || 
           (lowerColor.startsWith('#') && lowerColor.length >= 7 &&
            parseInt(lowerColor.slice(5, 7), 16) > parseInt(lowerColor.slice(1, 3), 16) &&
            parseInt(lowerColor.slice(5, 7), 16) > parseInt(lowerColor.slice(3, 5), 16));
  };

  // Chart dimensions - matching Exa search bar width (~640px)
  const margin = { top: 15, right: 30, bottom: 50, left: 70 };
  const width = 640;
  const height = 300;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const iconSize = 26;

  const exportToPng = async () => {
    const chartElement = chartContentRef.current;
    if (!chartElement) return;
    
    try {
      // Wait for all fonts to be fully loaded
      await document.fonts.ready;
      
      // Additional delay to ensure fonts are rendered in SVG
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await domtoimage.toPng(chartElement, {
        bgcolor: '#FAF9F7',
        scale: 4,
        quality: 1,
        style: {
          fontFamily: "'ABC Arizona Flare', 'ABC Diatype', 'ABC Diatype Mono', serif, sans-serif, monospace"
        },
        filter: (_node: Node) => {
          // Include all nodes
          return true;
        }
      });
      
      const link = document.createElement('a');
      link.download = `${data.title.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
    }
  };

  // Handler to toggle selection
  const handleChartClick = () => {
    const newSelectedState = !isSelected;
    setIsSelected(newSelectedState);
    onSelectionChange?.(newSelectedState);
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    exportToPng,
    isSelected
  }));

  useEffect(() => {
    if (!gridSvgRef.current || !barsSvgRef.current) return;

    // Clear previous content
    d3.select(gridSvgRef.current).selectAll('*').remove();
    d3.select(barsSvgRef.current).selectAll('*').remove();

    // Setup grid SVG (background layer)
    const gridSvg = d3.select(gridSvgRef.current)
      .attr('width', width)
      .attr('height', height);

    const gridChart = gridSvg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Setup bars SVG (foreground layer)
    const barsSvg = d3.select(barsSvgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add noise filter for bars
    const defs = barsSvg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'barNoise')
      .attr('x', '0%')
      .attr('y', '0%')
      .attr('width', '100%')
      .attr('height', '100%');
    
    filter.append('feTurbulence')
      .attr('type', 'fractalNoise')
      .attr('baseFrequency', '0.6')
      .attr('numOctaves', '3')
      .attr('result', 'noise');
    
    filter.append('feComponentTransfer')
      .attr('in', 'noise')
      .attr('result', 'adjustedNoise')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', '0.20');
    
    filter.append('feBlend')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'adjustedNoise')
      .attr('mode', 'normal');

    const barsChart = barsSvg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    if (data.chartType === 'scatter') {
      // === SCATTER PLOT ===
      const scatterPoints = data.scatterPoints || [];
      if (scatterPoints.length === 0) return;

      // Auto-calculate Y range based on data points
      const yValues = scatterPoints.map(p => p.y);
      const dataYMin = Math.min(...yValues);
      const dataYMax = Math.max(...yValues);
      const yPadding = (dataYMax - dataYMin) * 0.15 || 10; // 15% padding, minimum 10
      const yMin = Math.max(0, Math.floor((dataYMin - yPadding) / 10) * 10); // Round down to nearest 10
      const yMax = Math.min(100, Math.ceil((dataYMax + yPadding) / 10) * 10); // Round up to nearest 10

      // Scales - use band scale for X like bar chart
      const xScale = d3.scaleBand()
        .domain(scatterPoints.map((p, i) => p.label || `Point ${i + 1}`))
        .range([0, innerWidth])
        .paddingInner(0.316)
        .paddingOuter(0.211);

      const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([innerHeight, 0]);

      // Dotted grid background - 1:1 ratio spacing, 50% more dense
      const dotSpacing = 12; // Reduced from 18 for 50% more density
      const dotRadius = 0.5; // 1px diameter
      
      // Create dots grid with 1:1 ratio
      for (let x = 0; x <= innerWidth; x += dotSpacing) {
        for (let y = 0; y <= innerHeight; y += dotSpacing) {
          gridChart.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', dotRadius)
            .attr('fill', '#D0D0D0');
        }
      }

      // Y-axis tick labels with percentages
      const yTicks = d3.range(yMin, yMax + 1, (yMax - yMin) / 5);
      gridChart.selectAll('.y-tick-label')
        .data(yTicks)
        .enter()
        .append('text')
        .attr('class', 'y-tick-label')
        .attr('x', -10)
        .attr('y', d => yScale(d))
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#757575')
        .attr('font-size', '12px')
        .attr('font-family', "'ABC Diatype Mono', 'SF Mono', 'Monaco', monospace")
        .text(d => `${Math.round(d)}%`);

      // Y-axis label (rotated)
      gridChart.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#757575')
        .attr('font-size', '14px')
        .attr('font-family', "'ABC Arizona Flare', serif")
        .text(data.yAxisLabel);

      // X-axis label (centered at bottom)
      if (data.xAxisLabel) {
        barsChart.append('text')
          .attr('class', 'x-axis-label')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight + 30)
          .attr('text-anchor', 'middle')
          .attr('fill', '#757575')
          .attr('font-size', '14px')
          .attr('font-family', "'ABC Arizona Flare', serif")
          .text(data.xAxisLabel);
      }

      // Data points with labels
      const scatterIconSize = 12; // Size for logos replacing bullets
      scatterPoints.forEach((point, index) => {
        const pointLabel = point.label || `Point ${index + 1}`;
        const px = xScale(pointLabel)! + xScale.bandwidth() / 2;
        const py = yScale(point.y);
        const bulletSize = 10;
        
        // Check if point has a logo (uploaded or auto-assigned)
        const hasLogo = point.icon?.startsWith('data:') || scatterIconMap[point.label || ''];
        
        // Create a group for each point
        const pointGroup = barsChart.append('g')
          .attr('class', 'scatter-point-group');

        // Only render bullet if no logo
        if (!hasLogo) {
          const shouldBeSquare = point.highlighted || isBlueColor(point.color);
          if (shouldBeSquare) {
            pointGroup.append('rect')
              .attr('x', px - bulletSize / 2)
              .attr('y', py - bulletSize / 2)
              .attr('width', bulletSize)
              .attr('height', bulletSize)
              .attr('rx', 1)
              .attr('fill', point.color);
          } else {
            pointGroup.append('circle')
              .attr('cx', px)
              .attr('cy', py)
              .attr('r', bulletSize / 2)
              .attr('fill', point.color);
          }
        }

        // Label: name positioned to the right of bullet/logo (like a bullet point)
        if (point.label) {
          // Total icon box size: 14px image + 2px padding each side + 0.5px border each side = ~19px
          const iconBoxSize = hasLogo ? 19 : bulletSize;
          const bulletGap = 8; // Space between bullet and text
          const labelX = px + iconBoxSize / 2 + bulletGap;
          const labelY = py;

          // Company name (ABC Arizona Flare, 14px - same as x-axis)
          // Center aligned with bullet using 'central' baseline
          pointGroup.append('text')
            .attr('x', labelX)
            .attr('y', labelY)
            .attr('fill', '#000')
            .attr('font-size', '14px')
            .attr('font-family', "'ABC Arizona Flare', serif")
            .attr('dominant-baseline', 'central')
            .attr('alignment-baseline', 'central')
            .text(point.label);

          // Accuracy sublabel below (ABC Diatype Mono)
          if (point.sublabel) {
            pointGroup.append('text')
              .attr('x', labelX)
              .attr('y', labelY + 18)
              .attr('fill', '#757575')
              .attr('font-size', '12px')
              .attr('font-family', "'ABC Diatype Mono', 'SF Mono', 'Monaco', monospace")
              .attr('dominant-baseline', 'central')
              .text(point.sublabel);
          }
        }
      });

      // Calculate icon positions for scatter plot (logos replace bullets)
      // Icon box size: 12px image + 3px padding each side + border = ~18px
      const iconBoxSize = 18;
      const scatterIconPositions = scatterPoints
        .map((point, index) => {
          const pointLabel = point.label || `Point ${index + 1}`;
          const px = xScale(pointLabel)! + xScale.bandwidth() / 2;
          const py = yScale(point.y);
          // Use uploaded icon, or auto-assign based on label name
          const iconSrc = point.icon?.startsWith('data:') 
            ? point.icon 
            : (scatterIconMap[point.label || ''] || null);
          if (!iconSrc) return null;
          return {
            name: point.label || `Point ${index + 1}`,
            x: margin.left + px - iconBoxSize / 2, // Center the icon box on data point
            y: margin.top + py - iconBoxSize / 2, // Center vertically on data point
            src: iconSrc,
            size: scatterIconSize
          };
        })
        .filter((pos): pos is IconPosition & { size: number } => pos !== null);
      setIconPositions(scatterIconPositions);

    } else {
      // === BAR CHART ===
      if (!data.companies.length) return;

      // Auto-calculate Y range based on data
      const accuracyValues = data.companies.map(c => c.accuracy);
      const dataYMax = Math.max(...accuracyValues);
      const yPadding = dataYMax * 0.15 || 10; // 15% padding, minimum 10
      const yMax = Math.min(100, Math.ceil((dataYMax + yPadding) / 10) * 10); // Round up to nearest 10

      // Scales
      const xScale = d3.scaleBand()
        .domain(data.companies.map(c => c.name))
        .range([0, innerWidth])
        .paddingInner(0.316)
        .paddingOuter(0.211);

      const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([innerHeight, 0]);

      // === GRID SVG (background) ===
      
      // Grid lines - generate based on yMax
      const gridLines = d3.range(0, yMax + 1, yMax / 5).map(v => Math.round(v));
      gridChart.selectAll('.grid-line')
        .data(gridLines)
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#D0D0D0')
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 0.5);

      // Y-axis label
      gridChart.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#757575')
        .attr('font-size', '14px')
        .attr('font-family', "'ABC Arizona Flare', serif")
        .text(data.yAxisLabel);

      // Y-axis tick labels
      gridChart.selectAll('.y-tick')
        .data(gridLines)
        .enter()
        .append('text')
        .attr('class', 'y-tick')
        .attr('x', -10)
        .attr('y', d => yScale(d))
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#757575')
        .attr('font-size', '12px')
        .attr('font-family', "'ABC Diatype Mono', 'SF Mono', 'Monaco', monospace")
        .text(d => `${d}%`);

      // === BARS SVG (foreground) ===

      // Bars
      barsChart.selectAll('.bar')
        .data(data.companies)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.name)!)
        .attr('y', d => yScale(d.accuracy))
        .attr('width', xScale.bandwidth())
        .attr('height', d => innerHeight - yScale(d.accuracy))
        .attr('fill', d => d.color)
        .attr('filter', 'url(#barNoise)');

      // Percentage labels above bars
      barsChart.selectAll('.percentage-label')
        .data(data.companies)
        .enter()
        .append('text')
        .attr('class', 'percentage-label')
        .attr('x', d => xScale(d.name)! + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.accuracy) - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('font-size', '12px')
        .attr('font-weight', 'normal')
        .attr('font-family', "'ABC Diatype Mono', 'SF Mono', 'Monaco', monospace")
        .text(d => `${d.accuracy}%`);

      // Calculate icon positions for HTML overlay
      const positions = data.companies.map(company => ({
        name: company.name,
        x: margin.left + xScale(company.name)! + xScale.bandwidth() / 2 - iconSize / 2,
        y: margin.top + yScale(company.accuracy) + 12,
        src: company.icon?.startsWith('data:') ? company.icon : (iconMap[company.name] || '/images/Logo1.png')
      }));
      setIconPositions(positions);

      // Company names below bars
      barsChart.selectAll('.company-name')
        .data(data.companies)
        .enter()
        .append('text')
        .attr('class', 'company-name')
        .attr('x', d => xScale(d.name)! + xScale.bandwidth() / 2)
        .attr('y', innerHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#000')
        .attr('font-size', '14px')
        .attr('font-family', "'ABC Arizona Flare', serif")
        .text(d => d.name);

      // X-axis label (optional)
      if (data.xAxisLabel) {
        barsChart.append('text')
          .attr('class', 'x-axis-label')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight + 42)
          .attr('text-anchor', 'middle')
          .attr('fill', '#757575')
          .attr('font-size', '14px')
          .attr('font-family', "'ABC Arizona Flare', serif")
          .text(data.xAxisLabel);
      }

      // Y-axis line (drawn on top of bars)
      barsChart.append('line')
        .attr('class', 'y-axis-line')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5);

      // X-axis line (drawn on top of bars)
      barsChart.append('line')
        .attr('class', 'x-axis-line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', innerHeight)
        .attr('y2', innerHeight)
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.5);
    }

  }, [data, innerWidth, innerHeight, margin.left, margin.top]);

  // Render scatter legend - dynamically generated from scatter points
  const renderScatterLegend = () => {
    if (data.chartType !== 'scatter' || !data.scatterPoints?.length) return null;
    
    // Show all points with their logos (like the data points)
    return (
      <div className={styles.scatterLegend}>
        {data.scatterPoints.map((point, index) => {
          const logoSrc = point.icon?.startsWith('data:') 
            ? point.icon 
            : (scatterIconMap[point.label || ''] || null);
          return (
            <div key={index} className={styles.scatterLegendItem}>
              {logoSrc ? (
                <img src={logoSrc} alt={point.label || ''} className={styles.legendIcon} />
              ) : (
                <span className={styles.legendCircle} style={{ backgroundColor: point.color }} />
              )}
              <span className={styles.legendLabel}>{point.label || `Point ${index + 1}`}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.chartContainer}>
      {/* Flying line borders */}
      <div className={styles.borderTop}></div>
      <div className={styles.borderRight}></div>
      <div className={styles.borderBottom}></div>
      <div className={styles.borderLeft}></div>
      
      <div 
        className={`${styles.chartContent} ${isSelected ? styles.chartContentSelected : ''}`}
        ref={chartContentRef}
        onClick={handleChartClick}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.headerArea}>
          <h1 className={styles.title}>{data.title}</h1>
          {/* Legends - top aligned with title */}
          {data.chartType === 'bar' && <Legend companies={data.companies} />}
          {renderScatterLegend()}
        </div>
        <div className={styles.chartArea}>
          {/* Grid layer (bottom) */}
          <div className={styles.gridWrapper}>
            <svg ref={gridSvgRef}></svg>
          </div>
          {/* Bars layer (top) */}
          <div className={styles.barsWrapper}>
            <svg ref={barsSvgRef}></svg>
            {iconPositions.map((icon) => (
              <img
                key={icon.name}
                src={icon.src}
                alt={`${icon.name} logo`}
                className={data.chartType === 'scatter' ? styles.scatterIcon : styles.barIcon}
                style={{
                  left: icon.x,
                  top: icon.y,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

EvalChart.displayName = 'EvalChart';

export default EvalChart;
