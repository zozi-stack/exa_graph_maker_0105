import { useState } from 'react';
import { EvalData, Company, ScatterPoint } from '../types/eval.types';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  data: EvalData;
  onDataChange: (data: EvalData) => void;
  graphs: EvalData[];
  activeGraphIndex: number;
  onSelectGraph: (index: number) => void;
  onRemoveGraph: (index: number) => void;
}

const ControlPanel = ({ 
  data, 
  onDataChange, 
  graphs, 
  activeGraphIndex, 
  onSelectGraph, 
  onRemoveGraph 
}: ControlPanelProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      onSelectGraph(index);
    }
  };

  const updateTitle = (title: string) => {
    onDataChange({ ...data, title });
  };

  const updateYAxisLabel = (yAxisLabel: string) => {
    onDataChange({ ...data, yAxisLabel });
  };

  const updateXAxisLabel = (xAxisLabel: string) => {
    onDataChange({ ...data, xAxisLabel });
  };

  const updateCompany = (index: number, field: keyof Company, value: string | number | boolean) => {
    const updatedCompanies = [...data.companies];
    updatedCompanies[index] = {
      ...updatedCompanies[index],
      [field]: value,
    };
    onDataChange({ ...data, companies: updatedCompanies });
  };

  const addCompany = () => {
    const newCompany: Company = {
      name: `Company ${data.companies.length + 1}`,
      accuracy: 50,
      color: '#DFDFDF',
      icon: '',
      highlighted: false,
    };
    onDataChange({ ...data, companies: [...data.companies, newCompany] });
  };

  const removeCompany = (index: number) => {
    const updatedCompanies = data.companies.filter((_, i) => i !== index);
    onDataChange({ ...data, companies: updatedCompanies });
  };

  // Scatter point functions
  const updateScatterPoint = (index: number, field: keyof ScatterPoint, value: string | number | boolean) => {
    const updatedPoints = [...(data.scatterPoints || [])];
    updatedPoints[index] = {
      ...updatedPoints[index],
      [field]: value,
    };
    onDataChange({ ...data, scatterPoints: updatedPoints });
  };

  const addScatterPoint = () => {
    const newPoint: ScatterPoint = {
      x: 50,
      y: 50,
      color: '#DFDFDF',
      label: `Point ${(data.scatterPoints?.length || 0) + 1}`,
      sublabel: '',
      highlighted: false,
    };
    onDataChange({ ...data, scatterPoints: [...(data.scatterPoints || []), newPoint] });
  };

  const removeScatterPoint = (index: number) => {
    const updatedPoints = (data.scatterPoints || []).filter((_, i) => i !== index);
    onDataChange({ ...data, scatterPoints: updatedPoints });
  };


  const resetData = () => {
    const defaultData: EvalData = {
      id: `graph-${Date.now()}`,
      title: 'People Search Eval',
      yAxisLabel: 'Accuracy (%)',
      chartType: 'bar',
      companies: [
        {
          name: 'Exa',
          accuracy: 63,
          color: '#3D3FEE',
          icon: 'exa-icon.svg',
          highlighted: true,
        },
        {
          name: 'Brave',
          accuracy: 30,
          color: '#E5E5E5',
          icon: 'brave-icon.svg',
        },
        {
          name: 'Parallel',
          accuracy: 27,
          color: '#E5E5E5',
          icon: 'parallel-icon.svg',
        },
      ],
    };
    onDataChange(defaultData);
  };

  return (
    <div className={styles.controlPanel}>
      <div className={styles.content}>
          <h1 className={styles.panelTitle}>Exa Evals Studio</h1>

          {/* Graph Accordions */}
          <div className={styles.graphList}>
            {graphs.map((graph, index) => (
              <div key={index} className={styles.graphAccordion}>
                <div 
                  className={`${styles.graphHeader} ${index === expandedIndex ? styles.activeHeader : ''} ${index === activeGraphIndex ? styles.selectedGraph : ''}`}
                  onClick={() => toggleExpand(index)}
                >
                  <div className={styles.graphHeaderLeft}>
                    <span className={`${styles.graphIcon} ${index === expandedIndex ? styles.graphIconExpanded : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4.5L6 6.5L8 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span className={styles.graphTitle}>{graph.title || `Graph ${index + 1}`}</span>
                  </div>
                  <div className={styles.graphHeaderRight}>
                    {graphs.length > 1 && (
                      <button 
                        className={styles.graphRemove}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveGraph(index);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                {index === expandedIndex && (
                  <div className={styles.graphContent}>
                    <div className={styles.section}>
                      <label className={styles.label}>
                        Chart Title
                        <input
                          type="text"
                          value={data.title}
                          onChange={(e) => updateTitle(e.target.value)}
                          className={styles.input}
                        />
                      </label>

                      <label className={styles.label}>
                        Y-Axis Label
                        <input
                          type="text"
                          value={data.yAxisLabel}
                          onChange={(e) => updateYAxisLabel(e.target.value)}
                          className={styles.input}
                        />
                      </label>

                      <label className={styles.label}>
                        X-Axis Label (optional)
                        <input
                          type="text"
                          value={data.xAxisLabel || ''}
                          onChange={(e) => updateXAxisLabel(e.target.value)}
                          className={styles.input}
                          placeholder={data.chartType === 'scatter' ? 'e.g. Time (s)' : 'e.g. Companies'}
                        />
                      </label>

                      <div className={styles.label}>
                        <span>Choose Design</span>
                        <div className={styles.borderImageGrid}>
                          <div 
                            className={`${styles.borderImageNone} ${!data.borderImage ? styles.selected : ''}`}
                            onClick={() => onDataChange({ ...data, borderImage: undefined })}
                          >
                            None
                          </div>
                          {['/images/01.png', '/images/02.png', '/images/03.png', '/images/04.png', '/images/05.png', '/images/06.png', '/images/07.png', '/images/08.png', '/images/09 1.png'].map((img) => (
                            <img
                              key={img}
                              src={img}
                              alt={`Border ${img}`}
                              role="button"
                              tabIndex={0}
                              className={`${styles.borderImageOption} ${data.borderImage === img ? styles.selected : ''}`}
                              onClick={() => {
                                console.log('Selecting border image:', img);
                                onDataChange({ ...data, borderImage: img });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  onDataChange({ ...data, borderImage: img });
                                }
                              }}
                            />
                          ))}
                        </div>
                        <div className={styles.logoUploadContainer} style={{ marginTop: '8px' }}>
                          <label className={styles.uploadButton}>
                            Custom Upload
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    onDataChange({ ...data, borderImage: event.target?.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className={styles.fileInput}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {data.chartType === 'bar' ? (
                      /* Bar Chart Controls */
                      <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                          <h3>Companies</h3>
                        </div>

                        {data.companies.map((company, companyIndex) => (
                          <div key={companyIndex} className={styles.companyCard}>
                            <div className={styles.companyHeader}>
                              <span className={styles.companyNumber}>#{companyIndex + 1} {companyIndex === 0 ? 'Exa' : 'Company'}</span>
                              <button
                                className={styles.removeButton}
                                onClick={() => removeCompany(companyIndex)}
                                disabled={companyIndex === 0 || data.companies.length === 1}
                              >
                                ✕
                              </button>
                            </div>

                            {companyIndex === 0 ? (
                              <input
                                type="text"
                                value="Exa"
                                disabled
                                className={`${styles.input} ${styles.inputDisabled}`}
                              />
                            ) : (
                              <input
                                type="text"
                                value={company.name}
                                onChange={(e) => updateCompany(companyIndex, 'name', e.target.value)}
                                className={styles.input}
                              />
                            )}

                            <label className={styles.label}>
                              Accuracy (%)
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={company.accuracy}
                                onChange={(e) => updateCompany(companyIndex, 'accuracy', parseInt(e.target.value) || 0)}
                                className={styles.input}
                              />
                            </label>


                            <div className={styles.label}>
                              <span>Logo</span>
                              <div className={styles.logoUploadContainer}>
                                {company.icon && company.icon.startsWith('data:') ? (
                                  <img src={company.icon} alt="Logo" className={styles.logoPreview} />
                                ) : (
                                  <div className={styles.logoPlaceholder}>⬚</div>
                                )}
                                <label className={styles.uploadButton}>
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          updateCompany(companyIndex, 'icon', event.target?.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className={styles.fileInput}
                                  />
                                </label>
                                {company.icon && company.icon.startsWith('data:') && (
                                  <button
                                    type="button"
                                    className={styles.removeLogoButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateCompany(companyIndex, 'icon', '');
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Scatter Plot Controls */
                      <>
                        <div className={styles.section}>
                          <div className={styles.sectionHeader}>
                            <h3>Data Points</h3>
                          </div>

                          {(data.scatterPoints || []).map((point, pointIndex) => (
                            <div key={pointIndex} className={styles.companyCard}>
                              <div className={styles.companyHeader}>
                                <span className={styles.companyNumber}>#{pointIndex + 1} {pointIndex === 0 ? 'Exa' : 'Point'}</span>
                                <button
                                  className={styles.removeButton}
                                  onClick={() => removeScatterPoint(pointIndex)}
                                  disabled={pointIndex === 0 || (data.scatterPoints?.length || 0) <= 1}
                                >
                                  ✕
                                </button>
                              </div>

                              <label className={styles.label}>
                                Label
                                {pointIndex === 0 ? (
                                  <input
                                    type="text"
                                    value="Exa"
                                    disabled
                                    className={`${styles.input} ${styles.inputDisabled}`}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={point.label || ''}
                                    onChange={(e) => updateScatterPoint(pointIndex, 'label', e.target.value)}
                                    className={styles.input}
                                    placeholder="e.g. Company Name"
                                  />
                                )}
                              </label>

                              <label className={styles.label}>
                                Y Value
                                <input
                                  type="number"
                                  value={point.y}
                                  onChange={(e) => updateScatterPoint(pointIndex, 'y', parseFloat(e.target.value) || 0)}
                                  className={styles.input}
                                />
                              </label>

                              <label className={styles.label}>
                                X Value (optional)
                                <input
                                  type="number"
                                  value={point.x || ''}
                                  onChange={(e) => updateScatterPoint(pointIndex, 'x', e.target.value ? parseFloat(e.target.value) : 0)}
                                  className={styles.input}
                                  placeholder="e.g. 450"
                                />
                              </label>

                              <div className={styles.label}>
                                <span>Logo</span>
                                <div className={styles.logoUploadContainer}>
                                  {point.icon && point.icon.startsWith('data:') ? (
                                    <img src={point.icon} alt="Logo" className={styles.logoPreview} />
                                  ) : (
                                    <div className={styles.noLogo}>No logo</div>
                                  )}
                                  <label className={styles.uploadButton}>
                                    Upload
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            updateScatterPoint(pointIndex, 'icon', event.target?.result as string);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      style={{ display: 'none' }}
                                    />
                                  </label>
                                  {point.icon && point.icon.startsWith('data:') && (
                                    <button
                                      type="button"
                                      className={styles.removeLogoButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateScatterPoint(pointIndex, 'icon', '');
                                      }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          ))}
                        </div>

                        <div className={styles.section}>
                          <h3 className={styles.sectionSubtitle}>Chart Options</h3>
                          <div className={styles.toggleRow}>
                            <span className={styles.toggleLabel}>Y-axis starts from 0</span>
                            <button
                              className={`${styles.toggleButton} ${data.scatterYStartFromZero ? styles.toggleActive : ''}`}
                              onClick={() => onDataChange({ ...data, scatterYStartFromZero: !data.scatterYStartFromZero })}
                            >
                              <span className={styles.toggleKnob} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <div className={styles.addGraphSection}>
                      {data.chartType === 'bar' ? (
                        <button className={styles.addGraphButton} onClick={addCompany}>
                          + Add Company
                        </button>
                      ) : (
                        <button className={styles.addGraphButton} onClick={addScatterPoint}>
                          + Add Data Point
                        </button>
                      )}
                      <button className={styles.addGraphButton} onClick={resetData}>
                        <span className={styles.buttonIcon}>↺</span> Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
};

export default ControlPanel;
