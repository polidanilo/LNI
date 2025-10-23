import React, { useState, useRef, useEffect } from 'react';

interface CustomTooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  delay = 300 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2 whitespace-nowrap';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-[9999] bg-primary-tip bg-opacity-80 text-white text-xs rounded py-2 px-2 shadow-lg pointer-events-none text-center ${getTooltipClasses()}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default CustomTooltip;
