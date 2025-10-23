import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 ease-in-out transform
    focus:outline-none focus:ring-4 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95 hover:shadow-lg
  `.trim().replace(/\s+/g, ' ');
  
  const variantClasses = {
    primary: `
      gradient-primary text-white shadow-medium
      hover:shadow-large focus:ring-primary-200
      border border-primary-600/20
    `,
    secondary: `
      bg-white text-secondary-700 shadow-soft border border-secondary-200
      hover:bg-secondary-50 hover:border-secondary-300 focus:ring-secondary-200
    `,
    accent: `
      gradient-accent text-white shadow-medium
      hover:shadow-large focus:ring-accent-200
      border border-accent-600/20
    `,
    danger: `
      bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-medium
      hover:from-danger-600 hover:to-danger-700 hover:shadow-large focus:ring-danger-200
      border border-danger-600/20
    `,
    outline: `
      bg-transparent text-primary-600 border-2 border-primary-200
      hover:bg-primary-50 hover:border-primary-300 focus:ring-primary-200
    `,
    ghost: `
      bg-transparent text-secondary-600 hover:bg-secondary-100
      hover:text-secondary-700 focus:ring-secondary-200
    `,
  };
  
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs font-medium',
    sm: 'px-3 py-2 text-sm font-medium',
    md: 'px-4 py-2.5 text-sm font-semibold',
    lg: 'px-6 py-3 text-base font-semibold',
    xl: 'px-8 py-4 text-lg font-bold',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant].trim().replace(/\s+/g, ' ')} ${sizeClasses[size]} ${className}`;
  
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
