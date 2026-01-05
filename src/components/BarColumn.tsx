import { Company } from '../types/eval.types';
import styles from './BarColumn.module.css';
import defaultIcon from '../assets/icons/default-icon.svg';

interface BarColumnProps {
  company: Company;
  maxHeight: number;
}

const iconMap: Record<string, string> = {
  'Exa': '/images/Logo1.png',
  'Brave': '/images/Logo2.png',
  'Parallel': '/images/Logo3.png',
};

const BarColumn = ({ company, maxHeight: _maxHeight }: BarColumnProps) => {
  // Get icon path with fallback to default
  const getIconPath = () => {
    return iconMap[company.name] || defaultIcon;
  };

  return (
    <div className={styles.barColumn}>
      <div className={styles.barWrapper}>
        <div className={styles.percentageLabel}>{company.accuracy}%</div>
        <div 
          className={styles.bar}
          style={{ 
            height: `${company.accuracy}%`,
            backgroundColor: company.color
          }}
        >
          <img 
            src={getIconPath()} 
            alt={`${company.name} icon`}
            className={styles.icon}
          />
        </div>
      </div>
      <div className={styles.companyName}>{company.name}</div>
    </div>
  );
};

export default BarColumn;

