import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import EvalChart, { EvalChartRef } from './components/EvalChart';
import ControlPanel from './components/ControlPanel';
import { EvalData, ChartType } from './types/eval.types';
import evalDataJson from './data/evals.json';
import './App.css';

// Graphs no longer need position - motion handles carousel positioning
type GraphData = EvalData;

const createGraphId = () => `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultBarChartData: Omit<EvalData, 'id'> = {
  title: 'Bar Chart',
  yAxisLabel: 'Accuracy (%)',
  xAxisLabel: '',
  chartType: 'bar',
  companies: [
    { name: 'Exa', accuracy: 63, color: '#3D3FEE', icon: '', highlighted: true },
    { name: 'Brave', accuracy: 30, color: '#DFDFDF', icon: '' },
    { name: 'Parallel', accuracy: 27, color: '#DFDFDF', icon: '' },
  ],
};

const defaultScatterPlotData: Omit<EvalData, 'id'> = {
  title: 'Scatter Plot',
  yAxisLabel: 'Accuracy (%)',
  xAxisLabel: '',
  chartType: 'scatter',
  companies: [],
  scatterPoints: [
    { x: 0, y: 63, color: '#3D3FEE', label: 'Exa', sublabel: '63%', highlighted: true },
    { x: 0, y: 30, color: '#DFDFDF', label: 'Brave', sublabel: '30%', highlighted: false },
    { x: 0, y: 27, color: '#DFDFDF', label: 'Parallel', sublabel: '27%', highlighted: false },
  ],
  scatterLegend: [
    { label: 'Exa', color: '#3D3FEE', isSquare: true },
    { label: 'Others', color: '#DFDFDF', isSquare: false },
  ],
};

function App() {
  const [graphs, setGraphs] = useState<GraphData[]>([
    { 
      ...evalDataJson as EvalData, 
      id: createGraphId()
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
  const chartRefs = useRef<(EvalChartRef | null)[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  const activeGraph = graphs[activeGraphIndex];

  // Calculate drag constraints based on content width
  useEffect(() => {
    const calculateConstraints = () => {
      const chartWidth = 700; // chart width + gap
      const gap = 100;
      const totalWidth = graphs.length * (chartWidth + gap) - gap;
      const viewportWidth = window.innerWidth - 320; // Subtract control panel width
      const leftConstraint = Math.min(0, -(totalWidth - viewportWidth + 100));
      setDragConstraints({ left: leftConstraint, right: 100 });
    };
    
    calculateConstraints();
    window.addEventListener('resize', calculateConstraints);
    return () => window.removeEventListener('resize', calculateConstraints);
  }, [graphs.length]);

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

  const addGraph = (chartType: ChartType) => {
    const defaultData = chartType === 'scatter' ? defaultScatterPlotData : defaultBarChartData;
    
    const newGraph: GraphData = { 
      ...defaultData, 
      id: createGraphId(),
      title: `${chartType === 'scatter' ? 'Scatter Plot' : 'Bar Chart'} ${graphs.length + 1}`
    };
    setGraphs(prev => [...prev, newGraph]);
    setActiveGraphIndex(graphs.length);
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

  return (
    <div className="app-layout">
      <ControlPanel 
        data={activeGraph} 
        onDataChange={updateActiveGraph}
        graphs={graphs}
        activeGraphIndex={activeGraphIndex}
        onSelectGraph={setActiveGraphIndex}
        onAddGraph={addGraph}
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
        
        <motion.div 
          ref={carouselRef}
          className="charts-carousel"
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
          style={{ cursor: 'grab' }}
          whileDrag={{ cursor: 'grabbing' }}
        >
          {graphs.map((graph, index) => (
            <div 
              key={graph.id} 
              className={`chart-wrapper ${index === activeGraphIndex ? 'active' : ''}`}
            >
              <EvalChart 
                ref={(el) => (chartRefs.current[index] = el)}
                data={graph}
                onSelectionChange={(isSelected) => handleSelectionChange(index, isSelected)}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default App;
