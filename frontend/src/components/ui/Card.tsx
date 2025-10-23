import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  hover?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ 
  children, 
  className = '', 
  padding = 'md', 
  variant = 'default',
  hover = false 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const variantClasses = {
    default: 'bg-white shadow-soft border border-secondary-200/50',
    glass: 'glass-effect shadow-medium',
    elevated: 'bg-white shadow-large border-0',
    bordered: 'bg-white border-2 border-primary-200 shadow-soft',
  };
  
  const hoverClasses = hover 
    ? 'transition-all duration-300 hover:shadow-large hover:-translate-y-1 hover:scale-[1.02]'
    : 'transition-all duration-200';
  
  const classes = `
    ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses}
    rounded-2xl backdrop-blur-sm animate-fade-in
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`border-b border-secondary-200/50 pb-6 mb-6 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`${className}`}>
    {children}
  </div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`border-t border-secondary-200/50 pt-6 mt-6 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
