import React from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  hasArrow = false,
  className = '',
  as: Component = 'button',
  to,
  href,
  ...props 
}) => {
  const baseClass = styles.btnBase;
  const variantClass = styles[`btn${variant.charAt(0).toUpperCase() + variant.slice(1)}`];
  const sizeClass = styles[`btnSize${size.charAt(0).toUpperCase() + size.slice(1)}`];
  const disabledClass = disabled ? styles.btnDisabled : '';

  const classes = `${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`;

  if (Component === 'a' || href) {
    return (
      <a className={classes} href={href} {...props}>
        <span className={styles.btnContent}>{children}</span>
        {hasArrow && (
          <ArrowRight size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={styles.btnArrow} />
        )}
      </a>
    );
  }

  // Support react-router Link by default if 'to' is passed and 'as' is overridden
  if (to && Component !== 'button' && Component !== 'a') {
    return (
      <Component to={to} className={classes} {...props}>
         <span className={styles.btnContent}>{children}</span>
         {hasArrow && (
          <ArrowRight size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={styles.btnArrow} />
        )}
      </Component>
    );
  }

  return (
    <Component 
      className={classes}
      disabled={disabled}
      {...props}
    >
      <span className={styles.btnContent}>{children}</span>
      {hasArrow && (
        <ArrowRight size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={styles.btnArrow} />
      )}
    </Component>
  );
};

export default Button;
