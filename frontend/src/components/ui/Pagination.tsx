import React from 'react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          Mostra {startItem} - {endItem} di {totalItems}
        </div>
        
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Righe per pagina:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Precedente
        </Button>
        
        <span className="text-sm text-gray-600">
          Pagina {currentPage} di {totalPages}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Successiva
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
