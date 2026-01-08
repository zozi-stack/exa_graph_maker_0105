import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import EvalChart, { EvalChartRef } from './components/EvalChart';
import ControlPanel from './components/ControlPanel';
import { EvalData } from './types/eval.types';
import evalDataJson from './data/evals.json';
import './App.css';

// Graphs no longer need position - motion handles carousel positioning
type GraphData = EvalData;

const createGraphId = () => `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultScatterPlotData: Omit<EvalData, 'id'> = {
  title: 'Scatter Plot',
  yAxisLabel: 'Accuracy (%)',
  xAxisLabel: 'Latency (ms)',
  chartType: 'scatter',
  companies: [],
  scatterPoints: [
    { x: 450, y: 63, color: '#3D3FEE', label: 'Exa', sublabel: '63% / 450ms', highlighted: true },
    { x: 3000, y: 30, color: '#DFDFDF', label: 'Brave', sublabel: '30% / 3000ms', highlighted: false },
    { x: 3000, y: 27, color: '#DFDFDF', label: 'Parallel', sublabel: '27% / 3000ms', highlighted: false },
  ],
  scatterLegend: [
    { label: 'Exa', color: '#3D3FEE', isSquare: true },
    { label: 'Others', color: '#DFDFDF', isSquare: false },
  ],
  borderImage: '/images/01.png',
  scatterYStartFromZero: false,
};

function App() {
  const [graphs, setGraphs] = useState<GraphData[]>([
    { 
      ...evalDataJson as EvalData, 
      id: createGraphId(),
      title: 'Bar Chart'
    },
    {
      ...defaultScatterPlotData,
      id: createGraphId(),
      title: 'Scatter Plot'
    }
  ]);
  const [activeGraphIndex, setActiveGraphIndex] = useState(0);
  const [selectedChartIndex, setSelectedChartIndex] = useState<number | null>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  const [carouselX, setCarouselX] = useState(0);
  const chartRefs = useRef<(EvalChartRef | null)[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const activeGraph = graphs[activeGraphIndex];

  // Navigation functions
  const goToPrevious = () => {
    if (activeGraphIndex > 0) {
      setActiveGraphIndex(activeGraphIndex - 1);
    }
  };

  const goToNext = () => {
    if (activeGraphIndex < graphs.length - 1) {
      setActiveGraphIndex(activeGraphIndex + 1);
    }
  };

  // Shared chart dimensions
  const CHART_WIDTH = 750; // Chart width including border
  const GAP = 100;
  const CONTROL_PANEL_WIDTH = 280;

  // Calculate drag constraints
  useEffect(() => {
    const calculateConstraints = () => {
      const viewportWidth = window.innerWidth - CONTROL_PANEL_WIDTH;
      const centerOffset = (viewportWidth - CHART_WIDTH) / 2;
      const leftConstraint = Math.min(centerOffset, -((graphs.length - 1) * (CHART_WIDTH + GAP)) + centerOffset);
      const rightConstraint = centerOffset;
      setDragConstraints({ left: leftConstraint, right: rightConstraint });
    };
    
    calculateConstraints();
    window.addEventListener('resize', calculateConstraints);
    return () => window.removeEventListener('resize', calculateConstraints);
  }, [graphs.length]);

  // Scroll to active chart when it changes or graphs are added/removed - center it in viewport
  useEffect(() => {
    const centerChart = () => {
      const viewportWidth = window.innerWidth - CONTROL_PANEL_WIDTH;
      const chartPosition = activeGraphIndex * (CHART_WIDTH + GAP);
      const centerOffset = (viewportWidth - CHART_WIDTH) / 2;
      const targetX = -chartPosition + centerOffset;
      
      setCarouselX(targetX);
    };
    
    centerChart();
    window.addEventListener('resize', centerChart);
    return () => window.removeEventListener('resize', centerChart);
  }, [activeGraphIndex, graphs.length]);

  const updateActiveGraph = (data: EvalData) => {
    setGraphs(prev => {
      const newGraphs = [...prev];
      newGraphs[activeGraphIndex] = { 
        ...data, 
        id: newGraphs[activeGraphIndex].id
      };
      return newGraphs;
    });
  };

  const removeGraph = (index: number) => {
    if (graphs.length === 1) return;
    setGraphs(prev => prev.filter((_, i) => i !== index));
    if (activeGraphIndex >= graphs.length - 1) {
      setActiveGraphIndex(graphs.length - 2);
    } else if (activeGraphIndex > index) {
      setActiveGraphIndex(activeGraphIndex - 1);
    }
  };

  const handleExport = () => {
    if (selectedChartIndex !== null && chartRefs.current[selectedChartIndex]) {
      chartRefs.current[selectedChartIndex]?.exportToPng();
    }
  };

  const handleSelectionChange = (index: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedChartIndex(index);
      // Deselect other charts
      chartRefs.current.forEach((ref, i) => {
        if (i !== index && ref?.isSelected) {
          // The chart will handle its own deselection through click
        }
      });
    } else {
      setSelectedChartIndex(null);
    }
  };

  // Snap to nearest chart center after dragging
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    const viewportWidth = window.innerWidth - CONTROL_PANEL_WIDTH;
    const centerOffset = (viewportWidth - CHART_WIDTH) / 2;
    
    // Calculate current position after drag
    const currentX = carouselX + info.offset.x;
    
    // Find which chart index this corresponds to
    const rawIndex = -(currentX - centerOffset) / (CHART_WIDTH + GAP);
    
    // Factor in velocity for a more natural feel
    const velocityAdjustment = info.velocity.x > 500 ? -1 : info.velocity.x < -500 ? 1 : 0;
    
    // Clamp to valid index range
    const targetIndex = Math.max(0, Math.min(graphs.length - 1, Math.round(rawIndex) + velocityAdjustment));
    
    setActiveGraphIndex(targetIndex);
  };

  return (
    <div className="app-layout">
      <ControlPanel 
        data={activeGraph} 
        onDataChange={updateActiveGraph}
        graphs={graphs}
        activeGraphIndex={activeGraphIndex}
        onSelectGraph={setActiveGraphIndex}
        onRemoveGraph={removeGraph}
      />
      <div className="chart-section">
        {/* Export button - top right of canvas */}
        <button 
          className={`export-button ${selectedChartIndex === null ? 'disabled' : ''}`}
          onClick={handleExport}
          disabled={selectedChartIndex === null}
          title={selectedChartIndex !== null ? "Export selected chart" : "Select a chart first"}
        >
          <svg className="export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
        
        <div className="carousel-container">
          <div className="carousel-content">
            <motion.div 
              ref={carouselRef}
              className="charts-carousel"
              drag="x"
              dragConstraints={dragConstraints}
              dragElastic={0.1}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
              animate={{ x: carouselX }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ cursor: 'grab' }}
              whileDrag={{ cursor: 'grabbing' }}
              onDragEnd={handleDragEnd}
            >
              {graphs.map((graph, index) => (
                <div 
                  key={graph.id} 
                  className={`chart-wrapper ${index === activeGraphIndex ? 'active' : ''}`}
                  onClick={() => setActiveGraphIndex(index)}
                >
                  <EvalChart 
                    ref={(el) => (chartRefs.current[index] = el)}
                    data={graph}
                    onSelectionChange={(isSelected) => handleSelectionChange(index, isSelected)}
                  />
                </div>
              ))}
            </motion.div>
            
            {/* Navigation arrows */}
            <div className="carousel-navigation">
              <button 
                className="nav-arrow nav-arrow-left"
                onClick={goToPrevious}
                disabled={activeGraphIndex === 0}
                aria-label="Previous chart"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <div className="carousel-indicators">
                {graphs.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator-dot ${index === activeGraphIndex ? 'active' : ''}`}
                    onClick={() => setActiveGraphIndex(index)}
                    aria-label={`Go to chart ${index + 1}`}
                  />
                ))}
              </div>
              
              <button 
                className="nav-arrow nav-arrow-right"
                onClick={goToNext}
                disabled={activeGraphIndex === graphs.length - 1}
                aria-label="Next chart"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
