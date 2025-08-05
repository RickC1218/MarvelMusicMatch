import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { buttonBaseClasses, buttonTypeClasses, paddingWithLabel, paddingWithoutLabel } from '../styles/buttonStyles';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

interface ButtonProps {
  label?: string;
  onClick?: () => void;
  type?: 'primary' | 'background' | 'success' | 'danger';
  icon?: IconProp | null;
  iconColor?: string;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, type = 'primary', icon, iconColor, className }) => {
  const isCompleteButton = !label ? paddingWithoutLabel : paddingWithLabel;
  const buttonClasses = `${buttonBaseClasses} ${buttonTypeClasses[type]} ${isCompleteButton} ${className}`;

  return (
    <button onClick={onClick} className={buttonClasses}>
      {label}
      {icon && (
        <span className={`flex items-center ${iconColor}`}>
          <FontAwesomeIcon icon={icon} className="w-6 h-6" />
        </span>
      )}
    </button>
  );
};
