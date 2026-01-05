import { Company } from '../types/eval.types';
import styles from './Legend.module.css';
import defaultIcon from '../assets/icons/default-icon.svg';

interface LegendProps {
  companies: Company[];
}

const iconMap: Record<string, string> = {
  'Exa': '/images/exablue.png',
  'Brave': '/images/Logo2.png',
  'Parallel': '/images/Logo3.png',
};

const Legend = ({ companies }: LegendProps) => {
  // Get icon path with fallback to default
  const getIconPath = (company: Company) => {
    if (company.icon?.startsWith('data:')) {
      return company.icon;
    }
    return iconMap[company.name] || defaultIcon;
  };

  return (
    <div className={styles.legend}>
      {companies.map((company) => (
        <div key={company.name} className={styles.legendItem}>
          <img 
            src={getIconPath(company)} 
            alt={`${company.name} icon`}
            className={`${styles.legendIcon} ${company.name === 'Exa' ? styles.exaIcon : ''}`}
          />
          <span className={styles.legendText}>{company.name}</span>
        </div>
      ))}
    </div>
  );
};

export default Legend;

