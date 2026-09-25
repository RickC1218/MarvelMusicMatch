import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import {
  buttonBaseClasses,
  buttonVariantClasses,
  paddingWithLabel,
  paddingWithoutLabel,
  type ButtonVariant,
} from '../styles/buttonStyles';

interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  icon?: IconProp | null;
  iconColor?: string;
  /** Si se indica, se renderiza como enlace interno (react-router). */
  to?: string;
  /** Si se indica, se renderiza como enlace externo. */
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
}

const Spinner = () => (
  <span
    aria-hidden="true"
    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
  />
);

export const Button = ({
  label,
  variant = 'primary',
  icon,
  iconColor,
  to,
  href,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  'aria-label': ariaLabel,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const classes = [
    buttonBaseClasses,
    buttonVariantClasses[variant],
    label ? paddingWithLabel : paddingWithoutLabel,
    isDisabled ? 'pointer-events-none opacity-60' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <Spinner />}
      {label && <span>{label}</span>}
      {icon && !loading && (
        <span className={iconColor}>
          <FontAwesomeIcon icon={icon} className="h-5 w-5" />
        </span>
      )}
    </>
  );

  if (to && !isDisabled) {
    return (
      <Link to={to} className={classes} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  if (href && !isDisabled) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
};
