import styles from './YAxis.module.css';

interface YAxisProps {
  label: string;
}

const YAxis = ({ label }: YAxisProps) => {
  const ticks = [100, 80, 60, 40, 20, 0];

  return (
    <div className={styles.yAxis}>
      <div className={styles.label}>{label}</div>
      <div className={styles.ticks}>
        {ticks.map((tick) => (
          <div 
            key={tick} 
            className={styles.tick}
            style={{ bottom: `${tick}%` }}
          >
            <span className={styles.tickLabel}>{tick}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YAxis;

