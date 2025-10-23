import React, { useRef, useState, useEffect } from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  onScroll?: (scrollTop: number) => void;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children, className = '', maxHeight = '400px', onScroll }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateScrollbar = () => {
      const scrollHeight = content.scrollHeight;
      const clientHeight = content.clientHeight;
      const scrollTop = content.scrollTop;

      // Calcola ratio e dimensione thumb
      const ratio = clientHeight / scrollHeight;
      const thumbHeight = Math.max(ratio * clientHeight, 30); // Min 30px

      if (thumbRef.current) {
        thumbRef.current.style.height = `${thumbHeight}px`;
        thumbRef.current.style.top = `${(scrollTop / scrollHeight) * clientHeight}px`;
      }

      // Nascondi scrollbar se non necessaria
      if (scrollbarRef.current) {
        scrollbarRef.current.style.opacity = ratio >= 1 ? '0' : '1';
      }

      // Callback onScroll per parallax
      if (onScroll) {
        onScroll(scrollTop);
      }
    };

    updateScrollbar();
    content.addEventListener('scroll', updateScrollbar);
    window.addEventListener('resize', updateScrollbar);

    return () => {
      content.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
    };
  }, [children, onScroll]);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const content = contentRef.current;
      const scrollbar = scrollbarRef.current;
      if (!content || !scrollbar) return;

      const scrollbarRect = scrollbar.getBoundingClientRect();
      const thumbHeight = thumbRef.current?.offsetHeight || 0;
      
      // Calcola nuova posizione
      const mouseY = e.clientY - scrollbarRect.top;
      const maxThumbTop = scrollbarRect.height - thumbHeight;
      const thumbTop = Math.max(0, Math.min(mouseY - thumbHeight / 2, maxThumbTop));
      
      // Scroll del contenuto
      const scrollPercentage = thumbTop / maxThumbTop;
      const maxScroll = content.scrollHeight - content.clientHeight;
      content.scrollTop = scrollPercentage * maxScroll;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={`relative ${className}`} style={{ maxHeight }}>
      {/* Contenuto scrollabile */}
      <div
        ref={contentRef}
        className="overflow-y-scroll pr-2"
        style={{
          maxHeight,
          
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}
      >
        <style>{`
          .overflow-y-scroll::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }
        `}</style>
        {children}
      </div>

      {/* Custom Scrollbar Track */}
      <div
        ref={scrollbarRef}
        className="absolute top-0 bottom-0 w-2 transition-opacity duration-200"
        style={{ right: '0px', zIndex:9 }}
      >
        {/* Scrollbar Thumb - Base Layer */}
        <div
          ref={thumbRef}
          onMouseDown={handleThumbMouseDown}
          className="absolute right-0 w-full cursor-pointer"
          style={{
            backgroundColor: 'rgb(17, 17, 17)',
            borderRadius: '10px',
            minHeight: '20px',
          }}
        >
          {/* Hover Layer */}
          <div
            className="absolute inset-0 transition-opacity duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomScrollbar;
